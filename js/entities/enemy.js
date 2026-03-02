export class Enemy {
    constructor(engine) {
        this.engine = engine;
        this.canvas = engine.canvas;
        this.ctx = engine.ctx;

        this.x = 0;
        this.y = 0;
        this.speedX = 0;
        this.speedY = 0;
        this.active = false; // Alapból inaktív
    }

    spawn(x, y, dx, dy) {
        // A kapott kezdőkoordináták beállítása
        this.x = x;
        this.y = y;

        // Normalizálás és sebesség beállítása a jelenlegi objektumon
        const magnitude = Math.sqrt(dx * dx + dy * dy);
        this.speedX = (dx / magnitude) * 15;
        this.speedY = (dy / magnitude) * 15;

        // Aktiváljuk a golyót
        this.active = true;
    }

    update() {
        if (!this.active) return;


        const magnitude = Math.sqrt(dx * dx + dy * dy);
        this.speedX = (dx / magnitude) * 15;
        this.speedY = (dy / magnitude) * 15;

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