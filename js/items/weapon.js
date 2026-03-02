export class Weapon {
    constructor(data) {
        // Adatok betöltése: JSON 
        this.name = data.name;
        this.damage = data.damage;
        this.fireRate = data.fireRate; // ms-ban (pl. 1000 = 1 mp)
        this.price = data.price;
        this.enabled = data.enabled || false;

        this.lastShotTime = 0;
    }

    canShoot() {
        if (!this.enabled) return false;

        const currentTime = Date.now();
        const timeSinceLastShot = currentTime - this.lastShotTime;

        if (timeSinceLastShot >= this.fireRate) {
            this.lastShotTime = currentTime;
            return true;
        }

        return false;
    }

    enable() {
        this.enabled = true;
    }

    disable() {
        this.enabled = false;
    }

    // Segédmetódus
    getCooldownProgress() {
        const now = Date.now();
        const elapsed = now - this.lastShotTime;
        return Math.min(elapsed / this.fireRate, 1); // 0 és 1 közötti érték
    }
}