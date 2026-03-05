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

        this.loadEnemies();
    }

    loadEnemies() {
        let enemiesInfoContainer = document.getElementById("enemiesInfo-container");

        // Először ürítsük ki a konténert, ha szükséges
        enemiesInfoContainer.innerHTML = "";

        Object.keys(this.enemies).forEach(e => {
            const enemy = this.enemies[e];

            const wrapper = document.createElement("div");
            wrapper.id = "encyclopedia-wrapper"

            // 2. Belehelyezzük a címet és a canvast
            // Érdemes fix méretet adni a canvasnak a HTML-ben
            wrapper.innerHTML = `
            <h1>${e}</h1>
            <canvas width="50" height="50" style="border:1px solid #ccc;" id="${e}-canvas"></canvas>
        `;

            // 3. Hozzáadjuk a fő konténerhez
            enemiesInfoContainer.appendChild(wrapper);

            // 4. Megkeressük az éppen létrehozott canvast és rajzolunk rá
            const canvas = document.getElementById(`${e}-canvas`);
            const ctx = canvas.getContext("2d");

            // Négyzet kirajzolása az ellenség színével
            ctx.fillStyle = enemy.color;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            console.log(enemy);
        });
    }
}