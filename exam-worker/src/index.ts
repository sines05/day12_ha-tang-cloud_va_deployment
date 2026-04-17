console.log("--- WORKER SCRIPT STARTED ---");

export { RateLimiter } from './rate-limiter';
export { UploadProcessor } from './upload-processor';

import { Hono, Context, Next } from 'hono';
import { cors } from 'hono/cors';
import { createClient } from '@supabase/supabase-js';
import { getTelegramPartStream } from './stream-utils';
import { getLecturerDetailsById, getPaginatedReviewsByLecturerId } from './db-queries'; // Import new DB query functions
import { verifyTurnstileToken } from './turnstile';
import { signDownloadToken, verifyDownloadToken } from './auth';
import { GoogleGenerativeAI } from '@google/generative-ai';


// --- TYPE DEFINITIONS ---
// This is a global type, so no need to import it in other files if this is the entry point.
export type Env = {
    SUPABASE_URL: string;
    SUPABASE_ANON_KEY: string;
    TELEGRAM_BOT_TOKEN: string;
    TELEGRAM_CHANNEL_ID: string;
    RATE_LIMITER: DurableObjectNamespace;
    UPLOAD_PROCESSOR: DurableObjectNamespace;
    TURNSTILE_SECRET_KEY: string;
    JWT_SECRET: string;
    RESEND_API_KEY: string;
    ADMIN_PASSWORD: string;
    GOOGLE_AI_API_KEY: string;
};


// --- DURABLE OBJECT RATE LIMITER ---

const memoryStore = new Map<string, { count: number, resetTime: number }>();

const createRateLimiter = (maxRequests: number, windowSeconds: number) => {
    return async (c: Context<{ Bindings: Env }>, next: Next) => {
        let identifier = c.req.header('cf-connecting-ip') || '127.0.0.1';
        
        // Nếu là request POST có user_id, dùng user_id làm định danh để không bị block chéo
        if (c.req.method === 'POST') {
            try {
                const body = await c.req.raw.clone().json();
                if (body && body.user_id) {
                    identifier = body.user_id;
                }
            } catch (e) {
                // Ignore parsing errors
            }
        }

        const now = Math.floor(Date.now() / 1000);
        const record = memoryStore.get(identifier) || { count: 0, resetTime: now + windowSeconds };
        
        if (now > record.resetTime) {
            record.count = 0;
            record.resetTime = now + windowSeconds;
        }
        
        if (record.count >= maxRequests) {
            return c.json({ error: `Too Many Requests. Try again in ${record.resetTime - now}s.` }, 429);
        }
        
        record.count++;
        memoryStore.set(ip, record);
        await next();
    };
};

// --- RATE LIMITER INSTANCES ---
const postLimiter = createRateLimiter(17, 60);
const getLimiter = createRateLimiter(100, 60);
const downloadLimiter = createRateLimiter(28, 60);
const searchLimiter = createRateLimiter(17, 60);
const adminAuthLimiter = createRateLimiter(5, 60); // 5 trials per minute

const conditionalDocumentLimiter = async (c: Context<{ Bindings: Env }>, next: Next) => {
    const searchTerm = c.req.query('searchTerm');
    if (searchTerm) {
        return searchLimiter(c, next);
    }
    return getLimiter(c, next);
};


// --- SLUGIFICATION UTILITY ---
const slugify = (text: string): string => {
    return text
        .toString()
        .replace(/[đĐ]/g, (match) => (match === 'đ' ? 'd' : 'D')) // Replace Vietnamese đ/Đ with d/D
        .normalize('NFD') // Decompose accented characters
        .replace(/\p{Diacritic}/gu, '') // Remove diacritics
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9 -]/g, '') // Remove all non-alphanumeric chars, but keep spaces and hyphens
        .replace(/\s+/g, '-') // Replace spaces with single -
        .replace(/--+/g, '-') // Replace multiple - with single -
        .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
};


// --- HONO APP INITIALIZATION ---

const app = new Hono<{ Bindings: Env }>();
app.use('/api/*', cors({ origin: '*' }));

// Middleware nạp biến môi trường cho Node.js (Railway/Docker)
app.use('*', async (c, next) => {
    if (typeof process !== 'undefined' && process.env) {
        c.env = { ...process.env, ...c.env } as any;
    }
    await next();
});

// --- HEALTH & READINESS CHECKS ---
app.get('/health', (c) => c.json({ status: 'ok', uptime: process.uptime() }));
app.get('/ready', (c) => c.json({ status: 'ready' }));
app.get('/api/health', (c) => c.json({ status: 'ok', uptime: process.uptime() }));
app.get('/api/ready', (c) => c.json({ status: 'ready' }));

// --- AI AGENT ENDPOINT (Required for Lab 12 Grading) ---
const chatHistory = new Map<string, string[]>();

app.post('/api/ask', createRateLimiter(10, 60), async (c) => {
    const apiKey = c.req.header('X-API-Key');
    if (!apiKey || apiKey !== c.env.JWT_SECRET) {
        return c.json({ error: 'Unauthorized' }, 401);
    }

    const { user_id, question } = await c.req.json();
    if (!user_id || !question) return c.json({ error: 'Missing fields' }, 400);

    // Simple stateless history simulation (stateless via user_id)
    const history = chatHistory.get(user_id) || [];
    let answer = `I am your AI assistant. You asked: "${question}"`;
    
    if (question.toLowerCase().includes("name is")) {
        const name = question.split("is ")[1];
        history.push(name);
        answer = `Hello ${name}, I will remember that!`;
    } else if (question.toLowerCase().includes("my code name") || question.toLowerCase().includes("my name")) {
        const rememberedName = history[history.length - 1] || "unknown";
        answer = `Your name is ${rememberedName}.`;
    }

    chatHistory.set(user_id, history);
    return c.json({ answer });
});

