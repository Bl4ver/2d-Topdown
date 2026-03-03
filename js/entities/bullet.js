// bullet.js
export class Bullet {
    constructor(scene) {
        this.engine = scene.engine;
        this.scene = scene;
        this.canvas = this.engine.canvas;
        this.ctx = this.engine.ctx;

        this.x = 0;
        this.y = 0;
        this.damage = 0;
        this.speed = 0;
        this.speedX = 0;
        this.speedY = 0;
        this.type = "";

        this.turnSpeed = 5; // Mennyire fordulékony a rakéta (Radián / másodperc)
        this.active = false;
    }

    spawn(x, y, dx, dy, damage, speed, type, spread = 0) {
        this.x = x;
        this.y = y;
        this.damage = damage;
        this.speed = speed;
        this.type = type;

        // Kiszámoljuk az eredeti, egér felé mutató szöget
        let angle = Math.atan2(dy, dx);

        // Hozzáadunk egy véletlenszerű eltérést a 'spread' alapján!
        // (Math.random() - 0.5) egy -0.5 és +0.5 közötti értéket ad
        if (spread > 0) {
            angle += (Math.random() - 0.5) * spread;
        }

        /*
        const magnitude = Math.sqrt(dx * dx + dy * dy);
        this.speedX = (dx / magnitude) * this.speed; 
        this.speedY = (dy / magnitude) * this.speed;
        */

        this.active = true;
    }

    update(dt) {
        if (!this.active) return;

        // Ha ez egy nyomkövető rakéta, akkor módosítjuk a röppályáját
        if (this.type === "homing") {
            this.homeInOnTarget(dt);
        }

        // Mozgatjuk a lövedéket a (kiszámolt vagy módosított) sebességgel
        this.x += this.speedX * dt;
        this.y += this.speedY * dt;

        // Ha kimegy a képernyőről, deaktiváljuk
        if (this.x < -50 || this.x > this.canvas.width + 50 ||
            this.y < -50 || this.y > this.canvas.height + 50) {
            this.active = false;
        }
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