export class ObjectPool {
    constructor(ClassType, initialSize = 100, engine) {
        this.engine = engine
        this.ClassType = ClassType; // Bullet, Bot, Enemy
        this.pool = [];

        for (let i = 0; i < initialSize; i++) {
            this.pool.push(new this.ClassType(this.engine));
        }
    }

    get() {
        let obj = this.pool.find(item => !item.active);

        if (!obj) {
            console.log("Pool bővítése...");
            obj = new this.ClassType(this.engine);
            this.pool.push(obj);
        }

        obj.active = true;
        return obj;
    }

    updateAll(dt) {
        this.pool.forEach(object => {
            if (object.active) {
                object.update(dt);
            }
        });
    }

    releaseAll() {
        // Pl. szintváltáskor az összeset inaktívra tesszük
        this.pool.forEach(obj => obj.active = false);
    }
}