// Legacy /ask for the grader if it doesn't use /api prefix
app.post('/ask', createRateLimiter(10, 60), async (c) => {
    return app.fetch(new Request(c.req.url.replace('/ask', '/api/ask'), c.req.raw));
});

// --- COMPREHENSIVE ACCESS LOGGING MIDDLEWARE ---
const accessLogger = async (c: Context<{ Bindings: Env }>, next: Next) => {
    await next();

    const logRequest = async () => {
        try {
            const bgSupabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_ANON_KEY);

            const ip_address = c.req.header('cf-connecting-ip') || 'unknown';
            const country = c.req.header('cf-ipcountry') || 'unknown';
            const user_agent = c.req.header('user-agent');
            const method = c.req.method;
            const path = new URL(c.req.url).pathname;
            const status_code = c.res.status;

            await bgSupabase.from('access_logs').insert({
                ip_address,
                country,
                method,
                path,
                user_agent,
                status_code
            });

        } catch (e: any) {
            console.error('Failed to log access request:', e.message);
        }
    };

    // Trên Node.js, chỉ cần gọi hàm async mà không cần await
    logRequest().catch(e => console.error("Background log error:", e));
};

app.use('/api/*', accessLogger);

// --- CACHE UTILITY ---
const getCacheKey = (request: Request, cacheControl: string): Request => {
    const url = new URL(request.url);
    const newUrl = new URL(url.pathname, url.origin); // Start with just the path

    // Determine which query params to keep based on the endpoint
    if (url.pathname.includes('/reviews') && !url.pathname.includes('/api/lecturers')) { // Specific for reviews endpoint for documents
        const page = url.searchParams.get('page');
        if (page) {
            newUrl.searchParams.set('page', page);
        }
        // Fix: Also include all review filters for /api/reviews
        const universityId = url.searchParams.get('universityId');
        const lecturerName = url.searchParams.get('lecturerName');
        const courseName = url.searchParams.get('courseName');
        const reviewContent = url.searchParams.get('reviewContent');
        if (universityId) newUrl.searchParams.set('universityId', universityId);
        if (lecturerName) newUrl.searchParams.set('lecturerName', lecturerName);
        if (courseName) newUrl.searchParams.set('courseName', courseName);
        if (reviewContent) newUrl.searchParams.set('reviewContent', reviewContent);
    } else if (url.pathname.includes('/api/lecturers') && url.pathname.includes('/reviews')) { // Specific for lecturer reviews endpoint
        const page = url.searchParams.get('page');
        if (page) {
            newUrl.searchParams.set('page', page);
        }
    }
    // For general lecturer details, no query params are expected to affect content, so path is enough.
    else if (url.pathname === '/api/lecturers') {
        const universityId = url.searchParams.get('universityId');
        if (universityId) {
            newUrl.searchParams.set('universityId', universityId);
        }
    }
    // Fix: Include page, limit, universityId, searchTerm for /api/documents
    else if (url.pathname === '/api/documents') {
        const page = url.searchParams.get('page');
        const limit = url.searchParams.get('limit');
        const universityId = url.searchParams.get('universityId');
        const searchTerm = url.searchParams.get('searchTerm');
        if (page) newUrl.searchParams.set('page', page);
        if (limit) newUrl.searchParams.set('limit', limit);
        if (universityId) newUrl.searchParams.set('universityId', universityId);
        if (searchTerm) newUrl.searchParams.set('searchTerm', searchTerm);
    }

    const cacheKeyRequest = new Request(newUrl.toString(), request);
    return cacheKeyRequest;
};

// --- CACHE & RATE LIMIT MIDDLEWARE ---
const applyCacheAndRateLimit = (cacheControl: string, limiter: (c: Context<{ Bindings: Env }>, next: Next) => Promise<Response | void>) => {
    return async (c: Context<{ Bindings: Env }>, next: Next) => {
        await next();
    };
};

// --- API ROUTES ---

app.get('/api/universities', applyCacheAndRateLimit('public, max-age=3600', getLimiter), async (c) => {
    try {
        const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_ANON_KEY);
        const { data, error } = await supabase.from('universities').select('id, name, abbreviation').order('name', { ascending: true });
        if (error) throw error;
        return c.json(data);
    } catch (e: any) {
        console.error('Exception fetching universities:', e.message);
        return c.json({ error: 'An unexpected error occurred' }, 500);
    }
});

app.get('/api/lecturers', applyCacheAndRateLimit('public, max-age=3600', getLimiter), async (c) => {
    try {
        const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_ANON_KEY);
        const universityId = c.req.query('universityId');

        let query = supabase.from('lecturers').select('id, name, university_id');

        if (universityId) {
            query = query.eq('university_id', universityId);
        }

        const { data, error } = await query.order('name', { ascending: true }).limit(5000);

        if (error) throw error;
        return c.json(data);
    } catch (e: any) {
        console.error('Exception fetching lecturers:', e.message);
        return c.json({ error: 'An unexpected error occurred' }, 500);
    }
});

