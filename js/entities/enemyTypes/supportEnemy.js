import { Enemy } from '../enemy.js';

export class SupportEnemy extends Enemy {
    constructor(scene) {
        super(scene);
        this.healTimer = 0;
    }

    update(dt) {
        super.update(dt);
        if (!this.active || this.exploding) return;

        const player = this.scene.player;
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Menekül, ha a játékos túl közel van (150px), különben a játékos felé tart lassan
        if (dist < 150) {
            this.x -= (dx / dist) * this.speed * dt;
            this.y -= (dy / dist) * this.speed * dt;
        } else if (dist > 400) {
            this.x += (dx / dist) * this.speed * dt;
            this.y += (dy / dist) * this.speed * dt;
        }

        // Gyógyítás logika
        if (this.healTimer > 0) {
            this.healTimer -= dt;
        } else {
            let healed = false;
            
            Object.values(this.scene.enemyPools).forEach(pool => {
                pool.pool.forEach(ally => {
                    // Ha az ally él, nem maga a gyógyító az, és sérült
                    if (ally.active && !ally.exploding && ally !== this && ally.hp < ally.maxHp) {
                        const distToAlly = Math.sqrt((ally.x - this.x)**2 + (ally.y - this.y)**2);
                        
                        // 200 pixel hatósugár
                        if (distToAlly <= 200) { 
                            ally.hp = Math.min(ally.hp + 50, ally.maxHp);
                            healed = true;
                        }
                    }
                });
            });
            
            // Ha gyógyított valakit, 2 másodperc múlva újra próbálja, ha nem, fél másodperc múlva csekkol
            this.healTimer = healed ? 2.0 : 0.5;
        }
    }
}