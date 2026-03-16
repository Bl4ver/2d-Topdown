// core/levelManager.js

export class LevelManager {
    constructor(scene) {
        this.scene = scene; // A GameScene referenciája
        
        this.level = 0;
        this.levelStartTime = 0;
        // Ponthatárok: 1. szint: 20000, 2. szint: 10000, 3. szint: 20000...
        this.scoreThresholds = [0, 5000, 10000, 20000, 50000, 100000, 1000000];
        
        // Spawn menedzsment
        this.baseSpawnInterval = 2.5;
        this.minSpawnInterval = 0.2;
        this.bossFight = false;
    }

    init() {
        this.level = 0;
        this.levelStartTime = performance.now();
        this.bossFight = false;
        this.minSpawnInterval = 0.2;
    }

    checkLevelUp() {
        // Szintlépés ellenőrzése
        if (this.scene.runScore >= this.scoreThresholds[this.level]) {
            this.level++;
            this.levelStartTime = performance.now();
            
            // Ellenségek törlése a pályáról szintlépéskor
            Object.values(this.scene.enemyPools).forEach(pool => pool.releaseAll());

            this.scene.updateLevelUI();
            this.scene.engine.audio.sfx.levelUp();
            console.log(`SZINTLÉPÉS! Jelenlegi szint: ${this.level}`);
        }
        // Szintcsökkenés (ha valamiért pontot veszítene a játékos)
        else if (this.level > 0 && this.scene.runScore < this.scoreThresholds[this.level - 1]) {
            this.level--;
            this.levelStartTime = performance.now();
            Object.values(this.scene.enemyPools).forEach(pool => pool.releaseAll());
            this.scene.updateLevelUI();
            console.log(`SZINTCSÖKKENÉS! Jelenlegi szint: ${this.level}`);
        }
    }

    getCurrentSpawnInterval() {
        const levelTime = (performance.now() - this.levelStartTime) / 1000;
        // Kiszámoljuk az új spawn időt, de nem engedjük a minimum alá
        return Math.max(this.minSpawnInterval, this.baseSpawnInterval - (levelTime / 30));
    }

    getEnemyName() {
        const levelTime = (performance.now() - this.levelStartTime) / 1000;
        const r = Math.random();

        switch (this.level) {
            case 0: // 1. Szint
                this.minSpawnInterval = 0.3;
                if (levelTime > 20 && r > 0.7) return "basic";
                return "swarm";

            case 1: // 2. Szint
                this.minSpawnInterval = 0.25;
                if (levelTime > 30 && r > 0.8) return "bomber";
                if (levelTime > 10 && r > 0.5) return "fast";
                return "basic";

            case 2: // 3. Szint
                this.minSpawnInterval = 0.2;
                if (levelTime > 20 && r > 0.85) return "healer";
                if (r > 0.7) return "bullet";
                if (r > 0.5) return "brute";
                if (r > 0.3) return "fast";
                return "swarm";

            case 3: // 4. Szint
                if (r > 0.8) return "charger";
                if (r > 0.6) return "elite";
                if (r > 0.3) return "shooter";
                if (r > 0.1) return "teleporter";
                return "fast";

            case 4: // 5. Szint
                if (r > 0.9) return "guard";
                if (r > 0.75) return "charger";
                if (r > 0.6) return "sniper";
                if (r > 0.3) return "elite";
                return "healer";

            case 5: // 6. Szint - MINIBOSS
                if (!this.bossFight) {
                    this.bossFight = true;
                    return "miniboss";
                }
                this.minSpawnInterval = 3.0;
                if (r > 0.8) return "charger";
                if (r > 0.6) return "brute";
                return "fast";

            case 6: // 7. Szint - VÉGSŐ BOSS
                if (!this.bossFight) {
                    this.bossFight = true;
                    return "boss";
                }
                this.minSpawnInterval = 4.0;
                if (r > 0.8) return "guard";
                return "shooter";

            case 7: // Győzelem
                this.bossFight = false;
                console.log("GYŐZELEM!")
                this.scene.engine.sceneManager.changeScene("menu");
                return "basic";

            default:
                return "basic";
        }
    }
}