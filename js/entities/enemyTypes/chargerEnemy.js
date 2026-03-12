import { Enemy } from '../enemy.js';

export class ChargerEnemy extends Enemy {
    constructor(scene) {
        super(scene);
        this.dirX = 0;
        this.dirY = 0;
    }

    spawn(name) {
        super.spawn(name); // Ez beállítja a kezdő x, y, speed stb. értékeket

        // 1. Megnézzük, hol van a játékos a spawnolás PONTOS pillanatában
        const player = this.scene.player;
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // 2. Normalizáljuk a vektort, és elmentjük
        if (dist > 0) {
            this.dirX = dx / dist;
            this.dirY = dy / dist;
        } else {
            this.dirX = 1;
            this.dirY = 0;
        }
    }

    update(dt) {
        super.update(dt);
        if (!this.active || this.exploding) return;

        // 1. Mozgás: Mindig a rögzített irányba halad a saját sebességével
        this.x += this.dirX * this.speed * dt;
        this.y += this.dirY * this.speed * dt;

        // 2. Törlés (Memória kímélés): 
        // Mivel nem követi a játékost, kirepülhet a pályáról. 
        // Ha túl messze megy a képernyőtől, egyszerűen inaktiváljuk, hogy visszakerüljön a Pool-ba.
        const margin = 50; // 200 pixel ráhagyás a képernyő szélétől
        if (
            this.x < -margin || 
            this.x > this.canvas.width + margin || 
            this.y < -margin || 
            this.y > this.canvas.height + margin
        ) {
            this.active = false;
        }
    }
}