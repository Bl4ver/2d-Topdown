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
        this.radius = 0;
        this.color = "";

        this.exploding = false;
        this.particles = [];
        this.name = "";

        this.orbitAngle = 0;

        this.shootTimer = 0;
    }

    init(botName, state, datas) {
        this.name = botName;
        const botData = datas.bots[botName].upgrades;
        const botInventory = state.inventory.bots[botName].levels;

        if (!botData || !botInventory) {
            return console.error(`Hiba: Nem található adat a következő bothoz: ${botName}`);
        }


        const getStat = (key) => botData[key].baseValue + (botData[key].inc * (botInventory[key] - 1));
        // 1. KÖZÖS statisztikák
        this.maxHp = getStat("maxHp");
        this.hp = this.maxHp;
        this.speed = getStat("speed");

        // 2. SHOOTER BOT
        if (botName === "shooter_bot") {
            this.damage = getStat("damage");
            this.fireRate = getStat("fireRate");
            this.projectileSpeed = getStat("projectileSpeed");

            this.spread = Math.max(0, getStat("spread"));

            this.bulletType = botData.bulletType.baseValue;
            this.color = "#ff0055";
            this.shootTimer = 0;
        }

        // 3. REPAIR BOT
        if (botName === "repair_bot") {
            this.heal = getStat("heal");
            this.healRate = getStat("healRate");
            this.color = "#39ff14";
        }

        // Spawnoláskor a játékos mellé
        this.x = this.scene.player.x - 50;
        this.y = this.scene.player.y - 50;

        this.active = true;
        this.exploding = false;
        this.particles = [];
    }

    update(dt) {
        if (!this.active) return;

        // --- ÚJ: Timer csökkentése minden frame-ben ---
        if (this.shootTimer > 0) this.shootTimer -= dt;

        // 1. Keringési célpont kiszámolása
        this.orbitAngle += 2 * dt;
        const orbitRadius = this.name == "shooter_bot" ? 100 : 200;

        const targetX = this.scene.player.x + Math.cos(this.orbitAngle) * orbitRadius;
        const targetY = this.scene.player.y + Math.sin(this.orbitAngle) * orbitRadius;

        // 2. Tényleges mozgás a célpont felé
        const dx = targetX - this.x;
        const dy = targetY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 1) {
            const moveSpeed = this.speed * dt;
            const step = Math.min(moveSpeed, distance);

            this.x += (dx / distance) * step;
            this.y += (dy / distance) * step;
        }

        // Támadás vagy gyógyítás logikája
        switch (this.name) {
            case "shooter_bot": {
                this.shoot();
                break;
            }
            case "repair_bot": {
                this.repair(dt);
                break;
            }
        }
    }

    shoot() {
        if (this.shootTimer <= 0) {

            let target = null, minDist = Infinity;

            // 1. Célpont keresése
            this.scene.enemyPool.pool.forEach(e => {
                if (!e.active || e.exploding) return;

                const d = (e.x - this.x) ** 2 + (e.y - this.y) ** 2;
                if (d < minDist) { minDist = d; target = e; }
            });

            // 2. Ha NINCS célpont, azonnal kilépünk. 
            // A timer marad 0, így a következő frame-en rögtön újra tudja keresni az ellenfelet!
            if (!target) return;

            // 3. Ha VAN célpont, csak EKKOR indítjuk újra a visszaszámlálót
            const fireRateSec = this.fireRate / 1000;
            this.shootTimer = fireRateSec;

            // 4. Golyó lekérése és kilövése
            const bullet = this.scene.bulletPool.get();
            if (bullet) {
                const spreadInRadians = Math.max(0, this.spread) * (Math.PI / 180);

                bullet.spawn(
                    this.x, this.y,
                    target.x - this.x, target.y - this.y,
                    this.damage, this.projectileSpeed, this.bulletType, spreadInRadians
                );
            }

            // Hang lejátszása biztonságosan
            if (this.engine.audio && this.engine.audio.sfx && this.engine.audio.sfx.shoot) {
                this.engine.audio.sfx.shoot();
            }
        }
    }

    repair(dt) {
        const player = this.scene.player;
        if (player.damageCooldownTimer <= 0 && player.hp < player.maxHp) {

            const healStep = (this.heal * dt) / this.healRate;

            player.heal(healStep);
        }
    }

    // Egy egyszerű rajzoló funkció, hogy lássuk a pályán
    draw() {

    }
}