// enemy.js
export class Enemy {
    constructor(scene) {
        this.engine = scene.engine;
        this.scene = scene;
        this.canvas = this.engine.canvas;
        this.ctx = this.engine.ctx;

        this.x = 0;
        this.y = 0;
        this.active = false;
        this.angle = 0;

        // Adatok
        this.hp = 0;
        this.maxHp = 0;
        this.damage = 0;
        this.speed = 0;
        this.width = 0;
        this.height = 0;
        this.radius = 0;
        this.scoreValue = 0;
        this.coinAmount = 0;
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
            case 0: this.x = d; this.y = -50; break;
            case 1: this.x = w + 50; this.y = d - w; break;
            case 2: this.x = (2 * w + h) - d; this.y = h + 50; break;
            case 3: this.x = -50; this.y = (2 * w + 2 * h) - d; break;
        }

        this.hp = template.hp;
        this.maxHp = this.hp;
        this.damage = template.damage;
        this.speed = template.speed;
        this.width = template.width;
        this.height = template.height;
        this.radius = (template.width / 2) + (template.height * 0.05);
        this.scoreValue = template.scoreValue;
        this.coinAmount = template.earnedCoin;
        this.rotationSpeed = template.rotationSpeed || 3;
        this.color = template.color;
        this.type = template.type;
        this.level = template.level;

        this.exploding = false;
        this.particles = [];
        this.active = true;
    }

    takeDamage(damage) {
        if (!this.active || this.exploding) return;

        if (this.hp - damage > 0) {
            this.engine.audio.sfx.hit();
            this.hp -= damage;
        } else {
            this.die();
        }
    }

    die() {
        if (!this.active || this.exploding) return;

        this.engine.state.statistics.enemiesKilled += 1;
        this.engine.state.statistics.totalScore += this.scoreValue;
        this.engine.state.highScore = Math.max(this.engine.state.highScore, this.scene.runScore + this.scoreValue);

        this.scene.runScore += this.scoreValue;
        this.scene.runCoins += this.coinAmount;
        this.engine.state.coins += this.coinAmount;

        const scoreElement = document.getElementById("score");
        if (scoreElement) scoreElement.innerText = String(this.scene.runScore).padStart(6, '0');

        const coinElement = document.getElementById("credits-val");
        if (coinElement) coinElement.innerText = this.scene.runCoins;

        this.engine.audio.sfx.dieEnemy();

        this.exploding = true;
        this.particles = [];

        for (let i = 0; i < 15; i++) {
            this.particles.push({
                x: this.x,
                y: this.y,
                vx: (Math.random() - 0.5) * 500,
                vy: (Math.random() - 0.5) * 500,
                life: 1.0,
                size: Math.random() * 4 + 2
            });
        }
    }

    update(dt) {
        if (!this.active) return;

        // --- FORGÁS LOGIKA ---
        if (!this.exploding) {
            this.angle += this.rotationSpeed * dt;

            if (this.angle >= Math.PI * 2) {
                this.angle -= Math.PI * 2;
            }
        }

        // --- RÉSZECSKÉK (ROBBANÁS) KEZELÉSE ---
        if (this.exploding) {
            let allDead = true;
            this.particles.forEach(p => {
                p.x += p.vx * dt;
                p.y += p.vy * dt;
                p.life -= dt * 2;
                if (p.life > 0) allDead = false;
            });

            if (allDead) {
                this.active = false;
                this.exploding = false;
            }
        }
    }
}