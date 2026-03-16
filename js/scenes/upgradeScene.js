export class UpgradeScene {
    constructor(engine) {
        this.engine = engine;
    }

    init(state, datas) {
        this.state = state;
        this.datas = datas;

        this.engine.uiManager.showScreen('upgrades-screen');
        this.engine.uiManager.bindButtonEvents({
            onBack: () => this.engine.sceneManager.changeScene('menu')
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
                document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
                document.getElementById(target).classList.add('active');
            };
        });
    }

    // --- LOGIKA ---

    upgradePlayerStat(key) {
        const data = this.datas.playerUpgrades[key];
        const currentLevel = this.state.upgrades[key + "Level"] || 1;
        const cost = data.baseCost * currentLevel;

        if (this.state.coins >= cost) {
            this.state.coins -= cost;
            this.state.upgrades[key + "Level"] = currentLevel + 1;

            this.engine.audio.sfx.upgrade();
            this.engine.dataManager.save();
            this.updateUI();
        }
    }

    upgradeStat(id, statKey, type) {
        switch (type) {
            case "weapon": {
                const weaponData = this.datas.weapons[id];
                const weaponState = this.state.inventory.weapons[id];
                const cost = weaponData.upgrades[statKey].baseCost * weaponState.levels[statKey];

                if (this.state.coins >= cost) {
                    this.state.coins -= cost;
                    weaponState.levels[statKey]++;
                }
                break;
            }

            case "bot": {
                const botData = this.datas.bots[id];
                const botState = this.state.inventory.bots[id];
                const cost = botData.upgrades[statKey].baseCost * botState.levels[statKey];

                if (this.state.coins >= cost) {
                    this.state.coins -= cost;
                    botState.levels[statKey]++;
                }
                break;
            }
        }

        this.engine.audio.sfx.upgrade();
        this.engine.dataManager.save();
        this.updateUI();
    }

    unlock(id, type) {
        switch (type) {
            case "weapon": {
                const weapon = this.datas.weapons[id];
                if (this.state.coins >= weapon.unlockCost) {
                    this.state.coins -= weapon.unlockCost;
                    this.state.inventory.weapons[id].unlocked = true;
                }
                break;
            }

            case "bot": {
                const bot = this.datas.bots[id];
                if (this.state.coins >= bot.unlockCost) {
                    this.state.coins -= bot.unlockCost;
                    this.state.inventory.bots[id].unlocked = true;
                }
                break;
            }
        }

        this.engine.audio.sfx.upgrade();
        this.engine.dataManager.save();
        this.updateUI();
    }

    equip(id, type) {
        switch (type) {
            case "weapon": {
                this.state.inventory.activeWeapon = id;
                console.log(this.state.inventory.activeWeapon, "equipped");
                break;
            }
            case "bot": {
                if (this.state.inventory.activeBots.includes(id)) {
                    this.state.inventory.activeBots = this.state.inventory.activeBots.filter(botId => botId !== id);
                } else {
                    this.state.inventory.activeBots.push(id);
                }
                break;
            }
        }

        this.engine.audio.sfx.equip();
        this.engine.dataManager.save();
        this.updateUI();
    }

    // --- RENDERELÉS ---

    updateUI() {
        document.getElementById('upgrade-coins-val').innerText = Math.floor(this.state.coins);
        this.renderPlayerUpgrades();
        this.renderWeapons();
        this.renderBots();
    }

    renderPlayerUpgrades() {
        const container = document.getElementById('playerUpgrades-container');
        const upgradesData = this.datas?.playerUpgrades;
        if (!container || !upgradesData) return;

        container.innerHTML = Object.entries(upgradesData).map(([key, data]) => {
            const lvl = this.state.upgrades[key + "Level"] || 1;
            const cost = data.baseCost * lvl;
            const value = data.inc;
            const canAfford = this.state.coins >= cost;

            return `
                <div class="card">
                    <h3>${data.name}</h3>
                    <h4>Szint: ${lvl}</h4>
                    <p>Add: ${value}</p>
                    <button class="${canAfford ? 'btn-buy' : 'btn-disabled'}" data-action="player-upg" data-key="${key}">
                        FEJLESZTÉS (${cost} ¤)
                    </button>
                </div>`;
        }).join('');
        this.bindCardEvents(container);
    }

    renderWeapons() {
        const container = document.getElementById('weapons-container');
        if (!container || !this.datas?.weapons) return;

        container.innerHTML = Object.entries(this.datas.weapons).map(([id, data]) => {
            const wState = this.state.inventory.weapons[id];
            const isActive = this.state.inventory.activeWeapon === id;

            if (!wState.unlocked) {
                return `
                    <div class="card">
                        <h3>${id.toUpperCase()}</h3>
                        <p>Ár: ${data.unlockCost} ¤</p>
                        <button class="${this.state.coins >= data.unlockCost ? 'btn-buy' : 'btn-disabled'}" 
                                data-action="w-unlock" data-id="${id}">FELOLDÁS</button>
                    </div>`;
            }

            const statsHtml = Object.entries(data.upgrades).map(([sKey, sData]) => {
                const cost = sData.baseCost * wState.levels[sKey];
                return `
                    <div class="upgrade-row">
                        <span class="upgrade-label">${sData.name} (Lv${wState.levels[sKey]})</span>
                        <button class="btn-upgrade-stat ${this.state.coins >= cost ? 'btn-buy' : 'btn-disabled'}" 
                                data-action="w-upg" data-id="${id}" data-stat="${sKey}">${cost} ¤</button>
                    </div>`;
            }).join('');

            return `
                <div class="card">
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
        if (!container || !this.datas?.bots) return;

        container.innerHTML = Object.entries(this.datas.bots).map(([key, value]) => {
            const bState = this.state.inventory.bots[key];
            const isActive = this.state.inventory.activeBots.includes(key);

            if (!bState.unlocked) {
                return `
                    <div class="card">
                        <h3>${key.toUpperCase()}</h3>
                        <p>Ár: ${value.unlockCost} ¤</p>
                        <button class="${this.state.coins >= value.unlockCost ? 'btn-buy' : 'btn-disabled'}" 
                                data-action="b-unlock" data-id="${key}">FELOLDÁS</button>
                    </div>`;
            }
            const statsHtml = Object.entries(value.upgrades)
                .filter(([sKey, sValue]) => sValue.baseCost !== undefined)
                .map(([sKey, sValue]) => {
                    const currentLevel = bState.levels[sKey] || 1;
                    const cost = sValue.baseCost * currentLevel;
                    return `
                        <div class="upgrade-row">
                            <span class="upgrade-label">${sKey} (Lv${currentLevel})</span>
                            <button class="btn-upgrade-stat ${this.state.coins >= cost ? 'btn-buy' : 'btn-disabled'}" 
                                    data-action="b-upg" data-id="${key}" data-stat="${sKey}">${cost} ¤</button>
                        </div>`;
                }).join('');

            return `
                <div class="card">
                    <h3>${key.toUpperCase()}</h3>
                    <button class="${isActive ? 'btn-equipped' : 'btn-equip'}" data-action="b-equip" data-id="${key}">
                        ${isActive ? 'FELSZERELVE' : 'FELSZEREL'}
                    </button>
                    <div class="upgrades-list">${statsHtml}</div>
                </div>`;
        }).join('');
        this.bindCardEvents(container);
    }

    bindCardEvents(container) {
        if (container) {
            container.querySelectorAll('button').forEach(btn => {
                btn.onclick = () => {
                    const d = btn.dataset;
                    if (d.action === "player-upg") this.upgradePlayerStat(d.key);
                    if (d.action === "w-unlock") this.unlock(d.id, "weapon");
                    if (d.action === "w-upg") this.upgradeStat(d.id, d.stat, "weapon");
                    if (d.action === "w-equip") this.equip(d.id, "weapon");
                    if (d.action === "b-unlock") this.unlock(d.id, "bot");
                    if (d.action === "b-upg") this.upgradeStat(d.id, d.stat, "bot");
                    if (d.action === "b-equip") this.equip(d.id, "bot");
                };
            });
        }
    }
}