const CELL = 48;
const CELLS = 32;
const TRACK_H = 80;

let bpm = 120;
let isPlaying = false;
let playStartTime = 0;
let playStartBeat = 0;
let currentBeat = 0;
let animFrame = null;
let trackCount = 0;

const audioCtx = new AudioContext();

const clips = {};
let clipIdCounter =0;

function buildRuler() {
    const ruler = document.getElementById('ruler');
    ruler.innerHTML = '';
    for (let i = 0; i <= CELLS; i++) {
        const tick = document.createElement('div');
        tick.className = 'ruler-tick ' + (i % 4 === 0 ? 'bar' : 'beat');
        tick.style.left = (i * CELL) + 'px';
        ruler.appendChild(tick);
        if (i % 4 === 0) {
            const label = document.createElement('div');
            label.className = 'ruler-mark';
            label.style.left = (i * CELL + 3) + 'px';
            label.textContent = (i / 4 + 1);
            ruler.appendChild(label);
        } 
    }
}


function addTrack() {
    trackCount++;
    const container = document.getElementByIf('tracls-container');
    const track = document.createElement('div');
    track.className = 'track';
    track.dataset.track = trackCount;

    const label = document.createElement('div');
    label.className = 'track-label';

    const num = document.createElement('span');
    num.className = 'track-number';
    num.textContent = trackCount;

    const name = document.createElement('input');
    name.className = 'track-name';
    name.value = `track ${trackCount}`;
    name.type = 'text';
    name.addEventListener('mousedown', e => e.stopPropagation());

    const del = document.createElement('button');
    del.className = 'track-delete';
    del.textContent = 'x';
    del.title = 'delete track';
    del.addEventListener('click', () => track.remove());

    label.appendChild(num);
    label.appendChild(name);
    label.appendChild(del);
    track.appendChild(label);

    const lane = document.createElement('div');
    lane.className = 'track-lane';
    lane.dataset.track = trackCount;
    track.appendChild(lane);

    lane.addEventListener('dragover', e => {
        e.preventDefault();
        lane.classList.add('drag-over');
    });
    lane.addEventListener('dragleave', () => lane.classList.remove('drag-over'));
    lane.addEventListener('drop', e => {
        e.preventDefault();
        lane.classList.remove('drag-over');
    });
    lane.addEventListener('dragleave', () => lane.classList.remove('drag-over'));
    lane.addEventListener('drop', e => {
        e.preventDefault();
        lane.classList.remove('drag-over');
        const rect = lane.getBoundingClientRect();
        const x = e.clientX - rect.left;
        spawnClip(lane, x);
    });

    container.appendChild(track);
    return track;
}

document.querySelectorAll(".moveable").forEach(el => dragElement(el));

document.getElementById("spawn-btn").addEventListener("click", () => {
    const seal = document.createElement("div");
    seal.className = "moveable";
    seal.innerHTML = `
        <img src="ceiling.png">
        <div class="resize-handle n" data-dir="n"></div>
        <div class="resize-handle s" data-dir="s"></div>
        <div class="resize-handle e" data-dir="e"></div>
        <div class="resize-handle w" data-dir="w"></div>
    `;
    document.body.appendChild(seal);
    dragElement(seal);
})

document.addEventListener("mousedown", (e) => {
    document.querySelectorAll(".moveable").forEach(el => {
        if (!el.contains(e.target)) el.classList.remove("active");
    });
});

function dragElement(elmnt) {
    var currentX = 0;
    var currentY = 0;
    elmnt.style.left = '0px';
    elmnt.style.top = '0px';
    elmnt.style.transform = `translate(0px, 0px)`;
    var pos3 = 0, pos4 = 0;

    // audio stuff
    const audioCtx = new AudioContext();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    oscillator.type = "sine";
    gainNode.gain.value = 0;
    oscillator.start();

    function updateAudio() {
        const w = elmnt.offsetWidth;
        const h = elmnt.offsetHeight;
        const baseW = 200, baseH = 150;
        const pitch = 220 * (w / baseW) * (baseH / h);
        oscillator.frequency.setTargetAtTime(pitch, audioCtx.currentTime, 0.05);
    }

    function startAudio() {
        gainNode.gain.setTargetAtTime(0.3, audioCtx.currentTime, 0.05);
        updateAudio();
    }

    function stopAudio() {
        gainNode.gain.setTargetAtTime(0, audioCtx.currentTime, 0.1);
    }

    elmnt.onmousedown = dragMouseDown;

    function dragMouseDown(e) {
        document.querySelectorAll(".moveable").forEach(el => el.classList.remove("active"));
        elmnt.classList.add("active");
        e.preventDefault();

        const handle = e.target.closest(".resize-handle");

        if (handle) {
            startAudio();
            const dir = handle.dataset.dir;
            const startX = e.clientX, startY = e.clientY;
            const startW = elmnt.offsetWidth, startH = elmnt.offsetHeight;
            const startLeft = currentX, startTop = currentY;
            const onMove = (e) => {
                const dx = e.clientX - startX;
                const dy = e.clientY - startY;
                if (dir.includes("e")) elmnt.style.width = Math.max(80, startW + dx) + "px";
                if (dir.includes("s")) elmnt.style.height = Math.max(40, startH + dy) + "px";
                if (dir.includes("w")) {
                    elmnt.style.width = Math.max(80, (startW - dx) / startW);
                    currentX = startLeft + dx;
                    elmnt.style.transform = `translate(${currentX}px, ${currentY}px)`;
                }
                if (dir.includes("n")) {
                    elmnt.style.height = Math.max(40, (startH - dy) / startH);
                    currentY = startTop + dy;
                    elmnt.style.transform = `translate(${currentX}px, ${currentY}px)`
                }
                elmnt.style.transform = `translate(${currentX}px, ${currentY}px) scale(${currentScaleX}, ${currentScaleY})`;
                updateAudio();
            };
            const onUp = () => {
                stopAudio();
                document.removeEventListener("mousemove", onMove);
                document.removeEventListener("mouseup", onUp);
            };
            document.addEventListener("mousemove", onMove);
            document.addEventListener("mouseup", onUp);
        } else {
            pos3 = e.clientX;
            pos4 = e.clientY;
            const onMove = (e) => {
                e.preventDefault();
                const dx = e.clientX - pos3;
                const dy = e.clientY - pos4;
                currentX += dx;
                currentY += dy;
                elmnt.style.transform = `translate(${currentX}px, ${currentY}px)`;
                pos3 = e.clientX;
                pos4 = e.clientY;
            };
            const onUp = () => {
                document.removeEventListener("mousemove", onMove);
                document.removeEventListener("mouseup", onUp);
            };
            document.addEventListener("mousemove", onMove);
            document.addEventListener("mouseup", onUp);
        }
    }
}