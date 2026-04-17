import { GoogleAuth } from 'google-auth-library'; // Cách import chuẩn ES Module
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// --- CẤU HÌNH ---
const KEY_FILE = 'service-account.json';
const FRONTEND_BASE_URL = 'https://vnudocshub.com';
const INDEXING_API_ENDPOINT = 'https://indexing.googleapis.com/v3/urlNotifications:publish';

// --- LOGIC ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. Load .env (Sửa lỗi đường dẫn)
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const keyFilePath = path.join(__dirname, KEY_FILE);

// 2. Fix lỗi biến môi trường (Ưu tiên VITE_)
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('❌ Lỗi: Không tìm thấy biến môi trường Supabase.');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function generateUrls() {
    console.log('📊 Đang lấy danh sách URL cần Index...');
    const urls = [];

    // Trang tĩnh
    urls.push(`${FRONTEND_BASE_URL}/`);
    urls.push(`${FRONTEND_BASE_URL}/reviews`);

    // 3. Lấy Tài liệu (CHỈ LẤY 50 CÁI MỚI NHẤT ĐỂ TRÁNH HẾT QUOTA)
    try {
        const { data: documents } = await supabase
            .from('documents')
            .select('slug, created_at')
            .eq('status', 'approved')
            .order('created_at', { ascending: false }) // Ưu tiên cái mới nhất
            .limit(50); // Giới hạn 50 cái

        if (documents) {
            documents.forEach(doc => {
                if (doc.slug) urls.push(`${FRONTEND_BASE_URL}/documents/${doc.slug}`);
            });
            console.log(`   - Đã thêm ${documents.length} tài liệu mới nhất.`);
        }
    } catch (e) { console.error('Lỗi lấy documents:', e); }
    
    // 4. Lấy Giảng viên (CHỈ LẤY 20 CÁI)
    try {
        const { data: lecturers } = await supabase
            .from('lecturers')
            .select('slug')
            .limit(2000); // Giới hạn 20 cái

        if (lecturers) {
            lecturers.forEach(lec => {
                if (lec.slug) urls.push(`${FRONTEND_BASE_URL}/reviews/giang-vien/${lec.slug}`);
            });
            console.log(`   - Đã thêm ${lecturers.length} giảng viên.`);
        }
    } catch (e) { console.error('Lỗi lấy lecturers:', e); }
    
    console.log(`✅ Tổng cộng: ${urls.length} URL sẽ được gửi.`);
    return urls;
}

async function main() {
    // Check file key
    if (!fs.existsSync(keyFilePath)) {
        console.error(`❌ Lỗi: Thiếu file '${KEY_FILE}' trong thư mục scripts.`);
        return;
    }

    const urls = await generateUrls();
    if (urls.length === 0) return;

    // Auth Google
    const auth = new GoogleAuth({
        keyFile: keyFilePath,
        scopes: ['https://www.googleapis.com/auth/indexing'],
    });
    const client = await auth.getClient();

    console.log('\n🚀 Bắt đầu gửi request tới Google...');

    for (const [index, url] of urls.entries()) {
        try {
            // Gửi request
            const res = await client.request({
                method: 'POST',
                url: INDEXING_API_ENDPOINT,
                data: { url: url, type: 'URL_UPDATED' },
            });

            if (res.status === 200) {
                console.log(`[${index + 1}/${urls.length}] ✅ OK: ${url}`);
            } else {
                console.log(`[${index + 1}/${urls.length}] ⚠️ Lỗi ${res.status}: ${url}`);
            }
        } catch (error) {
            console.error(`[${index + 1}/${urls.length}] ❌ Lỗi: ${error.message}`);
        }
        
        // Delay 0.5s để Google không chặn vì spam
        await new Promise(r => setTimeout(r, 500));
    }
    console.log('\n🎉 Hoàn tất!');
}

main();