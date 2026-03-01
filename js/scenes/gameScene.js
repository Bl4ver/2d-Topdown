import { Player } from "../entities/player.js";

export class GameScene {
    constructor(engine) {
        this.engine = engine
        this.player = new Player(this.engine);
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