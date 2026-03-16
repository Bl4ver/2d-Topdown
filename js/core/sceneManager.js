import { GameScene } from "../scenes/gameScene.js";
import { ChallengeScene } from "../scenes/challengeScene.js";
import { MenuScene } from "../scenes/menuScene.js";
import { UpgradeScene } from "../scenes/upgradeScene.js";
import { StatisticsScene } from "../scenes/statisticsScene.js";
import { EncyclopediaScene } from "../scenes/encyclopediaScene.js";
import { SettingsScene } from "../scenes/settingsScene.js";
import { TestGroundScene } from "../scenes/testGroundScene.js";

export class SceneManager {
    constructor(engine) {
        this.engine = engine;
        this.currentSceneName = null;
        this.previousSceneName = null;
        this.currentScene = null;

        this.scenes = {
            menu: MenuScene,
            game: GameScene,
            testground: TestGroundScene,
            challenge: ChallengeScene,
            upgrades: UpgradeScene,
            statistics: StatisticsScene,
            encyclopedia: EncyclopediaScene,
            settings: SettingsScene
        };
    }

    changeScene(name) {
        if (name === "back") return this.changeScene(this.previousSceneName);
        
        if (this.scenes[name]) {
            if (this.currentScene && this.currentScene.exit) {
                this.currentScene.exit();
            }

            this.previousSceneName = this.currentSceneName;
            this.currentSceneName = name;
            
            // Új jelenet létrehozása és inicializálása
            this.currentScene = new this.scenes[name](this.engine);
            
            // Az adatok átadása a DataManager-ből
            if (this.currentScene.init) {
                this.currentScene.init(this.engine.dataManager.state, this.engine.dataManager.datas);
            }
        }
    }

    update(input, dt) {
        if (this.currentScene && this.currentScene.update) {
            this.currentScene.update(input, dt);
        }
    }

    draw(ctx) {
        if (this.currentScene && this.currentScene.draw) {
            this.currentScene.draw(ctx);
        }
    }
}