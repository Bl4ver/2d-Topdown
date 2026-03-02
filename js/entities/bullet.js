// bullet.js
export class Bullet {
    constructor(scene) {
        this.engine = scene.engine;
        this.scene = scene;
        this.canvas = this.engine.canvas;
        this.ctx = this.engine.ctx;

        this.x = 0;
        this.y = 0;
        this.speed = 2;
        this.speedX = 0;
        this.speedY = 0;
        this.active = false; // Alapból inaktív
    }

    spawn(x, y, dx, dy) {
        this.x = x;
        this.y = y;

        // Normalizálás és sebesség beállítása a jelenlegi objektumon
        const magnitude = Math.sqrt(dx * dx + dy * dy);
        this.speedX = (dx / magnitude) * this.speed; 
        this.speedY = (dy / magnitude) * this.speed;
        
        this.active = true; 
    }

    update() {
        if (!this.active) return;

        this.x += this.speedX;
        this.y += this.speedY;

        if (this.x < 0 || this.x > this.canvas.width || this.y < 0 || this.y > this.canvas.height) {
            this.active = false;
        }
    }

    draw() {
        if (!this.active) return;
        
        this.ctx.fillStyle = "red";
        this.ctx.beginPath();
        this.ctx.arc(this.x, this.y, 5, 0, Math.PI * 2); 
        
        this.ctx.fill();
        this.ctx.closePath();
    }
}