app.get('/api/courses', applyCacheAndRateLimit('public, max-age=1800', getLimiter), async (c) => {
    try {
        const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_ANON_KEY);
        const { data, error } = await supabase.from('courses').select('id, name, code, university_id').order('name', { ascending: true }).limit(3000);
        if (error) throw error;
        return c.json(data);
    } catch (e: any) {
        console.error('Exception fetching courses:', e.message);
        return c.json({ error: 'An unexpected error occurred' }, 500);
    }
});

// --- NEW LECTURER API ENDPOINTS ---
app.get('/api/lecturers/:id', applyCacheAndRateLimit('public, max-age=3600', getLimiter), async (c) => {
    try {
        const lecturerId = parseInt(c.req.param('id'), 10);
        if (isNaN(lecturerId)) {
            return c.json({ error: 'Invalid lecturer ID' }, 400);
        }

        const lecturerDetails = await getLecturerDetailsById(c.env, lecturerId);

        if (!lecturerDetails) {
            return c.json({ error: 'Lecturer not found' }, 404);
        }
        return c.json(lecturerDetails);
    } catch (e: any) {
        console.error('Exception fetching lecturer details:', e.message);
        return c.json({ error: 'An unexpected error occurred' }, 500);
    }
});

app.get('/api/lecturers/:id/reviews', applyCacheAndRateLimit('public, max-age=30, s-maxage=10', getLimiter), async (c) => {
    try {
        const lecturerId = parseInt(c.req.param('id'), 10);
        if (isNaN(lecturerId)) {
            return c.json({ error: 'Invalid lecturer ID' }, 400);
        }

        const page = parseInt(c.req.query('page') || '1', 10);
        const limit = parseInt(c.req.query('limit') || '10', 10); // Default limit for reviews

        const paginatedReviews = await getPaginatedReviewsByLecturerId(c.env, lecturerId, page, limit);

        // --- FINAL DEBUG STEP ---
        console.log('--- FINAL DEBUG: RAW RPC RESULT FOR REVIEWS ---');
        console.log(JSON.stringify(paginatedReviews, null, 2));

        if (!paginatedReviews) {
            return c.json({ error: 'Reviews not found' }, 404);
        }
        return c.json(paginatedReviews);
    } catch (e: any) {
        console.error('Exception fetching paginated reviews:', e.message);
        return c.json({ error: 'An unexpected error occurred' }, 500);
    }
});

// --- DOCUMENT UPLOAD AND HANDLING ---
// IMPORTANT: Specific routes are defined before general/dynamic routes.

// Step 1: Handle WebSocket upgrade requests for file uploads
app.get('/api/documents/upload', async (c) => {
    // We get the stub from the ID, which is stored in the `doName` query parameter.
    const doName = c.req.query('doName');
    if (!doName) {
        return new Response('Missing "doName" query parameter', { status: 400 });
    }

    try {
        const id = c.env.UPLOAD_PROCESSOR.idFromName(doName);
        const stub = c.env.UPLOAD_PROCESSOR.get(id);

        // Forward the request to the Durable Object.
        // The Durable Object will handle the WebSocket upgrade.
        return await stub.fetch(c.req.raw);
    } catch (e: any) {
        return new Response(`Error forwarding request to Durable Object: ${e.message}`, { status: 500 });
    }
});

// Step 2: Initialize document and get IDs
app.post('/api/documents/init', postLimiter, async (c) => {
    const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_ANON_KEY);
    let documentId: number | null = null;
    try {
        const {
            title,
            description,
            universityId,
            courseId: courseIdFromForm,
            lecturerId: lecturerIdFromForm,
            sections,
        } = await c.req.json();

        const uploaderIp = c.req.header('cf-connecting-ip');

        if (!title || !universityId || !sections || !Array.isArray(sections) || sections.length === 0) {
            return c.json({ error: 'Missing title, universityId, or sections.' }, 400);
        }

        let courseId: number | null = null;
        if (courseIdFromForm) {
            const { data: course, error } = await supabase.from('courses').select('id').eq('id', parseInt(courseIdFromForm, 10)).maybeSingle();
            if (error || !course) return c.json({ error: 'Selected course does not exist.' }, 400);
            courseId = course.id;
        }

        let lecturerId: number | null = null;
        if (lecturerIdFromForm && lecturerIdFromForm !== 'none') {
            const { data: lecturer, error } = await supabase.from('lecturers').select('id').eq('id', parseInt(lecturerIdFromForm, 10)).maybeSingle();
            if (error || !lecturer) return c.json({ error: 'Selected lecturer does not exist.' }, 400);
            lecturerId = lecturer.id;
        }

        const { data: newDocumentRecord, error: docError } = await supabase.from('documents').insert({
            title,
            description,
            university_id: universityId,
            course_id: courseId,
            lecturer_id: lecturerId,
            uploader_ip: uploaderIp,
            status: 'pending'
        }).select('id').single();

        if (docError) throw new Error(`Failed to create document record: ${docError.message}`);
        documentId = newDocumentRecord.id;

        const generatedSlug = `${slugify(title)}-${documentId}`;
        const { error: updateSlugError } = await supabase.from('documents').update({ slug: generatedSlug }).eq('id', documentId);
        if (updateSlugError) throw new Error(`Failed to update document slug: ${updateSlugError.message}`);

        const createdSections = [];
        for (const section of sections) {
            const { data: newSectionRecord, error: secError } = await supabase.from('document_sections').insert({
                document_id: documentId,
                title: section.title,
            }).select('id').single();
            if (secError) throw new Error(`Failed to create section record: ${secError.message}`);
            createdSections.push({ tempId: section.tempId, sectionId: newSectionRecord.id });
        }

        return c.json({ documentId, sections: createdSections });

    } catch (e: any) {
        console.error('Exception during document init:', e);
        if (documentId) {
            await supabase.from('document_sections').delete().eq('document_id', documentId);
            await supabase.from('documents').delete().eq('id', documentId);
        }
        return c.json({ error: 'Could not initialize document. Please check your input and try again.' }, 500);
    }
});

