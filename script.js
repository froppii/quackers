const rows = 6;
const cols = 10;
const grid = document.getElementById('grid');

let cells = [];
let currentStep = 0;
let isPlaying = false;
let loopTimer = null;

const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioCtx = new AudioContext();

const notes = [659.25, 622.25, 587.33, 523.25, 493.88, 440.00];

const staff1 = document.createElement('div');
staff1.classList.add('staff');

const staff2 = document.createElement('div');
staff2.classList.add('staff');

grid.appendChild(staff1);
grid.appendChild(staff2);

for (let r = 0; r < rows; r++) {
    cells[r] = [];
    const localRow = r % 3;

    for (let c = 0; c < cols; c++) {
        const cell = document.createElement('div');
        cell.classList.add('cell');
        cell.dataset.row = r;
        cell.dataset.col = c;
        cell.dataset.localRow = localRow;

        cell.addEventListener('mousedown', () => {
            audioCtx.resume();
            if(cell.classList.contains('active')) {
                cell.classList.remove('active');
            } else {
                cell.classList.add('active');
                playNote(notes[r]);
            }
        });

        if (r < 3) {
            staff1.appendChild(cell);
        } else {
            staff2.appendChild(cell);
        }

        cells[r][c] = cell;
    }
}

function playNote(freq, duration = 0.18) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'square';
    osc.frequency.value = freq;

    gain.gain.setValueAtTime(0.25, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + duration);
}

function loop() {
    if (!isPlaying) return;

    document.querySelectorAll('.cell.playing').forEach(c => c.classList.remove('playing'));

    for (let r = 0; r < rows; r++) {
        const cell = cells[r][currentStep];
        cell.classList.add('playing');

        if (cell.classList.contains('active')) {
            playNote(notes[r]);
        }
    }

    currentStep = (currentStep + 1) % cols;
    loopTimer = setTimeout(loop, 280);
}

keys.forEach(key => {
    key.addEventListener('mousedown', (e) => {
        e.preventDefault();
        audioCtx.resume();
        playNote(parseFloat(key.dataset.note), 0.5);
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
    if (e.code === 'Space') {
        e.preventDefault();
        isPlaying = !isPlaying;

        if (isPlaying) {
            audioCtx.resume();
            currentStep = 0;
            loop();
        } else {
            clearTimeout(loopTimer);
            document.querySelectorAll('.cell.playing').forEach(c => c.classList.remove('playing'));
        }
    }
});