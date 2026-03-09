dragElement(document.getElementById("moveable"));

const elmnt = document.getElementById("moveable");

document.addEventListener("mousedown", (e) => {
    if (!elmnt.contains(e.target)) {
        elmnt.classList.remove("active");
    }
});

function dragElement(elmnt) {
    var currentX = elmnt.offsetLeft;
    var currentY = elmnt.offsetTop;
    var currentScaleX = 1;
    var currentScaleY = 1;
    elmnt.style.left = '0px';
    elmnt.style.top = '0px';
    elmnt.style.transform = `translate(${currentX}px, ${currentY}px) scale(${currentScaleX}, ${currentScaleY})`;
    var pos3 = 0, pos4 = 0;
    elmnt.onmousedown = dragMouseDown;

    function dragMouseDown(e) {
        elmnt.classList.add("active");
        e.preventDefault();
        const rect = elmnt.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const threshold = 10;
        let dir = '';
        if (x < threshold) dir += 'w';
        if (x > rect.width - threshold) dir += 'e';
        if (y < threshold) dir += 'n';
        if (y > rect.height - threshold) dir += 's';
        if (dir) {
            const startX = e.clientX, startY = e.clientY;
            const startW = elmnt.offsetWidth, startH = elmnt.offsetHeight;
            const startLeft = currentX, startTop = currentY;
            const onMove = (e) => {
                const dx = e.clientX - startX;
                const dy = e.clientY - startY;
                if (dir.includes("e")) currentScaleX = Math.max(0.4, (startW + dx) / startW);
                if (dir.includes("s")) currentScaleY = Math.max(0.4, (startH + dy) / startH);
                if (dir.includes("w")) {
                    currentScaleX = Math.max(0.4, (startW - dx) / startW);
                    currentX = startLeft + dx;
                }
                if (dir.includes("n")) {
                    currentScaleY = Math.max(0.4, (startH - dy) / startH);
                    currentY = startTop + dy;
                }
                elmnt.style.transform = `translate(${currentX}px, ${currentY}px) scale(${currentScaleX}, ${currentScaleY})`;
            };
            const onUp = () => {
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
                elmnt.style.transform = `translate(${currentX}px, ${currentY}px) scale(${currentScaleX}, ${currentScaleY})`;
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