import { Input } from "./input.js";
import { UIManager } from "./uiManager.js";
import { GameScene } from "../scenes/gameScene.js";
import { MenuScene } from "../scenes/menuScene.js";
import { UpgradeScene } from "../scenes/upgradeScene.js";
import { StatisticsScene } from "../scenes/statisticsScene.js";
import { EncyclopediaScene } from "../scenes/encyclopediaScene.js";
import { SettingsScene } from "../scenes/settingsScene.js";



export class GameEngine {
    constructor() {
        this.canvas = document.getElementById("gameCanvas");
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;

        this.ctx = this.canvas.getContext("2d");

        this.input = new Input();
        this.input.init();
        
        this.uiManager = new UIManager();

        this.currentSceneName = null;
        this.previousSceneName = null;
        this.currentScene = null;


    }

    changeScene(sceneName) {
        let nextScene = null;

        if (sceneName === "back") {
            nextScene = this.previousSceneName;
        }
        else {
            switch (sceneName) {
                case 'menu':
                    nextScene = new MenuScene(this);
                    break;
                case 'game':
                    nextScene = new GameScene(this);
                    break;
                case 'upgrades':
                    nextScene = new UpgradeScene(this);
                    break;
                case 'statistics':
                    nextScene = new StatisticsScene(this);
                    break;
                case 'encyclopedia':
                    nextScene = new EncyclopediaScene(this);
                    break;
                case 'settings':
                    nextScene = new SettingsScene(this);
                    break;
            }
        }

        if (nextScene) {
            this.previousSceneName = this.currentSceneName;
            this.currentSceneName = sceneName;
            this.setScene(nextScene);
            console.log("Scene megváltoztatva: " + sceneName);
        }
    }

    setScene(newScene) {
        if (this.currentScene && this.currentScene.exit) {
            this.currentScene.exit();
        }

        this.lastScene = this.currentScene;
        this.currentScene = newScene;

        if (this.currentScene && this.currentScene.init) {
            this.currentScene.init(this.state);
        }
    }


    // main.js hívja meg
    start() {
        console.log("Játék indítása...");
        this.changeScene('menu');       // menu-re kell majd átírni
        const loop = () => {
            this.update();
            this.draw();
            requestAnimationFrame(loop);
        };
        requestAnimationFrame(loop);
    }

    update() {
        if (this.currentScene && this.currentScene.update) {
            this.currentScene.update(this.input);
        }
    }

    draw() {
        this.ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
        
        if (this.currentScene && this.currentScene.draw) this.currentScene.draw(this.ctx);
    }

}