import React, { useEffect, useRef } from 'react';

const Snow: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const animationFrameId = useRef<number | null>(null);
    const snowflakes = useRef<any[]>([]);
    const resizeTimeout = useRef<NodeJS.Timeout | null>(null);
    const cachedSnowflake = useRef<HTMLCanvasElement | null>(null);

    useEffect(() => {
        if (typeof window === 'undefined' || typeof document === 'undefined') {
            return;
        }

        let oldCanvas = document.getElementById('snowCanvas');
        if (oldCanvas) {
            oldCanvas.remove();
        }

        const canvas = document.createElement('canvas');
        canvas.id = 'snowCanvas';
        canvas.style.position = 'fixed';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.pointerEvents = 'none';
        canvas.style.zIndex = '99999';
        document.body.appendChild(canvas);
        canvasRef.current = canvas;

        const ctx = canvas.getContext('2d', { alpha: true });
        if (!ctx) return;

        let width = window.innerWidth;
        let height = window.innerHeight;
        canvas.width = width;
        canvas.height = height;

        // --- PRE-RENDERING ---
        const createCachedSnowflake = () => {
            const c = document.createElement('canvas');
            const size = 20; 
            const r = 2;    
            c.width = size;
            c.height = size;
            const cCtx = c.getContext('2d');
            if (!cCtx) return null;

            cCtx.translate(size / 2, size / 2); 
            cCtx.strokeStyle = "white";
            cCtx.lineWidth = 1;
            cCtx.lineCap = "round";

            for (let i = 0; i < 6; i++) {
                cCtx.rotate(Math.PI / 3);
                cCtx.beginPath();
                cCtx.moveTo(0, 0);
                cCtx.lineTo(0, r * 4);
                cCtx.moveTo(0, r * 2);
                cCtx.lineTo(-r, r * 3);
                cCtx.moveTo(0, r * 2);
                cCtx.lineTo(r, r * 3);
                cCtx.stroke();
            }
            return c;
        };

        cachedSnowflake.current = createCachedSnowflake();

        const setupSnowflakes = () => {
            snowflakes.current = [];
            const numSnowflakes = 100;
            for (let i = 0; i < numSnowflakes; i++) {
                snowflakes.current.push({
                    x: Math.random() * width,
                    y: Math.random() * height,
                    scale: Math.random() * 1 + 0.5, 
                    d: Math.random() * numSnowflakes, // Dùng để làm lệch pha dao động
                });
            }
        };

        setupSnowflakes();

        let angle = 0;
        const update = () => {
            // Tăng góc nhanh hơn một chút để chu kỳ lắc lư ngắn lại (gió thổi rõ hơn)
            angle += 0.01; 
            
            for (let i = 0; i < snowflakes.current.length; i++) {
                const p = snowflakes.current[i];
                
                // --- CHỈNH SỬA TỐC ĐỘ VÀ HƯỚNG GIÓ Ở ĐÂY ---
                
                // 1. Trục Y (Rơi xuống):
                // Công thức cũ rơi khá nhanh.
                // Công thức mới: Tốc độ rơi phụ thuộc vào scale. 
                // Bông nhỏ nhất rơi 0.25px/frame, bông lớn nhất rơi 0.75px/frame. Rất chậm rãi.
                p.y += p.scale * 0.5; 

                // 2. Trục X (Lắc lư):
                // Thêm p.d vào hàm sin để mỗi bông lắc một nhịp khác nhau.
                // Nhân 1.5 để biên độ lắc rộng hơn (bay qua bay lại thay vì thẳng tưng).
                p.x += Math.sin(angle + p.d) * 1.5;

                // Reset khi ra khỏi màn hình
                if (p.x > width + 20 || p.x < -20 || p.y > height) {
                    if (i % 3 > 0) { // 66% số tuyết rơi lại từ trên xuống
                        snowflakes.current[i] = { x: Math.random() * width, y: -20, scale: p.scale, d: p.d };
                    } else {
                        // 33% số tuyết bay vào từ 2 bên cạnh (để tạo cảm giác tự nhiên)
                        if (Math.sin(angle) > 0) {
                            snowflakes.current[i] = { x: -20, y: Math.random() * height, scale: p.scale, d: p.d };
                        } else {
                            snowflakes.current[i] = { x: width + 20, y: Math.random() * height, scale: p.scale, d: p.d };
                        }
                    }
                }
            }
        };

        const draw = () => {
            if (!ctx || !canvasRef.current || !cachedSnowflake.current) return;
            ctx.clearRect(0, 0, width, height);

            const img = cachedSnowflake.current;
            const baseSize = 20;

            for (let i = 0; i < snowflakes.current.length; i++) {
                const p = snowflakes.current[i];
                const currentSize = baseSize * p.scale;
                ctx.drawImage(img, p.x, p.y, currentSize, currentSize);
            }
            
            update();
            animationFrameId.current = requestAnimationFrame(draw);
        };

        draw();

        const handleResize = () => {
            if (resizeTimeout.current) clearTimeout(resizeTimeout.current);
            resizeTimeout.current = setTimeout(() => {
                const currentCanvas = canvasRef.current;
                if (currentCanvas) {
                    width = window.innerWidth;
                    height = window.innerHeight;
                    currentCanvas.width = width;
                    currentCanvas.height = height;
                }
            }, 200);
        };
        
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
            }
            if (resizeTimeout.current) {
                clearTimeout(resizeTimeout.current);
            }
            const canvasToRemove = document.getElementById('snowCanvas');
            if (canvasToRemove) {
                canvasToRemove.remove();
            }
        };
    }, []);

    return null;
};

export default Snow;