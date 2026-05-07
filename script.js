const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioCtx = new AudioContext();

const analyser = audioCtx.createAnalyser();
analyser.fftSize = 256;
analyser.connect(audioCtx.destination);
const vizBuf = new Uint8Array(analyser.frequencyBinCount);

const vizCanvas = document.getElementById('viz');
const vizCtx = vizCanvas.getContext('2d');

function drawViz() {
    requestAnimationFrame(drawViz);
    const W = vizCanvas.offsetWidth, H = vizCanvas.offsetHeight;
    if (vizCanvas.width !== W) vizCanvas.width = W;
    vizCanvas.height = H;
    analyser.getByteTimeDomainData(vizBuf);
    vizCtx.clearRect(0,0,W,H);
    vizCtx.beginPath();
    vizCtx.strokeStyle = '#1a1a1a';
    vizCtx.lineWidth = 1.5;
    const sl = vizBuf.length;
    for (let i=0; i<sl; i++) {
        const x = (i/sl)*W;
        const y = (vizBuf[i]/128)*H/2;
        i === 0 ? vizCtx.moveTo(x,y) : vizCtx.lineTo(x,y);
    }
    vizCtx.stroke();
}
drawViz();

const SCALES = {
    major: [0,2,4,5,7,9,11],
    minor: [0,2,3,5,7,8,10],
    pentatonic: [0,2,4,7,9],
    dorian: [0,2,3,5,7,9,10],
    chromatic: [0,1,2,3,4,5,6,7,8,9,10,11]
};

const MELODY_RAINBOW = ['#ff4d4d', '#ffb84d', '#ffff4d', '#4dff4d', '#4d4dff', '#bf4dff'];
const BASS_RAINBOW = ['#ff4d4d', '#ffff4d', '#4dff4d', '#4d4dff'];

function getColor(layer, row) {
    if (layer === 'melody') {
        return MELODY_RAINBOW[row] || '#ffffff';
    } else if (layer === 'bass') {
        return BASS_RAINBOW[row] || '#ffffff';
    }
    return '#ffffff';
}

function midiToFreq(m) {
    return 440 * Math.pow(2,(m-69)/12);
}

function buildFreqs(baseMidi, octave, rows, scaleName) {
    const sc = SCALES[scaleName];
    const freqs = [];
    for (let i = 0; i < rows; i++) {
        const deg = i % sc.length;
        const oct = Math.floor(i / sc.length);
        freqs.push(midiToFreq(baseMidi + sc[deg] + oct*12 + octave*12));
    }
    return freqs.reverse();
}

let melodyNotes = [];
let bassNotes = [];

function refreshNotes() {
    const s = document.getElementById('scale-sel').value;
    const k = parseInt(document.getElementById('key-sel').value);
    melodyNotes = buildFreqs(k, 1, 6, s);
    bassNotes = buildFreqs(k, 0, 4, s);
}
refreshNotes();

const MELODY_ROWS = 6;
const BASS_ROWS = 4;
const DRUM_ROWS = 2;
const COLS = 8;

let melodyCells = [];
let bassCells = [];
let drumCells = [];

let isPlaying = false;
let currentStep = 0;
let loopTimer = null;

function getBpm() {
    return parseInt(document.getElementById('bpm').value);
}

function stepDelay() {
    return (60 / getBpm()) * 1000 / 2;
}

function makeEnv(gain, atk, sus, rel) {
    const t = audioCtx.currentTime;
    gain.setValueAtTime(0, t);
    gain.linearRampToValueAtTime(sus, t + atk);
    gain.exponentialRampToValueAtTime(0.001, t + atk + rel);
}

function playMelody(freq) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    makeEnv(gain.gain, 0.005, 0.28, 0.5);
    osc.connect(gain);
    gain.connect(analyser);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.8);
}

function playBass(freq) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.value = freq;
    makeEnv(gain.gain, 0.005, 0.35, 0.35);
    osc.connect(gain);
    gain.connect(analyser);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.6);
}

function playHihat() {
    const bufSize = audioCtx.sampleRate * 0.05;
    const buf = audioCtx.createBuffer(1, bufSize, audioCtx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i=0;i<bufSize;i++) data[i] = Math.random()*2-1;
    const src = audioCtx.createBufferSource();
    src.buffer = buf;
    const gain = audioCtx.createGain();
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 8000;
    gain.gain.setValueAtTime(0.18, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(analyser);
    src.start();
    src.stop(audioCtx.currentTime + 0.06);
}

function playKick() {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(160, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, audioCtx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.7, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.18);
    osc.connect(gain);
    gain.connect(analyser);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.2);
}

