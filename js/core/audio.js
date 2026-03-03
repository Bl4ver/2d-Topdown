// audio.js
export class Audio {
    constructor(engine) {
        this.engine = engine;
        this.audioCtx;

        // TÖRÖLVE: this.volumes és a console.log, mert induláskor még nincs state!

        this.sfx = {
            shoot: () => this.playSoundEffect(450, 'square', 0.08, 0.03),
            hit: () => this.playSoundEffect(150, 'sawtooth', 0.1, 0.06, false),
            explosion: () => this.playSoundEffect(80, 'sawtooth', 0.4, 0.12),
            die: () => {
                this.playSoundEffect(150, 'square', 0.15, 0.15); 
                setTimeout(() => this.playSoundEffect(60, 'sawtooth', 0.5, 0.2), 40);
            },
            dieEnemy: () => { 
                this.playSoundEffect(120, 'square', 0.1, 0.5);
                setTimeout(() => this.playSoundEffect(80, 'sawtooth', 0.1, 0.6), 50);
                setTimeout(() => this.playSoundEffect(50, 'sawtooth', 0.1, 0.4), 120);
                setTimeout(() => this.playSoundEffect(30, 'square', 0.2, 0.2), 250);
            },
            pickup: () => { 
                this.playSoundEffect(800, 'sine', 0.15, 0.08); 
                // JAVÍTVA: playS helyett this.playSoundEffect
                setTimeout(() => this.playSoundEffect(1200, 'sine', 0.15, 0.08), 40); 
            },
            upgrade: () => this.playSoundEffect(600, 'sine', 0.5, 0.1)
        };
    }

    init() {
        if (!this.audioCtx) this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }

    playSoundEffect(frequency, waveType, duration, baseVolume = 0.1, pitchDrop = true) {
        // 1. Dinamikusan lekérjük a beállításokat a state-ből (Biztonságos lekérdezés ?.-al)
        const settings = this.engine.state?.settings;

        // Ha nincs audió kontextus, VAGY még nem töltött be a state, VAGY le van némítva, kilépünk
        if (!this.audioCtx || !settings || settings.volume <= 0) return;

        // A játékos által beállított globális hangerő (0.0 és 1.0 között)
        const globalVolume = settings.volume / 100;

        // A hanggenerátor (oscillator) és a hangerőszabályzó (gainNode) létrehozása
        const oscillator = this.audioCtx.createOscillator();
        const gainNode = this.audioCtx.createGain();

        // Hangszín és kezdő frekvencia (hangmagasság) beállítása
        oscillator.type = waveType;
        oscillator.frequency.setValueAtTime(frequency, this.audioCtx.currentTime);

        // Ha a pitchDrop igaz, a hangmagasság gyorsan a negyedére esik
        if (pitchDrop) {
            oscillator.frequency.exponentialRampToValueAtTime(frequency / 4, this.audioCtx.currentTime + duration);
        }

        // Kezdő hangerő beállítása (A Math.max megvéd attól, hogy pontosan 0 legyen, mert az exponentialRamp nem szereti a 0-t)
        const startVolume = Math.max(baseVolume * globalVolume, 0.0001);
        gainNode.gain.setValueAtTime(startVolume, this.audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, this.audioCtx.currentTime + duration);

        // Az elemek összekötése: Generátor -> Hangerőszabályzó -> Hangszóró
        oscillator.connect(gainNode);
        gainNode.connect(this.audioCtx.destination);

        // Lejátszás indítása és megállítása a megadott idő (duration) múlva
        oscillator.start();
        oscillator.stop(this.audioCtx.currentTime + duration);
    }
}