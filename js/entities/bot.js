export class Bot {
    constructor(scene) {
        this.engine = scene.engine;
        this.scene = scene;
        this.canvas = this.engine.canvas;
        this.ctx = this.engine.ctx;

        this.x = 0;
        this.y = 0;
        this.active = false;

        this.hp = 0;
        this.maxHp = 0;
        this.speed = 0;
        this.color = "#ffffff";
        this.name = "";

        this.orbitAngle = 0;
        this.exploding = false;
        this.particles = [];
    }

    init(botName, state, datas) {
        this.name = botName;
        const botData = datas.bots[botName]?.upgrades;
        const botInventory = state.inventory.bots[botName]?.levels;

        if (!botData || !botInventory) return;

        const getStat = (key) => botData[key].baseValue + (botData[key].inc * ((botInventory[key] || 1) - 1));
        
        this.maxHp = getStat("maxHp");
        this.hp = this.maxHp;
        this.speed = getStat("speed");

        this.active = true;
        this.exploding = false;
        this.particles = [];
    }

    update(dt) {
        if (!this.active) return;

        if (this.exploding) {
            let allDead = true;
            this.particles.forEach(p => {
                p.x += p.vx * dt;
                p.y += p.vy * dt;
                p.life -= dt * 2;
                if (p.life > 0) allDead = false;
            });

            if (allDead) {
                this.active = false;
                this.exploding = false;
            }
        }
    }

    orbitPlayer(dt, radius) {
        this.orbitAngle += 2 * dt;
        
        const targetX = this.scene.player.x + Math.cos(this.orbitAngle) * radius;
        const targetY = this.scene.player.y + Math.sin(this.orbitAngle) * radius;

        const dx = targetX - this.x;
        const dy = targetY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 1) {
            const moveSpeed = this.speed * dt;
            const step = Math.min(moveSpeed, distance);

            this.x += (dx / distance) * step;
            this.y += (dy / distance) * step;
        }
    }

    takeDamage(damage) {
        if (this.hp > 0) this.hp -= damage;
        if (this.hp <= 0) {
            this.exploding = true;
            this.die();
        }
    }

    die() {
        if (!this.active || this.exploding) return;
        this.active = false;
    }
}