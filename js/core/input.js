export class Input {
    constructor() {
        this.keys = {};
    }

    init() {
        document.addEventListener("keydown", e => this.onKeyDown(e)); // this.onKeyDown.Bind(this)
        document.addEventListener("keyup", e => this.onKeyUp(e));
        document.addEventListener("mousedown", e => this.onKeyDown(e));
        document.addEventListener("mouseup", e => this.onKeyUp(e));
    }

    onKeyDown(e) {
        const keyName = (e.type === "mousedown") ? "mouse" : e.key;
        this.keys[keyName] = true;
        // console.log("Down: ", keyName)
    }

    onKeyUp(e) {
        const keyName = (e.type === "mouseup") ? "mouse" : e.key;
        this.keys[keyName] = false;
        // console.log("Up: ", keyName)
    }

    isKeyDown(key) {
        return this.keys[key] || false;
    }

}