export class MenuScene{
    constructor(engine){
        this.engine = engine;
    }

    init(){
        this.engine.uiManager.showScreen("main-menu");
        this.engine.uiManager.bindButtonEvents({
            onStart: () => this.engine.changeScene("game"),
            onSettings: () => this.engine.changeScene("settings"),
            onStatistics: () => this.engine.changeScene("statistics"),
            onBack: () => this.engine.changeScene("back")
        });
    }

    update(){

    }

    draw(){

    }
}