import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// --- 1. CẤU HÌNH ĐƯỜNG DẪN & BIẾN MÔI TRƯỜNG ---

// Xác định đường dẫn file hiện tại và thư mục chứa nó
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env từ thư mục cha (vnu/)
// Giả sử script nằm ở vnu/scripts/generateSitemap.js -> trỏ về vnu/.env
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const FRONTEND_BASE_URL = 'https://vnudocshub.com';
const DOCUMENTS_PER_PAGE = 12; // Khớp với logic frontend
const LECTURERS_PER_PAGE = 5;  // Khớp với logic frontend

// Lấy biến môi trường (Ưu tiên VITE_ vì dự án Vite)
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('❌ Lỗi: Không tìm thấy SUPABASE_URL hoặc SUPABASE_ANON_KEY trong .env');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function generateSitemap() {
    console.log('🔄 Đang khởi tạo sitemap...');
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;

    const today = new Date().toISOString().split('T')[0];

    // -----------------------------------------------------------
    // 2. TRANG TĨNH (Static Pages)
    // -----------------------------------------------------------
    const staticPages = [
        { loc: '/', changefreq: 'daily', priority: '1.0' },
        { loc: '/reviews', changefreq: 'daily', priority: '0.9' },
    ];

    staticPages.forEach(page => {
        xml += `  <url>\n`;
        xml += `    <loc>${FRONTEND_BASE_URL}${page.loc}</loc>\n`;
        xml += `    <lastmod>${today}</lastmod>\n`;
        xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
        xml += `    <priority>${page.priority}</priority>\n`;
        xml += `  </url>\n`;
    });

    try {
        // -----------------------------------------------------------
        // 3. TÀI LIỆU CHI TIẾT (Documents)
        // -----------------------------------------------------------
        const { data: documents, error: docError } = await supabase
            .from('documents')
            .select('slug, created_at')
            .eq('status', 'approved');

        if (docError) throw new Error(`Lỗi query documents: ${docError.message}`);

        documents.forEach(doc => {
            if (doc.slug) {
                xml += `  <url>\n`;
                xml += `    <loc>${FRONTEND_BASE_URL}/documents/${doc.slug}</loc>\n`;
                xml += `    <lastmod>${new Date(doc.created_at).toISOString().split('T')[0]}</lastmod>\n`;
                xml += `    <changefreq>daily</changefreq>\n`;
                xml += `    <priority>0.9</priority>\n`;
                xml += `  </url>\n`;
            }
        });

        // -----------------------------------------------------------
        // 4. GIẢNG VIÊN CHI TIẾT (Lecturers)
        // -----------------------------------------------------------
        const { data: lecturers, error: lecturersError } = await supabase
            .from('lecturers')
            .select('slug');

        if (lecturersError) throw new Error(`Lỗi query lecturers: ${lecturersError.message}`);

        lecturers.forEach(lecturer => {
            if (lecturer.slug) {
                xml += `  <url>\n`;
                xml += `    <loc>${FRONTEND_BASE_URL}/reviews/giang-vien/${lecturer.slug}</loc>\n`;
                xml += `    <lastmod>${today}</lastmod>\n`; 
                xml += `    <changefreq>monthly</changefreq>\n`;
                xml += `    <priority>0.8</priority>\n`;
                xml += `  </url>\n`;
            }
        });

        // -----------------------------------------------------------
        // 5. PHÂN TRANG TÀI LIỆU (Documents Pagination)
        // -----------------------------------------------------------
        const { count: totalDocs, error: countDocError } = await supabase
            .from('documents')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'approved');

        if (countDocError) throw new Error(`Lỗi đếm documents: ${countDocError.message}`);

        const totalDocumentPages = Math.ceil((totalDocs || 0) / DOCUMENTS_PER_PAGE);

        for (let i = 1; i <= totalDocumentPages; i++) {
            xml += `  <url>\n`;
            xml += `    <loc>${FRONTEND_BASE_URL}/documents?page=${i}</loc>\n`;
            xml += `    <lastmod>${today}</lastmod>\n`;
            xml += `    <changefreq>daily</changefreq>\n`;
            xml += `    <priority>0.8</priority>\n`;
            xml += `  </url>\n`;
        }

        // -----------------------------------------------------------
        // 6. PHÂN TRANG ĐÁNH GIÁ (Reviews Pagination) - ĐÃ SỬA LOGIC
        // -----------------------------------------------------------
        // Logic đúng: Đếm số lượng giảng viên có ít nhất 1 review.
        const { data: reviewLecturerIds, error: reviewLecIdError } = await supabase
            .from('reviews')
            .select('lecturer_id');

        if (reviewLecIdError) throw new Error(`Lỗi query review lecturer_ids: ${reviewLecIdError.message}`);

        const distinctLecturerIds = new Set(reviewLecturerIds.map(r => r.lecturer_id));
        const totalLecturersWithReviews = distinctLecturerIds.size;

        const totalReviewPages = Math.ceil((totalLecturersWithReviews || 0) / LECTURERS_PER_PAGE);

        for (let i = 1; i <= totalReviewPages; i++) {
            xml += `  <url>\n`;
            xml += `    <loc>${FRONTEND_BASE_URL}/reviews?page=${i}</loc>\n`;
            xml += `    <lastmod>${today}</lastmod>\n`;
            xml += `    <changefreq>daily</changefreq>\n`;
            xml += `    <priority>0.7</priority>\n`;
            xml += `  </url>\n`;
        }

        // -----------------------------------------------------------
        // 7. LỌC THEO TRƯỜNG (University Filters)
        // -----------------------------------------------------------
        const { data: universities, error: uniError } = await supabase
            .from('universities')
            .select('id');

        if (uniError) throw new Error(`Lỗi query universities: ${uniError.message}`);

        if (universities) {
            universities.forEach(uni => {
                xml += `  <url>\n`;
                xml += `    <loc>${FRONTEND_BASE_URL}/documents?universityId=${uni.id}</loc>\n`;
                xml += `    <lastmod>${today}</lastmod>\n`;
                xml += `    <changefreq>daily</changefreq>\n`;
                xml += `    <priority>0.8</priority>\n`;
                xml += `  </url>\n`;
            });
        }

    } catch (error) {
        console.error('❌ Lỗi khi lấy dữ liệu động:', error);
        process.exit(1);
    }

    xml += `</urlset>\n`;

    // -----------------------------------------------------------
    // 8. GHI FILE
    // -----------------------------------------------------------
    const outputPath = path.join(__dirname, '..', 'public', 'sitemap.xml');
    
    try {
        fs.writeFileSync(outputPath, xml, 'utf8');
        console.log(`✅ Thành công! Sitemap đã được tạo tại: ${outputPath}`);
    } catch (e) {
        console.error(`❌ Lỗi ghi file: ${e.message}`);
    }
}

generateSitemap();
