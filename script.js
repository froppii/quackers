dragElement(document.getElementById("moveable"));

function dragElement(elmnt) {
    var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    if (document.getElementById(elmnt.id + "header")) {
        document.getElementById(elmnt.id + "header").onmousedown = dragMouseDown;
    } else {
        elmnt.onmousedown = dragMouseDown;
    }

    function dragMouseDown(e) {
        e = e || window.event;
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
            // resize
            const startX = e.clientX, startY = e.clientY;
            const startW = elmnt.offsetWidth, startH = elmnt.offsetHeight;
            const startLeft = elmnt.offsetLeft, startTop = elmnt.offsetTop;
            const onMove = (e) => {
                const dx = e.clientX - startX;
                const dy = e.clientY - startY;
                if (dir.includes("e")) elmnt.style.width = Math.max(80, startW + dx) + "px";
                if (dir.includes("s")) elmnt.style.height = Math.max(40, startH + dy) + "px";
                if (dir.includes("w")) {
                    elmnt.style.width = Math.max(80, startW - dx) + "px";
                    elmnt.style.left = (startLeft + dx) + "px";
                }
                if (dir.includes("n")) {
                    elmnt.style.height = Math.max(40, startH - dy) + "px";
                    elmnt.style.top = (startTop + dy) + "px";
                }
            };
            const onUp = () => {
                document.removeEventListener("mousemove", onMove);
                document.removeEventListener("mouseup", onUp);
            };
            document.addEventListener("mousemove", onMove);
            document.addEventListener("mouseup", onUp);
        } else {
            // drag
            pos3 = e.clientX;
            pos4 = e.clientY;
            var initialTop = elmnt.offsetTop;
            var initialLeft = elmnt.offsetLeft;
            document.onmouseup = closeDragElement;
            document.onmousemove = function(e) {
                elementDrag(e, initialTop, initialLeft);
            };
        }
    }

    function elementDrag(e, initialTop, initialLeft) {
        e = e || window.event;
        e.preventDefault();
        elmnt.style.top = (initialTop + (e.clientY - pos4)) + "px";
        elmnt.style.left = (initialLeft + (e.clientX - pos3)) + "px";
    }

    function closeDragElement() {
        document.onmouseup = null;
        document.onmousemove = null;
    }
}

const elmnt = document.getElementById("moveable");

document.addEventListener("mousedown", (e) => {
    if (elmnt.contains(e.target)) {
        elmnt.classList.add("active");
    } else {
        elmnt.classList.remove("active");
    }
});

document.querySelectorAll(".resize-handle").forEach(handle => {
    handle.addEventListener("mousedown", (e) => {
        e.stopPropagation();
        e.preventDefault();

        const dir = handle.dataset.dir;
        const startX = e.clientX, startY = e.clientY;
        const startW = elmnt.offsetWidth, startH = elmnt.offsetHeight;
        const startLeft = elmnt.offsetLeft, startTop = elmnt.offsetTop;

        const onMove = (e) => {
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;

            if (dir.includes("e")) elmnt.style.width = Math.max(80, startW + dx) + "px";
            if (dir.includes("s")) elmnt.style.height = Math.max(40, startH + dy) + "px";
            if (dir.includes("w")) {
                elmnt.style.width = Math.max(80, startW - dx) + "px";
                elmnt.style.left = (startLeft + dx) + "px";
            }

            if (dir.includes("n")) {
                elmnt.style.height = Math.max(40, startH - dy) + "px";
                elmnt.style.top = (startTop + dy) + "px";
            }
        };

        const onUp = () => {
            document.removeEventListener("mousemove", onMove);
            document.removeEventListener("mouseup", onUp);
        };

        document.addEventListener("mousemove", onMove);
        document.addEventListener("mouseup", onUp);
    });
});