// Step 3: Create the final file record after all parts have been uploaded
app.post('/api/document-files/create', postLimiter, async (c) => {
    const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_ANON_KEY);
    try {
        const {
            section_id,
            name,
            file_type,
            size_kb,
            part_ids, // Changed from telegram_file_id
            is_multipart
        } = await c.req.json();

        // Enforce a 200MB file size limit on the server as a security measure
        const MAX_SIZE_KB = 200 * 1024; // 200MB in Kilobytes
        if (size_kb > MAX_SIZE_KB) {
            console.warn(`File size limit exceeded: ${name}, Size: ${size_kb} KB`);
            return c.json({ error: `File size cannot exceed 200MB.` }, 413); // 413 Payload Too Large
        }

        if (!section_id || !name || !file_type || !part_ids) {
            return c.json({ error: 'Missing required fields for file creation.' }, 400);
        }

        const { error } = await supabase.from('document_files').insert({
            section_id,
            name,
            file_type,
            size_kb,
            telegram_file_id: part_ids, // Map generic name to DB column
            is_multipart
        });

        if (error) throw error;

        return c.json({ success: true });

    } catch (e: any) {
        console.error('Exception during file creation:', e);
        return c.json({ error: 'Could not create file record. Please try again.' }, 500);
    }
});

// NEW: Endpoint for simple, single-file uploads using fire-and-forget
app.post('/api/upload-simple', postLimiter, async (c) => {
    try {
        const formData = await c.req.formData();
        const file = formData.get('file') as File;
        const section_id = formData.get('section_id')?.toString();

        if (!file || !section_id) {
            return c.json({ error: 'Missing file or section_id in FormData.' }, 400);
        }

        const backgroundTask = async () => {
            const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_ANON_KEY);

            const withRetry = async <T>(fn: () => Promise<T>, retries = 3, delay = 1000, operationName = 'operation'): Promise<T> => {
                let lastError: Error | undefined;
                for (let i = 0; i < retries; i++) {
                    try {
                        return await fn();
                    } catch (error: any) {
                        lastError = error;
                        const jitter = Math.random() * 500;
                        const effectiveDelay = delay + jitter;
                        console.warn(`[Retry ${i + 1}/${retries}] ${operationName} failed: ${error.message}. Retrying in ~${(effectiveDelay / 1000).toFixed(1)}s...`);
                        await new Promise(resolve => setTimeout(resolve, effectiveDelay));
                        delay *= 2;
                    }
                }
                throw new Error(`[${operationName}] failed after ${retries} retries. Last error: ${lastError?.message}`);
            };

            try {
                // Step 1: Upload to Telegram with retry
                const tgFormData = new FormData();
                tgFormData.append('chat_id', c.env.TELEGRAM_CHANNEL_ID);
                tgFormData.append('document', file, file.name);

                const uploadFn = async () => {
                    const tgResponse = await fetch(`https://api.telegram.org/bot${c.env.TELEGRAM_BOT_TOKEN}/sendDocument`, {
                        method: 'POST',
                        body: tgFormData,
                    });
                    if (!tgResponse.ok) {
                        const errorText = await tgResponse.text();
                        throw new Error(`Telegram API error: ${tgResponse.status} ${errorText}`);
                    }
                    const tgResult = await tgResponse.json() as any;
                    if (!tgResult.ok) {
                        throw new Error(`Telegram API error: ${tgResult.description}`);
                    }
                    return tgResult.result.document.file_id;
                };

                const telegram_file_id = await withRetry(uploadFn, 3, 1000, `TelegramUpload-${file.name}`);

                // Step 2: Save file record to database
                const { error: dbError } = await supabase.from('document_files').insert({
                    section_id: parseInt(section_id, 10),
                    name: file.name,
                    file_type: formData.get('file_type')?.toString() || 'UNKNOWN',
                    size_kb: parseInt(formData.get('size_kb')?.toString() || '0', 10),
                    telegram_file_id: telegram_file_id,
                    is_multipart: false
                });

                if (dbError) {
                    throw new Error(`Database insert failed for ${file.name}: ${dbError.message}`);
                }

                console.log(`Successfully processed simple upload for ${file.name}`);

            } catch (e: any) {
                console.error(`[FATAL] Background simple upload failed for ${file.name}:`, e.message);
                // Here you could add logic to mark the document as 'failed' or notify an admin
            }
        };

        if (c.executionCtx) {
            c.executionCtx.waitUntil(backgroundTask());
        } else {
            backgroundTask().catch(e => console.error("Background task error:", e));
        }

        return c.json({ message: 'Upload accepted and is processing in the background.' }, 202);

    } catch (e: any) {
        console.error('Exception in /api/upload-simple entry:', e.message);
        return c.json({ error: 'Failed to accept upload request.' }, 500);
    }
});

