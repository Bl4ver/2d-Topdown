import { Player } from "../entities/player.js";
import { Bullet } from '../entities/bullet.js';

import { RepairBot } from '../entities/bots/repairBot.js';
import { ShooterBot } from '../entities/bots/shooterBot.js';

import { MeleeEnemy } from '../entities/enemyTypes/meleeEnemy.js';
import { ChargerEnemy } from '../entities/enemyTypes/chargerEnemy.js';
import { RangedEnemy } from '../entities/enemyTypes/rangedEnemy.js';
import { KamikazeEnemy } from '../entities/enemyTypes/kamikazeEnemy.js';
import { SupportEnemy } from '../entities/enemyTypes/supportEnemy.js';
import { BossEnemy } from '../entities/enemyTypes/bossEnemy.js';

import { ObjectPool } from "../core/objectPool.js";
import { Physics } from "../core/physics.js";
import { LevelManager } from "../core/levelManager.js";

export class GameScene {
    constructor(engine) {
        this.engine = engine;
        this.physics = new Physics();
        this.input = engine.input;
        
        // Ezeket majd az init-ben kapjuk meg
        this.datas = null;
        this.state = null;

        this.explosions = [];

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
        };

        this.runCoins = 0;
        this.runScore = 0;
        this.runTime = 0;
        this.startTime = 0;

        this.levelManager = new LevelManager(this);
        this.spawnTimer = 0;
    }

    // Az init most már megkapja a friss state-et és adatokat a SceneManager-től
    init(state, datas) {
        this.state = state;
        this.datas = datas;
        
        this.engine.uiManager.showScreen("hud");
        this.engine.isPaused = false;

        this.engine.uiManager.bindButtonEvents({
            onPause: () => {
                this.engine.isPaused = true;
                this.engine.uiManager.showScreen("pause-screen");
            },
            onResume: () => {
                this.engine.isPaused = false;
                this.engine.uiManager.showScreen("hud");
            },
            onPauseSettings: () => this.engine.uiManager.showScreen("settings-screen"),
            onSettingsBack: () => {
                if (this.engine.sceneManager.currentSceneName === 'game' || this.engine.sceneManager.currentSceneName === 'testground') {
                    this.engine.uiManager.showScreen("pause-screen");
                } else {
                    this.engine.sceneManager.changeScene("menu");
                }
            },
            onQuit: () => this.quitGame()
        });

        this.player.init(this.state, this.datas);
        this.player.spawn();
        this.player.active = true;
        this.player.hp = this.player.maxHp;

        let hpDisplay = document.getElementById("hp-fill");
        let hpText = document.getElementById("hp-val");
        if (hpDisplay) hpDisplay.style.width = "100%";
        if (hpText) hpText.innerText = "100%";

        this.state.inventory.activeBots.forEach(active => {
            if (!this.botPools[active]) return;
            this.botPools[active].get().init(active, this.state, this.datas);
        });

        this.runTime = 0;
        this.runScore = 0;
        this.runCoins = 0;
        this.spawnTimer = 0.5;
        this.startTime = performance.now();
        this.levelManager.init();

        this.updateTimerUI();
        this.updateLevelUI();
        document.getElementById("score").innerText = "000000";
        document.getElementById("credits-val").innerText = "0";
    }

    quitGame() {
        this.finalizeStats();
        this.engine.isPaused = false;
        document.getElementById("cheat-menu").classList.add("hidden");
        this.engine.sceneManager.changeScene("menu");
    }

    update(input, dt) {
        if (this.player.active) {
            this.runTime = (performance.now() - this.startTime) / 1000;
            this.levelManager.checkLevelUp();
            this.spawnTimer -= dt;

            if (this.spawnTimer <= 0) {
                const enemyName = this.levelManager.getEnemyName();
                const enemyData = this.datas.enemies[enemyName];

                if (enemyData) {
                    const poolType = enemyData.type;
                    const targetPool = this.enemyPools[poolType];
                    const enemy = targetPool.get();
                    if (enemy) enemy.spawn(enemyName);
                }
                this.spawnTimer = this.levelManager.getCurrentSpawnInterval();
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
            this.engine.sceneManager.changeScene("menu");
        }
    }

    updateLevelUI() {
        const levelLabel = document.querySelector(".level-label");
        if (levelLabel) levelLabel.innerText = `SZINT ${(this.levelManager.level + 1).toString().padStart(2, '0')}`;
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
        const stats = this.state.statistics;
        stats.totalPlayTime += this.runTime;
        stats.totalGamesPlayed += 1;

        if (this.runTime > stats.maxTime) stats.maxTime = this.runTime;
        if (this.runTime > 1 && (stats.minTime === 0 || this.runTime < stats.minTime)) {
            stats.minTime = this.runTime;
        }

        this.engine.dataManager.save();
    }

    handleCollisions() {
        // --- A: Barátságos Lövedékek vs Ellenségek ---
        this.playerBulletPool.pool.forEach(bullet => {
            if (!bullet.active) return;
            Object.values(this.enemyPools).forEach(pool => {
                pool.pool.forEach(enemy => {
                    if (enemy.active && !enemy.exploding && this.physics.checkCollision(bullet, enemy)) {
                        bullet.type === "homing" ? this.triggerExplosion(bullet) : enemy.takeDamage(bullet.damage);
                        bullet.active = false;
                    }
                });
            });
        });

        // --- B: Ellenségek vs Játékos ---
        Object.values(this.enemyPools).forEach(pool => {
            pool.pool.forEach(enemy => {
                if (enemy.active && !enemy.exploding && this.physics.checkCollision(enemy, this.player)) {
                    this.player.takeDamage(enemy.hp);
                    enemy.die();
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
                    if (bot.active && !bot.exploding && this.physics.checkCollision(bullet, bot)) {
                        bot.takeDamage(bullet.damage);
                        bullet.active = false;
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
                if ((dx * dx + dy * dy) <= (bullet.explosionRadius || 100) ** 2) {
                    enemy.takeDamage(bullet.damage);
                }
            });
        });

        this.explosions.push({
            x: bullet.x, y: bullet.y, r: 0,
            maxR: bullet.explosionRadius || 100, alpha: 1
        });
    }

    createExplosionEffect(x, y, radius) {
        this.explosionFlash = { x, y, r: 0, maxR: radius, alpha: 1 };
    }

    draw(ctx) {
        this.engine.renderer.renderPlayer(this.player);
        Object.values(this.botPools).forEach(pool => pool.pool.forEach(bot => this.engine.renderer.renderBot(bot)));
        Object.values(this.enemyPools).forEach(pool => pool.pool.forEach(enemy => this.engine.renderer.renderEnemy(enemy)));
        this.playerBulletPool.pool.forEach(bullet => this.engine.renderer.renderBullet(bullet));
        this.enemyBulletPool.pool.forEach(bullet => this.engine.renderer.renderBullet(bullet));
        this.explosions.forEach(exp => this.engine.renderer.renderExplosion(exp));
    }

    getAllActiveEnemies() {
        return Object.values(this.enemyPools).flatMap(pool => pool.pool.filter(e => e.active));
    }
}