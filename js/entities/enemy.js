export class Enemy {
    constructor(scene) {
        this.engine = scene.engine;
        this.scene = scene;
        this.canvas = this.engine.canvas;
        this.ctx = this.engine.ctx;

        this.hp = 50;
        this.damage = 10;
        this.x = 0;
        this.y = 0;
        this.target = { x: 0, y: 0 };
        this.speed = 0.4;
        this.active = false; // Alapból inaktív

        this.width = 30;
        this.height = 30;
        this.radius = 30;

        this.angle = 0;
        this.rotationSpeed = 0.05; // Ezzel állíthatod, milyen gyorsan pörögjön
    }

    spawn() {
        // A kapott kezdőkoordináták beállítása
        this.x = 0;
        this.y = 0;
        this.hp = 50

        // Aktiváljuk a golyót
        this.active = true;
    }

    update() {
        if (!this.active) return;

        this.angle += this.rotationSpeed;

        const dx = this.scene.player.x - this.x;
        const dy = this.scene.player.y - this.y;

        const magnitude = Math.sqrt(dx * dx + dy * dy);

        if (magnitude > 1) {
            const speedX = (dx / magnitude) * this.speed;
            const speedY = (dy / magnitude) * this.speed;

            this.x += speedX;
            this.y += speedY;
        }
    }

    takeDamage(damage){
        if (this.hp - damage > 0)
            this.hp -= damage;

        else
            this.active = false;
        console.log(this.hp);
    }

    draw() {
        if (!this.active) return;

        this.ctx.save();

        this.ctx.translate(this.x, this.y);

        this.ctx.rotate(this.angle);

        this.ctx.strokeStyle = "#b300ff";
        this.ctx.lineWidth = 3;
        this.ctx.shadowBlur = 15;
        this.ctx.shadowColor = '#b300ff';

        this.ctx.strokeRect(-this.width / 2, -this.height / 2, this.width, this.height);

        this.ctx.restore();

    }
}