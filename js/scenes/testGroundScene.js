import { GameScene } from './gameScene.js';

export class TestGroundScene extends GameScene {
    constructor(engine) {
        super(engine);
    }

    init() {
        this.realState = this.engine.state;
        this.engine.state = JSON.parse(JSON.stringify(this.realState));
        this.state = this.engine.state;

        super.init();

        document.getElementById("cheat-menu").classList.remove("hidden");

        // Legeneráljuk a dinamikus UI-t
        this.setupDynamicCheatMenu();
    }

    setupDynamicCheatMenu() {
        // --- 1. Alap Cheatek (Pénz, HP) ---
        document.getElementById("cheat-money").onclick = () => {
            this.engine.state.coins += 10000;
            this.runCoins += 10000;
            document.getElementById("credits-val").innerText = this.runCoins;
        };

        document.getElementById("cheat-heal").onclick = () => {
            this.player.hp = this.player.maxHp;
            let hpDisplay = document.getElementById("hp-fill");
            let hpText = document.getElementById("hp-val");
            if (hpDisplay) hpDisplay.style.width = "100%";
            if (hpText) hpText.innerText = "100%";
        };

        // Segédfüggvény a gombok HTML generálásához
        const createCheatBtn = (text, themeClass, onClickHandler) => {
            const btn = document.createElement("button");
            // A gomb megkapja az alap osztályokat ÉS a szín témát
            btn.className = `button-menu cheat-btn-small ${themeClass}`;
            btn.innerText = text.toUpperCase();
            btn.onclick = onClickHandler;
            return btn;
        };

        // --- 2. DINAMIKUS SZINTEK ---
        const levelsContainer = document.getElementById("cheat-levels-container");
        levelsContainer.innerHTML = '';
        for (let i = 0; i <= this.scoreThresholds.length; i++) {
            // Itt a 'theme-blue' CSS osztályt adjuk át
            const btn = createCheatBtn(`Szint ${i + 1}`, 'theme-blue', () => {
                this.level = i;
                this.levelStartTime = performance.now();
                this.runScore = i === 0 ? 0 : this.scoreThresholds[i - 1];
                document.getElementById("score").innerText = this.runScore.toString().padStart(6, '0');
                this.updateLevelUI();
                Object.values(this.enemyPools).forEach(pool => pool.releaseAll());
            });
            levelsContainer.appendChild(btn);
        }

        // --- 3. DINAMIKUS FEGYVEREK ---
        const weaponsContainer = document.getElementById("cheat-weapons-container");
        weaponsContainer.innerHTML = '';
        if (this.datas && this.datas.weapons) {
            Object.keys(this.datas.weapons).forEach(weaponKey => {
                const btn = createCheatBtn(weaponKey, 'theme-yellow', () => {
                    // 1. Unlockoljuk a mentésben
                    if (!this.state.inventory.weapons[weaponKey]) {
                        this.state.inventory.weapons[weaponKey] = { unlocked: true, level: 1 };
                    }

                    // 2. ERŐSZAKOS CSERE A JÁTÉKOSON:
                    this.player.currentWeapon = weaponKey; // Beállítjuk a kulcsot
                    this.player.weaponData = this.datas.weapons[weaponKey]; // Frissítjük a statokat

                    // Ha van esetleg tüzelés időzítőd a Player-ben, azt lenullázzuk:
                    if (this.player.fireTimer !== undefined) this.player.fireTimer = 0;
                    if (this.player.lastShotTime !== undefined) this.player.lastShotTime = 0;

                    console.log(`Fegyver sikeresen lecserélve erre: ${weaponKey}`);
                });
                weaponsContainer.appendChild(btn);
            });
        }

        // --- 4. DINAMIKUS BOTOK ---
        const botsContainer = document.getElementById("cheat-bots-container");
        botsContainer.innerHTML = '';
        if (this.datas && this.datas.bots) {
            Object.keys(this.datas.bots).forEach(botKey => {
                const btn = createCheatBtn(botKey, 'theme-green', () => {
                    if (!this.state.inventory.activeBots.includes(botKey)) {
                        this.state.inventory.activeBots.push(botKey);
                    }
                    if (this.botPools[botKey]) {
                        const bot = this.botPools[botKey].get();
                        bot.init(botKey, this.state, this.datas);
                    }
                });
                botsContainer.appendChild(btn);
            });
        }

        // --- 5. DINAMIKUS ELLENSÉGEK ---
        const enemiesContainer = document.getElementById("cheat-enemies-container");
        enemiesContainer.innerHTML = '';
        if (this.datas && this.datas.enemies) {
            Object.keys(this.datas.enemies).forEach(enemyKey => {
                const enemyData = this.datas.enemies[enemyKey];
                const poolType = enemyData.type;

                // Téma meghatározás típustól függően CSS osztállyal
                let theme = 'theme-purple';
                if (poolType === 'boss') theme = 'theme-pink';
                if (poolType === 'kamikaze') theme = 'theme-yellow';

                const btn = createCheatBtn(enemyKey, theme, () => {
                    if (this.enemyPools[poolType]) {
                        const enemy = this.enemyPools[poolType].get();
                        if (enemy) enemy.spawn(enemyKey);
                    }
                });
                enemiesContainer.appendChild(btn);
            });
        }
    }

    update(input, dt) {
        super.update(input, dt);
    }

    finalizeStats() {
        console.log("TEST GROUND KILÉPÉS - SEMMIT NEM MENTÜNK!");
        this.engine.state = this.realState;
        document.getElementById("cheat-menu").classList.add("hidden");
    }
}