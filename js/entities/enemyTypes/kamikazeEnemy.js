import { Enemy } from '../enemy.js';

export class KamikazeEnemy extends Enemy {
    update(dt) {
        super.update(dt);
        if (!this.active || this.exploding) return;

        const player = this.scene.player;
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 0) {
            this.x += (dx / dist) * this.speed * dt;
            this.y += (dy / dist) * this.speed * dt;
        }

        // Robbanás, ha közel ér a játékoshoz (pl. összeér a sugaruk)
        if (dist <= this.radius + player.radius) {
            player.takeDamage(this.damage);
            this.hp = 0;
            this.exploding = true;
            
            if (this.engine.audio?.sfx?.explosion) {
                this.engine.audio.sfx.explosion();
            }
        }
    }
}