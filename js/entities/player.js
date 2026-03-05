import { Bullet } from "./bullet.js";

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

        this.lastShotTime = 0;
        this.mouse = { x: 0, y: 0 };
        this.active = false;

        window.addEventListener('mousemove', (event) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouse.x = event.clientX - rect.left;
            this.mouse.y = event.clientY - rect.top;
        });
    }

    init(state, datas) {
        this.maxHp = state.player.maxHp * datas.playerUpgrades.maxHp.inc;
        this.hp = this.maxHp;
        this.speed = state.player.speed * datas.playerUpgrades.speed.inc;
        console.log(state.player.speed, datas.playerUpgrades.speed.inc)
        this.maxShield = (state.player.maxShield) * datas.playerUpgrades.maxShield.inc; // NEM FIX
        this.shield = this.maxShield;
        this.shieldRegen = (state.player.shieldRegen) * datas.playerUpgrades.shieldRegen.inc;
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
            this.engine.audio.sfx.hit();
        }
    }

    update(input, dt) {
        if (!this.active) return;

        const step = this.speed * dt;

        // Mozgás
        if (input.keys.a || input.keys.ArrowLeft) this.x -= step;
        if (input.keys.d || input.keys.ArrowRight) this.x += step;
        if (input.keys.w || input.keys.ArrowUp) this.y -= step;
        if (input.keys.s || input.keys.ArrowDown) this.y += step;

        // PAJZS REGEN: Időalapú visszatöltés
        if (this.shield < this.maxShield) {
            this.shield += this.shieldRegen * dt;
            if (this.shield > this.maxShield) this.shield = this.maxShield;
            this.updateUI(); // Folyamatosan frissítjük a csíkot
        }

        if (input.isKeyDown("mouse")) this.shoot();
    }

    updateUI() {
        // HP sáv
        const hpFill = document.getElementById("hp-fill");
        const hpVal = document.getElementById("hp-val");
        if (hpFill) hpFill.style.width = (this.hp / this.maxHp * 100) + "%";
        if (hpVal) hpVal.innerText = Math.max(0, Math.round(this.hp / this.maxHp * 100)) + "%";

        // Pajzs sáv
        const shieldFill = document.getElementById("shield-fill");
        const shieldVal = document.getElementById("shield-val");
        if (shieldFill) shieldFill.style.width = (this.shield / this.maxShield * 100) + "%";
        if (shieldVal) shieldVal.innerText = Math.max(0, Math.round(this.shield / this.maxShield * 100)) + "%";
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

        let fireRate = weaponData.baseFireRate + ((lvl.fireRate - 1) * upg.fireRate.inc);

        if (currentTime - this.lastShotTime >= Math.max(10, fireRate)) {
            this.lastShotTime = currentTime;

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