import { Enemy } from '../enemy.js';

export class MeleeEnemy extends Enemy {
    update(dt) {
        super.update(dt); // Robbanás/halál ellenőrzése
        if (!this.active || this.exploding) return;

        const player = this.scene.player;
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 0) {
            this.x += (dx / dist) * this.speed * dt;
            this.y += (dy / dist) * this.speed * dt;
        }
    }
}