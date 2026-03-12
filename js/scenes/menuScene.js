export class MenuScene{
    constructor(engine){
        this.engine = engine;
    }

    init(){
        this.engine.uiManager.showScreen("main-menu");
        this.engine.uiManager.bindButtonEvents({
            onStart: () => this.engine.changeScene("game"),
            onTestground: () => this.engine.changeScene("testground"),
            onSettings: () => this.engine.changeScene("settings"),
            onUpgrades: () => this.engine.changeScene("upgrades"),
            onEncyclopedia: () => this.engine.changeScene("encyclopedia"),
            onStatistics: () => this.engine.changeScene("statistics"),
            onBack: () => this.engine.changeScene("back")
        });
    }

    update(){

    }

    draw(){

    }
}