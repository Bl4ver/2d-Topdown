// gameScene.js
import { Player } from "../entities/player.js";
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

        // Objektum poolok és entitások
        this.bulletPool = new ObjectPool(Bullet, 200, this);
        this.enemyPool = new ObjectPool(Enemy, 200, this);
        this.player = new Player(this);

        // Run statisztikák
        this.runCoins = 0;
        this.runScore = 0;
        this.runTime = 0;
        this.startTime = 0;

        // Szintlépés beállításai
        this.level = 0;
        this.levelStartTime = 0;
        // Ponthatárok: 1. szint: 20000, 2. szint: 50000, 3. szint: 100000
        this.scoreThresholds = [5000, 10000, 20000];

        // Spawn menedzsment
        this.spawnTimer = 0;
        this.baseSpawnInterval = 2.5;
    }

    init() {
        this.engine.uiManager.showScreen("hud");

        this.player.init(this.engine.state);
        this.player.spawn();
        this.player.active = true;
        this.player.hp = this.player.maxHp;
        let hpDisplay = document.getElementById("hp-fill");
        let hpText = document.getElementById("hp-val");
        if (hpDisplay) hpDisplay.style.width = "100%";
        if (hpText) hpText.innerText = "100%";


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

                const difficultyMultiplier = Math.max(0.2, this.baseSpawnInterval - (levelTime / 30));
                this.spawnTimer = difficultyMultiplier;
            }
            this.updateTimerUI();

            this.player.update(input, dt);
            this.bulletPool.updateAll(dt);
            this.enemyPool.updateAll(dt);

            this.handleCollisions();
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
            // this.engine.audio.sfx.levelUp();
            console.log(`SZINTLÉPÉS! Jelenlegi szint: ${this.level}`);
        }
    }

    getEnemyType() {
        // Mennyi idő telt el Mióta ebbe a szintbe léptünk (másodperc)
        const levelTime = (performance.now() - this.levelStartTime) / 1000;
        const r = Math.random();

        switch (this.level) {
            case 0:
                if (levelTime > 20 && r > 0.8) return "fast";
                return "basic";

            case 1:
                if (levelTime > 30 && r > 0.9) return "elite";
                if (levelTime > 10 && r > 0.6) return "fast";
                return "basic";

            case 2:
                if (levelTime > 20 && r > 0.7) return "elite";
                if (r > 0.4) return "fast";
                return "basic";

            case 3:
                if (r > 0.8) return "boss";
                if (r > 0.4) return "elite";
                return "fast";

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
            if (!bullet.active) return; // Csak az élő golyókat nézzük

            this.enemyPool.pool.forEach(enemy => {
                if (!enemy.active) return; // Csak az élő ellenségeket nézzük

                if (this.physics.checkCollision(bullet, enemy)) {
                    bullet.active = false;
                    enemy.takeDamage(this.player.damage);
                }
            });
        });

        // --- B: Ellenségek vs Játékos ---
        this.enemyPool.pool.forEach(enemy => {
            if (!enemy.active) return;

            if (this.physics.checkCollision(enemy, this.player)) {
                if (this.player.hp > enemy.hp)
                    this.engine.state.statistics.enemiesKilled += 1
                enemy.die();
                this.player.takeDamage(enemy.hp);
            }
        });
    }

    draw(ctx) {
        this.player.draw(ctx);
        this.bulletPool.drawAll();
        this.enemyPool.drawAll();
    }
}