import { Enemy } from "../enemy.js";

export class GuardEnemy extends Enemy {
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
    }
}