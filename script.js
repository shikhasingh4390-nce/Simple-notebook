
const canvas = document.getElementById('notebookCanvas');
const ctx = canvas.getContext('2d');
const textInput = document.getElementById('textInput');
const pageDisplay = document.getElementById('pageNumber');
const colorPicker = document.getElementById('colorPicker');
const penSize = document.getElementById('penSize');

canvas.width = 800;
canvas.height = 1000;

let drawing = false;
let lastX = 0;
let lastY = 0;
let currentPage = 1;
let isEraser = false;
let textX, textY;

// 1. Lines ko hamesha upar rakhne ke liye function
function drawBackgroundLines() {
    ctx.save(); // Purani settings save karein
    ctx.globalCompositeOperation = 'destination-over'; // Yeh lines ko sabke peeche rakhega
    
    // Horizontal Blue Lines
    ctx.strokeStyle = "#a0c4ff"; 
    ctx.lineWidth = 1;
    for (let i = 40; i < canvas.height; i += 30) {
        ctx.beginPath();
        ctx.moveTo(0, i); ctx.lineTo(canvas.width, i);
        ctx.stroke();
    }
    
    // Vertical Red Margin
    ctx.strokeStyle = "#ffadad"; 
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(70, 0); ctx.lineTo(70, canvas.height);
    ctx.stroke();

    // White Background
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore(); // Settings restore karein
}

function setEraser() { isEraser = true; }
function setPen() { isEraser = false; }

function getCoords(e) {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches.clientX : e.clientX;
    const clientY = e.touches ? e.touches.clientY : e.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
}

// 2. Drawing Logic with REAL Eraser
canvas.addEventListener('mousedown', (e) => {
    drawing = true;
    const coords = getCoords(e);
    [lastX, lastY] = [coords.x, coords.y];
});

canvas.addEventListener('mousemove', (e) => {
    if (!drawing) return;
    const coords = getCoords(e);
    
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(coords.x, coords.y);
    
    if (isEraser) {
        // 'destination-out' se pixels delete hote hain (asli eraser)
        ctx.globalCompositeOperation = 'destination-out';
        ctx.lineWidth = 30;
    } else {
        ctx.globalCompositeOperation = 'source-over'; // Normal drawing
        ctx.strokeStyle = colorPicker.value;
        ctx.lineWidth = penSize.value;
    }
    
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
    
    [lastX, lastY] = [coords.x, coords.y];
    
    // Har stroke ke baad lines ko redraw karna zaroori hai
    drawBackgroundLines(); 
});

window.addEventListener('mouseup', () => {
    if(drawing) {
        drawing = false;
        saveToBrowser();
    }
});

// 3. Typing Logic
canvas.addEventListener('click', (e) => {
    const coords = getCoords(e);
    textX = coords.x;
    textY = coords.y;
    textInput.value = ""; 
    textInput.focus();
});

textInput.addEventListener('input', () => {
    loadFromBrowser(() => {
        ctx.globalCompositeOperation = 'source-over';
        ctx.font = "20px 'Courier New'";
        ctx.fillStyle = colorPicker.value;
        ctx.fillText(textInput.value, textX, textY);
        drawBackgroundLines();
    });
});

textInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        saveToBrowser();
        textInput.value = "";
    }
});

// 4. Persistence & PDF
function saveToBrowser() {
    localStorage.setItem(`copy_page_${currentPage}`, canvas.toDataURL());
}

function loadFromBrowser(callback) {
    const data = localStorage.getItem(`copy_page_${currentPage}`);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (data) {
        const img = new Image();
        img.src = data;
        img.onload = () => {
            ctx.globalCompositeOperation = 'source-over';
            ctx.drawImage(img, 0, 0);
            drawBackgroundLines();
            if(callback) callback();
        };
    } else {
        drawBackgroundLines();
        if(callback) callback();
    }
}


async function downloadPDF() {
    // 1. Check karein ki library load hui hai ya nahi
    if (!window.jspdf) {
        alert("Library load nahi hui! Internet check karein.");
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'px', [800, 1000]); // Canvas ke size ka PDF

    // 2. Current page save karein pehle
    saveToBrowser();

    // 3. Sari pages ko PDF mein add karein
    for (let i = 1; i <= currentPage; i++) {
        const pageData = localStorage.getItem(`copy_page_${i}`);
        if (pageData) {
            if (i > 1) doc.addPage();
            doc.addImage(pageData, 'PNG', 0, 0, 800, 1000);
        }
    }

    // 4. File save karein
    doc.save("My_Notebook.pdf");
}




function nextPage() { saveToBrowser(); currentPage++; pageDisplay.innerText = `Page ${currentPage}`; loadFromBrowser(); }
function prevPage() { if (currentPage > 1) { saveToBrowser(); currentPage--; pageDisplay.innerText = `Page ${currentPage}`; loadFromBrowser(); } }

function clearCanvas() {
    if (confirm("clear page?")) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawBackgroundLines();
        saveToBrowser();
    }
}

loadFromBrowser();
