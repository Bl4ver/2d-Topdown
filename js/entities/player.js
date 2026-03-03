import { Bullet } from "./bullet.js";

export class Player {
    constructor(scene) {
        this.scene = scene;
        this.engine = scene.engine;
        this.canvas = this.engine.canvas;
        this.x = 0;
        this.y = 0;

        this.speed = 0;
        this.maxHp = 0;
        this.activeWeapon = "pistol";

        this.fireRate = 1000;
        this.lastShotTime = 0;

        this.mouse = { x: 0, y: 0 };
        this.active = false;

        window.addEventListener('mousemove', (event) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouse.x = event.clientX - rect.left;
            this.mouse.y = event.clientY - rect.top;
        });
    }

    init(state) {
        this.maxHp = state.player.maxHp;
        this.hp = this.maxHp;
        this.speed = state.player.speed;
    }

    spawn() {
        this.x = this.canvas.width / 2;
        this.y = this.canvas.height / 2;
    }

    takeDamage(dmg) {
        this.hp -= dmg;
        document.getElementById("hp-fill").style.width = (this.hp / this.maxHp * 100) + "%";
        document.getElementById("hp-val").innerText = Math.max(0, Math.round(this.hp / this.maxHp * 100)) + "%";
        if (this.hp <= 0) { this.active = false; this.engine.audio.sfx.die(); }
        else this.engine.audio.sfx.hit();
    }

    update(input, dt) {
        const step = this.speed * dt;
        if (input.keys.a || input.keys.ArrowLeft) this.x -= step;
        if (input.keys.d || input.keys.ArrowRight) this.x += step;
        if (input.keys.w || input.keys.ArrowUp) this.y -= step;
        if (input.keys.s || input.keys.ArrowDown) this.y += step;
        if (input.isKeyDown("mouse")) this.shoot();
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

        // Most már biztonságosan olvashatjuk a szinteket
        const lvl = weaponSave.levels;
        const upg = weaponData.upgrades;

        let fireRate = weaponData.baseFireRate + ((lvl.fireRate - 1) * upg.fireRate.inc);

        if (currentTime - this.lastShotTime >= Math.max(50, fireRate)) {
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
        const angle = Math.atan2(this.mouse.y - this.y, this.mouse.x - this.x);
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(angle);
        ctx.fillStyle = "#00f3ff";
        ctx.shadowBlur = 15; ctx.shadowColor = '#00f3ff';
        ctx.beginPath(); ctx.moveTo(22, 0); ctx.lineTo(-12, -14); ctx.lineTo(-6, 0); ctx.lineTo(-12, 14); ctx.fill();
        ctx.restore();

        /*
    if (this.shield > 0) {
        ctx.beginPath(); ctx.arc(0, 0, this.radius + 12, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(0, 243, 255, ${0.2 + Math.sin(frameCount * 0.1) * 0.1})`;
        ctx.lineWidth = 2; ctx.stroke();
    }
    */
    }
}