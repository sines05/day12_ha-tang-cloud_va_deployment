import { GoogleAuth } from 'google-auth-library';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// --- CẤU HÌNH ---
const KEY_FILE = 'service-account.json';
const FRONTEND_BASE_URL = 'https://vnudocshub.com';
const INDEXING_API_ENDPOINT = 'https://indexing.googleapis.com/v3/urlNotifications:publish';
const DAILY_LIMIT = 190;
const BATCH_SIZE = 20; // Số lượng request gửi song song mỗi đợt (để tránh lỗi rate limit của Google)

// --- SETUP ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const keyFilePath = path.join(__dirname, KEY_FILE);
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('❌ Lỗi: Thiếu biến môi trường Supabase.');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function main() {
    console.log(`\n🚀 BẮT ĐẦU CHIẾN DỊCH INDEXING (Quota: ${DAILY_LIMIT}, Batch Size: ${BATCH_SIZE})...`);

    // 1. Kiểm tra File Key
    if (!fs.existsSync(keyFilePath)) {
        console.error(`❌ Thiếu file '${KEY_FILE}'.`);
        return;
    }

    // 2. Lấy dữ liệu
    const { data: candidates, error } = await supabase
        .from('lecturers')
        .select('id, slug')
        .is('last_indexed_at', null)
        .limit(DAILY_LIMIT);

    if (error) {
        console.error('❌ Lỗi query Supabase:', error.message);
        return;
    }

    if (!candidates || candidates.length === 0) {
        console.log('🎉 Đã index hết toàn bộ giảng viên!');
        return;
    }

    console.log(`📊 Tìm thấy ${candidates.length} giảng viên cần index.`);

    // 3. Khởi tạo Google Auth
    const auth = new GoogleAuth({
        keyFile: keyFilePath,
        scopes: ['https://www.googleapis.com/auth/indexing'],
    });
    const client = await auth.getClient();

    // 4. Xử lý theo từng BATCH (Nhóm)
    let successCount = 0;
    
    // Chia mảng candidates thành các mảng con (chunks)
    for (let i = 0; i < candidates.length; i += BATCH_SIZE) {
        const chunk = candidates.slice(i, i + BATCH_SIZE);
        console.log(`\n🔄 Đang xử lý nhóm ${i + 1} - ${i + chunk.length}...`);

        // Tạo mảng các Promises để gửi request song song
        const promises = chunk.map(async (lecturer) => {
            if (!lecturer.slug) return { id: lecturer.id, status: 'skipped' };

            const url = `${FRONTEND_BASE_URL}/reviews/giang-vien/${lecturer.slug}`;
            try {
                const res = await client.request({
                    method: 'POST',
                    url: INDEXING_API_ENDPOINT,
                    data: { url: url, type: 'URL_UPDATED' },
                });

                if (res.status === 200) {
                    console.log(`  ✅ Đã gửi: ${lecturer.slug}`);
                    return { id: lecturer.id, status: 'success' };
                } else {
                    console.error(`  ❌ Lỗi Google (${res.status}): ${lecturer.slug}`);
                    return { id: lecturer.id, status: 'failed' };
                }
            } catch (err) {
                if (err.message.includes('429')) {
                    console.error('⛔ HẾT QUOTA GOOGLE!');
                    throw new Error('QUOTA_EXCEEDED'); // Ném lỗi để dừng vòng lặp ngoài
                }
                console.error(`  ❌ Lỗi Exception: ${err.message}`);
                return { id: lecturer.id, status: 'error' };
            }
        });

        try {
            // Chờ cả nhóm chạy xong
            const results = await Promise.all(promises);

            // Lọc ra các ID thành công để update Database 1 lần
            const successIds = results
                .filter(r => r.status === 'success')
                .map(r => r.id);

            if (successIds.length > 0) {
                // Batch Update Supabase (1 request thay vì 20 request)
                const { error: updateError } = await supabase
                    .from('lecturers')
                    .update({ last_indexed_at: new Date() })
                    .in('id', successIds); // Sử dụng .in() để update nhiều dòng

                if (updateError) {
                    console.error(`  ⚠️ Lỗi update DB batch: ${updateError.message}`);
                } else {
                    successCount += successIds.length;
                    console.log(`  💾 Đã lưu ${successIds.length} mục vào Database.`);
                }
            }
            
            // Delay nhẹ giữa các batch để tránh spam quá gắt
            await new Promise(r => setTimeout(r, 1000));

        } catch (err) {
            if (err.message === 'QUOTA_EXCEEDED') break;
            console.error(err);
        }
    }

    console.log(`\n🏁 KẾT THÚC. Tổng cộng thành công: ${successCount}/${candidates.length}`);
    
    // Tính toán dự kiến
    const { count } = await supabase.from('lecturers').select('*', { count: 'exact', head: true }).is('last_indexed_at', null);
    const daysLeft = Math.ceil((count || 0) / DAILY_LIMIT);
    console.log(`📅 Dự kiến còn ${daysLeft} ngày nữa.`);
}

main();