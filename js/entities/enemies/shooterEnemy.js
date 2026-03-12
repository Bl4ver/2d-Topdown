import { Enemy } from "../enemy.js";

export class ShooterEnemy extends Enemy {
    constructor(scene) {
        super(scene); 

        this.shootTimer = 0;
        this.fireRate = 1000;
        this.projectileSpeed = 100;
        
        this.bulletType = 'normal';
        this.spread = 0;

        this.damage = 5;
    }

    update(dt) {
        super.update(dt);

        if (!this.active || this.exploding) return;

        this.angle += this.rotationSpeed * dt;

        const dx = this.scene.player.x - this.x;
        const dy = this.scene.player.y - this.y;
        const magnitude = Math.sqrt(dx * dx + dy * dy);

        if (magnitude > 1) {
            const speedX = (dx / magnitude) * this.speed;
            const speedY = (dy / magnitude) * this.speed;
            this.x += speedX * dt;
            this.y += speedY * dt;
        }

        if (this.shootTimer > 0) this.shootTimer -= dt;
        else this.shoot();
    }

    shoot() {
        this.shootTimer = this.fireRate;
        const bullet = this.scene.bulletPool.get();
        if (bullet) {
            bullet.spawn(
                this.x, this.y,
                0, 0,
                this.damage, this.projectileSpeed, this.bulletType, Math.max(0, this.spread)
            );

            if (this.engine.audio && this.engine.audio.sfx) {
                this.engine.audio.sfx.shoot();
            }
        }
    }
}