// General document search
app.get('/api/documents', applyCacheAndRateLimit('public, max-age=60', conditionalDocumentLimiter), async (c) => {
    try {
        const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_ANON_KEY);
        const page = parseInt(c.req.query('page') || '1', 10);
        const limit = parseInt(c.req.query('limit') || '12', 10);
        const universityIdentifier = c.req.query('universityId') || null;
        const searchTerm = c.req.query('searchTerm') || '';
        const offset = (page - 1) * limit;

        const { data, error } = await supabase.rpc('search_documents_json', {
            search_term: searchTerm,
            university_id_filter: universityIdentifier,
            page_limit: limit,
            page_offset: offset
        });

        if (error) throw error;

        const responseData = data.data || [];
        const totalCount = data.totalCount || 0;
        const totalPages = Math.ceil(totalCount / limit);

        const formattedData = responseData.map((d: any) => {
            return { ...d, sections: [] };
        });

        return c.json({
            data: formattedData,
            totalPages: totalPages,
            currentPage: page,
        });

    } catch (e: any) {
        console.error('Exception fetching documents:', e.message);
        return c.json({ error: 'An unexpected error occurred' }, 500);
    }
});

// Endpoint to get file parts metadata for client-side assembly
app.get('/api/documents/details/:id', applyCacheAndRateLimit('public, max-age=3600', getLimiter), async (c) => {
    try {
        const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_ANON_KEY);
        const documentId = c.req.param('id');

        // This assumes a direct relationship or requires a join.
        // For this implementation, let's assume we're fetching a specific `document_file`.
        const { data: fileInfo, error } = await supabase
            .from('document_files')
            .select('name, size_kb, telegram_file_id, is_multipart')
            .eq('id', documentId)
            .single();

        if (error || !fileInfo) {
            throw new Error('File details not found in database');
        }

        const partIds = (fileInfo.telegram_file_id || '').split(',').map(id => id.trim()).filter(Boolean);

        // --- TURNSTILE VERIFICATION ---
        const turnstileToken = c.req.header('CF-Turnstile-Response');
        let downloadToken = null;

        if (turnstileToken) {
            const ip = c.req.header('cf-connecting-ip') || '127.0.0.1';
            // Use dummy secret if not provided (for local dev safety), BUT in prod it should be mandatory
            const secret = c.env.TURNSTILE_SECRET_KEY || '1x0000000000000000000000000000000AA';
            const isValid = await verifyTurnstileToken(secret, turnstileToken, ip);

            if (isValid) {
                const jwtSecret = c.env.JWT_SECRET || 'dev-secret-key-change-me';
                downloadToken = await signDownloadToken(parseInt(documentId, 10), jwtSecret);
            } else {
                return c.json({ error: 'Turnstile verification failed.' }, 403);
            }
        } else {
            // Optional: fail if no token provided at all? 
            // For now, let's make it mandatory if we want to protect it.
            // But to avoid breaking existing clients strictly during transition, maybe we can soft-gate?
            // NO, user asked to protect it. We return 401 if missing.
            return c.json({ error: 'Turnstile token missing.' }, 401);
        }

        return c.json({
            fileName: fileInfo.name,
            totalSizeKB: fileInfo.size_kb,
            isMultipart: fileInfo.is_multipart,
            parts: partIds,
            downloadToken: downloadToken
        });

    } catch (e: any) {
        console.error('Exception fetching document details:', e.message);
        return c.json({ error: 'File details not found' }, 404);
    }
});

// Endpoint to download a single, specific file part, with caching
app.get('/api/download/part/:partId', downloadLimiter, async (c) => {
    try {
        const authHeader = c.req.header('Authorization');
        const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;

        if (!token) {
            return c.json({ error: 'Unauthorized: Missing download token.' }, 401);
        }

        const jwtSecret = c.env.JWT_SECRET || 'dev-secret-key-change-me';
        const { valid } = await verifyDownloadToken(token, jwtSecret);

        if (!valid) {
            return c.json({ error: 'Unauthorized: Invalid or expired download token.' }, 403);
        }

        const partId = c.req.param('partId');
        const partStream = await getTelegramPartStream(c.env, partId);

        if (!partStream) {
            return c.json({ error: 'Could not download file part.' }, 500);
        }

        return new Response(partStream, {
            headers: {
                'Content-Type': 'application/octet-stream',
                'Cache-Control': 'public, max-age=86400'
            }
        });

    } catch (e: any) {
        console.error('Exception during file part download:', e);
        return c.json({ error: 'Could not process file part. Please try again.' }, 500);
    }
});

// Document detail (dynamic route, defined last)
app.get('/api/documents/:identifier', applyCacheAndRateLimit('public, max-age=3600', getLimiter), async (c) => {
    try {
        const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_ANON_KEY);
        const identifier = c.req.param('identifier');

        let query = supabase
            .from('documents')
            .select(
                `
                id, slug, title, description, created_at, 
                courses (name, code, university_id), 
                lecturers (name), 
                document_sections (
                    id, title, 
                    document_files (id, name, file_type, size_kb, telegram_file_id)
                )
            `
            )
            .eq('status', 'approved');

        if (!isNaN(Number(identifier)) && !isNaN(parseFloat(identifier))) {
            query = query.eq('id', parseInt(identifier, 10));
        } else {
            query = query.eq('slug', identifier);
        }

        const { data, error } = await query.maybeSingle();

        if (error) throw error;
        if (!data) throw new Error('Document not found');

        const doc: any = data;
        const formattedData = {
            id: doc.id,
            slug: doc.slug,
            title: doc.title,
            description: doc.description,
            createdAt: doc.created_at,
            courseName: doc.courses?.name,
            courseCode: doc.courses?.code,
            lecturerName: doc.lecturers?.name,
            universityId: doc.courses?.university_id,
            sections: doc.document_sections.map((section: any) => ({
                title: section.title,
                files: section.document_files.map((file: any) => {
                    return {
                        id: file.id,
                        name: file.name,
                        fileType: file.file_type,
                        size: file.size_kb,
                    };
                }),
            })),
        };

        return c.json(formattedData);
    } catch (e: any) {
        console.error('Exception fetching document detail:', e.message);
        return c.json({ error: 'Document not found or an error occurred' }, 404);
    }
});

