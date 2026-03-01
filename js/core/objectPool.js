export class ObjectPool {
    constructor(ClassType, initialSize = 100) {
        this.ClassType = ClassType; // Bullet, Bot, Enemy
        this.pool = [];
        
        // Előre legyártjuk az alapmennyiséget
        for (let i = 0; i < initialSize; i++) {
            this.pool.push(new this.ClassType());
        }
    }

    // Kérünk egy szabad objektumot
    get() {
        let obj = this.pool.find(item => !item.active);

        if (!obj) {
            console.log("Pool bővítése...");
            obj = new this.ClassType();
            this.pool.push(obj);
        }

        obj.active = true;
        return obj;
    }

    // Itt nem töröljük le az objektumokat, csak láthatatlanná tesszük őket a ciklusnak
    releaseAll() {
        // Pl. szintváltáskor az összeset inaktívra tesszük
        this.pool.forEach(obj => obj.active = false);
    }
}