import { Input } from "./input.js";
import { Audio } from "./audio.js";
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
        this.datas = null; // Ide jön a datas.json tartalma

        this.ctx = this.canvas.getContext("2d");

        this.state = null;

        this.lastTime = 0;

        this.audio = new Audio(this);
        this.audio.init();
        this.input = new Input();
        this.input.init();

        this.uiManager = new UIManager();

        this.currentSceneName = null;
        this.previousSceneName = null;
        this.currentScene = null;
    }

    // --- JÁTÉK INDÍTÁSA ---
    async start() {
        try {
            // 1. JSON beolvasása
            this.datas = this.loadDatas();

            // 2. Alapállapot beállítása a JSON-ből
            this.state = JSON.parse(JSON.stringify(this.datas.state));

            // 3. Mentés betöltése (ez felülírja az alapállapotot, ahol kell)
            this.load();

            // 4. Többi rendszer indítása
            this.input.init();
            this.audio.init();
            this.changeScene('menu');
            requestAnimationFrame((t) => this.loop(t));
        } catch (e) {
            console.error("Betöltési hiba:", e);
        }
    }

    async loadDatas() {
        let response = await fetch("./assets/datas.json");

        if (!response.ok) {
            throw new Error(`Hiba! Status: ${response.status} - Ellenőrizd az útvonalat!`);
        }
        return await response.json();
    }

    loop(timestamp) {
        const dt = Math.min((timestamp - this.lastTime) / 1000, 0.1);
        this.lastTime = timestamp;
        if (this.currentScene?.update) this.currentScene.update(this.input, dt);
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        if (this.currentScene?.draw) this.currentScene.draw(this.ctx);
        requestAnimationFrame((t) => this.loop(t));
    }

    update(dt) {
        if (this.currentScene && this.currentScene.update) {
            this.currentScene.update(this.input, dt);
        }
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        if (this.currentScene && this.currentScene.draw) {
            this.currentScene.draw(this.ctx);
        }
    }

    // --- JELENET KEZELÉS ---
    changeScene(name) {
        const scenes = {
            menu: MenuScene,
            game: GameScene,
            upgrades: UpgradeScene,
            statistics: StatisticsScene
        };
        if (name === "back") return this.changeScene(this.previousSceneName);
        if (scenes[name]) {
            this.previousSceneName = this.currentSceneName;
            this.currentSceneName = name;
            this.currentScene = new scenes[name](this);
            this.currentScene.init(this.state);
        }
    }

    setScene(newScene) {
        if (this.currentScene && this.currentScene.exit) {
            this.currentScene.exit();
        }

        this.currentScene = newScene;

        if (this.currentScene && this.currentScene.init) {
            this.currentScene.init(this.state);
        }
    }

    // --- ADATKEZELÉS ---
    load() {
        const localSave = localStorage.getItem("neonO-save");
        if (localSave) {
            const parsedSave = JSON.parse(localSave);

            // Biztonságos összefésülés, hogy ne legyen 'undefined' hiba
            this.state = {
                ...this.state,
                ...parsedSave,
                inventory: {
                    ...this.state.inventory,
                    ...(parsedSave.inventory || {}),
                    weapons: {
                        ...this.state.inventory.weapons,
                        ...(parsedSave.inventory?.weapons || {})
                    }
                }
            };
        }
    }

    save() { localStorage.setItem("neonO-save", JSON.stringify(this.state)); }
}