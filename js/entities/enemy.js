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
    }

    spawn(name) {
        const template = this.scene.datas?.enemies?.[name];
        if (!template) return console.error(`Adatok nem elérhetőek, vagy nincs ilyen ellenség: ${name}`);

        const w = this.canvas.width;
        const h = this.canvas.height;

        // Teljes kerület és véletlen távolság kiszámítása
        const p = 2 * w + 2 * h;
        const d = Math.random() * p;

        // Melyik oldalra esik a pont? (0: Teteje, 1: Jobb, 2: Alja, 3: Bal)
        const side = (d >= w) + (d >= w + h) + (d >= 2 * w + h);

        // Koordináták beállítása a kiválasztott oldal alapján
        switch (side) {
            case 0: // Felső él
                this.x = d;
                this.y = 0;
                break;
            case 1: // Jobb él
                this.x = w;
                this.y = d - w;
                break;
            case 2: // Alsó él (jobbról balra haladva)
                this.x = (2 * w + h) - d;
                this.y = h;
                break;
            case 3: // Bal él (lentről felfelé haladva)
                this.x = 0;
                this.y = (2 * w + 2 * h) - d;
                break;
        }

        this.hp = template.hp;
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

        // Aktiváljuk a golyót
        this.active = true;
    }

    takeDamage(damage) {
        if (this.hp - damage > 0) {
            this.engine.audio.sfx.hit()
            this.hp -= damage;
        }

        else this.die();
    }

    die() {
        if (!this.active) return;

        // 1. GLOBÁLIS STATISZTIKA (Hogy a profilodban megmaradjon az összesítés)
        this.engine.state.statistics.enemiesKilled += 1;
        this.engine.state.statistics.totalScore += this.scoreValue; // Összesített pont
        this.engine.state.highScore = Math.max(this.engine.state.highScore, this.scene.runScore + this.scoreValue);

        // 2. AKTUÁLIS KÖR (RUN) ADATAI
        this.scene.runScore += this.scoreValue;
        const earnedCoin = this.coinAmount;
        this.scene.runCoins += earnedCoin;

        // A globális pénztárcát is növeljük, hogy elmentődjön
        this.engine.state.coins += earnedCoin;

        // 3. UI FRISSÍTÉS - Csak a jelenlegi kör pontszáma (6 karakteres formátum)
        const scoreElement = document.getElementById("score");
        if (scoreElement) {
            scoreElement.innerText = String(this.scene.runScore).padStart(6, '0');
        }

        // 4. UI FRISSÍTÉS - Csak a jelenlegi kör pénze
        const coinElement = document.getElementById("credits-val");
        if (coinElement) {
            coinElement.innerText = this.scene.runCoins;
        }

        // 5. Effekt és deaktiválás
        this.engine.audio.sfx.dieEnemy();
        this.active = false;
    }

    update(dt) {
        if (!this.active) return;

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

    draw() {
        if (!this.active) return;

        this.ctx.save();

        this.ctx.translate(this.x, this.y);

        this.ctx.rotate(this.angle);

        this.ctx.strokeStyle = this.color;
        this.ctx.lineWidth = 3;
        this.ctx.shadowBlur = 15;
        this.ctx.shadowColor = this.color;

        this.ctx.strokeRect(-this.width / 2, -this.height / 2, this.width, this.height);

        this.ctx.restore();

    }
}