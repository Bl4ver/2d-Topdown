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

        this.lastShotTime = 0;

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
        this.speed = Math.max(botData.speed.baseValue, botData.speed.inc * botInventory.speed);

        // 2. SHOOTER BOT specifikus statisztikák
        if (botName === "shooter_bot") {
            this.damage = Math.max(botData.damage.baseValue, botData.damage.inc * botInventory.damage);
            this.fireRate = Math.max(botData.fireRate.baseValue, botData.fireRate.inc * botInventory.fireRate);
            this.projectileSpeed = Math.max(botData.projectileSpeed.baseValue, botData.projectileSpeed.inc * botInventory.projectileSpeed);
            this.color = "#ff0055"; // Pirosas
        }

        // 3. REPAIR BOT specifikus statisztikák
        if (botName === "repair_bot") {
            this.heal = Math.max(botData.heal.baseValue, botData.heal.inc * botInventory.heal);
            this.healRate = Math.max(botData.healRate.baseValue, botData.healRate.inc * botInventory.healRate);
            this.color = "#39ff14"; // Zöld
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
        if (this.name == "shooter_bot") {
            this.shoot();
        }

        // 1. Keringési célpont kiszámolása
        this.orbitAngle += 2 * dt;  // A keringés sebessége
        const orbitRadius = 70;     // Milyen távol lebegjen a játékostól

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
    }

    shoot() {
        const currentTime = Date.now();
        if (!(currentTime - this.lastShotTime >= Math.max(10, this.fireRate))) return;
        console.log("Bot shoot")
        this.lastShotTime = currentTime;

        // x, y, dx, dy, damage, speed, type, spread
        const bullet = this.scene.bulletPool.get();
        if (bullet) {
            bullet.spawn(
                this.x,
                this.y,
                this.mouse.x - this.x,
                this.mouse.y - this.y,
                this.damage,
                this.projectileSpeed,
                "normal_bullet",
                0
            );
            this.engine.audio.sfx.shoot();
        }

        // Ha homing, legyen robbanási sugara (pl. 100 pixel)
        this.explosionRadius = (type === "homing") ? 100 : 0;

        let angle = Math.atan2(dy, dx) + (Math.random() - 0.5) * spread;
        this.speedX = Math.cos(angle) * this.speed;
        this.speedY = Math.sin(angle) * this.speed;
        this.active = true;
    }

    // Egy egyszerű rajzoló funkció, hogy lássuk a pályán
    draw() {

    }
}