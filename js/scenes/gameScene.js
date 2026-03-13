// gameScene.js
import { Player } from "../entities/player.js";
import { Bullet } from '../entities/bullet.js';

import { RepairBot } from '../entities/bots/repairBot.js';
import { ShooterBot } from '../entities/bots/shooterBot.js';
// import { MinerBot } from '../entities/bots/minerBot.js';
// import { BuilderBot } from '../entities/bots/builderBot.js';
// import { FighterBot } from '../entities/bots/fighterBot.js';
// import { GuardBot } from '../entities/bots/guardBot.js';
// import { ScoutBot } from '../entities/bots/scoutBot.js';

import { MeleeEnemy } from '../entities/enemyTypes/meleeEnemy.js';
import { ChargerEnemy } from '../entities/enemyTypes/chargerEnemy.js';
import { RangedEnemy } from '../entities/enemyTypes/rangedEnemy.js';
import { KamikazeEnemy } from '../entities/enemyTypes/kamikazeEnemy.js';
import { SupportEnemy } from '../entities/enemyTypes/supportEnemy.js';
import { BossEnemy } from '../entities/enemyTypes/bossEnemy.js';

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
        this.player = new Player(this);
        this.playerBulletPool = new ObjectPool(Bullet, 200, this);
        this.enemyBulletPool = new ObjectPool(Bullet, 200, this);
        this.enemyPools = {
            melee: new ObjectPool(MeleeEnemy, 300, this),
            range: new ObjectPool(RangedEnemy, 100, this),
            kamikaze: new ObjectPool(KamikazeEnemy, 100, this),
            support: new ObjectPool(SupportEnemy, 50, this),
            charger: new ObjectPool(ChargerEnemy, 100, this),
            boss: new ObjectPool(BossEnemy, 5, this)
        };

        this.botPools = {
            repair: new ObjectPool(RepairBot, 10, this),
            shooter: new ObjectPool(ShooterBot, 10, this)
            // miner: new ObjectPool(MinerBot, 10, this),
            // builder: new ObjectPool(BuilderBot, 10, this),
            // fighter: new ObjectPool(FighterBot, 10, this),
            // guard: new ObjectPool(GuardBot, 10, this),
            // scout: new ObjectPool(ScoutBot, 10, this)
        };

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
        this.engine.isPaused = false;

        // EGYETLEN ESEMÉNYKEZELŐ (Ez köti be a Pause menüt és a gombjait)
        this.engine.uiManager.bindButtonEvents({
            onPause: () => {
                console.log("Játék megállítva!"); // Képernyőre is ír a konzolban
                this.engine.isPaused = true;
                this.engine.uiManager.showScreen("pause-screen");
            },
            onResume: () => {
                this.engine.isPaused = false;
                this.engine.uiManager.showScreen("hud");
            },
            onPauseSettings: () => {
                this.engine.uiManager.showScreen("settings-screen");
            },
            onSettingsBack: () => {
                if (this.engine.currentSceneName === 'game' || this.engine.currentSceneName === 'testground') {
                    this.engine.uiManager.showScreen("pause-screen");
                } else {
                    this.engine.changeScene("menu");
                }
            },
            onQuit: () => this.quitGame()
        });

        // Játékos inicializálása
        this.player.init(this.state, this.datas);
        this.player.spawn();
        this.player.active = true;
        this.player.hp = this.player.maxHp;

        // Életerő csík frissítése
        let hpDisplay = document.getElementById("hp-fill");
        let hpText = document.getElementById("hp-val");
        if (hpDisplay) hpDisplay.style.width = "100%";
        if (hpText) hpText.innerText = "100%";

        // Botok inicializálása
        this.state.inventory.activeBots.forEach(active => {
            if (!this.botPools[active]) return;
            this.botPools[active].get().init(active, this.state, this.datas);
        });

        // Változók lenullázása
        this.runTime = 0;
        this.runScore = 0;
        this.runCoins = 0;
        this.spawnTimer = 0.5;
        this.startTime = performance.now();

        this.level = 0;
        this.levelStartTime = performance.now();

        // UI lenullázása
        this.updateTimerUI();
        this.updateLevelUI();
        document.getElementById("score").innerText = "000000";
        document.getElementById("credits-val").innerText = "0";

        // ITT VOLT A HIBÁS KÓD, AZT TELJESEN KITÖRÖLTEM INNEN!
    }

    quitGame() {
        this.finalizeStats();
        this.engine.isPaused = false;

        document.getElementById("cheat-menu").classList.add("hidden");

        this.engine.changeScene("menu");
    }

    update(input, dt) {
        if (this.player.active) {
            this.runTime = (performance.now() - this.startTime) / 1000;

            this.checkLevelUp();
            this.spawnTimer -= dt;

            if (this.spawnTimer <= 0) {
                const enemyName = this.getEnemyName();
                const enemyData = this.datas.enemies[enemyName];

                if (enemyData) {
                    const poolType = enemyData.type;
                    const targetPool = this.enemyPools[poolType];
                    const enemy = targetPool.get();

                    if (enemy) enemy.spawn(enemyName);
                }

                const levelTime = (performance.now() - this.levelStartTime) / 1000;
                const difficultyMultiplier = Math.max(this.minSpawnInterval, this.baseSpawnInterval - (levelTime / 30));
                this.spawnTimer = difficultyMultiplier;
            }
            this.updateTimerUI();

            this.player.update(input, dt);
            Object.values(this.botPools).forEach(pool => pool.updateAll(dt));
            this.playerBulletPool.updateAll(dt);
            this.enemyBulletPool.updateAll(dt);
            Object.values(this.enemyPools).forEach(pool => pool.updateAll(dt));

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
        if (this.level < this.scoreThresholds.length && this.runScore >= this.scoreThresholds[this.level]) {
            this.level++;
            this.levelStartTime = performance.now();
            Object.values(this.enemyPools).forEach(pool => pool.releaseAll());

            this.updateLevelUI();

            this.engine.audio.sfx.levelUp();
            console.log(`SZINTLÉPÉS! Jelenlegi szint: ${this.level}`);
        }
    }

    getEnemyName() {
        const levelTime = (performance.now() - this.levelStartTime) / 1000;
        const r = Math.random();

        switch (this.level) {
            case 0:
                // 1. Szint (0): Könnyű kezdés, sok apró Swarm, később Basic
                this.minSpawnInterval = 0.3;
                if (levelTime > 20 && r > 0.7) return "basic";
                return "swarm";

            case 1:
                // 2. Szint (1): Bejönnek a gyorsak és a bombázók
                this.minSpawnInterval = 0.25;
                if (levelTime > 30 && r > 0.8) return "bomber";
                if (levelTime > 10 && r > 0.5) return "fast";
                return "basic";

            case 2:
                // 3. Szint (2): Megjelenik a tankos Brute, a gyógyító Healer és egy-egy Bullet
                this.minSpawnInterval = 0.2;
                if (levelTime > 20 && r > 0.85) return "healer";
                if (r > 0.7) return "bullet";
                if (r > 0.5) return "brute";
                if (r > 0.3) return "fast";
                return "swarm";

            case 3:
                // 4. Szint (3): Lövöldözős szakasz (Shooter és Teleporter)
                if (r > 0.8) return "charger";
                if (r > 0.6) return "elite";
                if (r > 0.3) return "shooter";
                if (r > 0.1) return "teleporter";
                return "fast";

            case 4:
                // 5. Szint (4): Nagyon kemény normál hullám (Guard, Sniper, és Bullet horda)
                if (r > 0.9) return "guard";
                if (r > 0.75) return "charger";
                if (r > 0.6) return "sniper";
                if (r > 0.3) return "elite";
                return "healer";

            case 5:
                // 6. Szint (5): MINIBOSS HARC
                if (!this.bossFight) {
                    this.bossFight = true;
                    return "miniboss";
                }
                // Amíg a Miniboss él, elit seregek jönnek lassan
                this.minSpawnInterval = 3.0;
                if (r > 0.8) return "charger";
                if (r > 0.6) return "brute";
                return "fast";

            case 6:
                // 7. Szint (6): VÉGSŐ BOSS HARC
                if (!this.bossFight) {
                    this.bossFight = true;
                    return "boss";
                }
                this.minSpawnInterval = 4.0;
                if (r > 0.8) return "guard";
                return "shooter";

            case 7:
                // Győzelem utáni kilépés
                this.bossFight = false;
                this.engine.changeScene("menu");
                return "basic";

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

        stats.totalPlayTime += this.runTime;
        stats.totalGamesPlayed += 1;

        if (this.runTime > stats.maxTime) {
            stats.maxTime = this.runTime;
        }

        if (this.runTime > 1) {
            if (stats.minTime === 0 || this.runTime < stats.minTime) {
                stats.minTime = this.runTime;
            }
        }

        this.engine.save();
    }

    handleCollisions() {
        // --- A: Barátságos Lövedékek vs Ellenségek ---
        this.playerBulletPool.pool.forEach(bullet => {
            if (!bullet.active) return;

            Object.values(this.enemyPools).forEach(pool => {
                pool.pool.forEach(enemy => {
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
        });

        // --- B: Ellenségek vs Játékos ---
        Object.values(this.enemyPools).forEach(pool => {
            pool.pool.forEach(enemy => {
                if (enemy.active && !enemy.exploding) {
                    if (this.physics.checkCollision(enemy, this.player)) {
                        this.player.takeDamage(enemy.hp);
                        enemy.die();
                    }
                }
            });
        });

        // --- C: Ellenséges Lövedékek vs Játékos/Bot ---
        this.enemyBulletPool.pool.forEach(bullet => {
            if (!bullet.active) return;

            if (this.physics.checkCollision(bullet, this.player)) {
                this.player.takeDamage(bullet.damage);
                bullet.active = false;
            }

            Object.values(this.botPools).forEach(pool => {
                pool.pool.forEach(bot => {
                    if (bot.active && !bot.exploding) {
                        if (this.physics.checkCollision(bullet, bot)) {
                            bot.takeDamage(bullet.damage);
                            bullet.active = false;
                        }
                    }
                });
            });
        });
    }

    triggerExplosion(bullet) {
        this.engine.audio.sfx.explosion();

        Object.values(this.enemyPools).forEach(pool => {
            pool.pool.forEach(enemy => {
                if (!enemy.active) return;
                const dx = enemy.x - bullet.x;
                const dy = enemy.y - bullet.y;
                const distSq = dx * dx + dy * dy;

                const radius = bullet.explosionRadius || 100;
                if (distSq <= radius * radius) {
                    enemy.takeDamage(bullet.damage);
                }
            });
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

        Object.values(this.botPools).forEach(pool => {
            pool.pool.forEach(bot => this.engine.renderer.renderBot(bot));
        });

        Object.values(this.enemyPools).forEach(pool => {
            pool.pool.forEach(enemy => this.engine.renderer.renderEnemy(enemy));
        });

        this.playerBulletPool.pool.forEach(bullet => this.engine.renderer.renderBullet(bullet));
        this.enemyBulletPool.pool.forEach(bullet => this.engine.renderer.renderBullet(bullet));

        this.explosions.forEach(exp => {
            this.engine.renderer.renderExplosion(exp);
        });
    }

    getAllActiveEnemies() {
        let enemies = [];
        Object.values(this.enemyPools).forEach(pool => {
            enemies = enemies.concat(pool.pool.filter(e => e.active));
        });
        return enemies;
    }
}