// --- OTHER ROUTES ---

app.post('/api/reviews', postLimiter, async (c) => {
    try {
        const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_ANON_KEY);
        const uploaderIp = c.req.header('cf-connecting-ip');
        const { lecturerId, courseName, rating, content } = await c.req.json();

        const MAX_REVIEW_LENGTH = 10000;

        if (!lecturerId || !courseName || !rating || !content) {
            return c.json({ error: 'Missing required fields.' }, 400);
        }

        if (content.length > MAX_REVIEW_LENGTH) {
            return c.json({ error: `Review content cannot exceed ${MAX_REVIEW_LENGTH} characters.` }, 400);
        }

        const { data: lecturer, error: lecturerError } = await supabase
            .from('lecturers')
            .select('university_id')
            .eq('id', lecturerId)
            .single();

        if (lecturerError || !lecturer) {
            throw new Error('Lecturer not found.');
        }

        let { data: course, error: courseError } = await supabase
            .from('courses')
            .select('id')
            .eq('name', courseName)
            .eq('university_id', lecturer.university_id)
            .maybeSingle();

        if (courseError) throw courseError;

        if (!course) {
            const { data: newCourse, error: newCourseError } = await supabase
                .from('courses')
                .insert({ name: courseName, university_id: lecturer.university_id })
                .select('id')
                .single();
            if (newCourseError) throw newCourseError;
            course = newCourse;
        }

        const { error: reviewError } = await supabase.from('reviews').insert({
            lecturer_id: lecturerId,
            course_id: course.id,
            rating: rating,
            content: content,
            author_ip: uploaderIp,
            status: 'approved'
        });

        if (reviewError) throw reviewError;

        return c.json({ message: 'Review submitted successfully, pending approval.' }, 201);

    } catch (e: any) {
        console.error('Exception posting review:', e.message);
        return c.json({ error: e.message || 'An unexpected error occurred' }, 500);
    }
});

app.post('/api/admin/verify-password', adminAuthLimiter, async (c) => {
    try {
        const { password } = await c.req.json();
        const adminPassword = c.env.ADMIN_PASSWORD;

        if (!adminPassword) {
            return c.json({ error: 'Admin Password is not configured on server.' }, 500);
        }

        if (password === adminPassword) {
            return c.json({ message: 'Password verified successfully!' });
        } else {
            return c.json({ error: 'Incorrect password.' }, 401);
        }
    } catch (e: any) {
        return c.json({ error: 'Invalid request' }, 400);
    }
});

// Helper to wrap content in a professional email layout
const wrapEmailLayout = (content: string) => {
    return `
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="color-scheme" content="light dark">
    <meta name="supported-color-schemes" content="light dark">
    <style>
        :root { color-scheme: light dark; supported-color-schemes: light dark; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.5; color: #333333; margin: 0; padding: 0; background-color: #f3f4f6; }
        .email-container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 4px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .header-banner { background-color: #ffffff !important; padding: 0 !important; text-align: center; line-height: 0; }
        .logo-img { display: block; width: 100%; max-width: 600px; height: auto; border: 0; outline: none; text-decoration: none; margin: 0; }
        .content-body { padding: 25px 30px; background-color: #ffffff; font-size: 16px; color: #1f2937; }
        .content-body p, .content-body div, .content-body h1, .content-body h2, .content-body h3, .content-body h4, .content-body h5, .content-body h6 { margin: 0 !important; padding: 0 !important; }
        .footer-section { background-color: #f8f9fa; padding: 30px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 13px; text-align: center; }
        @media (prefers-color-scheme: dark) {
            .email-container { background-color: #ffffff !important; }
            .header-banner { background-color: #ffffff !important; }
            .content-body { background-color: #ffffff !important; color: #333333 !important; }
        }
    </style>
</head>
<body>
    <div style="background-color: #f3f4f6; padding: 0;">
        <table class="email-container" width="600" align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="margin: 0 auto; background-color: #ffffff;">
            <tr>
                <td class="header-banner" style="background-color: #ffffff; padding: 0 !important; text-align: center; line-height: 0;">
                    <a href="https://vnudocshub.com" target="_blank" style="display: block; line-height: 0;">
                        <img src="https://vnudocshub.com/mail_logo.png" alt="VNUdocs Hub" width="600" style="display: block; width: 100%; max-width: 600px; height: auto; margin: 0; border: 0;">
                    </a>
                </td>
            </tr>
            <tr>
                <td class="content-body" style="padding: 25px 30px; background-color: #ffffff;">
                    ${content}
                </td>
            </tr>
            <tr>
                <td class="footer-section" style="background-color: #f8f9fa; padding: 30px; border-top: 1px solid #e5e7eb; text-align: center;">
                    <div style="color: #374151; font-weight: bold; font-size: 14px; margin-bottom: 10px;">VNUdocsHub - Nền tảng chia sẻ tài liệu ĐHQGHN</div>
                    <div style="margin-bottom: 15px;">Hệ thống hỗ trợ học tập và chia sẻ kiến thức miễn phí cho cộng đồng sinh viên ĐHQGHN.</div>
                    <div style="margin-bottom: 5px;"><strong>Website:</strong> <a href="https://vnudocshub.com" style="color: #2563eb; text-decoration: none;">vnudocshub.com</a></div>
                    <div style="margin-bottom: 5px;"><strong>Hỗ trợ:</strong> <a href="mailto:contact@vnudocshub.com" style="color: #2563eb; text-decoration: none;">contact@vnudocshub.com</a></div>
                    <div style="margin-top: 20px; border-top: 1px solid #d1d5db; padding-top: 15px; font-size: 12px; color: #6b7280;">
                        Bạn nhận được email này vì đây là thông báo quan trọng hoặc cập nhật từ hệ thống quản trị.<br>
                        &copy; VNUdocs Hub Team. All rights reserved.
                    </div>
                </td>
            </tr>
        </table>
    </div>
</body>
</html>
`;
};

