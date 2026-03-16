export class Bullet {
    constructor(scene) {
        this.scene = scene;
        this.engine = scene.engine;
        this.ctx = scene.engine.ctx;
        this.canvas = scene.engine.canvas;

        this.active = false;
        this.turnSpeed = 5;

        this.x = 0;
        this.y = 0;
        this.damage = 0;
        this.speed = 0;
        this.speedX = 0;
        this.speedY = 0;
        this.type = "";
    }

    spawn(x, y, dx, dy, damage, speed, type, spread) {
        this.x = x;
        this.y = y;
        this.damage = damage;
        this.speed = speed;
        this.type = type;

        this.explosionRadius = (type === "homing") ? 100 : 0;

        let angle = Math.atan2(dy, dx) + (Math.random() - 0.5) * spread;
        this.speedX = Math.cos(angle) * this.speed;
        this.speedY = Math.sin(angle) * this.speed;
        this.active = true;
    }

    update(dt) {
        if (this.type === "homing") {
            let target = null, minDist = Infinity;
            Object.values(this.scene.enemyPools).forEach(pool => {
                pool.pool.forEach(e => {
                    if (!e.active) return;
                    const d = (e.x - this.x) ** 2 + (e.y - this.y) ** 2;
                    if (d < minDist) { minDist = d; target = e; }
                });
            });
            
            if (target) {
                const desired = Math.atan2(target.y - this.y, target.x - this.x);
                let current = Math.atan2(this.speedY, this.speedX);
                let diff = desired - current;
                while (diff > Math.PI) diff -= Math.PI * 2;
                while (diff < -Math.PI) diff += Math.PI * 2;
                current += Math.sign(diff) * Math.min(Math.abs(diff), this.turnSpeed * dt);
                this.speedX = Math.cos(current) * this.speed;
                this.speedY = Math.sin(current) * this.speed;
            }
        }
        
        this.x += this.speedX * dt; 
        this.y += this.speedY * dt;
        
        if (this.x < 0 || this.x > this.canvas.width || this.y < 0 || this.y > this.canvas.height) {
            this.active = false;
        }
    }
}