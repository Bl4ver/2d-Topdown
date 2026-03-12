import { Enemy } from '../enemy.js';

export class BossEnemy extends Enemy {
    constructor(scene) {
        super(scene);
        this.shootTimer = 0;
        this.phase = 1;
        this.rageMultiplier = 1;
    }

    spawn(name) {
        super.spawn(name); // Betölti az alap HP, sebesség stb. adatokat a JSON-ből
        this.phase = 1;
        this.rageMultiplier = 1.0;
        this.shootTimer = 2.0; // 2 másodperc múlva lő először
    }

    update(dt) {
        super.update(dt);
        if (!this.active || this.exploding) return;

        const player = this.scene.player;
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // --- FÁZISVÁLTÁS (RAGE MODE) ---
        // Ha 50% alá esik a HP-ja, és még az 1. fázisban van
        if (this.phase === 1 && this.hp <= this.maxHp * 0.5) {
            this.phase = 2;
            this.rageMultiplier = 1.5;  // 50%-kal gyorsabb lesz!
            this.shootTimer = 0;        // Azonnal támad egyet
            
            // Hang lejátszása fázisváltáskor
            if (this.engine.audio?.sfx?.bossRage) this.engine.audio.sfx.bossRage();
        }

        if (this.phase === 2 && this.hp <= this.maxHp * 0.05) {
            this.phase = 3;
            this.rageMultiplier = 2;  // 50%-kal gyorsabb lesz!
            this.shootTimer = 0;        // Azonnal támad egyet
            
            // Hang lejátszása fázisváltáskor
            if (this.engine.audio?.sfx?.bossRage) this.engine.audio.sfx.bossRage();
        }

        // --- MOZGÁS ---
        // A Boss folyamatosan a játékos felé sétál, de fázis 2-ben gyorsabban
        if (dist > 0) {
            this.x += (dx / dist) * this.speed * this.rageMultiplier * dt;
            this.y += (dy / dist) * this.speed * this.rageMultiplier * dt;
        }

        // --- TÁMADÁS LOGIKA ---
        this.shootTimer -= dt;
        if (this.shootTimer <= 0) {
            
            if (this.phase === 1) {
                // 1. FÁZIS: Sima lövés a játékos felé
                const bullet = this.scene.enemyBulletPool.get();
                if (bullet) {
                    // Nagyobb, gyorsabb golyót lő (300-as sebesség)
                    bullet.spawn(this.x, this.y, dx, dy, this.damage, 300, "enemyBullet", 0);
                }
                this.shootTimer = 2.0; // 2 másodpercenként lő
                
            } else {
                // 2. FÁZIS: "Kör-lövés" (Bullet Hell) 8 irányba!
                for (let i = 0; i < 8; i++) {
                    const angle = (Math.PI / 4) * i; // 45 fokonként
                    const dirX = Math.cos(angle);
                    const dirY = Math.sin(angle);
                    
                    const bullet = this.scene.enemyBulletPool.get();
                    if (bullet) {
                        // Nagyon gyors golyók (400-as sebesség)
                        bullet.spawn(this.x, this.y, dirX, dirY, this.damage, 400, "enemyBullet", 0);
                    }
                }
                this.shootTimer = 1.5; // Dühöngve gyorsabban lő!
            }
        }
    }
}