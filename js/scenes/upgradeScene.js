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

    // Fegyver feloldása
    unlockWeapon(weaponId) {
        const weaponData = this.engine.datas.weapons[weaponId];
        const weaponState = this.engine.state.inventory.weapons[weaponId];

        if (this.engine.state.coins >= weaponData.unlockCost) {
            this.engine.state.coins -= weaponData.unlockCost;
            weaponState.unlocked = true;
            // Minden statot 1-es szintre teszünk feloldáskor
            for (let key in weaponData.upgrades) {
                weaponState.levels[key] = 1;
            }
            this.engine.save();
            this.engine.audio.sfx.unlock();
            this.updateUI();
        }
    }

    // Egy konkrét tulajdonság fejlesztése
    upgradeWeaponStat(weaponId, statKey) {
        const weaponData = this.engine.datas.weapons[weaponId];
        const weaponState = this.engine.state.inventory.weapons[weaponId];
        const currentLevel = weaponState.levels[statKey];
        const cost = weaponData.upgrades[statKey].baseCost * currentLevel;

        if (this.engine.state.coins >= cost) {
            this.engine.state.coins -= cost;
            weaponState.levels[statKey] += 1;
            this.engine.save();
            this.engine.audio.sfx.upgrade();
            this.updateUI();
        }
    }

    equipWeapon(weaponId) {
        this.engine.state.inventory.activeWeapon = weaponId;
        this.engine.save();
        this.engine.audio.sfx.equip();
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

            const card = document.createElement('div');
            card.className = 'weapon-card';
            card.innerHTML = `<h3>${weaponId.toUpperCase()}</h3>`;

            if (!weaponState.unlocked) {
                const info = document.createElement('p');
                info.innerText = `Ár: ${weaponData.unlockCost} ¤`;
                card.appendChild(info);

                const unlockBtn = document.createElement('button');
                unlockBtn.innerText = "FELOLDÁS";
                unlockBtn.className = this.engine.state.coins >= weaponData.unlockCost ? 'btn-buy' : 'btn-disabled';
                unlockBtn.onclick = () => this.unlockWeapon(weaponId);
                card.appendChild(unlockBtn);
            } else {
                const equipBtn = document.createElement('button');
                const isActive = this.engine.state.inventory.activeWeapon === weaponId;
                equipBtn.innerText = isActive ? "FELSZERELVE" : "FELSZEREL";
                equipBtn.className = isActive ? 'btn-equipped' : 'btn-equip';
                if (!isActive) equipBtn.onclick = () => this.equipWeapon(weaponId);
                card.appendChild(equipBtn);

                const upgradesList = document.createElement('div');
                upgradesList.className = 'upgrades-list';

                for (let statKey in weaponData.upgrades) {
                    const statData = weaponData.upgrades[statKey];
                    const level = weaponState.levels[statKey];
                    const cost = statData.baseCost * level;

                    const row = document.createElement('div');
                    row.className = 'upgrade-row';
                    row.innerHTML = `<span class="upgrade-label">${statData.name} (Lv${level})</span>`;

                    const upgBtn = document.createElement('button');
                    upgBtn.innerText = `+${cost} ¤`;
                    upgBtn.className = `btn-upgrade-stat ${this.engine.state.coins >= cost ? 'btn-buy' : 'btn-disabled'}`;
                    upgBtn.onclick = () => this.upgradeWeaponStat(weaponId, statKey);

                    row.appendChild(upgBtn);
                    upgradesList.appendChild(row);
                }
                card.appendChild(upgradesList);
            }
            container.appendChild(card);
        }
    }
}