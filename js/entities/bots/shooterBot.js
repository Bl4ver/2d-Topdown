import { Bot } from "../bot.js";

export class ShooterBot extends Bot {
    constructor(scene) {
        super(scene);
        this.name = "repair_bot";
        this.orbitRadius = 100;
        this.color = "";

        this.damage = 0;
        this.fireRate = 0;
        this.projectileSpeed = 0;
        this.spread = 0;
        this.bulletType = "";
        this.shootTimer = 0;
    }
    init(botName, state, datas) {
        super.init(botName, state, datas);
        const botData = datas.bots[botName].upgrades;
        const botInventory = state.inventory.bots[botName].levels;

        if (!botData || !botInventory) {
            return console.error(`Hiba: Nem található adat a következő bothoz: ${botName}`);
        }

        const getStat = (key) => botData[key].baseValue + (botData[key].inc * (botInventory[key] - 1));

        this.damage = getStat("damage");
        this.fireRate = getStat("fireRate");
        this.projectileSpeed = getStat("projectileSpeed");
        this.spread = Math.max(0, getStat("spread"));
        this.bulletType = botData.bulletType.baseValue;
        this.color = "#ff0055";
        this.shootTimer = 0;

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
        if (this.shootTimer > 0) this.shootTimer -= dt * 1000;
        this.shoot();
    }

    shoot(dt) {
        if (this.shootTimer <= 0) {
            let target = null, minDist = Infinity;
            Object.values(this.scene.enemyPools).forEach(pool => {
                pool.pool.forEach(enemy => {
                    if (enemy.active) {
                        let distance = Math.sqrt((enemy.x - this.x) ** 2 + (enemy.y - this.y) ** 2);
                        if (distance < minDist) {
                            minDist = distance;
                            target = enemy;
                        }
                    }
                });
            });

            if (target) {
                const bullet = this.scene.playerBulletPool.get();
                if (bullet) {
                    bullet.spawn(
                        this.x, this.y,
                        target.x - this.x, target.y - this.y,
                        this.damage, this.projectileSpeed, this.bulletType, Math.max(0, this.spread)
                    );
                    this.shootTimer = this.fireRate;
                }

                if (this.engine.audio && this.engine.audio.sfx) {
                    this.engine.audio.sfx.shoot();
                }
            }
        }
    }
}