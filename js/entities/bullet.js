export class Bullet {
    constructor() {
        this.x = 0;
        this.y = 0;
        this.speedX = 0;
        this.speedY = 0;
        this.active = false; // Alapból inaktív
    }

    spawn(x, y, dx, dy) {
        // Normalizálás: a vektor hosszát 1-re hozzuk, majd megszorozzuk a sebességgel
        const magnitude = Math.sqrt(dx * dx + dy * dy);
        const velocityX = (dx / magnitude) * 15; // 15 a golyó sebessége
        const velocityY = (dy / magnitude) * 15;

        const bullet = new Bullet(x, y, velocityX, velocityY);
        // Hozzáadás a GameScene listájához...
    }

    update() {
        if (!this.active) return;

        this.x += this.speedX;
        this.y += this.speedY;

        // Ha kimegy a képből, inaktívvá tesszük, hogy újra felhasználható legyen
        if (this.x < 0 || this.x > canvas.width || this.y < 0 || this.y > canvas.height) {
            this.active = false;
        }
    }

    draw() {
        if (!this.active) return;
        ctx.fillStyle = "red";
        ctx.fillRect(this.x, this.y, 5, 10);
    }
}