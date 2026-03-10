export class Player {
    constructor(scene) {
        this.scene = scene;
        this.engine = scene.engine;
        this.canvas = this.engine.canvas;
        this.x = 0;
        this.y = 0;

        this.hp = 0;
        this.maxHp = 0;
        this.speed = 0;

        // Pajzs tulajdonságok
        this.maxShield = 0;
        this.shield = 0;
        this.shieldRegen = 0;

        this.shootTimer = 0;
        this.damageCooldownTimer = 0;
        this.mouse = { x: 0, y: 0 };
        this.active = false;

        this.ui = {
            hpFill: null,
            hpVal: null,
            shieldFill: null,
            shieldVal: null
        };

        window.addEventListener('mousemove', (event) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouse.x = event.clientX - rect.left;
            this.mouse.y = event.clientY - rect.top;
        });
    }

    init(state, datas) {
        const getLvl = (key) => state.upgrades[key + "Level"] || 1; // Lekérjük a szintet
        const upg = datas.playerUpgrades;
        const base = state.player;


        this.maxHp = base.maxHp + (upg.maxHp.inc * (getLvl("maxHp") - 1));
        this.hp = this.maxHp;
        this.speed = base.speed + (upg.speed.inc * (getLvl("speed") - 1));
        this.maxShield = base.maxShield + (upg.maxShield.inc * (getLvl("maxShield") - 1));
        this.shield = this.maxShield;
        this.shieldRegen = base.shieldRegen + (upg.shieldRegen.inc * (getLvl("shieldRegen") - 1));


        this.ui.hpFill = document.getElementById("hp-fill");
        this.ui.hpVal = document.getElementById("hp-val");
        this.ui.shieldFill = document.getElementById("shield-fill");
        this.ui.shieldVal = document.getElementById("shield-val");

        this.updateUI();
    }

    spawn() {
        this.x = this.canvas.width / 2;
        this.y = this.canvas.height / 2;
    }

    takeDamage(dmg) {
        if (this.shield > 0) {
            if (this.shield >= dmg) {
                this.shield -= dmg;
                dmg = 0;
            } else {
                dmg -= this.shield;
                this.shield = 0;
            }
        }

        if (dmg > 0) {
            this.hp -= dmg;
        }

        this.updateUI();

        if (this.hp <= 0) {
            this.active = false;
            this.engine.audio.sfx.die();
        } else {
            this.damageCooldownTimer = 3.0;
            this.engine.audio.sfx.hit();
        }
    }

    update(input, dt) {
        if (!this.active) return;

        const step = this.speed * dt;
        if (this.shootTimer > 0) this.shootTimer -= dt;
        if (this.damageCooldownTimer > 0) this.damageCooldownTimer -= dt;

        // Mozgás
        if (input.keys.a || input.keys.ArrowLeft) {
            this.x = Math.max(0, this.x - step);
        }
        if (input.keys.d || input.keys.ArrowRight) {
            this.x = Math.min(this.canvas.width, this.x + step);
        }
        if (input.keys.w || input.keys.ArrowUp) {
            this.y = Math.max(0, this.y - step);
        }
        if (input.keys.s || input.keys.ArrowDown) {
            this.y = Math.min(this.canvas.height, this.y + step);
        }

        // PAJZS REGEN: Időalapú visszatöltés
        if (this.shield < this.maxShield && this.damageCooldownTimer <= 0) {
            this.shield += this.shieldRegen * dt;
            if (this.shield > this.maxShield) this.shield = this.maxShield;
            this.updateUI(); 
        }

        if (input.isKeyDown("mouse")) this.shoot();
    }

    updateUI() {
        // HP
        if (this.ui.hpFill) this.ui.hpFill.style.width = (this.hp / this.maxHp * 100) + "%";
        if (this.ui.hpVal) this.ui.hpVal.innerText = Math.max(0, Math.round(this.hp / this.maxHp * 100)) + "%";

        // Shield
        if (this.ui.shieldFill) this.ui.shieldFill.style.width = (this.shield / this.maxShield * 100) + "%";
        if (this.ui.shieldVal) this.ui.shieldVal.innerText = Math.max(0, Math.round(this.shield / this.maxShield * 100)) + "%";
    }

    shoot() {
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

        let fireRateMs = weaponData.baseFireRate + ((lvl.fireRate - 1) * upg.fireRate.inc);
        let fireRateSec = fireRateMs / 1000;

        if (this.shootTimer <= 0) {
            this.shootTimer = fireRateSec

            const dmg = weaponData.baseDamage + ((lvl.damage - 1) * upg.damage.inc);
            const spd = weaponData.bulletSpeed + ((lvl.projectileSpeed - 1) * upg.projectileSpeed.inc);
            let spread = weaponData.baseAccuracy + ((lvl.accuracy - 1) * upg.accuracy.inc);

            const bullet = this.scene.bulletPool.get();
            if (bullet) {
                bullet.spawn(
                    this.x, this.y,
                    this.mouse.x - this.x, this.mouse.y - this.y,
                    dmg, spd, weaponData.type, Math.max(0, spread)
                );
                this.engine.audio.sfx.shoot();
            }
        }
    }

    heal(amount) {
        this.hp = Math.min(this.hp + amount, this.maxHp);
        console.log(this.hp)
        this.updateUI();
    }


    draw(ctx) {
        if (!this.active) return;

        const angle = Math.atan2(this.mouse.y - this.y, this.mouse.x - this.x);

        // 1. Pajzs vizuális effekt (Kör a játékos körül)
        if (this.shield > 0) {
            ctx.save();
            ctx.beginPath();
            ctx.arc(this.x, this.y, 30, 0, Math.PI * 2);
            // Az átlátszóság függ a pajzs erejétől
            const alpha = (this.shield / this.maxShield) * 0.3;
            ctx.strokeStyle = `rgba(0, 243, 255, ${alpha})`;
            ctx.lineWidth = 3;
            ctx.stroke();

            // Pulzáló effekt
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#00f3ff';
            ctx.stroke();
            ctx.restore();
        }

        // 2. Játékos teste
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(angle);
        ctx.fillStyle = "#00f3ff";
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#00f3ff';
        ctx.beginPath();
        ctx.moveTo(22, 0);
        ctx.lineTo(-12, -14);
        ctx.lineTo(-6, 0);
        ctx.lineTo(-12, 14);
        ctx.fill();
        ctx.restore();
    }
}