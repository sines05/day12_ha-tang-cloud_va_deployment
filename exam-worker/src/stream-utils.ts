// exam-worker/src/stream-utils.ts
import type { Env } from 'hono';

export const getTelegramPartStream = async (env: Env, fileId: string): Promise<ReadableStream | null> => {
    try {
        const getFileUrl = `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/getFile?file_id=${fileId}`;
        const fileMetaResponse = await fetch(getFileUrl);
        if (!fileMetaResponse.ok) {
            console.error(`Telegram getFile API failed with status ${fileMetaResponse.status}`);
            return null;
        }

        const fileMetaData = await fileMetaResponse.json() as { ok: boolean, result: { file_path: string } };
        if (!fileMetaData.ok || !fileMetaData.result.file_path) {
            console.error('Telegram getFile API response was not OK or missing file_path');
            return null;
        }

        const filePath = fileMetaData.result.file_path;
        const fileUrl = `https://api.telegram.org/file/bot${env.TELEGRAM_BOT_TOKEN}/${filePath}`;
        
        const fileResponse = await fetch(fileUrl);
        if (!fileResponse.ok || !fileResponse.body) {
            console.error(`Telegram file download failed with status ${fileResponse.status}`);
            return null;
        }

        return fileResponse.body;

    } catch (e: any) {
        console.error('Exception in getTelegramPartStream:', e.message);
        return null;
    }
};

export const getFileTypeEnum = (mimeType: string): 'PDF' | 'DOCX' | 'PPTX' | 'ZIP' | 'JPEG' | 'PNG' | 'GIF' | 'VIDEO' | 'TXT' | 'HTML' | 'XLSX' | 'CSV' | 'RAR' | 'DOC' | 'IPYNB' | null => {
    if (mimeType === 'application/pdf') return 'PDF';
    if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') return 'DOCX';
    if (mimeType === 'application/msword') return 'DOC';
    if (mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') return 'XLSX';
    if (mimeType === 'text/csv') return 'CSV';
    if (mimeType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation') return 'PPTX';
    if (mimeType === 'application/vnd.ms-powerpoint') return 'PPTX'; // Standardize to PPTX
    if (mimeType === 'application/zip' || mimeType === 'application/x-zip-compressed') return 'ZIP';
    if (mimeType === 'application/vnd.rar' || mimeType === 'application/x-rar-compressed') return 'RAR';
    if (mimeType === 'image/jpeg') return 'JPEG';
    if (mimeType === 'image/png') return 'PNG';
    if (mimeType === 'image/gif') return 'GIF';
    if (mimeType.startsWith('video/')) return 'VIDEO';
    if (mimeType === 'text/plain') return 'TXT';
    if (mimeType === 'text/html') return 'HTML';
    if (mimeType === 'application/x-ipynb+json' || mimeType === 'application/json') return 'IPYNB';
    return null;
};

export const streamToBuffer = async (stream: ReadableStream): Promise<Buffer> => {
    const reader = stream.getReader();
    const chunks: Uint8Array[] = [];
    while (true) {
        const { done, value } = await reader.read();
        if (done) {
            break;
        }
        chunks.push(value);
    }
    return Buffer.concat(chunks);
};