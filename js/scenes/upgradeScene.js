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
                document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
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

            this.engine.state.upgrades[key + "Level"] = currentLevel + 1;

            this.engine.audio.sfx.upgrade();
            this.engine.save();
            this.updateUI();
        }
    }

    upgradeStat(id, statKey, type) {
        switch (type) {
            case "weapon": {
                const weaponData = this.engine.datas.weapons[id];
                const weaponState = this.engine.state.inventory.weapons[id];
                const cost = weaponData.upgrades[statKey].baseCost * weaponState.levels[statKey];

                if (this.engine.state.coins >= cost) {
                    this.engine.state.coins -= cost;
                    weaponState.levels[statKey]++;
                }
                break;
            }

            case "bot": {
                const botData = this.engine.datas.bots[id];
                const botState = this.engine.state.inventory.bots[id];
                const cost = botData.upgrades[statKey].baseCost * botState.levels[statKey];

                if (this.engine.state.coins >= cost) {
                    this.engine.state.coins -= cost;
                    botState.levels[statKey]++;
                }
                break;
            }
        }

        this.engine.audio.sfx.upgrade();
        this.engine.save();
        this.updateUI();

    }

    unlock(id, type) {

        console.log(SVGUnitTypes)
        switch (type) {
            case "weapon": {
                const weapon = this.engine.datas.weapons[id];
                if (this.engine.state.coins >= weapon.unlockCost) {
                    this.engine.state.coins -= weapon.unlockCost;
                    this.engine.state.inventory.weapons[id].unlocked = true;
                    break;
                }
            }

            case "bot": {
                const bot = this.engine.datas.bots[id];
                if (this.engine.state.coins >= bot.unlockCost) {
                    this.engine.state.coins -= bot.unlockCost;
                    this.engine.state.inventory.bots[id].unlocked = true;
                    break;
                }
            }
        }

        this.engine.audio.sfx.upgrade();
        this.engine.save();
        this.updateUI();

    }

    equip(id, type) {
        switch (type) {
            case "weapon": {
                this.engine.state.inventory.activeWeapon = id;
                console.log(this.engine.state.inventory.activeWeapon, "equipped");
                break;
            }
            case "bot": {
                if (this.engine.state.inventory.activeBots.includes(id)) {
                    this.engine.state.inventory.activeBots = this.engine.state.inventory.activeBots.filter(botId => botId !== id);

                }
                else this.engine.state.inventory.activeBots.push(id);
                break;
            }
        }

        this.engine.audio.sfx.equip();
        this.engine.save();
        this.updateUI();
    }

    // --- RENDERELÉS ---

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
            const value = data.inc
            const canAfford = this.engine.state.coins >= cost;

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
        if (!container || !this.engine.datas?.weapons) return;

        container.innerHTML = Object.entries(this.engine.datas.weapons).map(([id, data]) => {
            const state = this.engine.state.inventory.weapons[id];
            const isActive = this.engine.state.inventory.activeWeapon === id;

            if (!state.unlocked) {
                return `
                    <div class="card">
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
        if (!container || !this.engine.datas?.bots) return;

        // key = repair_bot     value = unlockCost
        container.innerHTML = Object.entries(this.engine.datas.bots).map(([key, value]) => {
            const state = this.engine.state.inventory.bots[key];
            const isActive = this.engine.state.inventory.activeBots.includes(key);

            if (!state.unlocked) {
                return `
                    <div class="card">
                        <h3>${key.toUpperCase()}</h3>
                        <p>Ár: ${value.unlockCost} ¤</p>
                        <button class="${this.engine.state.coins >= value.unlockCost ? 'btn-buy' : 'btn-disabled'}" 
                                data-action="b-unlock" data-id="${key}">FELOLDÁS</button>
                    </div>`;
            }
            const statsHtml = Object.entries(value.upgrades)
                .filter(([sKey, sValue]) => sValue.baseCost !== undefined)
                .map(([sKey, sValue]) => {
                    const currentLevel = state.levels[sKey] || 1;
                    const cost = sValue.baseCost * currentLevel;
                    return `
                        <div class="upgrade-row">
                            <span class="upgrade-label">${sKey} (Lv${currentLevel})</span>
                            <button class="btn-upgrade-stat ${this.engine.state.coins >= cost ? 'btn-buy' : 'btn-disabled'}" 
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