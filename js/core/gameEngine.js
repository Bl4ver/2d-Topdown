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
        this.datas = null; // Ide jön majd a datas.json tartalma

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
        console.log("Játék inicializálása...");
        try {
            this.datas = await this.loadDatas();

            // Alapértékek betöltése
            this.state = JSON.parse(JSON.stringify(this.datas.state));

            // Biztosítjuk, hogy minden fegyvernek megvan a "levels" objektuma
            for (let weaponId in this.datas.weapons) {
                if (!this.state.inventory.weapons[weaponId]) {
                    this.state.inventory.weapons[weaponId] = { unlocked: false, levels: {} };
                }
                const weaponState = this.state.inventory.weapons[weaponId];
                if (!weaponState.levels) weaponState.levels = {};

                // Beállítjuk az 1-es szintet minden statra, ha még nem létezne
                ['damage', 'fireRate', 'projectileSpeed', 'accuracy'].forEach(stat => {
                    if (weaponState.levels[stat] === undefined) {
                        weaponState.levels[stat] = 1;
                    }
                });
            }

            this.load();
            this.changeScene('menu');
            requestAnimationFrame((timestamp) => this.loop(timestamp));
        } catch (error) {
            console.error("Kritikus hiba:", error);
        }
    }

    // GameEngine.js - Csak az érintett rész:
    loop(timestamp) {
        if (!this.lastTime) this.lastTime = timestamp;
        const deltaTime = (timestamp - this.lastTime) / 1000;
        this.lastTime = timestamp;

        const dt = Math.min(deltaTime, 0.1);

        this.update(dt);
        this.draw();

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
    changeScene(sceneName) {
        let nextScene = null;

        if (sceneName === "back") {
            if (this.previousSceneName) {
                this.changeScene(this.previousSceneName);
            }
            return;
        }

        switch (sceneName) {
            case 'menu': nextScene = new MenuScene(this); break;
            case 'game': nextScene = new GameScene(this); break;
            case 'upgrades': nextScene = new UpgradeScene(this); break;
            case 'statistics': nextScene = new StatisticsScene(this); break;
            case 'encyclopedia': nextScene = new EncyclopediaScene(this); break;
            case 'settings': nextScene = new SettingsScene(this); break;
            default: console.warn(`Ismeretlen jelenet: ${sceneName}`); return;
        }

        if (nextScene) {
            this.previousSceneName = this.currentSceneName;
            this.currentSceneName = sceneName;
            this.setScene(nextScene);
            console.log(`[Scene Váltás] ${this.previousSceneName || 'Start'} -> ${sceneName}`);
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
    async loadDatas() {
        let response = await fetch("../../assets/datas.json");
        if (!response.ok) throw new Error(`HTTP hiba: ${response.status}`);
        return await response.json();
    }

    load() {
        try {
            const localSave = localStorage.getItem("neonO-save");
            if (localSave) {
                const parsedSave = JSON.parse(localSave);

                this.state = {
                    ...this.state, // Ez az alap a datas.json-ből
                    ...parsedSave, // Ezt ráöntjük

                    // És itt fésüljük össze a mélyebb szinteket biztonságosan:
                    settings: { ...this.state.settings, ...(parsedSave.settings || {}) },
                    player: { ...this.state.player, ...(parsedSave.player || {}) },
                    upgrades: { ...this.state.upgrades, ...(parsedSave.upgrades || {}) },
                    statistics: { ...this.state.statistics, ...(parsedSave.statistics || {}) },
                    encyclopedia: { ...this.state.encyclopedia, ...(parsedSave.encyclopedia || {}) },

                    inventory: {
                        ...this.state.inventory,
                        ...(parsedSave.inventory || {}),
                        weapons: {
                            ...this.state.inventory.weapons,
                            // A KULCS: A kérdőjel (?.), ami megakadályozza az összeomlást!
                            ...(parsedSave.inventory?.weapons || {})
                        }
                    }
                };

                console.log("Játékállás sikeresen betöltve!", this.state);
            } else {
                console.log("Nem található korábbi mentés, új profil inicializálása...");
            }
        } catch (error) {
            console.error("Hiba a mentés betöltésekor. Alapértékek használata.", error);
        }

        this.save();
    }

    save() {
        try {
            const stateString = JSON.stringify(this.state);
            localStorage.setItem("neonO-save", stateString);
        } catch (error) {
            console.error("Hiba történt a mentés során:", error);
        }
    }
}