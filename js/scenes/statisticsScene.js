export class StatisticsScene {
    constructor(engine) {
        this.engine = engine;
    }

    // A GameEngine hívja meg, amikor erre a jelenetre váltunk
    init() {
        this.engine.uiManager.showScreen('statistics-screen');

        this.engine.uiManager.bindButtonEvents({
            onBack: () => this.engine.changeScene(this.engine.previousSceneName)
        });
    }

    update() {
    }

    draw(ctx) {
    }

    exit() {
        // Itt nem kell showScreen, mert a következő jelenet 
        // init() függvénye úgyis elrejti ezt a képernyőt!
    }
}