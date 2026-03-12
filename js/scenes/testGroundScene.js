import { GameScene } from './gameScene.js';

export class TestGroundScene extends GameScene {
    constructor(engine) {
        // A super() lefuttatja a GameScene constructorát (betölti a poolokat, stb.)
        super(engine); 
    }

    init() {
        // 1. ELMENTJÜK AZ EREDETI ÁLLAPOTOT
        this.realState = this.engine.state;
        
        // 2. KÉSZÍTÜNK EGY KLÓNT: A játék motorja mostantól ezt a "hamis" mentést látja
        this.engine.state = JSON.parse(JSON.stringify(this.realState));
        this.state = this.engine.state;

        // 3. Lefuttatjuk az eredeti GameScene init-jét a klónozott adatokkal
        super.init();

        // 4. Teszt UI megjelenítése (később adjuk hozzá a HTML-hez)
        const testUI = document.getElementById("test-ground-ui");
        if (testUI) testUI.classList.remove("hidden");
    }

    update(input, dt) {
        super.update(input, dt); // Fut a normál játék

        // --- CHEAT KÓDOK / TESZT FUNKCIÓK ---
        // Ha megnyomja a 'C' gombot, kap 10,000 kreditet
        if (input.keys.c || input.keys.C) {
            this.engine.state.coins += 10000;
            this.runCoins += 10000;
            document.getElementById("credits-val").innerText = this.runCoins;
            input.keys.c = false; // Ne spamelje szét másodpercenként 60-szor
            input.keys.C = false;
        }

        // Ha megnyomja a 'H' gombot, visszatölti a HP-t maxra
        if (input.keys.h || input.keys.H) {
            this.player.hp = this.player.maxHp;
            this.player.updateUI();
            input.keys.h = false;
            input.keys.H = false;
        }

        // Ha megnyomja az 'L' gombot, azonnal szintet lép
        if (input.keys.l || input.keys.L) {
            this.runScore = this.scoreThresholds[this.level] || this.runScore + 10000;
            input.keys.l = false;
            input.keys.L = false;
        }
    }

    // EZ A LEGFONTOSABB RÉSZ: Felülírjuk az eredeti mentési logikát!
    finalizeStats() {
        // 1. Kiszámoljuk a tesztpályán töltött időt, és hozzáadjuk az EREDETI mentéshez
        if (!this.realState.statistics.testGroundTime) {
            this.realState.statistics.testGroundTime = 0;
        }
        this.realState.statistics.testGroundTime += this.runTime;

        // 2. Visszaállítjuk az eredeti mentést (a klónt a sok pénzzel kidobjuk)
        this.engine.state = this.realState;
        
        // 3. Elmentjük az eredeti state-et (amiben csak a testGroundTime nőtt)
        this.engine.save();

        // 4. Elrejtjük a teszt UI-t
        const testUI = document.getElementById("test-ground-ui");
        if (testUI) testUI.classList.add("hidden");
    }
}