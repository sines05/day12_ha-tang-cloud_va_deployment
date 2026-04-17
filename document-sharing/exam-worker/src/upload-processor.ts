import { createClient } from '@supabase/supabase-js';
import { getFileTypeEnum, streamToBuffer } from './stream-utils';
import type { Env } from './index'; // Import Env type from the main entry point

// --- TYPE DEFINITIONS ---

interface UploadMetadata {
    fileName: string;
    fileType: string;
    fileSize: number;
    sectionId: number;
}

// --- UPLOAD HELPER ---

const uploadToTelegramBotApi = async (env: Env, fileStream: ReadableStream, fileName: string, fileType: string): Promise<string> => {
    const buffer = await streamToBuffer(fileStream);
    const file = new File([buffer], fileName, { type: fileType });

    const tgFormData = new FormData();
    tgFormData.append('chat_id', env.TELEGRAM_CHANNEL_ID);
    tgFormData.append('document', file, file.name);

    console.log(`Uploading ${fileName} (${(buffer.length / 1024).toFixed(2)} KB) to Telegram Bot API...`);

    const tgResponse = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendDocument`, {
        method: 'POST',
        body: tgFormData,
    });

    if (!tgResponse.ok) {
        const errorText = await tgResponse.text();
        console.error('Telegram API Error:', errorText);
        throw new Error(`Telegram API error: ${errorText}`);
    }

    const tgResult = await tgResponse.json() as any;
    if (!tgResult.ok) {
        console.error('Telegram API Error Result:', tgResult);
        throw new Error(`Telegram API error: ${tgResult.description}`);
    }

    console.log('Successfully uploaded to Telegram.');
    return tgResult.result.document.file_id;
};


// --- DURABLE OBJECT CLASS ---

export class UploadProcessor implements DurableObject {
    state: DurableObjectState;
    env: Env;
    
    // These will be initialized for each upload attempt.
    transformStream: TransformStream | null = null;
    uploadPromise: Promise<void> | null = null;
    writer: WritableStreamDefaultWriter | null = null;

    constructor(state: DurableObjectState, env: Env) {
        this.state = state;
        this.env = env;
    }

    async fetch(request: Request): Promise<Response> {
        const upgradeHeader = request.headers.get('Upgrade');
        if (!upgradeHeader || upgradeHeader !== 'websocket') {
            return new Response('Expected Upgrade: websocket', { status: 426 });
        }
        const webSocketPair = new WebSocketPair();
        const [client, server] = Object.values(webSocketPair);
        this.state.acceptWebSocket(server);
        return new Response(null, { status: 101, webSocket: client });
    }

    async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer) {
        if (typeof message === 'string') {
            try {
                const data: any = JSON.parse(message);
                if (data.action === 'start') {
                    console.log(`DO: Received metadata for ${data.fileName}`);
                    
                    // A new upload is starting. Reset all state from any previous attempt.
                    this.transformStream = new TransformStream();
                    this.writer = this.transformStream.writable.getWriter();
                    this.uploadPromise = this.handleUpload(ws, this.transformStream.readable, data);

                } else if (data.action === 'end') {
                    console.log(`DO: Received 'end' signal. Closing writer.`);
                    if (this.writer) {
                        await this.writer.close();
                        this.writer = null;
                    }
                }
            } catch (e: any) {
                console.error('DO: Error parsing JSON message', e);
                ws.close(1011, 'Invalid JSON message');
            }
        } else if (message instanceof ArrayBuffer) {
            // Write the chunk using the held writer.
            if (this.writer) {
                await this.writer.write(new Uint8Array(message));
            } else {
                console.error('DO: Received chunk data before upload was started.');
                ws.close(1011, 'Chunk sent before start');
            }
        }
    }

    async webSocketClose(ws: WebSocket, code: number, reason: string, wasClean: boolean) {
        console.log(`DO: WebSocket closed. Code: ${code}, Reason: ${reason}`);
        // If the socket closes unexpectedly, try to abort the writer to signal an error downstream.
        if (this.writer) {
            await this.writer.abort(reason);
            this.writer = null;
        }
        // Wait for any pending upload process to finish or fail.
        if (this.uploadPromise) {
            await this.uploadPromise;
        }
    }

    async webSocketError(ws: WebSocket, error: any) {
        console.error(`DO: WebSocket error:`, error);
        // On error, abort the writer.
        if (this.writer) {
            await this.writer.abort(error);
            this.writer = null;
        }
    }

    async handleUpload(ws: WebSocket, stream: ReadableStream, metadata: UploadMetadata) {
        try {
            // Step 1: Upload the file chunk to Telegram
            const telegramFileId = await uploadToTelegramBotApi(this.env, stream, metadata.fileName, metadata.fileType);
            
            // Step 2: Instead of saving to DB, send the received ID back to the client
            console.log(`DO: Successfully uploaded part ${metadata.fileName}. Echoing back partId.`);
            ws.send(JSON.stringify({ status: 'success', partId: telegramFileId }));

        } catch (e: any) {
            console.error(`Full upload process failed for ${metadata.fileName}:`, e.message, e.stack);
            try {
                ws.send(JSON.stringify({ status: 'error', error: e.message }));
            } catch {}
        }
    }
}