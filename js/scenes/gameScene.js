// gameScene.js
import { Player } from "../entities/player.js";
import { Bullet } from '../entities/bullet.js';
import { Enemy } from '../entities/enemy.js';
import { ObjectPool } from "../core/objectPool.js";
import { Physics } from "../core/physics.js";

export class GameScene {
    constructor(engine) {
        this.engine = engine;
        this.scene = engine.scene;
        this.physics = new Physics();

        this.bulletPool = new ObjectPool(Bullet, 200, this);
        this.enemyPool = new ObjectPool(Enemy, 200, this);
        this.player = new Player(this);
    }

    init() {
        this.engine.uiManager.showScreen("hud");
        this.player.init(this.engine.state);
        this.player.active = true;
    }

    update(input) {
        if (this.player.active) {
            if (Math.random() > 0.995) {
                this.enemyPool.get().spawn();
            }

            this.player.update(input);

            this.bulletPool.updateAll();
            this.enemyPool.updateAll();

            this.handleCollisions();
        }

        else this.engine.changeScene("menu");
    }

    handleCollisions() {
        // --- A: Lövedékek vs Ellenségek ---
        this.bulletPool.pool.forEach(bullet => {
            if (!bullet.active) return; // Csak az élő golyókat nézzük

            this.enemyPool.pool.forEach(enemy => {
                if (!enemy.active) return; // Csak az élő ellenségeket nézzük

                if (this.physics.checkCollision(bullet, enemy)) {
                    // Találat történt!
                    bullet.active = false;      // Golyó "eltűnik"
                    enemy.takeDamage(this.player.damage);       // Ellenség sebződik (függvény az Enemy-ben)
                }
            });
        });

        // --- B: Ellenségek vs Játékos ---
        this.enemyPool.pool.forEach(enemy => {
            if (!enemy.active) return;

            if (this.physics.checkCollision(enemy, this.player)) {
                // A játékos nekiment egy ellenségnek
                enemy.active = false;           // Ellenség felrobban
                this.player.takeDamage(enemy.damage);     // Játékos sebződik
            }
        });
    }

    draw(ctx) {
        this.player.draw(ctx);
        this.bulletPool.drawAll();
        this.enemyPool.drawAll();
    }
}