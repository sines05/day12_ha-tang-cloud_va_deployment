import { serve } from '@hono/node-server'
import app from './index'

/**
 * Mock Durable Objects cho môi trường Node.js
 * Vì Railway không có Durable Objects của Cloudflare, chúng ta giả lập để code không bị crash.
 */
const mockDurableObject = {
  idFromName: () => ({ 
    toString: () => 'mock-id',
    get: () => ({ 
        fetch: () => Promise.resolve(new Response(JSON.stringify({ status: 'ok' }), { status: 200 })) 
    })
  }),
  get: () => ({ 
    fetch: () => Promise.resolve(new Response(JSON.stringify({ status: 'ok' }), { status: 200 })) 
  })
};

// Middleware để bơm các biến môi trường từ process.env vào c.env của Hono
app.use('*', async (c, next) => {
  c.env = {
    ...process.env,
    RATE_LIMITER: mockDurableObject,
    UPLOAD_PROCESSOR: mockDurableObject,
    ...c.env
  } as any
  await next()
})

const port = 3000
console.log(`🚀 Server is running on port ${port}`)

serve({
  fetch: app.fetch,
  port,
  hostname: '0.0.0.0'
})
