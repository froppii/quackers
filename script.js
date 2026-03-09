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

        const handle = e.target.closest(".resize-handle");

        if (handle) {
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