function playPiano(freq) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.value = freq;
    makeEnv(gain.gain, 0.005, 0.3, 0.6);
    osc.connect(gain);
    gain.connect(analyser);
    osc.start();
    osc.stop(audioCtx.currentTime + 1.0);
}

function buildGrid(gridEl, staffEl, rows, cols, layer, isMonophonic) {
  gridEl.innerHTML = '';
  gridEl.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
  gridEl.style.gridTemplateRows    = `repeat(${rows}, 1fr)`;
 
  staffEl.querySelectorAll('.barline').forEach(b=>b.remove());
 
  const cellArr = Array.from({length: rows}, () => []);
 
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = document.createElement('div');
      cell.className = 'cell ' + layer;
      cell.dataset.row = r;
      cell.dataset.col = c;
      cell.style.gridRow    = r+1;
      cell.style.gridColumn = c+1;
 
      const nh = document.createElement('div');
      nh.className = 'note-head';
      const ns = document.createElement('div');
      ns.className = 'note-stem';
      cell.appendChild(nh);
      cell.appendChild(ns);
 
      cell.addEventListener('mousedown', () => {
        audioCtx.resume();
        onCellClick(cell, layer, r, c, rows, isMonophonic, cellArr);
      });
 
      gridEl.appendChild(cell);
      cellArr[r][c] = cell;
    }
  }
 
  return cellArr;
}

function onCellClick(cell, layer, r, c, rows, isMonophonic, cellArr) {
    const noteHead = cell.querySelector('.note-head');
    if (cell.classList.contains('active')) {
        cell.classList.remove('active');
        cell.style.backgroundColor = '';
        if (layer === 'drums') {
            noteHead.style.opacity = '';
        }
    } else {
        if (isMonophonic) {
            for (let rr = 0; rr < rows; rr++) {
                cellArr[rr][c].classList.remove('active');
                cellArr[rr][c].style.backgroundColor = '';
                if (layer === 'drums') {
                    const otherHead = cellArr[rr][c].querySelector('.note-head');
                    otherHead.style.opacity = '';
                }
            }
        }
        cell.classList.add('active');

        if (layer === 'drums') {
            cell.style.backgroundColor = 'transparent';
            noteHead.style.opacity = '1';
            noteHead.style.backgroundColor = '#1a1a1a';
            noteHead.style.borderRadius = r === 0 ? '50%' : '2px';
            noteHead.style.top = '50%';
            noteHead.style.transform = 'translate(-50%, -50%)';
            noteHead.style.width = '14px';
            noteHead.style.height = '14px';
        } else {
            cell.style.backgroundColor = getColor(layer, r);
            noteHead.style.opacity = '';
        }

        if (layer === 'melody') playMelody(melodyNotes[r]);
        else if (layer === 'bass') playBass(bassNotes[r]);
        else if (layer === 'drums') {
            if (r === 0) playHihat();
            else playKick();
        }
    }
}

function rebuildAll() {
    melodyCells = buildGrid(
        document.getElementById('melody-grid'),
        document.getElementById('melody-staff'),
        MELODY_ROWS, COLS, 'melody', false
    );
    bassCells = buildGrid(
        document.getElementById('bass-grid'),
        document.getElementById('bass-staff'),
        BASS_ROWS, COLS, 'bass', false
    );
    drumCells = buildGrid(
        document.getElementById('drums-grid'),
        document.getElementById('drums-staff'),
        DRUM_ROWS, COLS, 'drums', false
    );


    buildStepDots();
    currentStep = 0;
}

function buildStepDots() {
    const el = document.getElementById('step-dots');
    el.innerHTML = '';
    for (let i = 0; i < COLS; i++) {
        const d = document.createElement('div');
        d.className = 'step-dot';
        d.id = `dot-${i}`;
        el.appendChild(d);
    }
}

function updateStepDots(step) {
    document.querySelectorAll('.step-dot').forEach((d,i) => {
        d.classList.toggle('active', i === step);
    });
}

