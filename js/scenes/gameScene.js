// gameScene.js
import { Player } from "../entities/player.js";
import { Bot } from "../entities/bot.js";
import { Bullet } from '../entities/bullet.js';
import { Enemy } from '../entities/enemy.js';
import { ObjectPool } from "../core/objectPool.js";
import { Physics } from "../core/physics.js";

export class GameScene {
    constructor(engine) {
        this.engine = engine;
        this.physics = new Physics();
        this.input = engine.input;
        this.datas = engine.datas;
        this.state = engine.state;

        this.explosions = [];

        // Objektum poolok és entitások
        this.bulletPool = new ObjectPool(Bullet, 200, this);
        this.enemyPool = new ObjectPool(Enemy, 200, this);
        this.botPool = new ObjectPool(Bot, 10, this);
        this.player = new Player(this);

        // Run statisztikák
        this.runCoins = 0;
        this.runScore = 0;
        this.runTime = 0;
        this.startTime = 0;

        // Szintlépés beállításai
        this.level = 0;
        this.levelStartTime = 0;
        // Ponthatárok: 1. szint: 20000, 2. szint: 10000, 3. szint: 20000...
        this.scoreThresholds = [5000, 10000, 20000, 50000, 100000, 1000000];

        // Spawn menedzsment
        this.spawnTimer = 0;
        this.baseSpawnInterval = 2.5;
        this.minSpawnInterval = 0.2;
        this.bossFight = false;
    }

    init() {
        this.engine.uiManager.showScreen("hud");
        this.engine.uiManager.bindButtonEvents({
            onPause: () => this.engine.changeScene('menu')
        });
        this.player.init(this.state, this.datas);
        this.player.spawn();
        this.player.active = true;
        this.player.hp = this.player.maxHp;
        let hpDisplay = document.getElementById("hp-fill");
        let hpText = document.getElementById("hp-val");
        if (hpDisplay) hpDisplay.style.width = "100%";
        if (hpText) hpText.innerText = "100%";


        console.log(this.state.inventory.activeBots)  // --> undifined
        let temp = 0;
        this.state.inventory.activeBots.forEach(active => {
            console.log(temp)
            temp++;
            this.botPool.get().init(active, this.state, this.datas);
        });

        /*
        Object.keys(this.state.inventory.bots).forEach(bot => {
            bot.init(bot, this.state, this.datas)
        });
        */


        this.runTime = 0;
        this.runScore = 0;
        this.runCoins = 0;
        this.spawnTimer = 0.5;
        this.startTime = performance.now();

        // Szint adatok nullázása induláskor
        this.level = 0;
        this.levelStartTime = performance.now();

        // Pause gomb beállítása
        this.engine.uiManager.bindButtonEvents({
            onPause: () => this.engine.changeScene(this.engine.previousSceneName)
        });

        // UI lenullázása
        this.updateTimerUI();
        this.updateLevelUI();
        document.getElementById("score").innerText = "000000";
        document.getElementById("credits-val").innerText = "0";
    }

    // GameScene.js - update metódus:
    update(input, dt) { // Hozzáadva a dt paraméter!
        if (this.player.active) {
            this.runTime = (performance.now() - this.startTime) / 1000;

            this.checkLevelUp();
            this.spawnTimer -= dt;

            if (this.spawnTimer <= 0) {
                const type = this.getEnemyType();
                const enemy = this.enemyPool.get();
                if (enemy) enemy.spawn(type);

                const levelTime = (performance.now() - this.levelStartTime) / 1000;

                const difficultyMultiplier = Math.max(this.minSpawnInterval, this.baseSpawnInterval - (levelTime / 30));
                this.spawnTimer = difficultyMultiplier;
            }
            this.updateTimerUI();

            this.player.update(input, dt);
            this.botPool.updateAll(dt);
            this.bulletPool.updateAll(dt);
            this.enemyPool.updateAll(dt);

            this.handleCollisions();

            this.explosions.forEach(exp => {
                exp.r += 300 * dt;
                exp.alpha -= 1.5 * dt;
            });

            this.explosions = this.explosions.filter(exp => exp.alpha > 0);
        } else {
            this.finalizeStats();
            this.engine.changeScene("menu");
        }
    }

    updateLevelUI() {
        const levelLabel = document.querySelector(".level-label");
        if (levelLabel) {
            levelLabel.innerText = `SZINT ${(this.level + 1).toString().padStart(2, '0')}`;
        }
    }

    checkLevelUp() {
        // Megnézzük, van-e még következő szint, ÉS a pontszámunk elérte-e a határt
        if (this.level < this.scoreThresholds.length && this.runScore >= this.scoreThresholds[this.level]) {
            this.level++; // Szintlépés!
            this.levelStartTime = performance.now(); // Újraindítjuk a szint-időzítőt
            this.enemyPool.releaseAll()

            this.updateLevelUI(); // Kiírjuk a HUD-ra

            // Itt akár lejátszhatsz egy hangeffektet is!
            this.engine.audio.sfx.levelUp();
            console.log(`SZINTLÉPÉS! Jelenlegi szint: ${this.level}`);
        }
    }

