export class Player {
    constructor(engine) {
        this.engine = engine;
        this.x = engine.canvas.width / 2;
        this.y = engine.canvas.height / 2;
        this.speed = 1;
    }

    init() {
        this.spawn();

    }

    spawn() {
        this.draw(this.x, this.y)
    }

    update() {
        
    }

    draw(x, y) {
        let ctx = this.engine.ctx;

        ctx.beginPath();
        ctx.arc(x, y, 10, 0, 2 * Math.PI);
        ctx.fill();
        ctx.closePath();
    }
}