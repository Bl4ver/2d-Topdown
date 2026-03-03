export class UpgradeScene {
    constructor(engine) {
        this.engine = engine;
    }

    init() {
        this.engine.uiManager.showScreen('upgrades-screen');
        this.engine.uiManager.bindButtonEvents({
            onBack: () => this.engine.changeScene('menu')
        });

        this.setupTabs();
        this.updateUI();
    }

    setupTabs() {
        const tabs = document.querySelectorAll('.tab-btn');
        tabs.forEach(btn => {
            btn.onclick = () => {
                tabs.forEach(t => t.classList.remove('active'));
                btn.classList.add('active');

                const target = btn.getAttribute('data-target');
                document.querySelectorAll('.upgrade-content').forEach(c => c.classList.remove('active'));
                document.getElementById(target).classList.add('active');
            };
        });
    }

    // --- LOGIKA ---

    upgradePlayerStat(key) {
    const data = this.engine.datas.playerUpgrades[key];
    const currentLevel = this.engine.state.upgrades[key + "Level"] || 1;
    const cost = data.baseCost * currentLevel;

    if (this.engine.state.coins >= cost) {
        this.engine.state.coins -= cost;
        
        // CSAK A SZINTET NÖVELJÜK!
        this.engine.state.upgrades[key + "Level"] = currentLevel + 1;

        this.engine.audio.sfx.upgrade();
        this.engine.save();
        this.updateUI();
    }
}

    unlockWeapon(id) {
        const weapon = this.engine.datas.weapons[id];
        if (this.engine.state.coins >= weapon.unlockCost) {
            this.engine.state.coins -= weapon.unlockCost;
            this.engine.state.inventory.weapons[id].unlocked = true;
            this.engine.audio.sfx.upgrade();
            this.engine.save();
            this.updateUI();
        }
    }

    upgradeWeaponStat(id, statKey) {
        const weaponData = this.engine.datas.weapons[id];
        const weaponState = this.engine.state.inventory.weapons[id];
        const cost = weaponData.upgrades[statKey].baseCost * weaponState.levels[statKey];

        if (this.engine.state.coins >= cost) {
            this.engine.state.coins -= cost;
            weaponState.levels[statKey]++;
            this.engine.audio.sfx.upgrade();
            this.engine.save();
            this.updateUI();
        }
    }

    equipWeapon(id) {
        this.engine.state.inventory.activeWeapon = id;
        this.engine.audio.sfx.equip();
        this.engine.save();
        this.updateUI();
    }

    // --- RENDERELÉS (Template Literals) ---

    updateUI() {
        document.getElementById('upgrade-coins-val').innerText = Math.floor(this.engine.state.coins);
        this.renderPlayerUpgrades();
        this.renderWeapons();
        this.renderBots();
    }

    renderPlayerUpgrades() {
        const container = document.getElementById('playerUpgrades-container');
        const upgradesData = this.engine.datas?.playerUpgrades;
        if (!container || !upgradesData) return;

        container.innerHTML = Object.entries(upgradesData).map(([key, data]) => {
            const lvl = this.engine.state.upgrades[key + "Level"] || 1;
            const cost = data.baseCost * lvl;
            const canAfford = this.engine.state.coins >= cost;

            return `
                <div class="weapon-card">
                    <h3>${data.name}</h3>
                    <p>Szint: ${lvl}</p>
                    <button class="${canAfford ? 'btn-buy' : 'btn-disabled'}" data-action="player-upg" data-key="${key}">
                        FEJLESZTÉS (${cost} ¤)
                    </button>
                </div>`;
        }).join('');
        this.bindCardEvents(container);
    }

    renderWeapons() {
        const container = document.getElementById('weapons-container');
        if (!container || !this.engine.datas?.weapons) return;

        container.innerHTML = Object.entries(this.engine.datas.weapons).map(([id, data]) => {
            const state = this.engine.state.inventory.weapons[id];
            const isActive = this.engine.state.inventory.activeWeapon === id;

            if (!state.unlocked) {
                return `
                    <div class="weapon-card">
                        <h3>${id.toUpperCase()}</h3>
                        <p>Ár: ${data.unlockCost} ¤</p>
                        <button class="${this.engine.state.coins >= data.unlockCost ? 'btn-buy' : 'btn-disabled'}" 
                                data-action="w-unlock" data-id="${id}">FELOLDÁS</button>
                    </div>`;
            }

            const statsHtml = Object.entries(data.upgrades).map(([sKey, sData]) => {
                const cost = sData.baseCost * state.levels[sKey];
                return `
                    <div class="upgrade-row">
                        <span class="upgrade-label">${sData.name} (Lv${state.levels[sKey]})</span>
                        <button class="btn-upgrade-stat ${this.engine.state.coins >= cost ? 'btn-buy' : 'btn-disabled'}" 
                                data-action="w-upg" data-id="${id}" data-stat="${sKey}">${cost} ¤</button>
                    </div>`;
            }).join('');

            return `
                <div class="weapon-card">
                    <h3>${id.toUpperCase()}</h3>
                    <button class="${isActive ? 'btn-equipped' : 'btn-equip'}" data-action="w-equip" data-id="${id}">
                        ${isActive ? 'FELSZERELVE' : 'FELSZEREL'}
                    </button>
                    <div class="upgrades-list">${statsHtml}</div>
                </div>`;
        }).join('');
        this.bindCardEvents(container);
    }

    renderBots() {
        const container = document.getElementById('bots-container');
        if (!container || !this.engine.datas?.bots) return;
        // Hasonló logika mint a fegyvereknél...
    }

    bindCardEvents(container) {
        container.querySelectorAll('button').forEach(btn => {
            btn.onclick = () => {
                const d = btn.dataset;
                if (d.action === "player-upg") this.upgradePlayerStat(d.key);
                if (d.action === "w-unlock") this.unlockWeapon(d.id);
                if (d.action === "w-upg") this.upgradeWeaponStat(d.id, d.stat);
                if (d.action === "w-equip") this.equipWeapon(d.id);
            };
        });
    }
}