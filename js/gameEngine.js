import { Input } from "./core/input.js";
import { Audio } from "./core/audio.js";
import { UIManager } from "./core/uiManager.js";
import { Renderer } from "./core/renderer.js";
import { DataManager } from "./core/dataManager.js";
import { SceneManager } from "./core/sceneManager.js";

export class GameEngine {
    constructor() {
        this.canvas = document.getElementById("gameCanvas");
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.ctx = this.canvas.getContext("2d");

        this.lastTime = 0;
        this.isPaused = false;

        // --- FPS Számoló változók ---
        this.fps = 0;
        this.frameCount = 0;
        this.fpsTimer = 0;

        // Rendszerek inicializálása
        this.input = new Input();
        this.audio = new Audio(this);
        this.uiManager = new UIManager();
        this.renderer = new Renderer(this.canvas, this.ctx);
        
        this.dataManager = new DataManager();
        this.sceneManager = new SceneManager(this);
    }

    async start() {
        try {
            await this.dataManager.init();
            this.input.init();
            this.audio.init();
            this.sceneManager.changeScene('menu');

            requestAnimationFrame((t) => this.loop(t));
        } catch (e) {
            console.error("Betöltési hiba:", e);
        }
    }

    loop(timestamp) {
        // A valós eltelt idő (másodpercben) a frame-ek között
        const rawDt = (timestamp - this.lastTime) / 1000;
        // A limitált dt a játéklogikához (hogy ne essen szét a fizika lag esetén)
        const dt = Math.min(rawDt, 0.1); 
        this.lastTime = timestamp;

        // --- FPS LOGIKA ---
        this.frameCount++;
        this.fpsTimer += rawDt;

        // Fél másodpercenként (0.5s) frissítjük a kiírást, hogy olvasható maradjon
        if (this.fpsTimer >= 0.5) {
            // Fél másodperc alatti frame-ek duplázva adják ki az 1 másodpercnyi FPS-t
            this.fps = Math.round(this.frameCount / this.fpsTimer); 
            this.frameCount = 0;
            this.fpsTimer = 0;

            // Frissítjük a HTML elemet, ha létezik
            const fpsEl = document.getElementById("fps-display");
            if (fpsEl) fpsEl.innerText = `FPS: ${this.fps}`;
        }

        // Logika frissítése (ha nincs megállítva)
        if (!this.isPaused) {
            this.sceneManager.update(this.input, dt);
        }

        // Kirajzolás
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.sceneManager.draw(this.ctx);

        requestAnimationFrame((t) => this.loop(t));
    }
    
    get state() {
        return this.dataManager.state;
    }
}