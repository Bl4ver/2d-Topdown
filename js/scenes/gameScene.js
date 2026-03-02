import { Player } from "../entities/player.js";
import { Bullet } from '../entities/bullet.js';
import { ObjectPool } from "../core/objectPool.js";

export class GameScene {
    constructor(engine) {
        this.engine = engine
        this.bulletPool = new ObjectPool(Bullet, 200, this.engine);
        this.player = new Player(this);
    }

    init() {
        this.engine.uiManager.showScreen("hud");
        this.player.init(this.engine.state);
    }

    update(input) {
        this.player.update(input);
    }

    draw(ctx) {
        this.player.draw(ctx);

    }
}