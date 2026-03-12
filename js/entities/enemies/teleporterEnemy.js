import { Enemy } from "../enemy.js";

export class TeleporterEnemy extends Enemy {
    constructor(scene) {
        super(scene)
        this.player = scene.player;
        this.teleportTimer = 1000;
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
        if (this.teleportTimer > 0) this.teleportTimer -= dt * 1000;
        else this.teleport();
    }

    teleport() {
        this.teleportTimer = 2000 + (Math.random() * 2000);

        const minDistance = 10;
        let distanceFromPlayer = 0;

        while (distanceFromPlayer < minDistance) {
            this.x = Math.random() * this.canvas.width;
            this.y = Math.random() * this.canvas.height;

            let dx = this.x - this.scene.player.x;
            let dy = this.y - this.scene.player.y;
            distanceFromPlayer = Math.sqrt(dx * dx + dy * dy);
        }

        console.log("Teleport");
    }
}