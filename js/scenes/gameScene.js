// gameScene.js
import { Player } from "../entities/player.js";
import { Bullet } from '../entities/bullet.js';
import { Enemy } from '../entities/enemy.js';
import { ObjectPool } from "../core/objectPool.js";

export class GameScene {
    constructor(engine) {
        this.engine = engine;
        this.bulletPool = new ObjectPool(Bullet, 200, this.engine);
        this.enemyPool = new ObjectPool(Enemy, 200, this.engine);
        this.player = new Player(this);
    }

    init() {
        this.engine.uiManager.showScreen("hud");
        this.player.init(this.engine.state);
    }

    update(input) {
        
        // if (Math.random() > 0.999) this.enemyPool.find(enemy => enemy.active).spawn();

        this.player.update(input);

        this.bulletPool.pool.forEach(bullet => {
            if (bullet.active) {
                bullet.update();
            }
        }); 
        
        this.enemyPool.pool.forEach(enemy => {
            if (enemy.active) {
                enemy.update();
            }
        });
    }

    draw(ctx) {
        this.player.draw(ctx);

        this.bulletPool.pool.forEach(bullet => {
            if (bullet.active) {
                bullet.draw(ctx);
            }
        });

        this.enemyPool.pool.forEach(enemy => {
            if (enemy.active) {
                enemy.draw(ctx);
            }
        });
    }
}