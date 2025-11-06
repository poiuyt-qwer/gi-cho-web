console.log(document.getElementById('plant1'));
dragElement(document.getElementById('plant1'));
dragElement(document.getElementById('plant2'));
dragElement(document.getElementById('plant3'));
dragElement(document.getElementById('plant4'));
dragElement(document.getElementById('plant5'));
dragElement(document.getElementById('plant6'));
dragElement(document.getElementById('plant7'));
dragElement(document.getElementById('plant8'));
dragElement(document.getElementById('plant9'));
dragElement(document.getElementById('plant10'));
dragElement(document.getElementById('plant11'));
dragElement(document.getElementById('plant12'));
dragElement(document.getElementById('plant13'));
dragElement(document.getElementById('plant14'));

// let maxZIndex = 10;
// function dragElement(terrariumElement) {
//     let pos1 = 0,
//         pos2 = 0,
//         pos3 = 0,
//         pos4 = 0;
//     terrariumElement.onpointerdown = pointerDrag;
//     terrariumElement.ondblclick = bringToFront;

//     function pointerDrag(e) {
//         e.preventDefault();
//         console.log(e);
//         pos3 = e.clientX;
//         pos4 = e.clientY;
//         document.onpointermove = elementDrag;
//         document.onpointerup = stopElementDrag;
//     }
//     function elementDrag(e) {
//         pos1 = pos3 - e.clientX;
//         pos2 = pos4 - e.clientY;
//         pos3 = e.clientX;
//         pos4 = e.clientY;
//         console.log(pos1, pos2, pos3, pos4);
//         terrariumElement.style.top = terrariumElement.offsetTop - pos2 + 'px';
//         terrariumElement.style.left = terrariumElement.offsetLeft - pos1 + 'px';
//         maxZIndex++;
//         terrariumElement.style.zIndex = maxZIndex;
//     }
//     function stopElementDrag() {
//         document.onpointerup = null;
//         document.onpointermove = null;
//     }

//     function bringToFront() {
//         maxZIndex++;
//         terrariumElement.style.zIndex = maxZIndex;
//     }

// }

let maxZIndex = 10;
function dragElement(terrariumElement) {
    terrariumElement.setAttribute('draggable', 'true');

    let grabX = 0;
    let grabY = 0;
    let parentRect;

    terrariumElement.ondblclick = () => {
        maxZIndex++;
        terrariumElement.style.zIndex = maxZIndex;
    };

    terrariumElement.addEventListener('dragstart', (e) => {
        const rect = terrariumElement.getBoundingClientRect();
        grabX = e.clientX - rect.left;
        grabY = e.clientY - rect.top;

        const parent = terrariumElement.offsetParent || document.body;
        parentRect = parent.getBoundingClientRect();

        maxZIndex++;
        terrariumElement.style.zIndex = maxZIndex;
    });

    document.addEventListener('dragover', (e) => {
        e.preventDefault();
    });

    terrariumElement.addEventListener('drag', (e) => {
        if (!e.clientX && !e.clientY) return;

        const parent = terrariumElement.offsetParent || document.body;
        const left = e.clientX - parentRect.left + parent.scrollLeft - grabX;
        const top  = e.clientY - parentRect.top  + parent.scrollTop  - grabY;

        terrariumElement.style.position = 'absolute';
        terrariumElement.style.left = `${left}px`;
        terrariumElement.style.top = `${top}px`;
    });

    terrariumElement.addEventListener('dragend', (e) => {
        if (e.clientX || e.clientY) {
            const parent = terrariumElement.offsetParent || document.body;
            const left = e.clientX - parentRect.left + parent.scrollLeft - grabX;
            const top  = e.clientY - parentRect.top  + parent.scrollTop  - grabY;
            terrariumElement.style.left = `${left}px`;
            terrariumElement.style.top = `${top}px`;
        }
    });
}