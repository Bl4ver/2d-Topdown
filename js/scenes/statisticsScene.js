export class StatisticsScene {
    constructor(engine) {
        this.engine = engine;
    }

    // A GameEngine hívja meg, amikor erre a jelenetre váltunk
    init() {
        // 1. Megjelenítjük a statisztikai képernyőt
        this.engine.uiManager.showScreen('statistics-screen');

        // 2. Adatok frissítése a HTML-ben a GameEngine state alapján
        this.displayStats();

        // 3. Gombok eseménykezelése (Vissza gomb)
        this.engine.uiManager.bindButtonEvents({
            onBack: () => this.engine.changeScene(this.engine.previousSceneName)
        });
    }

    displayStats() {
        const stats = this.engine.state.statistics;
        const state = this.engine.state;

        this.setStatText("stat-allScore", state.highScore);
        this.setStatText("stat-money", Math.floor(state.coins));
        this.setStatText("stat-kills", stats.enemiesKilled);
        this.setStatText("stat-maxTime", this.formatTime(stats.maxTime));
        this.setStatText("stat-minTime", this.formatTime(stats.minTime));
        this.setStatText("stat-allTime", this.formatTime(stats.totalPlayTime));
        this.setStatText("stat-testTime", this.formatTime(stats.testGroundTime));
    }

    // Segédfüggvény az élesebb kódért
    setStatText(id, value) {
        const el = document.getElementById(id);
        if (el) el.innerText = value;
    }

    // Segédfüggvény az idő másodpercről MM:SS-re alakításához
    formatTime(seconds) {
        if (!seconds) return "00:00";
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    update() {
        // Statisztikai képernyőn általában nincs folyamatos logika
    }

    draw(ctx) {
        // A háttérben futhat valami animáció, de a UI-t a HTML/CSS kezeli
    }

    exit() {
        // Kilépéskor elrejthetjük a képernyőt, ha a GameEngine nem tenné meg
        // this.engine.uiManager.hideScreen('statistics-screen');
    }
}