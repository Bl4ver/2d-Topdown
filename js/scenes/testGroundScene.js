import { GameScene } from './gameScene.js';

export class TestGroundScene extends GameScene {
    constructor(engine) {
        super(engine);
        this.isImmortal = true; 
        this.wavesEnabled = false; // Új változó a hullámok követésére (Alapból kikapcsolva a tesztpályán!)
    }

    init(state, datas) {
        this.state = state;
        this.datas = datas;

        this.realState = this.state;
        
        // Klónozás, hogy a cheat menu ne rontsa el a mentést
        this.engine.dataManager.state = JSON.parse(JSON.stringify(this.realState));
        this.state = this.engine.dataManager.state;

        super.init(this.state, this.datas);

        // --- HALHATATLANSÁG ÉS WAVE BEÁLLÍTÁSOK ---
        this.isImmortal = true; 
        this.wavesEnabled = false; // Alapból legyen csend és béke a tesztpályán

        // 1. Felülírjuk a játékos sebződését
        const originalTakeDamage = this.player.takeDamage.bind(this.player);
        this.player.takeDamage = (dmg) => {
            if (this.isImmortal) return; 
            originalTakeDamage(dmg);
        };

        // 2. Felülírjuk az UI frissítőt
        const originalUpdateUI = this.player.updateUI.bind(this.player);
        this.player.updateUI = () => {
            originalUpdateUI(); 
            if (this.isImmortal) {
                const hpText = document.getElementById("hp-val");
                if (hpText) hpText.innerText = "VÉGTELEN";
            }
        };

        this.player.updateUI();

        document.getElementById("cheat-menu").classList.remove("hidden");
        this.setupDynamicCheatMenu();
        
        // Mivel alapból kikapcsoltuk a wave-eket, töröljük le az esetlegesen már lespawnolt kezdő ellenségeket
        if (!this.wavesEnabled) {
            Object.values(this.enemyPools).forEach(pool => pool.releaseAll());
        }
    }

    setupDynamicCheatMenu() {
        document.getElementById("cheat-money").onclick = () => {
            this.state.coins += 10000;
            this.runCoins += 10000;
            document.getElementById("credits-val").innerText = this.runCoins;
        };

        const healBtn = document.getElementById("cheat-heal");
        if (healBtn) {
            healBtn.innerText = "MÓD: HALHATATLAN";
            healBtn.onclick = () => {
                this.isImmortal = !this.isImmortal; 
                
                if (this.isImmortal) {
                    healBtn.innerText = "MÓD: HALHATATLAN";
                    this.player.hp = this.player.maxHp; 
                } else {
                    healBtn.innerText = "MÓD: NORMÁL HP";
                }
                this.player.updateUI(); 
            };
        }

        const createCheatBtn = (text, themeClass, onClickHandler) => {
            const btn = document.createElement("button");
            btn.className = `button-menu cheat-btn-small ${themeClass}`;
            btn.innerText = text.toUpperCase();
            btn.onclick = onClickHandler;
            return btn;
        };

        // --- ÚJ: WAVES KAPCSOLÓ ---
        const levelsContainer = document.getElementById("cheat-levels-container");
        levelsContainer.innerHTML = '';
        
        const wavesBtn = createCheatBtn("WAVES: KIKAPCSOLVA", "theme-red", () => {
            this.wavesEnabled = !this.wavesEnabled;
            
            if (this.wavesEnabled) {
                wavesBtn.innerText = "WAVES: BEKAPCSOLVA";
                wavesBtn.classList.replace("theme-red", "theme-green"); // Kis vizuális visszajelzés
                this.spawnTimer = 0.5; // Rögtön indítjuk a spawner-t
            } else {
                wavesBtn.innerText = "WAVES: KIKAPCSOLVA";
                wavesBtn.classList.replace("theme-green", "theme-red");
                // Azonnal takarítjuk a pályát, ha kikapcsoljuk
                Object.values(this.enemyPools).forEach(pool => pool.releaseAll());
            }
        });
        // Kicsit kiemeljük a többi közül
        wavesBtn.style.marginBottom = "10px";
        wavesBtn.style.width = "100%";
        levelsContainer.appendChild(wavesBtn);

        // --- 2. DINAMIKUS SZINTEK ---
        for (let i = 0; i <= this.levelManager.scoreThresholds.length; i++) {
            const btn = createCheatBtn(`Szint ${i + 1}`, 'theme-blue', () => {
                this.levelManager.level = i;
                this.levelManager.levelStartTime = performance.now();
                this.runScore = i === 0 ? 0 : this.levelManager.scoreThresholds[i - 1];
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
                    if (!this.state.inventory.weapons[weaponKey]) {
                        this.state.inventory.weapons[weaponKey] = { unlocked: true, level: 1 };
                    }
                    this.player.currentWeapon = weaponKey; 
                    this.player.weaponData = this.datas.weapons[weaponKey]; 

                    if (this.player.shootTimer !== undefined) this.player.shootTimer = 0;
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

        // --- 6. STRESSZ TESZT (FPS GYILKOS) ---
        if (this.datas && this.datas.enemies) {
            const stressBtn = createCheatBtn("FPS TESZT (500 ELLENSÉG)", "theme-red", () => {
                const enemyKeys = Object.keys(this.datas.enemies);
                if (enemyKeys.length === 0) return;

                for (let i = 0; i < 500; i++) {
                    const randomKey = enemyKeys[Math.floor(Math.random() * enemyKeys.length)];
                    const enemyData = this.datas.enemies[randomKey];
                    const poolType = enemyData.type;

                    if (this.enemyPools[poolType]) {
                        const enemy = this.enemyPools[poolType].get();
                        if (enemy) enemy.spawn(randomKey);
                    }
                }
            });
            stressBtn.style.marginTop = "15px";
            stressBtn.style.border = "2px solid red";
            enemiesContainer.appendChild(stressBtn);
        }
    }

    update(input, dt) {
        // TRÜKK: Ha nincsenek engedélyezve a wave-ek, mesterségesen magasan tartjuk az időzítőt,
        // így a GameScene "update" függvénye sosem fog magától ellenfelet generálni.
        if (!this.wavesEnabled) {
            this.spawnTimer = 100;
        }

        super.update(input, dt);

        if (input.keys.l || input.keys.L) {
            const currentLevel = this.levelManager.level;
            this.runScore = this.levelManager.scoreThresholds[currentLevel] || this.runScore + 10000;
            input.keys.l = false;
            input.keys.L = false;
        }

        if (input.keys.k || input.keys.K) {
            const currentLevel = this.levelManager.level;
            if (currentLevel > 0) {
                this.runScore -= this.levelManager.scoreThresholds[currentLevel - 1] || 10000;
            } else {
                this.runScore = 0;
            }
            input.keys.k = false;
            input.keys.K = false;
        }
    }

    finalizeStats() {
        this.engine.dataManager.state = this.realState; 
        document.getElementById("cheat-menu").classList.add("hidden");
    }
}