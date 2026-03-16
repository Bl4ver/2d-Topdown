// --- menuScene.js ---
export class MenuScene {
    constructor(engine) { this.engine = engine; }
    init() {
        this.engine.uiManager.showScreen("main-menu");
        this.engine.uiManager.bindButtonEvents({
            onStart: () => this.engine.uiManager.showScreen("game-modes-screen"),
            onModeNormal: () => this.engine.sceneManager.changeScene("game"),
            onModeChallenge: () => this.engine.sceneManager.changeScene("challenge"),
            onModeTest: () => this.engine.sceneManager.changeScene("testground"),
            onSettings: () => this.engine.sceneManager.changeScene("settings"),
            onUpgrades: () => this.engine.sceneManager.changeScene("upgrades"),
            onEncyclopedia: () => this.engine.sceneManager.changeScene("encyclopedia"),
            onStatistics: () => this.engine.sceneManager.changeScene("statistics"),
            onBack: () => this.engine.uiManager.showScreen("main-menu")
        });
    }
}

// --- settingsScene.js ---
export class SettingsScene {
    constructor(engine) { this.engine = engine; }
    init() {
        this.engine.uiManager.showScreen('settings-screen');
        this.engine.uiManager.bindButtonEvents({
            onBack: () => this.engine.sceneManager.changeScene(this.engine.sceneManager.previousSceneName)
        });
    }
    exit() {}
}

// --- statisticsScene.js ---
export class StatisticsScene {
    constructor(engine) { this.engine = engine; }
    init(state) {
        this.state = state; // Ezt most a SceneManager adja át
        this.engine.uiManager.showScreen('statistics-screen');
        this.displayStats();
        this.engine.uiManager.bindButtonEvents({
            onBack: () => this.engine.sceneManager.changeScene(this.engine.sceneManager.previousSceneName)
        });
    }
    displayStats() {
        const stats = this.state.statistics;
        this.setStatText("stat-allScore", this.state.highScore);
        this.setStatText("stat-money", Math.floor(this.state.coins));
        this.setStatText("stat-kills", stats.enemiesKilled);
        this.setStatText("stat-maxTime", this.formatTime(stats.maxTime));
        this.setStatText("stat-minTime", this.formatTime(stats.minTime));
        this.setStatText("stat-allTime", this.formatTime(stats.totalPlayTime));
        this.setStatText("stat-testTime", this.formatTime(stats.testGroundTime));
    }
    setStatText(id, value) { const el = document.getElementById(id); if (el) el.innerText = value; }
    formatTime(seconds) {
        if (!seconds) return "00:00";
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
}