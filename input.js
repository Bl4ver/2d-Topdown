export class Input {
    constructor() {
        this.keys = {};
    }

    init(){
        document.addEventListener("keydown", this.onKeyDown.bind(this));
        document.addEventListener("keyup", this.onKeyUp.bind(this));
    }

    onKeyDown(e) {
        this.keys[e.key] = true;
        console.log("Down: ", e.key)
    }

    onKeyUp(e) {
        this.keys[e.key] = false;
        console.log("Up: ", e.key)
    }

    isKeyDown(key) {
        return this.keys[key];
    }

}