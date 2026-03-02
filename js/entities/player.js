import { Bullet } from "./bullet.js";

export class Player {
    constructor(scene) {
        this.engine = scene.engine;
        this.scene = scene;
        this.canvas = this.engine.canvas;
        this.x = this.canvas.width / 2;
        this.y = this.canvas.height / 2;
        this.speed = 1.2;
        this.activeWeapon = "pistol";

        this.bulletSpeed = 2;
        this.fireRate = 300;
        this.lastShotTime = 0;

        this.mouse = { x: 0, y: 0 };

        window.addEventListener('mousemove', (event) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouse.x = event.clientX - rect.left;
            this.mouse.y = event.clientY - rect.top;
        });

    }

    init(state) {

    }

    spawn() {

    }

    update(input) {
        if (input.keys.ArrowLeft || input.keys.a) this.x -= this.speed;
        if (input.keys.ArrowRight || input.keys.d) this.x += this.speed;
        if (input.keys.ArrowUp || input.keys.w) this.y -= this.speed;
        if (input.keys.ArrowDown || input.keys.s) this.y += this.speed;



        if (input.isKeyDown("mouse")) {
            this.shoot();
        }
    }

    shoot() {
        const currentTime = Date.now();

        // Ellenőrizzük, hogy eltelt-e már a fireRate által megadott idő
        if (currentTime - this.lastShotTime >= this.fireRate) {
            
            const bullet = this.scene.bulletPool.get();
            
            if (bullet) {
                // Sikeres lövés esetén frissítjük az utolsó lövés idejét
                this.lastShotTime = currentTime;
                
                const dx = this.mouse.x - this.x;
                const dy = this.mouse.y - this.y;

                bullet.spawn(this.x, this.y, dx, dy);
            }
        }
    }


    draw() {
        const ctx = this.engine.ctx;

        const dx = this.mouse.x - this.x;
        const dy = this.mouse.y - this.y;

        const angle = Math.atan2(dy, dx);

        ctx.save();

        ctx.translate(this.x, this.y);

        /*
        if (this.shield > 0) {
            ctx.beginPath(); ctx.arc(0, 0, this.radius + 12, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(0, 243, 255, ${0.2 + Math.sin(frameCount * 0.1) * 0.1})`;
            ctx.lineWidth = 2; ctx.stroke();
        }
        */

        ctx.rotate(angle);
        ctx.fillStyle = "#00f3ff";
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#00f3ff'
        ctx.beginPath();

        ctx.beginPath();
        ctx.moveTo(22, 0);
        ctx.lineTo(-12, -14);
        ctx.lineTo(-6, 0);
        ctx.lineTo(-12, 14);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
    }
}