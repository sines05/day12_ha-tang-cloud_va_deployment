
// Using a simple HMAC signature for "tokens" to avoid heavy JWT libraries if not needed, 
// OR use web crypto for standard JWT. 
// Given this is a worker, let's use Web Crypto API for a standard HS256 JWT.

// Encode helper
function base64UrlEncode(text: string): string {
    const base64 = btoa(text);
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlDecode(str: string): string {
    str = str.replace(/-/g, '+').replace(/_/g, '/');
    while (str.length % 4) {
        str += '=';
    }
    return atob(str);
}

async function importKey(secret: string): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    return crypto.subtle.importKey(
        'raw',
        encoder.encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign', 'verify']
    );
}

export async function signDownloadToken(fileId: number, secret: string, expiresInSeconds: number = 3600): Promise<string> {
    const header = { alg: 'HS256', typ: 'JWT' };
    const now = Math.floor(Date.now() / 1000);
    const payload = {
        sub: 'download_session', // Subject
        fileId: fileId,
        iat: now,
        exp: now + expiresInSeconds
    };

    const encodedHeader = base64UrlEncode(JSON.stringify(header));
    const encodedPayload = base64UrlEncode(JSON.stringify(payload));
    const data = `${encodedHeader}.${encodedPayload}`;

    const key = await importKey(secret);
    const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
    const encodedSignature = base64UrlEncode(String.fromCharCode(...new Uint8Array(signature)));

    return `${data}.${encodedSignature}`;
}

export async function verifyDownloadToken(token: string, secret: string): Promise<{ valid: boolean, fileId?: number }> {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return { valid: false };

        const [encodedHeader, encodedPayload, encodedSignature] = parts;
        const data = `${encodedHeader}.${encodedPayload}`;

        const key = await importKey(secret);
        const signature = new Uint8Array(atob(encodedSignature.replace(/-/g, '+').replace(/_/g, '/')).split('').map(c => c.charCodeAt(0)));

        const isValid = await crypto.subtle.verify('HMAC', key, signature, new TextEncoder().encode(data));

        if (!isValid) return { valid: false };

        const payload = JSON.parse(base64UrlDecode(encodedPayload));
        const now = Math.floor(Date.now() / 1000);

        if (payload.exp < now) {
            return { valid: false }; // Expired
        }

        return { valid: true, fileId: payload.fileId };
    } catch (e) {
        console.error('Token verification error:', e);
        return { valid: false };
    }
}
