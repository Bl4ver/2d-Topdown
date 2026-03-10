import { Input } from "./core/input.js";
import { Audio } from "./core/audio.js";
import { UIManager } from "./core/uiManager.js";
import { Renderer } from "./core/renderer.js";
import { GameScene } from "./scenes/gameScene.js";
import { MenuScene } from "./scenes/menuScene.js";
import { UpgradeScene } from "./scenes/upgradeScene.js";
import { StatisticsScene } from "./scenes/statisticsScene.js";
import { EncyclopediaScene } from "./scenes/encyclopediaScene.js";
import { SettingsScene } from "./scenes/settingsScene.js";

export class GameEngine {
    constructor() {
        this.canvas = document.getElementById("gameCanvas");
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;

        this.ctx = this.canvas.getContext("2d");

        this.datas = null; // Ide jön a datas.json tartalma
        this.state = null;

        this.lastTime = 0;

        this.audio = new Audio(this);
        this.audio.init();
        this.input = new Input();
        this.input.init();

        this.uiManager = new UIManager();
        this.renderer = new Renderer(this.canvas, this.ctx);

        this.currentSceneName = null;
        this.previousSceneName = null;
        this.currentScene = null;
    }

    // --- JÁTÉK INDÍTÁSA ---
    async start() {
        try {
            // 1. JSON beolvasása - IDE KELL AZ await, hogy megvárja a letöltést!
            this.datas = await this.loadDatas();

            // 2. Alapállapot beállítása a JSON-ből
            this.state = JSON.parse(JSON.stringify(this.datas.state));

            // 3. Mentés betöltése
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
        let response = await fetch("assets/datas.json");

        if (!response.ok) {
            throw new Error(`Hiba! Status: ${response.status} - Útvonal: ${response.url}`);
        }
        return await response.json();
    }

    loop(timestamp) {
        const dt = Math.min((timestamp - this.lastTime) / 1000, 0.1);
        this.lastTime = timestamp;

        if (this.currentScene) {
            if (this.currentScene.update) this.currentScene.update(this.input, dt);

            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            if (this.currentScene.draw) this.currentScene.draw(this.ctx);
        }

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
            statistics: StatisticsScene,
            encyclopedia: EncyclopediaScene,
            settings: SettingsScene
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

            // Mély összefésülés (Deep Merge)
            this.state = {
                ...this.state,          // Alapértékek a JSON-ből
                ...parsedSave,          // Globális értékek (coins, highScore, stb.)

                // 1. Játékos aktuális statisztikái (maxHp, maxShield, speed...)
                player: {
                    ...this.state.player,
                    ...(parsedSave.player || {})
                },

                // 2. Fejlesztési szintek (hpLevel, shieldLevel...)
                upgrades: {
                    ...this.state.upgrades,
                    ...(parsedSave.upgrades || {})
                },

                // 3. Inventory (Fegyverek és Botok)
                inventory: {
                    ...this.state.inventory,
                    ...(parsedSave.inventory || {}),

                    // Fegyver szintek és unlock állapotok
                    weapons: {
                        ...this.state.inventory.weapons,
                        ...(parsedSave.inventory?.weapons || {})
                    },

                    // Botok unlock állapota és szintjei
                    bots: {
                        ...this.state.inventory.bots,
                        ...(parsedSave.inventory?.bots || {})
                    },

                    activeBots: parsedSave.inventory?.activeBots || this.state.inventory.activeBots || []
                }
            };
            console.log("Mentés sikeresen betöltve:", this.state);
        }
        else {
            this.state = this.datas.state
            console.log(this.state)
        }
    }

    save() { /*localStorage.setItem("neonO-save", JSON.stringify(this.state)); */ }
}