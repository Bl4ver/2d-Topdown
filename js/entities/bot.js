export class Bot {
    constructor(scene) {
        this.engine = scene.engine;
        this.scene = scene;
        this.canvas = this.engine.canvas;
        this.ctx = this.engine.ctx;

        this.x = 0;
        this.y = 0;
        this.target = { x: 0, y: 0 };
        this.active = false;

        this.hp = 0;
        this.maxHp = 0;
        this.damage = 0;
        this.speed = 0;
        this.radius = 10; // Alap méret a botnak --> datas.json-hoz hozzá kellene adni
        this.color = "#00f3ff"; // Alapértelmezett kék neon szín

        this.exploding = false;
        this.particles = [];
        this.name = "";
        this.lastTime = 0;

        this.orbitAngle = 0;
    }

    init(botName, state, datas) {
        this.name = botName;
        const botData = datas.bots[botName].upgrades;
        const botInventory = state.inventory.bots[botName].levels;

        if (!botData || !botInventory) {
            return console.error(`Hiba: Nem található adat a következő bothoz: ${botName}`);
        }


        // 1. KÖZÖS statisztikák betöltése (minden botnak van)
        this.maxHp = botData.maxHp.inc * botInventory.maxHp;
        this.hp = this.maxHp;
        this.speed = Math.max(botData.speed.baseValue, botData.speed.inc * botInventory.speed); // MÁSHOL IS KELL A BASE VALUE              FONTOOOSSS

        // 2. SHOOTER BOT specifikus statisztikák
        if (botName === "shooter_bot") {
            this.damage = botData.damage.inc * botInventory.damage;
            this.fireRate = botData.fireRate.inc * botInventory.fireRate;
            if (botInventory.projectileSpeed != 1) this.projectileSpeed = botData.projectileSpeed.inc * botInventory.projectileSpeed;
            else this.projectileSpeed = botData.projectileSpeed.baseValue;
            this.bulletType = botData.bulletType.type
            this.spread = botData.spread.inc * -botInventory.spread;
            this.color = "#ff0055"; // Pirosas szín a harci botnak
        }

        // 3. REPAIR BOT specifikus statisztikák
        if (botName === "repair_bot") {
            this.heal = botData.heal.inc * botInventory.heal;
            this.healRate = botData.healRate.inc * botInventory.healRate;
            this.color = "#39ff14"; // Zöld szín a gyógyító botnak
        }

        // Spawnoláskor a játékos mellé tesszük
        this.x = this.scene.player.x - 50;
        this.y = this.scene.player.y - 50;

        this.active = true;
        this.exploding = false;
        this.particles = [];
    }

    // Ide jön majd a mozgás, követés és a támadás/gyógyítás logikája
    update(dt) {
        if (!this.active) return;

        // 1. Keringési célpont kiszámolása
        this.orbitAngle += 2 * dt; // A keringés sebessége (növeld, ha gyorsabban pörögjön)
        const orbitRadius = 70; // Milyen távol lebegjen a játékostól (pixelben)

        // Ide akarjuk küldeni a botot (a játékos pozíciója + a kör egy pontja)
        const targetX = this.scene.player.x + Math.cos(this.orbitAngle) * orbitRadius;
        const targetY = this.scene.player.y + Math.sin(this.orbitAngle) * orbitRadius;

        // 2. Tényleges mozgás a célpont felé
        const dx = targetX - this.x;
        const dy = targetY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Ha messzebb van a céltól, mint 1 pixel, akkor mozog
        if (distance > 1) {
            // Normalizáljuk az irányt, majd megszorozzuk a bot SEBESSÉGÉVEL
            const moveSpeed = this.speed * dt;

            // Math.min: megakadályozza, hogy "túlrepüljön" a célon és remegni kezdjen
            const step = Math.min(moveSpeed, distance);

            this.x += (dx / distance) * step;
            this.y += (dy / distance) * step;
        }

        // --- Később IDE jön majd a bot TÁMADÁSA vagy GYÓGYÍTÁSA ---
        switch (this.name) {
            case "shooter_bot": {
                this.shoot();
                break;
            }
            case "repair_bot": {
                this.repair();
                break;
            }
            default: {
                console.log("Nem futott le semmi, bot neve: ", this.name)
                break;
            }
        }
    }

    shoot() {
        console.log(`${Math.max(10, this.fireRate)}`);
        if (Date.now() - this.lastTime >= Math.max(10, this.fireRate)) {
            console.log("shoot");
            this.lastTime = Date.now();
            const bullet = this.scene.bulletPool.get();
            bullet.spawn(
                this.x, this.y,
                0, 0,
                this.damage, this.projectileSpeed, this.bulletType, Math.max(0, this.spread)
            );
            this.engine.audio.sfx.shoot()
        }
        return;

        /*
        const inv = this.engine.state.inventory;
        const weaponData = this.engine.datas.weapons[inv.activeWeapon];
        const weaponSave = inv.weapons[inv.activeWeapon];

        if (!weaponData || !weaponSave || !weaponSave.levels || !weaponData.upgrades) {
            console.warn("Fegyver adatok hiányoznak vagy elavult mentés!");
            return;
        }

        const currentTime = Date.now();
        const lvl = weaponSave.levels;
        const upg = weaponData.upgrades;

        let fireRate = weaponData.baseFireRate + ((lvl.fireRate - 1) * upg.fireRate.inc);

        if (currentTime - this.lastShotTime >= Math.max(10, fireRate)) {
            this.lastShotTime = currentTime;

            const dmg = weaponData.baseDamage + ((lvl.damage - 1) * upg.damage.inc);
            const spd = weaponData.bulletSpeed + ((lvl.projectileSpeed - 1) * upg.projectileSpeed.inc);
            let spread = weaponData.baseAccuracy + ((lvl.accuracy - 1) * upg.accuracy.inc);

            const bullet = this.scene.bulletPool.get();
            if (bullet) {
                bullet.spawn(
                );
                this.engine.audio.sfx.shoot();
            }
        }
        */
    }

    repair() {
        if (this.lastTime - Date.now() <= this.healRate)
            console.log("repair");
        return;
    }

    // Egy egyszerű rajzoló funkció, hogy lássuk a pályán
    draw() {

    }
}