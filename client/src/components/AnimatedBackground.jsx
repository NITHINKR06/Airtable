import { useEffect, useRef } from 'react';

function AnimatedBackground() {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        let animationFrameId;
        let time = 0;

        // Set canvas size
        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        // Enhanced Star class
        class Star {
            constructor() {
                this.reset();
                this.twinkleSpeed = Math.random() * 0.02 + 0.01;
                this.twinklePhase = Math.random() * Math.PI * 2;
            }

            reset() {
                this.x = Math.random() * canvas.width;
                this.y = Math.random() * canvas.height;
                this.size = Math.random() * 1.5 + 0.8;
                this.speed = Math.random() * 1.5 + 0.8;
                this.baseOpacity = Math.random() * 0.4 + 0.2;
                this.maxOpacity = this.baseOpacity + 0.3;
            }

            update() {
                this.y += this.speed;
                if (this.y > canvas.height + 10) {
                    this.reset();
                    this.y = -10;
                }
                
                // Twinkling effect
                this.twinklePhase += this.twinkleSpeed;
                this.currentOpacity = this.baseOpacity + 
                    (Math.sin(this.twinklePhase) * 0.2 + 0.1);
                this.currentOpacity = Math.min(this.currentOpacity, this.maxOpacity);
            }

            draw() {
                // Draw star with glow effect
                const gradient = ctx.createRadialGradient(
                    this.x, this.y, 0,
                    this.x, this.y, this.size * 2
                );
                gradient.addColorStop(0, `rgba(0, 0, 0, ${this.currentOpacity})`);
                gradient.addColorStop(0.5, `rgba(0, 0, 0, ${this.currentOpacity * 0.6})`);
                gradient.addColorStop(1, `rgba(0, 0, 0, 0)`);
                
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size * 2, 0, Math.PI * 2);
                ctx.fill();
                
                // Draw main star
                ctx.fillStyle = `rgba(0, 0, 0, ${this.currentOpacity})`;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // Create stars with better distribution
        const stars = [];
        const starCount = 50; // More stars for better effect
        for (let i = 0; i < starCount; i++) {
            const star = new Star();
            // Distribute stars more evenly
            star.y = (i / starCount) * canvas.height;
            stars.push(star);
        }

        // Animation loop with time tracking
        const animate = () => {
            time += 0.01;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            stars.forEach(star => {
                star.update();
                star.draw();
            });

            animationFrameId = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            window.removeEventListener('resize', resizeCanvas);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 pointer-events-none z-0"
            style={{ background: 'transparent' }}
        />
    );
}

export default AnimatedBackground;

