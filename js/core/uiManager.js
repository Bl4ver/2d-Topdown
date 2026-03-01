export class UIManager {
    constructor() {
        this.screens = document.querySelectorAll(".ui-screen")
    }

    showScreen(screenName) {
        console.log("sreenname: ", screenName)
        this.screens.forEach(screen => screen.classList.add("hidden"));
        document.getElementById(screenName).classList.remove("hidden");
    }

    bindButtonEvents(callbacks) {
        document.getElementById('btn-start').onclick = callbacks.onStart;
        document.getElementById('btn-settings').onclick = callbacks.onSettings;
        document.getElementById('btn-statistics').onclick = callbacks.onStatistics;
        document.querySelectorAll('.btn-pause').forEach(btn => {
            btn.onclick = callbacks.onPause;
        });
        document.querySelectorAll('.btn-back').forEach(btn => {
            btn.onclick = callbacks.onBack;
        });
    }
}