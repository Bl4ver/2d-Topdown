import { Bot } from "../bot.js";

export class ShooterBot extends Bot {
    constructor(scene) {
        super(scene);
        this.orbitRadius = 100;
        this.color = "#ff0055";
        
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

        const getStat = (key) => botData[key].baseValue + (botData[key].inc * ((botInventory[key] || 1) - 1));

        this.damage = getStat("damage");
        this.fireRate = getStat("fireRate") / 1000; // Átkonvertáljuk másodpercre a dt miatt!
        this.projectileSpeed = getStat("projectileSpeed");
        this.spread = Math.max(0, getStat("spread"));
        
        // Biztosítjuk, hogy ne oomoljon össze, ha esetleg nincs bulletType
        this.bulletType = botData.bulletType ? botData.bulletType.baseValue : "enemyBullet"; 
        
        this.shootTimer = 0;
        this.x = this.scene.player.x - 50;
        this.y = this.scene.player.y - 50;
    }

    update(dt) {
        super.update(dt); 

        if (!this.active || this.exploding) return;

        // 1. KERINGÉS MEGHÍVÁSA
        this.orbitPlayer(dt, this.orbitRadius);

        // 2. LÖVÉS LOGIKA
        if (this.shootTimer > 0) {
            this.shootTimer -= dt;
        } else {
            this.shoot();
        }
    }

    shoot() {
        let target = null, minDist = Infinity;
        
        Object.values(this.scene.enemyPools).forEach(pool => {
            pool.pool.forEach(enemy => {
                if (enemy.active && !enemy.exploding) {
                    // Gyorsabb távolságmérés Math.sqrt() nélkül
                    let distanceSq = (enemy.x - this.x) ** 2 + (enemy.y - this.y) ** 2;
                    if (distanceSq < minDist) {
                        minDist = distanceSq;
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
                    this.damage, this.projectileSpeed, this.bulletType, this.spread
                );
                this.shootTimer = this.fireRate; // Visszaállítjuk a timert
            }

            if (this.scene.engine.audio && this.scene.engine.audio.sfx) {
                this.scene.engine.audio.sfx.shoot();
            }
        }
    }
}