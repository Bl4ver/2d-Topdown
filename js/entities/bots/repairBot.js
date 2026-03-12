import { Bot } from "../bot.js";

export class RepairBot extends Bot {
    constructor(scene) {
        super(scene);
        this.name = "repair_bot";
        this.orbitRadius = 200;
        this.color = "";
        this.heal = 0;
        this.healRate = 0;
    }
    init(botName, state, datas) {
        super.init(botName, state, datas);
        this.name = botName;
        const botData = datas.bots[botName].upgrades;
        const botInventory = state.inventory.bots[botName].levels;

        if (!botData || !botInventory) {
            return console.error(`Hiba: Nem található adat a következő bothoz: ${botName}`);
        }

        const getStat = (key) => botData[key].baseValue + (botData[key].inc * (botInventory[key] - 1));

        this.heal = getStat("heal");
        this.healRate = getStat("healRate");
        this.color = "#39ff14";

        this.x = this.scene.player.x - 50;
        this.y = this.scene.player.y - 50;
    }

    update(dt) {
        super.update(dt); // Lefuttatja a robbanás ellenőrzését

        // Ha halott vagy robban, ne csináljon semmit
        if (!this.active || this.exploding) return;

        // 1. KERINGÉS MEGHÍVÁSA
        this.orbitPlayer(dt, this.orbitRadius);

        // 2. GYÓGYÍTÁS
        this.repair(dt);
    }

    repair(dt) {
        const player = this.scene.player;
        if (player.damageCooldownTimer <= 0 && player.hp < player.maxHp) {
            const healStep = (this.heal * dt) / this.healRate;
            player.heal(healStep);
        }
    }
}