    getEnemyType() {
        // Mennyi idő telt el Mióta ebbe a szintbe léptünk (másodperc)
        const levelTime = (performance.now() - this.levelStartTime) / 1000;
        const r = Math.random();

        switch (this.level) {
            case 0:
                this.minSpawnInterval = 0.2;
                if (levelTime > 20 && r > 0.8) return "fast";   // 20%
                return "basic";                                 // 80%

            case 1:
                if (levelTime > 30 && r > 0.9) return "elite";  // 10%
                if (levelTime > 10 && r > 0.6) return "fast";   // 30%
                return "basic";                                 // 60%

            case 2:
                if (levelTime > 20 && r > 0.7) return "elite";  // 30%
                if (r > 0.4) return "fast";                     // 30%
                return "basic";                                 // 40%

            case 3:
                if (r > 0.6) return "elite";                    // 40%
                if (r > 0.2) return "fast";                     // 40%
                return "basic";                                 // 20%
            case 4:
                if (r > 0.9) return "guard";                    // 10%
                if (r > 0.4) return "elite";                    // 50%
                return "fast";                                  // 40%
            case 5:
                if (!this.bossFight) { this.bossFight = true; return "boss" }      // 100% első alkalomra
                if (r > 0.8) return "guard";                    // 20%
                this.minSpawnInterval = 20;
                return "elite";                                 // 80%
            case 6:
                this.bossFight = false;
                this.engine.changeScene("menu");
            default:
                return "basic";
        }
    }

    updateTimerUI() {
        const runTimeDisplay = document.getElementById("run-time-display");
        if (runTimeDisplay) {
            const mins = Math.floor(this.runTime / 60);
            const secs = Math.floor(this.runTime % 60);
            runTimeDisplay.innerText = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
    }

    finalizeStats() {
        const stats = this.engine.state.statistics;

        // 1. Összes játszott idő
        stats.totalPlayTime += this.runTime;
        stats.totalGamesPlayed += 1;

        // 2. MAX TIME (Rekord túlélés)
        if (this.runTime > stats.maxTime) {
            stats.maxTime = this.runTime;
        }

        // 3. MIN TIME (Leggyorsabb vereség)
        if (this.runTime > 1) {
            if (stats.minTime === 0 || this.runTime < stats.minTime) {
                stats.minTime = this.runTime;
            }
        }

        this.engine.save();
    }

    handleCollisions() {
        // --- A: Lövedékek vs Ellenségek ---
        this.bulletPool.pool.forEach(bullet => {
            if (!bullet.active) return;

            this.enemyPool.pool.forEach(enemy => {
                if (enemy.active && !enemy.exploding) {
                    if (this.physics.checkCollision(bullet, enemy)) {
                        if (bullet.type === "homing") {
                            this.triggerExplosion(bullet);
                        } else {
                            enemy.takeDamage(bullet.damage);
                        }
                        bullet.active = false;
                    }
                }


            });
        });

        // --- B: Ellenségek vs Játékos ---
        this.enemyPool.pool.forEach(enemy => {
            if (enemy.active && !enemy.exploding) {

                if (this.physics.checkCollision(enemy, this.player)) {
                    // Itt maradhat az "ütközési" sebzés (pl. az enemy HP-ja vonódik le a játékostól)
                    this.player.takeDamage(enemy.hp);
                    enemy.die();
                }
            }
        });
    }

    triggerExplosion(bullet) {
        this.engine.audio.sfx.explosion();

        this.enemyPool.pool.forEach(enemy => {
            if (!enemy.active) return;
            const dx = enemy.x - bullet.x;
            const dy = enemy.y - bullet.y;
            const distSq = dx * dx + dy * dy;

            const radius = bullet.explosionRadius || 100;
            if (distSq <= radius * radius) {
                enemy.takeDamage(bullet.damage);
            }
        });

        this.explosions.push({
            x: bullet.x,
            y: bullet.y,
            r: 0,
            maxR: bullet.explosionRadius || 100,
            alpha: 1
        });
    }

    createExplosionEffect(x, y, radius) {
        this.explosionFlash = { x, y, r: 0, maxR: radius, alpha: 1 };
    }

    draw(ctx) {
        this.engine.renderer.renderPlayer(this.player);
        this.botPool.pool.forEach(bot => this.engine.renderer.renderBot(bot));
        this.enemyPool.pool.forEach(enemy => this.engine.renderer.renderEnemy(enemy));
        this.bulletPool.pool.forEach(bullet => this.engine.renderer.renderBullet(bullet));

        this.explosions.forEach(exp => {
            this.engine.renderer.renderExplosion(exp);
        });
    }
}