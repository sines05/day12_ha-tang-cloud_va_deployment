// File: exam-worker/src/rate-limiter.ts

// This is the first implementation of the Durable Object, restored at user's request.
// It contains a known race condition in the constructor which may lead to inconsistent behavior.

interface Env {}

export class RateLimiter {
    state: DurableObjectState;
    env: Env;
    requestCount: number;
    windowStart: number;

    constructor(state: DurableObjectState, env: Env) {
        this.state = state;
        this.env = env;
        this.requestCount = 0;
        this.windowStart = 0;

        // Load persisted state without awaiting, which causes a race condition.
        // This is part of the original logic being restored.
        this.state.storage.get(["count", "windowStart"]).then(persisted => {
            const map = persisted as Map<string, number>;
            if (map && map.size > 0) {
                this.requestCount = map.get("count") || 0;
                this.windowStart = map.get("windowStart") || 0;
            }
        });
    }

    async fetch(request: Request): Promise<Response> {
        const url = new URL(request.url);
        const maxRequests = parseInt(url.searchParams.get("maxRequests") || "10", 10);
        const windowSeconds = parseInt(url.searchParams.get("windowSeconds") || "60", 10);
        const now = Math.floor(Date.now() / 1000);

        if (now > this.windowStart + windowSeconds) {
            this.windowStart = now;
            this.requestCount = 0;
        }

        if (this.requestCount >= maxRequests) {
            const remainingSeconds = (this.windowStart + windowSeconds) - now;
            return new Response(
                JSON.stringify({
                    error: `Too Many Requests: Please try again after ${remainingSeconds} seconds.`
                }),
                { status: 429 }
            );
        }

        this.requestCount++;

        const currentAlarm = await this.state.storage.getAlarm();
        if (currentAlarm === null) {
            this.state.storage.setAlarm(Date.now() + 60 * 1000);
        }

        return new Response("ALLOW", { status: 200 });
    }

    async alarm() {
        await this.state.storage.put(
            {
                "count": this.requestCount,
                "windowStart": this.windowStart
            },
            { expirationTtl: 3600 }
        );
    }
}
