import { GameScene } from './gameScene.js';

export class ChallengeScene extends GameScene {
    constructor(engine) {
        super(engine);
        this.activeChallenge = null;
    }

    // A SceneManager átadja a state-et és a datas-t
    init(state, datas, challengeId = "challenge_1") {
        this.state = state;
        this.datas = datas;

        // Lekérjük a kihívás adatait a datas-ből
        this.activeChallenge = this.datas.challenges[challengeId];

        // 1. Klónozzuk az állapotot, hogy ne módosítsuk az alap felszerelést
        this.realState = this.state;
        
        // A dataManager state-jét klónozzuk ideiglenesen
        this.engine.dataManager.state = JSON.parse(JSON.stringify(this.realState));
        this.state = this.engine.dataManager.state;

        // 2. Kihívás-specifikus szabályok alkalmazása
        if (this.activeChallenge && this.activeChallenge.modifiers && this.activeChallenge.modifiers.maxHp) {
            this.state.player.maxHp = this.activeChallenge.modifiers.maxHp;
        }

        // 3. Alap GameScene init futtatása a klónozott állapottal
        super.init(this.state, this.datas);
        
        this.challengeGoalProgress = 0; 
    }

    update(input, dt) {
        super.update(input, dt); 

        if (!this.player.active) {
            this.handleDefeat(); 
            return;
        }

        // --- GYŐZELMI FELTÉTELEK VIZSGÁLATA ---
        if (this.activeChallenge) {
            switch (this.activeChallenge.goalType) {
                case "surviveTime":
                    if (this.runTime >= this.activeChallenge.targetValue) {
                        this.handleVictory();
                    }
                    break;
                case "killCount":
                    if (this.challengeGoalProgress >= this.activeChallenge.targetValue) {
                        this.handleVictory();
                    }
                    break;
            }
        }
    }

    getEnemyName() {
        if (this.activeChallenge && this.activeChallenge.forceEnemyType) {
            return this.activeChallenge.forceEnemyType;
        }
        return super.getEnemyName(); 
    }

    handleVictory() {
        console.log("Kihívás teljesítve!");
        this.player.active = false; 
        
        // Jutalmak kiosztása az EREDETI state-be
        this.realState.coins += this.activeChallenge.rewardCoins;
        
        if (!this.realState.completedChallenges) this.realState.completedChallenges = [];
        if (!this.realState.completedChallenges.includes(this.activeChallenge.id)) {
            this.realState.completedChallenges.push(this.activeChallenge.id);
        }

        // Visszaállítjuk az eredeti állapotot és mentünk
        this.engine.dataManager.state = this.realState; 
        this.engine.dataManager.save();
        this.engine.sceneManager.changeScene("menu"); 
    }

    handleDefeat() {
        console.log("Kihívás elbukva!");
        // Visszaállítjuk, jutalom nincs, nincs mentés
        this.engine.dataManager.state = this.realState; 
        this.engine.sceneManager.changeScene("menu");
    }

    finalizeStats() {
        // Nem csinálunk semmit
    }
}