function loop() {
    if (!isPlaying) return;

    document.querySelectorAll('.cell.col-playing').forEach(c => c.classList.remove('col-playing'));

    for (let r = 0; r < MELODY_ROWS; r++) {
        const cell = melodyCells[r][currentStep];
        cell.classList.add('col-playing');
        if (cell.classList.contains('active')) playMelody(melodyNotes[r]);
    }

    for (let r = 0; r < BASS_ROWS; r++) {
        const cell = bassCells[r][currentStep];
        if (!cell) continue;
        cell.classList.add('col-playing');
        if (cell.classList.contains('active')) playBass(bassNotes[r]);
    }

    for (let r = 0; r < DRUM_ROWS; r++) {
        const cell = drumCells[r][currentStep];
        if (!cell) continue;
        cell.classList.add('col-playing');
        if (cell.classList.contains('active')) {
            if (r === 0) playHihat();
            else playKick();
        }
    }

    updateStepDots(currentStep);
    const delay = stepDelay(currentStep);
    currentStep = (currentStep + 1) % COLS;
    loopTimer = setTimeout(loop, delay);
}

function startStop() {
    isPlaying = !isPlaying;
    const btn = document.getElementById('play-btn');
    if (isPlaying) {
        audioCtx.resume();
        btn.innerHTML = '&#9646;&#9646;';
        btn.classList.add('playing');
        currentStep = 0;
        loop();
    } else {
        clearTimeout(loopTimer);
        btn.innerHTML = '&#9654;';
        btn.classList.remove('playing');
        document.querySelectorAll('.cell.col-playing').forEach(c=>c.classList.remove('col-playing'));
        document.querySelectorAll('.step-dot').forEach(d=>d.classList.remove('active'));
    }
}

function buildPiano() {
    const pianoEl = document.getElementById('piano');
    pianoEl.innerHTML = '';
    const keyData = [
        {w:261.63,b:277.18},{w:293.66,b:311.13},{w:329.63,b:null},
        {w:349.23,b:369.99},{w:392.00,b:415.30},{w:440.00,b:466.16},
        {w:493.88,b:null}, {w:523.25,b:554.37},{w:587.33,b:622.25},
        {w:659.25,b:null}
    ];
    
    keyData.forEach(({w,b}) => {
        const grp = document.createElement('div');
        grp.className = 'key-group';
        const wk = document.createElement('div');
        wk.className = 'key white';
        wk.dataset.note = w;
        grp.appendChild(wk);
        if (b) {
            const bk = document.createElement('div');
            bk.className = 'key black';
            bk.dataset.note = b;
            grp.appendChild(bk);
        }
        pianoEl.appendChild(grp);
    });

    pianoEl.querySelectorAll('.key').forEach(key => {
        key.addEventListener('mousedown', e => {
            e.preventDefault();
            audioCtx.resume();
            playPiano(parseFloat(key.dataset.note));
            key.classList.add('active');
        });
        key.addEventListener('mouseup', () => key.classList.remove('active'));
        key.addEventListener('mouseleave', () => key.classList.remove('active'));
    });
}

const pianoPopup = document.getElementById('piano-popup');
const pianoToggleBtn = document.getElementById('piano-toggle-btn');
const pianoCloseBtn = document.getElementById('piano-close');

function openPiano() {
    pianoPopup.classList.add('open');
    pianoToggleBtn.classList.add('active');
}
function closePiano() {
    pianoPopup.classList.remove('open');
    pianoToggleBtn.classList.remove('active');
}
 
pianoToggleBtn.addEventListener('click', () => {
    pianoPopup.classList.contains('open') ? closePiano() : openPiano();
});
pianoCloseBtn.addEventListener('click', closePiano);

document.getElementById('play-btn').addEventListener('click', startStop);

document.getElementById('bpm').addEventListener('input', function() {
    document.getElementById('bpm-val').textContent = this.value;
});

document.getElementById('scale-sel').addEventListener('change', refreshNotes);
document.getElementById('key-sel').addEventListener('change', refreshNotes);

document.getElementById('clear-btn').addEventListener('click', () => {
    document.querySelectorAll('.cell.active').forEach(c => {
        c.classList.remove('active');
        c.style.backgroundColor = '';
        const head = c.querySelector('.note-head');
        if (head) head.style.opacity = '';
    });
});

const KEY_NOTE_MAP = {
    'KeyA': 261.63,
    'KeyW': 277.18,
    'KeyS': 293.66,
    'KeyE': 311.13,
    'KeyD': 329.63,
    'KeyF': 349.23,
    'KeyT': 369.99,
    'KeyG': 392.00,
    'KeyY': 415.30,
    'KeyH': 440.00,
    'KeyU': 466.16,
    'KeyJ': 493.88,
    'KeyK': 523.25,
};

