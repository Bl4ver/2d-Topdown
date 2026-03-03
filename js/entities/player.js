import { Bullet } from "./bullet.js";

export class Player {
    constructor(scene) {
        this.engine = scene.engine;
        this.scene = scene;
        this.canvas = this.engine.canvas;
        this.x = 0;
        this.y = 0;

        this.speed = 0;
        this.hp = 100;
        this.maxHp = 0;
        this.damage = 2;
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
        this.maxHp = state.player?.maxHp || 100;
        this.hp = this.maxHp;
        this.speed = state.player?.speed || 200;
    }

    spawn() {
        this.x = this.canvas.width / 2;
        this.y = this.canvas.height / 2;
    }

    takeDamage(damage) {
        if (this.hp - damage > 0) {
            let hpDisplay = document.getElementById("hp-fill");
            let hpText = document.getElementById("hp-val");

            this.engine.audio.sfx.hit()
            this.hp -= damage;

            let hpPercent = (this.hp / this.maxHp) * 100
            hpDisplay.style.width = hpPercent + "%";
            hpText.innerText = Math.max(0, Math.round(hpPercent)) + "%";
        }

        else {
            this.engine.audio.sfx.die();
            this.active = false;
            this.engine.state.statistics.totalGamesPlayed += 1;
        }
        console.log(this.hp);
    }

    update(input, dt) {
        const moveStep = this.speed * dt;

        if (input.keys.ArrowLeft || input.keys.a) this.x -= moveStep;
        if (input.keys.ArrowRight || input.keys.d) this.x += moveStep;
        if (input.keys.ArrowUp || input.keys.w) this.y -= moveStep;
        if (input.keys.ArrowDown || input.keys.s) this.y += moveStep;

        if (input.isKeyDown("mouse")) {
            this.shoot();
        }
    }

    shoot() {
        const weaponName = this.engine.state.inventory.activeWeapon;
        const weaponData = this.scene.datas.weapons[weaponName];
        const weaponSave = this.engine.state.inventory.weapons[weaponName];

        if (!weaponData || !weaponSave) return;
        const currentTime = Date.now();

        // 1. Tűzgyorsaság kiszámítása
        let currentFireRate = weaponData.baseFireRate + ((weaponSave.levels.fireRate - 1) * weaponData.upgrades.fireRate.inc);
        currentFireRate = Math.max(50, currentFireRate);

        if (currentTime - this.lastShotTime >= currentFireRate) {
            this.lastShotTime = currentTime;

            // 2. Sebzés és Golyó sebesség kiszámítása
            const currentDamage = weaponData.baseDamage + ((weaponSave.levels.damage - 1) * weaponData.upgrades.damage.inc);
            const currentSpeed = weaponData.bulletSpeed + ((weaponSave.levels.projectileSpeed - 1) * weaponData.upgrades.projectileSpeed.inc);

            // 3. Pontosság (Szórás) kiszámítása
            // Minél kisebb a spread, annál pontosabb. A 0 a tökéletes egyenes.
            let spread = weaponData.baseAccuracy + ((weaponSave.levels.accuracy - 1) * weaponData.upgrades.accuracy.inc);
            spread = Math.max(0, spread); // Nem lehet negatív a szórás

            if (weaponData.type === "projectile" || weaponData.type === "homing") {
                const bullet = this.scene.bulletPool.get();
                if (bullet) {
                    const dx = this.mouse.x - this.x;
                    const dy = this.mouse.y - this.y;

                    // Átadjuk a golyónak a kiszámolt értékeket PLUSZ a szórást
                    bullet.spawn(this.x, this.y, dx, dy, currentDamage, currentSpeed, weaponData.type, spread);
                }
            } else if (weaponData.type === "melee") {
                console.log(`Suhintás! Sebzés: ${currentDamage}`);
            }

            this.engine.audio.sfx.shoot();
        }
    }


    draw() {
        const ctx = this.engine.ctx;

        const dx = this.mouse.x - this.x;
        const dy = this.mouse.y - this.y;

        const angle = Math.atan2(dy, dx);

        ctx.save();

        ctx.translate(this.x, this.y);

        /*
        if (this.shield > 0) {
            ctx.beginPath(); ctx.arc(0, 0, this.radius + 12, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(0, 243, 255, ${0.2 + Math.sin(frameCount * 0.1) * 0.1})`;
            ctx.lineWidth = 2; ctx.stroke();
        }
        */

        ctx.rotate(angle);
        ctx.fillStyle = "#00f3ff";
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#00f3ff'
        ctx.beginPath();

        ctx.beginPath();
        ctx.moveTo(22, 0);
        ctx.lineTo(-12, -14);
        ctx.lineTo(-6, 0);
        ctx.lineTo(-12, 14);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
    }
}