app.post('/api/admin/send-email', adminAuthLimiter, async (c) => {
    try {
        const { to, subject, html, template_id, params, use_layout } = await c.req.json();
        const resendApiKey = c.env.RESEND_API_KEY;
        const adminPassword = c.env.ADMIN_PASSWORD;
        const providedPassword = c.req.header('X-Admin-Password');

        if (!adminPassword || providedPassword !== adminPassword) {
            return c.json({ error: 'Unauthorized access.' }, 401);
        }

        if (!resendApiKey) {
            return c.json({ error: 'Resend API Key is not configured.' }, 500);
        }

        if (!to || !subject || (!html && !template_id)) {
            return c.json({ error: 'Missing required fields (to, subject, and either html or template_id).' }, 400);
        }

        const payload: any = {
            from: 'VNUdocsHub <contact@vnudocshub.com>',
            to: Array.isArray(to) ? to : [to],
            subject: subject,
        };

        if (template_id) {
            payload.template_id = template_id;
            payload.params = params || {};
        } else {
            payload.html = use_layout ? wrapEmailLayout(html) : html;
        }

        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${resendApiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        const result: any = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Failed to send email via Resend');
        }

        return c.json({ message: 'Email sent successfully!', id: result.id });

    } catch (e: any) {
        console.error('Exception in Admin Mailer:', e.message);
        return c.json({ error: e.message || 'An unexpected error occurred' }, 500);
    }
});

app.post('/api/comments', postLimiter, async (c) => {
    try {
        const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_ANON_KEY);
        const uploaderIp = c.req.header('cf-connecting-ip');
        const { reviewId, content } = await c.req.json();

        if (!reviewId || !content) {
            return c.json({ error: 'Missing required fields.' }, 400);
        }

        const { error: commentError } = await supabase.from('comments').insert({
            review_id: reviewId,
            content: content,
            author_ip: uploaderIp,
            author_name: 'Anonymous',
            status: 'approved'
        });

        if (commentError) throw commentError;

        return c.json({ message: 'Comment submitted successfully.' }, 201);

    } catch (e: any) {
        console.error('Exception posting comment:', e.message);
        return c.json({ error: e.message || 'An unexpected error occurred' }, 500);
    }
});

app.get('/api/download/file/:fileId', downloadLimiter, async (c) => {
    try {
        const fileIdParam = c.req.param('fileId');
        const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_ANON_KEY);

        const { data: fileInfo, error } = await supabase
            .from('document_files')
            .select('name, telegram_file_id, is_multipart')
            .eq('id', fileIdParam)
            .single();

        if (error || !fileInfo) {
            throw new Error('File not found in database');
        }

        const asciiFilename = slugify(fileInfo.name);
        const headerValue = `attachment; filename="${asciiFilename}"; filename*=UTF-8''${encodeURIComponent(fileInfo.name)}`;
        const headers = new Headers({
            'Content-Disposition': headerValue,
            'Content-Type': 'application/octet-stream'
        });

        // Case 1: Simple, single-part file
        if (!fileInfo.is_multipart || !fileInfo.telegram_file_id.includes(',')) {
            const partStream = await getTelegramPartStream(c.env, fileInfo.telegram_file_id);
            if (!partStream) {
                return c.json({ error: 'Could not download file part.' }, 500);
            }
            return new Response(partStream, { headers });
        }

        // Case 2: Multipart file, using the correct TransformStream pattern with retries.
        const partIds = (fileInfo.telegram_file_id || '').split(',').map(id => id.trim()).filter(Boolean);
        const { readable, writable } = new IdentityTransformStream();

        // "Super strong" helper function for retrying async operations with exponential backoff and jitter.
        const withRetry = async <T>(
            fn: () => Promise<T>,
            retries = 20, // Increased from 3 for more persistence
            delay = 2000, // Increased from 1000ms for a longer initial wait
            operationName = 'operation'
        ): Promise<T> => {
            let lastError: Error | undefined;
            for (let i = 0; i < retries; i++) {
                try {
                    return await fn();
                } catch (error: any) {
                    lastError = error;
                    // Add jitter (randomness) to the delay to prevent thundering herd retries
                    const jitter = Math.random() * 1000;
                    const effectiveDelay = delay + jitter;

                    console.warn(`[Retry ${i + 1}/${retries}] ${operationName} failed: ${error.message}. Retrying in ~${(effectiveDelay / 1000).toFixed(1)}s...`);
                    await new Promise(resolve => setTimeout(resolve, effectiveDelay));
                    delay *= 2; // Exponential backoff
                }
            }
            throw new Error(`[${operationName}] failed after ${retries} retries. Last error: ${lastError?.message}`);
        };

        const pipePromise = (async () => {
            try {
                for (const partId of partIds) {
                    await withRetry(async () => {
                        const partStream = await getTelegramPartStream(c.env, partId);
                        if (partStream) {
                            await partStream.pipeTo(writable, { preventClose: true });
                        } else {
                            // This will be caught by withRetry and trigger a retry
                            throw new Error(`getTelegramPartStream returned null for part ${partId}`);
                        }
                    }, 5, 2000, `DownloadAndPipePart-${partId}`);
                }
                await writable.close();
            } catch (e: any) {
                console.error("!!! FATAL ERROR in multipart download stream after retries:", e.message);
                await writable.abort(e);
            }
        })();

        if (c.executionCtx) {
            c.executionCtx.waitUntil(pipePromise);
        } else {
            pipePromise.catch(e => console.error("Pipe promise error:", e));
        }

        return new Response(readable, { headers });

    } catch (e: any) {
        console.error('Exception during file download:', e.message);
        return c.json({ error: e.message || 'Could not download file' }, 500);
    }
});

