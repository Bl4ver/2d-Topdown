// bullet.js
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

        // Ha homing, legyen robbanási sugara (pl. 100 pixel)
        this.explosionRadius = (type === "homing") ? 100 : 0;

        let angle = Math.atan2(dy, dx) + (Math.random() - 0.5) * spread;
        this.speedX = Math.cos(angle) * this.speed;
        this.speedY = Math.sin(angle) * this.speed;
        this.active = true;

        /*
        const magnitude = Math.sqrt(dx * dx + dy * dy);
        this.speedX = (dx / magnitude) * this.speed; 
        this.speedY = (dy / magnitude) * this.speed;
        */
    }

    update(dt) {
        if (this.type === "homing") {
            let target = null, minDist = Infinity;
            this.scene.enemyPool.pool.forEach(e => {
                if (!e.active) return;
                const d = (e.x - this.x) ** 2 + (e.y - this.y) ** 2;
                if (d < minDist) { minDist = d; target = e; }
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
        this.x += this.speedX * dt; this.y += this.speedY * dt;
        if (this.x < 0 || this.x > this.scene.engine.canvas.width || this.y < 0 || this.y > this.scene.engine.canvas.height) this.active = false;
    }

    homeInOnTarget(dt) {
        let closestEnemy = null;
        let minDistanceSq = Infinity; // A legkisebb távolság (négyzetesen, hogy spóroljunk a CPU-val)

        // 1. Megkeressük a legközelebbi aktív ellenséget a pályán
        this.scene.enemyPool.pool.forEach(enemy => {
            if (!enemy.active) return;

            // Pitagorasz-tétel (gyökvonás nélkül gyorsabb)
            const distSq = (enemy.x - this.x) ** 2 + (enemy.y - this.y) ** 2;

            if (distSq < minDistanceSq) {
                minDistanceSq = distSq;
                closestEnemy = enemy;
            }
        });

        // 2. Ha találtunk célpontot, forduljunk felé!
        if (closestEnemy) {
            const desiredAngle = Math.atan2(closestEnemy.y - this.y, closestEnemy.x - this.x);
            let currentAngle = Math.atan2(this.speedY, this.speedX);

            let angleDiff = desiredAngle - currentAngle;
            while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
            while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

            const maxTurnThisFrame = this.turnSpeed * dt;

            if (Math.abs(angleDiff) <= maxTurnThisFrame) {
                currentAngle = desiredAngle;
            } else {
                currentAngle += Math.sign(angleDiff) * maxTurnThisFrame;
            }

            this.speedX = Math.cos(currentAngle) * this.speed;
            this.speedY = Math.sin(currentAngle) * this.speed;
        }
    }

    draw() {
        if (!this.active) return;

        // JAVÍTVA: Rakéta design
        this.ctx.save();
        this.ctx.translate(this.x, this.y);

        const angle = Math.atan2(this.speedY, this.speedX);
        this.ctx.rotate(angle);

        if (this.type === "homing") {
            this.ctx.fillStyle = "#FFA500";
            this.ctx.shadowBlur = 10;
            this.ctx.shadowColor = "#FF4500";
            this.ctx.beginPath();
            this.ctx.moveTo(10, 0);
            this.ctx.lineTo(-10, -5);
            this.ctx.lineTo(-6, 0);
            this.ctx.lineTo(-10, 5);
            this.ctx.closePath();
            this.ctx.fill();
        } else {
            this.ctx.fillStyle = "#00f3ff";
            this.ctx.shadowBlur = 10;
            this.ctx.shadowColor = "#00f3ff";
            this.ctx.fillRect(-10, -2, 20, 4);
        }

        this.ctx.restore();
    }
}