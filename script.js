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
    elmnt.onmousedown = dragMouseDown;

    function dragMouseDown(e) {
        document.querySelectorAll(".moveable").forEach(el => el.classList.remove("active"));
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