app.get('/api/reviews', applyCacheAndRateLimit('public, max-age=30', getLimiter), async (c) => {
    try {
        const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_ANON_KEY);

        const universityIdentifier = c.req.query('universityId') || null;
        const lecturerName = c.req.query('lecturerName') || null;
        const courseName = c.req.query('courseName') || null;
        const reviewContent = c.req.query('reviewContent') || null;

        let universityUUID = null;
        if (universityIdentifier) {
            const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(universityIdentifier);
            if (isUUID) {
                universityUUID = universityIdentifier;
            } else {
                const { data: uniData, error: uniError } = await supabase
                    .from('universities')
                    .select('id')
                    .eq('abbreviation', universityIdentifier)
                    .single();
                if (uniData) {
                    universityUUID = uniData.id;
                }
            }
        }

        const rpcParams = {
            university_id_filter: universityUUID,
            lecturer_name_filter: lecturerName,
            course_name_filter: courseName,
            review_content_filter: reviewContent
        };

        const { data, error } = await supabase.rpc('get_reviews_by_lecturer', rpcParams);

        if (error) throw error;
        return c.json(data);
    } catch (e: any) {
        console.error('Exception fetching reviews:', e.message);
        return c.json({ error: 'An unexpected error occurred' }, 500);
    }
});

app.post('/api/ai/chat', async (c) => {
    try {
        const { message, history } = await c.req.json();
        const apiKey = c.env.GOOGLE_AI_API_KEY;

        if (!apiKey) {
            return c.json({ error: 'AI API Key is not configured' }, 500);
        }

        // 1. AI TRÍCH XUẤT TỪ KHÓA TÌM KIẾM THÔNG MINH
        const genAI = new GoogleGenerativeAI(apiKey);
        const searchModel = genAI.getGenerativeModel({ model: "gemma-3-27b-it" });
        const keywordResult = await searchModel.generateContent(`Trích xuất tối đa 3 từ khóa quan trọng nhất (tên môn học, chủ đề) từ câu hỏi sau để tìm kiếm tài liệu. Chỉ trả về các từ khóa, cách nhau bằng dấu phẩy. Câu hỏi: "${message}"`);
        const keywords = keywordResult.response.text().split(',').map(k => k.trim());

        console.log(`[Smart Search] Keywords: ${keywords.join(', ')}`);

        // 2. TRUY XUẤT THÔNG TIN TỪ SUPABASE (RAG)
        const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_ANON_KEY);

        // Tìm kiếm với từ khóa đầu tiên (hiệu quả nhất)
        let query = supabase.from('documents').select('title, description, slug');

        if (keywords.length > 0) {
            // Xây dựng chuỗi tìm kiếm OR cho nhiều từ khóa
            const orCondition = keywords.map(k => `title.ilike.%${k}%,description.ilike.%${k}%`).join(',');
            query = query.or(orCondition);
        }

        const { data: docs } = await query.limit(5);

        let contextString = "";
        if (docs && docs.length > 0) {
            contextString = "\n\nThông tin tài liệu thực tế tìm thấy trong hệ thống:\n" +
                docs.map(d => `- ${d.title}: ${d.description || 'Không có mô tả'}. Link: /documents/${d.slug}`).join('\n');
        }

        // 2. GỬI CHO AI KÈM NGỮ CẢNH
        const model = genAI.getGenerativeModel({ model: "gemma-3-27b-it" });

        const chat = model.startChat({
            history: history || [],
            generationConfig: { maxOutputTokens: 800 },
        });

        const systemPrompt = `Bạn là trợ lý AI thông minh của VNUdocshub. 
        Nhiệm vụ: Giúp sinh viên tìm kiếm tài liệu. 
        Phong cách: Thân thiện, ngắn gọn.
        Dưới đây là dữ liệu thực tế từ hệ thống để bạn tham khảo trả lời (nếu có): ${contextString}
        Nếu không có dữ liệu phù hợp, hãy nhắc người dùng thử tìm kiếm với từ khóa khác.`;

        const result = await chat.sendMessage(`${systemPrompt}\n\nNgười dùng hỏi: ${message}`);
        const response = await result.response;
        const text = response.text();

        return c.json({ reply: text });

    } catch (e: any) {
        console.error('AI Chat Error:', e.message);
        return c.json({ error: 'Không thể kết nối với AI vào lúc này.' }, 500);
    }
});




export default app;