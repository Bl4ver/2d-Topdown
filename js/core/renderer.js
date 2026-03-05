export class Renderer {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
    }

    renderPlayer(player) {
        if (!player.active) return;
        const ctx = this.ctx;

        const angle = Math.atan2(player.mouse.y - player.y, player.mouse.x - player.x);

        // 1. Pajzs rajzolása
        if (player.shield > 0) {
            ctx.save();
            ctx.beginPath();
            ctx.arc(player.x, player.y, 30, 0, Math.PI * 2);
            const alpha = (player.shield / player.maxShield) * 0.3;
            ctx.strokeStyle = `rgba(0, 243, 255, ${alpha})`;
            ctx.lineWidth = 3;
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#00f3ff';
            ctx.stroke();
            ctx.restore();
        }

        // 2. Játékos hajó rajzolása
        ctx.save();
        ctx.translate(player.x, player.y);
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

    renderBot(bot) {
        if (!bot.active) return;
        const ctx = this.ctx;

        ctx.save();
        ctx.translate(bot.x, bot.y);

        const botColor = bot.color || "#00ff00"; // Alapértelmezett szín, ha nincs megadva

        ctx.lineWidth = 3;

        // Halványodik, ha sérül
        const hpRatio = bot.maxHp > 0 ? (bot.hp / bot.maxHp) : 1;
        ctx.globalAlpha = Math.max(0, hpRatio);

        // Neon effekt (árnyék)
        ctx.shadowColor = botColor;
        ctx.shadowBlur = 15;

        // Csak egy egyszerű, tiszta kör rajzolása
        ctx.beginPath();
        ctx.arc(0, 0, bot.radius || 15, 0, Math.PI * 2);

        // Körvonal kirajzolása
        ctx.strokeStyle = botColor;
        ctx.stroke();

        ctx.restore();
    }

    renderEnemy(enemy) {
        if (!enemy.active) return;
        const ctx = this.ctx;

        // 1. HA ÉPP ROBBAN: Csak a részecskéket (szilánkokat) rajzoljuk ki
        if (enemy.exploding) {
            ctx.save();

            enemy.particles.forEach(p => {
                if (p.life <= 0) return; // Ha már teljesen elhalványult, nem rajzoljuk

                ctx.globalAlpha = Math.max(0, p.life); // Fokozatosan átlátszó lesz
                ctx.fillStyle = enemy.color;
                ctx.shadowBlur = 10;
                ctx.shadowColor = enemy.color;

                // Pici négyzetek kirajzolása a részecske saját koordinátájára
                ctx.fillRect(p.x, p.y, p.size, p.size);
            });

            ctx.restore();
            return; // KILÉPÜNK! Így az eredeti nagy négyzetet már nem rajzolja ki.
        }

        // 2. HA NORMÁLISAN ÉL (Nem robban): Az eredeti rajzoló kódod
        ctx.save();

        ctx.translate(enemy.x, enemy.y);
        ctx.rotate(enemy.angle);

        ctx.lineWidth = 3;
        // console.log("HP:", enemy.hp, "MaxHP:", enemy.maxHp, "Alpha:", enemy.hp / enemy.maxHp);

        ctx.strokeStyle = enemy.color;
        ctx.globalAlpha = Math.max(0, enemy.hp / enemy.maxHp);
        ctx.shadowColor = enemy.color;
        ctx.shadowBlur = 15;

        ctx.strokeRect(-enemy.width / 2, -enemy.height / 2, enemy.width, enemy.height);

        ctx.restore();
    }

    renderBullet(bullet) {
        if (!bullet.active) return;
        const ctx = this.ctx;

        ctx.save();
        ctx.translate(bullet.x, bullet.y);

        const angle = Math.atan2(bullet.speedY, bullet.speedX);
        ctx.rotate(angle);

        // Rakéta vagy sima lövedék design
        switch (bullet.type) {
            case "homing": {
                ctx.fillStyle = "#FFA500";
                ctx.shadowBlur = 10;
                ctx.shadowColor = "#FF4500";
                ctx.beginPath();
                ctx.moveTo(10, 0);
                ctx.lineTo(-10, -5);
                ctx.lineTo(-6, 0);
                ctx.lineTo(-10, 5);
                ctx.closePath();
                ctx.fill();
                break;
            }
            default: {
                ctx.fillStyle = "#00f3ff";
                ctx.shadowBlur = 10;
                ctx.shadowColor = "#00f3ff";
                ctx.fillRect(-10, -2, 20, 4);
            }
        }

        ctx.restore();
    }

    renderExplosion(explosion) {
        const ctx = this.ctx;
        ctx.save();
        ctx.beginPath();
        ctx.arc(explosion.x, explosion.y, explosion.r, 0, Math.PI * 2);
        // Biztosítjuk, hogy az alpha sosem menjen 0 alá, mert az kifagyasztja a canvas-t
        ctx.strokeStyle = `rgba(255, 165, 0, ${Math.max(0, explosion.alpha)})`;
        ctx.lineWidth = 5;
        ctx.shadowBlur = 15;
        ctx.shadowColor = "#FF4500";
        ctx.stroke();
        ctx.restore();
    }
}