export class DataManager {
    constructor() {
        this.datas = null;
        this.state = null;
    }

    async init() {
        this.datas = await this.loadDatas();
        this.state = JSON.parse(JSON.stringify(this.datas.state));
        this.load();
    }

    async loadDatas() {
        let response = await fetch("assets/datas.json");
        if (!response.ok) {
            throw new Error(`Hiba! Status: ${response.status} - Útvonal: ${response.url}`);
        }
        return await response.json();
    }

    load() {
        const localSave = localStorage.getItem("neonO-save");
        if (localSave) {
            const parsedSave = JSON.parse(localSave);

            this.state = {
                ...this.state,
                ...parsedSave,
                player: { ...this.state.player, ...(parsedSave.player || {}) },
                upgrades: { ...this.state.upgrades, ...(parsedSave.upgrades || {}) },
                inventory: {
                    ...this.state.inventory,
                    ...(parsedSave.inventory || {}),
                    weapons: { ...this.state.inventory.weapons, ...(parsedSave.inventory?.weapons || {}) },
                    bots: { ...this.state.inventory.bots, ...(parsedSave.inventory?.bots || {}) },
                    activeBots: parsedSave.inventory?.activeBots || this.state.inventory.activeBots || []
                }
            };
            console.log("Mentés sikeresen betöltve:", this.state);
        } else {
            console.log("Alapállapot betöltve:", this.state);
        }
    }

    save() {
        localStorage.setItem("neonO-save", JSON.stringify(this.state));
    }
}