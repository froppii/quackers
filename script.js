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
        pos3 = e.clientX;
        pos4 = e.clientY;
        var initialTop = elmnt.offsetTop;
        var initialLeft = elmnt.offsetLeft;
        document.onmouseup = closeDragElement;
        document.onmousemove = function(e) {
            elementDrag(e, initialTop, initialLeft);
        };
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