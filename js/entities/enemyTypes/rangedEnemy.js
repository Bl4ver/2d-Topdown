import { Enemy } from '../enemy.js';

export class RangedEnemy extends Enemy {
    constructor(scene) {
        super(scene);
        this.shootTimer = 0;
    }

    update(dt) {
        super.update(dt);
        if (!this.active || this.exploding) return;

        const player = this.scene.player;
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Csak akkor mozog, ha túl messze van (pl. 300 pixel)
        if (dist > 300) {
            this.x += (dx / dist) * this.speed * dt;
            this.y += (dy / dist) * this.speed * dt;
        }

        // Lövés logika
        if (this.shootTimer > 0) this.shootTimer -= dt;
        
        if (this.shootTimer <= 0 && dist < 500) { // Csak akkor lő, ha a képernyőn van
            const bullet = this.scene.enemyBulletPool.get();
            if (bullet) {
                // Irány a játékos felé, sebesség pl. 250, szórás 0
                bullet.spawn(this.x, this.y, dx, dy, this.damage, 250, "enemyBullet", 0);
            }
            this.shootTimer = 2.0; // 2 másodpercenként lő
        }
    }
}