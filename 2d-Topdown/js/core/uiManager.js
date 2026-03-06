export class UIManager {
    constructor() {
        this.screens = document.querySelectorAll(".ui-screen")
    }

    showScreen(screenName) {
        this.screens.forEach(screen => screen.classList.add("hidden"));
        const targetScreen = document.getElementById(screenName);
        if (targetScreen) {
            targetScreen.classList.remove("hidden");
        } else {
            console.error(`UIManager hiba: Nincs ilyen képernyő: ${screenName}`);
        }
    }

    bindButtonEvents(callbacks) {
        if (callbacks.onStart) document.getElementById('btn-start').onclick = callbacks.onStart;
        if (callbacks.onUpgrades) document.getElementById('btn-upgrades').onclick = callbacks.onUpgrades;if (callbacks.onStatistics) document.getElementById('btn-statistics').onclick = callbacks.onStatistics;
        if (callbacks.onEncyclopedia) document.getElementById('btn-encyclopedia').onclick = callbacks.onEncyclopedia;
        if (callbacks.onSettings) document.getElementById('btn-settings').onclick = callbacks.onSettings;
        

        if (callbacks.onPause) {
            document.querySelectorAll('.btn-pause').forEach(btn => {
                btn.onclick = callbacks.onPause;
            });
        }

        if (callbacks.onBack) {
            document.querySelectorAll('.btn-back').forEach(btn => {
                btn.onclick = callbacks.onBack;
            });
        };
    }
}