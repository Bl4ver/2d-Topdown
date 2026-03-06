export class EncyclopediaScene {
    constructor(engine) {
        this.engine = engine;
        this.enemies = engine.datas.enemies;
    }

    init() {
        this.engine.uiManager.showScreen('encyclopedia-screen');
        this.engine.uiManager.bindButtonEvents({
            onBack: () => this.engine.changeScene('menu')
        });

        this.setupTabs();
        this.updateUI();
    }

    setupTabs() {
        const tabs = document.querySelectorAll('.tab-btn');
        tabs.forEach(btn => {
            btn.onclick = () => {
                tabs.forEach(t => t.classList.remove('active'));
                btn.classList.add('active');

                const target = btn.getAttribute('data-target');
                document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
                document.getElementById(target).classList.add('active');
            };
        });
    }

    updateUI() {
        this.renderEnemiesEncyc();
    }

    renderEnemiesEncyc() {
        let enemiesInfoContainer = document.getElementById("enemies-container");
        enemiesInfoContainer.innerHTML = "";

        // Állítsuk le az előző animációt, ha volt
        if (this.encycAnimId) {
            cancelAnimationFrame(this.encycAnimId);
        }

        const canvasesToAnimate = [];

        Object.keys(this.enemies).forEach(enemyKey => {
            const enemy = this.enemies[enemyKey];

            const card = document.createElement("div");
            card.className = "card";

            card.innerHTML = `
            <h3>${enemyKey}</h3>
            <p>HP: ${enemy.hp}</p>
            <p>Damage: ${enemy.damage}</p>
            <p>Speed: ${enemy.speed}</p>
            <p>Score: ${enemy.scoreValue}</p>
            <p>Coin: ${enemy.earnedCoin}</p>
            <p>Type: ${enemy.type}</p>
            <p><canvas width="${enemy.radius + 60}" height="${enemy.radius + 60}"></canvas></p>
        `;

            enemiesInfoContainer.appendChild(card);

            const canvas = card.querySelector("canvas");
            const ctx = canvas.getContext("2d");

            canvasesToAnimate.push({ canvas, ctx, enemy });
        });

        let angle = 0;

        const animate = () => {
            angle += 0.005; // A forgás sebessége

            canvasesToAnimate.forEach(item => {
                const { canvas, ctx, enemy } = item;

                // Előző képkocka törlése
                ctx.clearRect(0, 0, canvas.width, canvas.height);

                ctx.save();

                // Origó középre tolása és forgatás
                ctx.translate(canvas.width / 2, canvas.height / 2);
                ctx.rotate(angle);

                // Stílusok
                ctx.strokeStyle = enemy.color;
                ctx.lineWidth = 3;
                ctx.shadowBlur = 15;
                ctx.shadowColor = enemy.color;

                // Rajzolás az eredeti méretekkel
                ctx.strokeRect(-enemy.width / 2, -enemy.height / 2, enemy.width, enemy.height);

                ctx.restore();
            });

            this.encycAnimId = requestAnimationFrame(animate);
        };

        animate();
    }

}
