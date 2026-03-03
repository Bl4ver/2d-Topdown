export class UpgradeScene {
    constructor(engine) {
        this.engine = engine;
    }

    init() {
        this.engine.uiManager.showScreen('upgrades-screen');
        this.engine.uiManager.bindButtonEvents({
            onBack: () => this.engine.changeScene('menu')
        });
        this.updateUI();
    }

    unlockWeapon(weaponId) {
        const weaponData = this.engine.datas.weapons[weaponId];
        if (this.engine.state.coins >= weaponData.unlockCost) {
            this.engine.state.coins -= weaponData.unlockCost;
            this.engine.state.inventory.weapons[weaponId].unlocked = true;
            this.engine.save();
            this.updateUI();
        }
    }

    upgradeWeaponStat(weaponId, statKey) {
        const weaponData = this.engine.datas.weapons[weaponId];
        const weaponState = this.engine.state.inventory.weapons[weaponId];

        const currentLevel = weaponState.levels[statKey];
        const cost = weaponData.upgrades[statKey].baseCost * currentLevel;

        if (this.engine.state.coins >= cost) {
            this.engine.state.coins -= cost;
            weaponState.levels[statKey] += 1;
            this.engine.save();
            this.updateUI();
        }
    }

    equipWeapon(weaponId) {
        this.engine.state.inventory.activeWeapon = weaponId;
        this.engine.save();
        this.updateUI();
    }

    updateUI() {
        const coinsEl = document.getElementById('upgrade-coins-val');
        if (coinsEl) coinsEl.innerText = Math.floor(this.engine.state.coins);

        const container = document.getElementById('weapons-container');
        if (!container) return;
        container.innerHTML = "";

        for (let weaponId in this.engine.datas.weapons) {
            const weaponData = this.engine.datas.weapons[weaponId];
            const weaponState = this.engine.state.inventory.weapons[weaponId];

            // --- 1. BIZTONSÁGI JAVÍTÁS (ÖNGYÓGYÍTÁS) ---
            // Ha egy régi mentést töltünk be, amiben nincs "levels" objektum, létrehozzuk!
            if (!weaponState.levels) {
                weaponState.levels = { damage: 1, fireRate: 1, projectileSpeed: 1, accuracy: 1 };
                this.engine.save(); // Azonnal mentjük is a kijavított verziót
            }

            const card = document.createElement('div');
            card.className = 'weapon-card';

            const title = document.createElement('h3');
            title.innerText = weaponId.toUpperCase();
            card.appendChild(title);

            if (!weaponState.unlocked) {
                const info = document.createElement('p');
                info.innerText = `Ár: ${weaponData.unlockCost} kredit`;
                card.appendChild(info);

                const unlockBtn = document.createElement('button');
                unlockBtn.innerText = "FELOLDÁS";
                unlockBtn.className = this.engine.state.coins >= weaponData.unlockCost ? 'btn-buy' : 'btn-disabled';
                unlockBtn.onclick = () => this.unlockWeapon(weaponId);
                card.appendChild(unlockBtn);
            }
            else {
                // Felszerelés gomb a kártya tetejére
                const equipBtn = document.createElement('button');
                if (this.engine.state.inventory.activeWeapon === weaponId) {
                    equipBtn.innerText = "FELSZERELVE";
                    equipBtn.className = 'btn-equipped';
                } else {
                    equipBtn.innerText = "FELSZEREL";
                    equipBtn.className = 'btn-equip';
                    equipBtn.onclick = () => this.equipWeapon(weaponId);
                }
                card.appendChild(equipBtn);

                // --- 2. BIZTONSÁGI ELLENŐRZÉS (datas.json struktúra) ---
                // Ellenőrizzük, hogy a datas.json is frissítve lett-e a több opciós "upgrades" rendszerre!
                if (weaponData.upgrades) {
                    const upgradesContainer = document.createElement('div');
                    upgradesContainer.className = 'upgrades-list';

                    // Végigmegyünk a fejleszthető tulajdonságokon
                    for (let statKey in weaponData.upgrades) {
                        const statData = weaponData.upgrades[statKey];
                        const currentLevel = weaponState.levels[statKey] || 1; // Biztonságos olvasás
                        const cost = statData.baseCost * currentLevel;

                        const row = document.createElement('div');
                        row.className = 'upgrade-row';

                        const label = document.createElement('span');
                        label.className = 'upgrade-label';
                        label.innerText = `${statData.name} (Lv${currentLevel})`;

                        const upgBtn = document.createElement('button');
                        upgBtn.innerText = `+${cost} ¤`;

                        const colorClass = this.engine.state.coins >= cost ? 'btn-buy' : 'btn-disabled';
                        upgBtn.className = `btn-upgrade-stat ${colorClass}`;
                        upgBtn.onclick = () => this.upgradeWeaponStat(weaponId, statKey);

                        row.appendChild(label);
                        row.appendChild(upgBtn);
                        upgradesContainer.appendChild(row);
                    }
                    card.appendChild(upgradesContainer);
                } else {
                    // Ezt a hibát fogod látni a felületen, ha elfelejtetted átírni a JSON-t!
                    const errorMsg = document.createElement('p');
                    errorMsg.style.color = "var(--neon-pink)";
                    errorMsg.style.marginTop = "1cqmin";
                    errorMsg.innerText = "HIBA: A datas.json-ben még régi a fegyver struktúra!";
                    card.appendChild(errorMsg);
                }
            }
            container.appendChild(card);
        }
    }
    update() { }
    draw() { }
    exit() { this.engine.uiManager.screens.forEach(s => s.classList.add("hidden")); }
}