const rows = 5;
const cols = 8;
const grid = document.getElementById('grid');

let cells = [];
let currentStep = 0;
let isPlaying = false;

const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioCtx = new AudioContext();

const notes = [261.63, 293.66, 329.63, 392.00, 440.00];
const keys = document.querySelectorAll('.key');

for (let r = 0; r < rows; r++) {
    cells[r] = [];
    for (let c = 0; c < cols; c++) {
        const cell = document.createElement('div');
        cell.classList.add('cell');

        cell.addEventListener('click', () => {
            cell.classList.toggle('active');
        });

        grid.appendChild(cell);
        cells[r][c] = cell;
    }
}

function playNote(freq) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'triangle';
    osc.frequency.value = freq;

    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.5);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + 0.2);
}

keys.forEach(key => {
    key.addEventListener('mousedown', () => {
        playNote(parseFloat(key.dataset.note));
        key.classList.add('active');
    });

    key.addEventListener('mouseup', () => {
        key.classList.remove('active');
    });

    key.addEventListener('mouseleave', () => {
        key.classList.remove('active');
    })
});

document.addEventListener('keydown', (e) => {
    const key = document.querySelector(`[data-key='${e.key}']`)
    if (key) {
        playNote(parseFloat(key.dataset.note));
        key.classList.add('active');
    }
});

document.addEventListener('keyup', (e) => {
    const key = document.querySelector(`[data-key='${e.key}']`);
    if (key) key.classList.remove('active');
});

function loop() {
    if (!isPlaying) return;

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            cells[r][c].classList.remove('playing');
        }
    }

    for (let r = 0; r < rows; r++) {
        if (cells[r][currentStep].classList.contains('active')) {
            cells[r][currentStep].classList.add('playing');
            playNote(notes[r]);
        }
    }

    currentStep = (currentStep + 1) % cols;
    setTimeout(loop, 300);
}

document.getElementById('play').onclick = () => {
    isPlaying = !isPlaying;
    if (isPlaying) loop();
};

const keyboard = document.getElementById('keyboard');

notes.forEach(freq => {
    const key = document.createElement('div');
    key.classList.add('key');

    key.onclick = () => playNote(freq);

    keyboard.appendChild(key);
});