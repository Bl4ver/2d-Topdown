export class Enemy {
    constructor(scene) {
        this.engine = scene.engine;
        this.scene = scene;
        this.canvas = this.engine.canvas;
        this.ctx = this.engine.ctx;

        this.x = 0;
        this.y = 0;
        this.target = { x: 0, y: 0 };
        this.active = false; // Alapból inaktív

        this.angle = 0;

        this.hp = 0;
        this.maxHp = 0;
        this.damage = 0;
        this.speed = 0;
        this.width = 0;
        this.height = 0;
        this.radius = 0;
        this.scoreValue = 0;
        this.earnedCoin = 0;
        this.rotationSpeed = 0;
        this.color = "";
        this.type = "";
        this.level = 0;

        this.exploding = false;
        this.particles = [];
    }

    spawn(name) {
        const template = this.scene.datas?.enemies?.[name];
        if (!template) return console.error(`Adatok nem elérhetőek: ${name}`);

        const w = this.canvas.width;
        const h = this.canvas.height;
        const p = 2 * w + 2 * h;
        const d = Math.random() * p;
        const side = (d >= w) + (d >= w + h) + (d >= 2 * w + h);

        switch (side) {
            case 0: this.x = d; this.y = 0; break;
            case 1: this.x = w; this.y = d - w; break;
            case 2: this.x = (2 * w + h) - d; this.y = h; break;
            case 3: this.x = 0; this.y = (2 * w + 2 * h) - d; break;
        }

        this.hp = template.hp;
        this.maxHp = this.hp;
        this.damage = template.damage;
        this.speed = template.speed;
        this.width = template.width;
        this.height = template.height;
        this.radius = template.radius;
        this.scoreValue = template.scoreValue;
        this.coinAmount = template.earnedCoin;
        this.rotationSpeed = template.rotationSpeed || 3;
        this.color = template.color;
        this.type = template.type;
        this.level = template.level;

        // Alaphelyzetbe állítjuk a robbanást, hátha egy újrahasznosított ellenség
        this.exploding = false;
        this.particles = [];
        this.active = true;
    }

    takeDamage(damage) {
        // Ha inaktív, VAGY már épp robban (halott), ne kapjon több sebzést!
        if (!this.active || this.exploding) return;

        if (this.hp - damage > 0) {
            this.engine.audio.sfx.hit();
            this.hp -= damage;
        } else this.die();

    }

    die() {
        if (!this.active || this.exploding) return;

        this.engine.state.statistics.enemiesKilled += 1;
        this.engine.state.statistics.totalScore += this.scoreValue;
        this.engine.state.highScore = Math.max(this.engine.state.highScore, this.scene.runScore + this.scoreValue);

        this.scene.runScore += this.scoreValue;
        const earnedCoin = this.coinAmount;
        this.scene.runCoins += earnedCoin;
        this.engine.state.coins += earnedCoin;

        const scoreElement = document.getElementById("score");
        if (scoreElement) scoreElement.innerText = String(this.scene.runScore).padStart(6, '0');

        const coinElement = document.getElementById("credits-val");
        if (coinElement) coinElement.innerText = this.scene.runCoins;

        this.engine.audio.sfx.dieEnemy();

        // INNEN JÖN AZ ÚJDONSÁG! Nem tűnik el egyből, hanem robban!
        this.exploding = true;
        this.particles = [];

        // Generálunk 15 kis szilánkot
        for (let i = 0; i < 15; i++) {
            this.particles.push({
                x: this.x,
                y: this.y,
                // Véletlenszerű irány és sebesség (-250 és +250 között)
                vx: (Math.random() - 0.5) * 500,
                vy: (Math.random() - 0.5) * 500,
                // Élettartam (1.0 = 100%, 0 = eltűnt)
                life: 1.0,
                // Véletlenszerű méret 2 és 6 pixel között
                size: Math.random() * 4 + 2
            });
        }
    }

    update(dt) {
        if (!this.active) return;

        // Ha éppen robban, CSÜK a részecskéket mozgatjuk, az ellenséget már nem
        if (this.exploding) {
            let allDead = true;
            this.particles.forEach(p => {
                p.x += p.vx * dt;
                p.y += p.vy * dt;
                p.life -= dt * 2; // Elhalványulás sebessége (0.5 másodperc alatt tűnik el)

                if (p.life > 0) allDead = false;
            });

            // Ha az összes szilánk eltűnt, VÉGLEG kikapcsoljuk az ellenséget
            if (allDead) {
                this.active = false;
                this.exploding = false;
            }
            return; // Kilépünk, hogy ne fusson le az alatta lévő mozgás kód
        }

        // --- Normál mozgás logikája (csak ha nem robban) ---
        this.angle += this.rotationSpeed * dt;

        const dx = this.scene.player.x - this.x;
        const dy = this.scene.player.y - this.y;
        const magnitude = Math.sqrt(dx * dx + dy * dy);

        if (magnitude > 1) {
            const speedX = (dx / magnitude) * this.speed;
            const speedY = (dy / magnitude) * this.speed;
            this.x += speedX * dt;
            this.y += speedY * dt;
        }
    }
}