const heldKeys = new Set();

document.addEventListener('keydown', e => {
    if (e.code === 'Space') {
        e.preventDefault();
        startStop();
        return;
    }

    if (KEY_NOTE_MAP[e.code] && !heldKeys.has(e.code)) {
        heldKeys.add(e.code);
        audioCtx.resume();
        const freq = KEY_NOTE_MAP[e.code];
        playPiano(freq);
    
        document.querySelectorAll('.key').forEach(k => {
            if (Math.abs(parseFloat(k.dataset.note) - freq) < 0.1) k.classList.add('active');
        });
    }
});

document.addEventListener('keyup', (e) => {
    if (KEY_NOTE_MAP[e.code]) {
        heldKeys.delete(e.code);
        const freq = KEY_NOTE_MAP[e.code];
        document.querySelectorAll('.key').forEach(k => {
            if (Math.abs(parseFloat(k.dataset.note) - freq) < 0.1) k.classList.remove('active');
        });
    }
});

document.getElementById('share-btn').addEventListener('click', () => {
    const melodyBits = melodyCells.flat().map(cell => cell.classList.contains('active') ? '1' : '0').join('');
    const bassBits = bassCells.flat().map(cell => cell.classList.contains('active') ? '1' : '0').join('');
    const drumsBits = drumCells.flat().map(cell => cell.classList.contains('active') ? '1' : '0').join('');
    
    function bitsToB64(bits) {
        const padded = bits.padEnd(Math.ceil(bits.length / 8) * 8, '0');
        const bytes = new Uint8Array(padded.length / 8);
        for (let i = 0; i < bytes.length; i++) {
            bytes[i] = parseInt(padded.slice(i*8, (i+1)*8), 2);
        }
        return btoa(String.fromCharCode(...bytes));
    }
    
    const encoded = [
        document.getElementById('scale-sel').value,
        document.getElementById('key-sel').value,
        document.getElementById('bpm').value,
        bitsToB64(melodyBits),
        bitsToB64(bassBits),
        bitsToB64(drumsBits)
    ].join(',');
    
    const url = window.location.origin + window.location.pathname + '#' + encoded;
    navigator.clipboard.writeText(url).then(() => {
        alert('Share URL copied to clipboard!');
    });
});


rebuildAll();
buildPiano();

function loadFromHash() {
    const hash = window.location.hash.slice(1);
    if (!hash) return;
    try {
        const parts = hash.split(',');
        if (parts.length !== 6) return;
        const [scale, key, bpm, melodyB64, bassB64, drumsB64] = parts;
        
        function b64ToBits(b64, length) {
            const binary = atob(b64);
            let bits = '';
            for (let i = 0; i < binary.length; i++) {
                const byte = binary.charCodeAt(i).toString(2).padStart(8, '0');
                bits += byte;
            }
            return bits.slice(0, length).split('').map(b => b === '1');
        }
        
        document.getElementById('scale-sel').value = scale;
        document.getElementById('key-sel').value = key;
        document.getElementById('bpm').value = bpm;
        document.getElementById('bpm-val').textContent = bpm;
        refreshNotes();
        rebuildAll();
        
        const melodyActives = b64ToBits(melodyB64, MELODY_ROWS * COLS);
        melodyActives.forEach((active, i) => {
            const r = Math.floor(i / COLS);
            const c = i % COLS;
            if (active) {
                melodyCells[r][c].classList.add('active');
                melodyCells[r][c].style.backgroundColor = getColor('melody', r);
            }
        });
        
        const bassActives = b64ToBits(bassB64, BASS_ROWS * COLS);
        bassActives.forEach((active, i) => {
            const r = Math.floor(i / COLS);
            const c = i % COLS;
            if (active) {
                bassCells[r][c].classList.add('active');
                bassCells[r][c].style.backgroundColor = getColor('bass', r);
            }
        });
        
        const drumsActives = b64ToBits(drumsB64, DRUM_ROWS * COLS);
        drumsActives.forEach((active, i) => {
            const r = Math.floor(i / COLS);
            const c = i % COLS;
            if (active) {
                const drumCell = drumCells[r][c];
                drumCell.classList.add('active');
                drumCell.style.backgroundColor = 'transparent';
                const head = drumCell.querySelector('.note-head');
                head.style.opacity = '1';
                head.style.borderRadius = r === 0 ? '50%' : '2px';
            }
        });
    } catch (e) {
        console.error('Invalid hash', e);
    }
}

loadFromHash();