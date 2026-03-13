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
        // Főmenü gombok
        if (callbacks.onStart) document.getElementById('btn-start').onclick = callbacks.onStart;
        if (callbacks.onUpgrades) document.getElementById('btn-upgrades').onclick = callbacks.onUpgrades;
        if (callbacks.onStatistics) document.getElementById('btn-statistics').onclick = callbacks.onStatistics;
        if (callbacks.onEncyclopedia) document.getElementById('btn-encyclopedia').onclick = callbacks.onEncyclopedia;
        if (callbacks.onSettings) document.getElementById('btn-settings').onclick = callbacks.onSettings;

        // Játékmód választó gombok
        if (callbacks.onModeNormal) document.getElementById('btn-mode-normal').onclick = callbacks.onModeNormal;
        if (callbacks.onModeTest) document.getElementById('btn-mode-test').onclick = callbacks.onModeTest;

        // Szünet menü gombok
        if (callbacks.onResume) document.getElementById('btn-resume').onclick = callbacks.onResume;
        if (callbacks.onPauseSettings) document.getElementById('btn-pause-settings').onclick = callbacks.onPauseSettings;
        if (callbacks.onQuit) document.getElementById('btn-quit').onclick = callbacks.onQuit;

        // Settings Back gomb (külön kezelve a pause és a main menu miatt)
        if (callbacks.onSettingsBack) {
            const btn = document.getElementById('btn-settings-back');
            if (btn) btn.onclick = callbacks.onSettingsBack;
        }

        // --- KÜLÖN KEZELJÜK A SETTINGS VISSZA GOMBOT ---
        if (callbacks.onSettingsBack) {
            const settingsBackBtn = document.getElementById('btn-settings-back');
            if (settingsBackBtn) {
                settingsBackBtn.onclick = callbacks.onSettingsBack;
            }
        }

        // --- AZ ÖSSZES TÖBBI VISSZA GOMB (Kivéve a Settings-ét) ---
        if (callbacks.onBack) {
            // A :not() biztosítja, hogy a Settings gombját ne írja felül a főmenüs logikával
            document.querySelectorAll('.btn-back:not(#btn-settings-back)').forEach(btn => {
                btn.onclick = callbacks.onBack;
            });
        }

        // HUD Pause gomb
        if (callbacks.onPause) {
            const pauseBtn = document.getElementById('btn-pause');
            if (pauseBtn) {
                pauseBtn.onclick = (e) => {
                    console.log("PAUSE GOMB KATTINTVA!");
                    callbacks.onPause(e);
                };
            }
        }
    }
}