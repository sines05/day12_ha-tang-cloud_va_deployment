export async function verifyTurnstileToken(secret: string, token: string, ip: string): Promise<boolean> {
    const url = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
    const formData = new FormData();
    formData.append('secret', secret);
    formData.append('response', token);
    formData.append('remoteip', ip);

    try {
        const result = await fetch(url, {
            body: formData,
            method: 'POST',
        });

        const outcome = await result.json() as any;
        return outcome.success;
    } catch (e) {
        console.error('Turnstile verification failed:', e);
        return false;
    }
}
