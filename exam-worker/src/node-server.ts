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

const server = serve({
  fetch: app.fetch,
  port,
  hostname: '0.0.0.0'
})

// --- GRACEFUL SHUTDOWN (Lab 12 Requirement) ---
const shutdown = () => {
  console.log('--- SIGTERM/SIGINT received: closing HTTP server ---')
  server.close(() => {
    console.log('--- HTTP server closed ---')
    process.exit(0)
  })
  
  // Nếu server không đóng sau 10s, ép buộc thoát
  setTimeout(() => {
    console.error('--- Could not close connections in time, forcefully shutting down ---')
    process.exit(1)
  }, 10000)
}

process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)
