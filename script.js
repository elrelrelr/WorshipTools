// --- DATA ---
const galleryImages = [];
for (let i = 1; i <= 23; i++) {
    galleryImages.push(`imagenes/fondo${i}.jpg`);
}

// --- ESTADO ---
let slidesData = [];
let bgImageData = null;
let currentEditingIndex = -1;

let currentAlignment = 'center';
let currentVerticalAlignment = 'center';
let generatedTagString = "";

// Estado Tema
let isDarkMode = true;

// Estado Repertoire (PPTX Queue)
let repertoireList = [];

// Estado PDF Merger
let selectedPdfs = [];
let dragStartIndex;

// Estado Secciones
let instrumentosVisible = false;
let repertorioVisible = false;
let pdfMergerVisible = false;

// Init Theme
if (localStorage.getItem('theme') === 'light') {
    document.documentElement.classList.remove('dark');
    isDarkMode = false;
} else {
    document.documentElement.classList.add('dark');
    isDarkMode = true;
}
setTimeout(updateThemeIcon, 100);

function toggleTheme() {
    isDarkMode = !isDarkMode;
    if (isDarkMode) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
    } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
    }
    updateThemeIcon();
}

function updateThemeIcon() {
    const icon = document.getElementById('themeIcon');
    const iconMobile = document.getElementById('themeIconMobile');
    if (isDarkMode) {
        icon.className = 'fa-solid fa-moon';
        if (iconMobile) iconMobile.className = 'fa-solid fa-moon';
    } else {
        icon.className = 'fa-solid fa-sun text-yellow-300';
        if (iconMobile) iconMobile.className = 'fa-solid fa-sun text-yellow-300';
    }
}

function toggleMobileMenu() {
    const menu = document.getElementById('mobileMenu');
    const icon = document.getElementById('mobileMenuIcon');

    if (menu.classList.contains('hidden')) {
        menu.classList.remove('hidden');
        icon.className = 'fa-solid fa-xmark text-xl text-slate-700 dark:text-slate-200';
    } else {
        menu.classList.add('hidden');
        icon.className = 'fa-solid fa-bars text-xl text-slate-700 dark:text-slate-200';
    }
}

// --- NAVEGACIÓN ---
function scrollToSection(id) {
    document.getElementById(id).scrollIntoView({ behavior: 'smooth' });
}

function toggleInstrumentos() {
    const container = document.getElementById('instrumentosContainer');
    const icon = document.getElementById('instrumentosIcon');
    const text = document.getElementById('instrumentosText');

    instrumentosVisible = !instrumentosVisible;

    if (instrumentosVisible) {
        container.classList.remove('hidden');
        icon.className = 'fa-solid fa-chevron-up';
        text.innerText = 'Ocultar Instrumentos';
    } else {
        container.classList.add('hidden');
        icon.className = 'fa-solid fa-chevron-down';
        text.innerText = 'Mostrar Instrumentos';
    }
}

function toggleRepertorio() {
    const container = document.getElementById('repertorioContainer');
    const preview = document.getElementById('repertorioPreview');
    const icon = document.getElementById('repertorioIcon');
    const text = document.getElementById('repertorioText');

    repertorioVisible = !repertorioVisible;

    if (repertorioVisible) {
        container.classList.remove('hidden');
        preview.classList.add('hidden');
        icon.className = 'fa-solid fa-chevron-up';
        text.innerText = 'Ocultar';
    } else {
        container.classList.add('hidden');
        if (repertoireList.length > 0) {
            preview.classList.remove('hidden');
        }
        icon.className = 'fa-solid fa-chevron-down';
        text.innerText = 'Mostrar';
    }
}

function togglePdfMerger() {
    const container = document.getElementById('pdfMergerContainer');
    const icon = document.getElementById('pdfMergerIcon');
    const text = document.getElementById('pdfMergerText');

    pdfMergerVisible = !pdfMergerVisible;

    if (pdfMergerVisible) {
        container.classList.remove('hidden');
        icon.className = 'fa-solid fa-chevron-up';
        text.innerText = 'Ocultar';
    } else {
        container.classList.add('hidden');
        icon.className = 'fa-solid fa-chevron-down';
        text.innerText = 'Mostrar';
    }
}

// --- LÓGICA DE TEXTO Y ETIQUETAS ---
function toTitleCase(str) {
    if (!str) return "";
    return str.replace(/\w\S*/g, function(txt) {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
}

function generateTag() {
    let name = document.getElementById('songName').value.trim();
    let author = document.getElementById('songAuthor').value.trim();
    const cleanName = name ? toTitleCase(name) : "";
    const cleanAuthor = author ? toTitleCase(author) : "";

    if (cleanName) {
        const hash = cleanName.replace(/\s+/g, '');
        let initials = "";
        if (cleanAuthor) {
            cleanAuthor.split(/\s+/).forEach(w => {
                if (w.length > 0 && /[a-zA-Z]/.test(w[0])) initials += w[0].toUpperCase();
            });
        } else { initials = "?"; }
        generatedTagString = `#${hash} (${cleanAuthor}) (${initials})`;
    } else {
        generatedTagString = "";
    }

    document.getElementById('resultOutput').value = generatedTagString;
    updateFilenamePreview();
    return generatedTagString;
}

function updateFilenamePreview() {
    const currentTag = document.getElementById('resultOutput').value;
    if (currentTag) {
        document.getElementById('exportFileName').value = currentTag;
    } else {
        let name = document.getElementById('songName').value.trim();
        if (name) {
            document.getElementById('exportFileName').value = name;
        }
    }
}

function copyToClipboard(elementId) {
    const el = document.getElementById(elementId);
    if (!el || !el.value) return;
    el.select();
    el.setSelectionRange(0, 99999);
    navigator.clipboard.writeText(el.value).then(() => {
        const originalBg = el.style.backgroundColor;
        el.style.backgroundColor = '#064e3b';
        setTimeout(() => el.style.backgroundColor = originalBg, 300);
    });
}

function searchExternal(type) {
    let name = toTitleCase(document.getElementById('songName').value);
    let author = toTitleCase(document.getElementById('songAuthor').value);
    if (!name) { alert("Ingresa nombre de canción"); return; }
    const q = `${name} ${author}`;
    let url = "";
    switch (type) {
        case 'youtube': url = `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`; break;
        case 'lyrics': url = `https://www.letras.com/?q=${encodeURIComponent(q)}`; break;
        case 'chords': url = `https://www.google.com/search?q=${encodeURIComponent(q + " acordes chords")}`; break;
        case 'drums': url = `https://www.youtube.com/results?search_query=${encodeURIComponent(q + " drum cover bateria")}`; break;
        case 'piano': url = `https://www.youtube.com/results?search_query=${encodeURIComponent(q + " piano tutorial")}`; break;
        case 'guitar_cover': url = `https://www.youtube.com/results?search_query=${encodeURIComponent(q + " guitar cover")}`; break;
        case 'bass': url = `https://www.youtube.com/results?search_query=${encodeURIComponent(q + " bass cover bajo")}`; break;
        case 'voices': url = `https://www.youtube.com/results?search_query=${encodeURIComponent(q + " voces coros harmony tutorial")}`; break;
        case 'trumpet': url = `https://www.youtube.com/results?search_query=${encodeURIComponent(q + " trompeta trumpet cover")}`; break;
        case 'flute': url = `https://www.youtube.com/results?search_query=${encodeURIComponent(q + " flauta flute cover")}`; break;
        case 'tiple': url = `https://www.youtube.com/results?search_query=${encodeURIComponent(q + " tiple")}`; break;
    }
    window.open(url, '_blank');
}

// --- PROCESAMIENTO DE SLIDES ---
function processLyrics() {
    generateTag();
    const text = document.getElementById('lyricsInput').value;
    const maxLines = parseInt(document.getElementById('linesPerSlide').value) || 2;
    const addBlank = document.getElementById('addBlankSlide').checked;
    const addTitle = document.getElementById('addTitleSlide').checked;

    slidesData = [];
    if (addBlank) slidesData.push(" ");
    if (addTitle) {
        const name = toTitleCase(document.getElementById('songName').value || "Título");
        const auth = toTitleCase(document.getElementById('songAuthor').value || "");
        slidesData.push(`${name}\n${auth}`);
    }
    if (text.trim()) {
        const lines = text.split('\n');
        let chunk = [];
        for (let line of lines) {
            line = line.trim();
            if (line === "") {
                if (chunk.length > 0) { slidesData.push(chunk.join('\n')); chunk = []; }
            } else {
                chunk.push(line);
                if (chunk.length >= maxLines) { slidesData.push(chunk.join('\n')); chunk = []; }
            }
        }
        if (chunk.length > 0) slidesData.push(chunk.join('\n'));
    }
    renderSlides();
    renderQuickCopyList();
}

function clearSlides() {
    // Limpiar Editor
    document.getElementById('lyricsInput').value = '';
    slidesData = [];
    
    // Limpiar Generador de Etiquetas y Recursos
    document.getElementById('songName').value = '';
    document.getElementById('songAuthor').value = '';
    document.getElementById('resultOutput').value = '';
    document.getElementById('exportFileName').value = '';
    generatedTagString = "";
    
    renderSlides();
    renderQuickCopyList();
}

function renderSlides() {
    const container = document.getElementById('slidesContainer');
    container.innerHTML = '';
    document.getElementById('slideCount').innerText = slidesData.length;
    if (slidesData.length === 0) {
        container.innerHTML = `<div class="text-slate-500 text-center col-span-full py-12 border-2 border-dashed border-slate-700 rounded-lg bg-slate-800/50"><i class="fa-solid fa-music text-4xl mb-3 opacity-50"></i><br>Vacío</div>`;
        return;
    }
    slidesData.forEach((text, i) => {
        const slide = document.createElement('div');
        slide.className = 'slide-preview rounded-lg';
        
        const num = document.createElement('div');
        num.className = 'slide-number';
        num.innerText = i + 1;
        
        const content = document.createElement('div');
        content.className = 'slide-content';
        content.innerText = text;

        // Overlay de acciones
        const overlay = document.createElement('div');
        overlay.className = 'slide-overlay';

        // Botón Editar
        const btnEdit = document.createElement('button');
        btnEdit.className = 'overlay-btn';
        btnEdit.innerHTML = '<i class="fa-solid fa-pen"></i>';
        btnEdit.title = "Editar Texto";
        btnEdit.onclick = (e) => { e.stopPropagation(); openEditModal(i); };

        // Botón Agregar Vacío
        const btnAdd = document.createElement('button');
        btnAdd.className = 'overlay-btn add';
        btnAdd.innerHTML = '<i class="fa-solid fa-plus"></i>';
        btnAdd.title = "Agregar Diapositiva en Blanco Después";
        btnAdd.onclick = (e) => { e.stopPropagation(); addBlankSlideAfter(i); };

        // Botón Eliminar
        const btnDel = document.createElement('button');
        btnDel.className = 'overlay-btn delete';
        btnDel.innerHTML = '<i class="fa-solid fa-trash"></i>';
        btnDel.title = "Eliminar Diapositiva";
        btnDel.onclick = (e) => { e.stopPropagation(); deleteSlide(i); };

        overlay.appendChild(btnEdit);
        overlay.appendChild(btnAdd);
        overlay.appendChild(btnDel);
        
        slide.appendChild(num);
        slide.appendChild(content);
        slide.appendChild(overlay);
        container.appendChild(slide);
    });
    updateStyles();
}

function deleteSlide(index) {
    slidesData.splice(index, 1);
    syncSlidesToLyrics();
    renderSlides();
    renderQuickCopyList();
}

function addBlankSlideAfter(index) {
    slidesData.splice(index + 1, 0, " ");
    syncSlidesToLyrics();
    renderSlides();
    renderQuickCopyList();
}

// Sincroniza los cambios manuales de la vista previa de vuelta al área de texto
function syncSlidesToLyrics() {
    let lyricsSlides = [...slidesData];
    
    const addBlank = document.getElementById('addBlankSlide').checked;
    const addTitle = document.getElementById('addTitleSlide').checked;
    
    // Quitar las que se generan dinámicamente para no ensuciar el textarea con duplicados
    if (addTitle && lyricsSlides.length > 0) {
        // La de título suele ser la primera (o segunda si hay blanco inicial)
        lyricsSlides.splice(addBlank ? 1 : 0, 1);
    }
    if (addBlank && lyricsSlides.length > 0) {
        lyricsSlides.splice(0, 1);
    }

    // Unir con doble salto de línea para que el procesador los reconozca como bloques
    document.getElementById('lyricsInput').value = lyricsSlides.join('\n\n');
}

function updateStyles() {
    const font = document.getElementById('fontFamily').value;
    const color = document.getElementById('textColor').value;
    const shadow = document.getElementById('textShadow').checked;
    const isBold = document.getElementById('textBold').checked;

    const realSize = parseInt(document.getElementById('fontSize').value);
    const previewSize = Math.max(10, realSize * 0.25);
    const vAlignMap = { 'top': 'flex-start', 'center': 'center', 'bottom': 'flex-end' };

    const btnBg = 'bg-slate-700';
    document.getElementById('btnAlignLeft').classList.remove(btnBg);
    document.getElementById('btnAlignCenter').classList.remove(btnBg);
    document.getElementById('btnAlignRight').classList.remove(btnBg);
    if (currentAlignment === 'left') document.getElementById('btnAlignLeft').classList.add(btnBg);
    if (currentAlignment === 'center') document.getElementById('btnAlignCenter').classList.add(btnBg);
    if (currentAlignment === 'right') document.getElementById('btnAlignRight').classList.add(btnBg);

    document.getElementById('btnVAlignTop').classList.remove(btnBg);
    document.getElementById('btnVAlignCenter').classList.remove(btnBg);
    document.getElementById('btnVAlignBottom').classList.remove(btnBg);
    if (currentVerticalAlignment === 'top') document.getElementById('btnVAlignTop').classList.add(btnBg);
    if (currentVerticalAlignment === 'center') document.getElementById('btnVAlignCenter').classList.add(btnBg);
    if (currentVerticalAlignment === 'bottom') document.getElementById('btnVAlignBottom').classList.add(btnBg);

    document.querySelectorAll('.slide-preview').forEach(slide => {
        if (bgImageData) {
            slide.style.backgroundImage = `url(${bgImageData})`;
            slide.style.backgroundSize = 'cover';
            slide.style.backgroundPosition = 'center';
        } else {
            slide.style.backgroundColor = 'white';
            slide.style.backgroundImage = 'none';
        }
        const content = slide.querySelector('.slide-content');
        if (content) {
            content.style.fontFamily = font;
            content.style.color = color;
            content.style.textAlign = currentAlignment;
            content.style.justifyContent = 'center';
            content.style.alignItems = vAlignMap[currentVerticalAlignment];
            content.style.fontSize = `${previewSize}px`;
            content.style.fontWeight = isBold ? 'bold' : 'normal';
            content.style.textShadow = shadow ? '2px 2px 4px rgba(0,0,0,0.8)' : 'none';
        }
    });
}

function setAlignment(a) { currentAlignment = a; updateStyles(); }
function setVerticalAlignment(a) { currentVerticalAlignment = a; updateStyles(); }

function handleImageUpload(input) {
    if (input.files && input.files[0]) {
        const r = new FileReader();
        r.onload = (e) => {
            bgImageData = e.target.result;
            updateStyles();
        }
        r.readAsDataURL(input.files[0]);
    }
}

function removeBackground() {
    bgImageData = null;
    document.getElementById('bgImageInput').value = "";
    updateStyles();
}

// --- GALERÍA & MODALES ---
function openGallery() {
    const grid = document.getElementById('galleryGrid');
    grid.innerHTML = '';
    galleryImages.forEach(url => {
        const item = document.createElement('div');
        item.className = 'gallery-item bg-slate-700 animate-pulse';
        item.onclick = () => selectGalleryImage(url);

        const img = document.createElement('img');
        img.src = url;
        img.loading = 'lazy';
        img.className = 'w-full h-full object-cover rounded-lg';
        img.onload = () => item.classList.remove('animate-pulse');

        item.appendChild(img);
        grid.appendChild(item);
    });
    document.getElementById('galleryModal').classList.remove('hidden');
    document.getElementById('galleryModal').classList.add('flex');
}

function closeGallery() {
    document.getElementById('galleryModal').classList.add('hidden');
    document.getElementById('galleryModal').classList.remove('flex');
}

async function selectGalleryImage(url) {
    closeGallery();
    document.getElementById('globalLoader').classList.remove('hidden');
    document.getElementById('globalLoader').classList.add('flex');

    try {
        const response = await fetch(url);
        const blob = await response.blob();
        const reader = new FileReader();
        reader.onloadend = () => {
            bgImageData = reader.result;
            updateStyles();
            document.getElementById('globalLoader').classList.add('hidden');
            document.getElementById('globalLoader').classList.remove('flex');
        };
        reader.readAsDataURL(blob);
    } catch (error) {
        console.error(error);
        alert("Error al cargar imagen. Intenta con otra.");
        document.getElementById('globalLoader').classList.add('hidden');
        document.getElementById('globalLoader').classList.remove('flex');
    }
}

function openEditModal(i) {
    currentEditingIndex = i;
    document.getElementById('editModalIndex').innerText = `#${i + 1}`;
    document.getElementById('editSlideText').value = slidesData[i];
    document.getElementById('editModal').classList.remove('hidden');
    document.getElementById('editModal').classList.add('flex');
}

function closeEditModal() {
    document.getElementById('editModal').classList.add('hidden');
    document.getElementById('editModal').classList.remove('flex');
}

function saveEditSlide() {
    if (currentEditingIndex > -1) {
        slidesData[currentEditingIndex] = document.getElementById('editSlideText').value;
        syncSlidesToLyrics();
        renderSlides();
        renderQuickCopyList();
        closeEditModal();
    }
}

function toggleQuickCopy() {
    const panel = document.getElementById('quickCopyPanel');
    const overlay = document.getElementById('panelOverlay');
    if (panel.classList.contains('translate-x-full')) {
        panel.classList.remove('translate-x-full');
        overlay.classList.remove('hidden');
    } else {
        panel.classList.add('translate-x-full');
        overlay.classList.add('hidden');
    }
}

function renderQuickCopyList() {
    const list = document.getElementById('quickCopyContainer');
    list.innerHTML = '';
    if (slidesData.length === 0) {
        list.innerHTML = '<p class="text-slate-500 text-center text-sm mt-10">Sin datos.</p>';
        return;
    }
    slidesData.forEach((text, i) => {
        const item = document.createElement('div');
        item.className = 'copy-block bg-slate-800 border border-slate-700 rounded-lg p-3 flex justify-between items-center group';
        const txtPreview = document.createElement('div');
        txtPreview.className = 'text-xs text-slate-300 font-mono whitespace-pre truncate mr-2 flex-1';
        txtPreview.innerText = text.replace(/\n/g, ' ↵ ');
        const btn = document.createElement('button');
        btn.className = 'bg-slate-700 hover:bg-blue-600 text-white p-2 rounded transition shadow-sm shrink-0';
        btn.innerHTML = `<i class="fa-regular fa-copy"></i>`;
        btn.onclick = () => {
            navigator.clipboard.writeText(text).then(() => {
                const original = btn.innerHTML;
                btn.innerHTML = `<i class="fa-solid fa-check text-green-400"></i>`;
                setTimeout(() => btn.innerHTML = original, 1000);
            });
        };
        const num = document.createElement('span');
        num.className = 'text-[10px] text-slate-500 mr-2 font-bold w-4';
        num.innerText = i + 1;
        item.appendChild(num);
        item.appendChild(txtPreview);
        item.appendChild(btn);
        list.appendChild(item);
    });
}

// --- REPERTOIRE (SETLIST) LOGIC - VERSIÓN FUNCIONAL ---

function addToRepertoire() {
    if (slidesData.length === 0) return alert("No hay diapositivas para agregar.");

    // TOMAR EL NOMBRE DE LA CANCIÓN DEL CAMPO "songName", NO del exportFileName
    let songName = document.getElementById('songName').value.trim();
    let author = document.getElementById('songAuthor').value.trim();
    
    // Formatear el nombre correctamente
    if (songName) {
        songName = toTitleCase(songName);
        if (author) {
            songName = `${songName} - ${toTitleCase(author)}`;
        }
    } else {
        songName = "Canción Sin Nombre";
    }

    const songConfig = {
        id: Date.now(),
        type: 'internal',
        name: songName,  // Ahora usa el nombre limpio, no la etiqueta
        slides: [...slidesData],
        styles: {
            font: document.getElementById('fontFamily').value,
            size: parseInt(document.getElementById('fontSize').value),
            color: document.getElementById('textColor').value.replace('#', ''),
            bold: document.getElementById('textBold').checked,
            align: currentAlignment,
            valign: currentVerticalAlignment,
            shadow: document.getElementById('textShadow').checked,
            bgImage: bgImageData
        }
    };

    repertoireList.push(songConfig);
    renderRepertoireList();

    const btn = document.querySelector('button[onclick="addToRepertoire()"]');
    const originalHTML = btn.innerHTML;
    btn.innerHTML = `<i class="fa-solid fa-check"></i> ¡Agregado!`;
    btn.classList.add('bg-green-600');
    setTimeout(() => {
        btn.innerHTML = originalHTML;
        btn.classList.remove('bg-green-600');
    }, 1000);
}

function renderRepertoireList() {
    const list = document.getElementById('repertoireList');
    const preview = document.getElementById('repertorioPreview');
    const previewCount = document.getElementById('repertorioPreviewCount');
    document.getElementById('repertoireCount').innerText = repertoireList.length;
    previewCount.innerText = repertoireList.length;
    list.innerHTML = "";

    if (repertoireList.length === 0) {
        list.innerHTML = '<p class="text-slate-500 text-xs text-center mt-10 italic">La lista está vacía.</p>';
        preview.classList.add('hidden');
        return;
    }

    // Show preview if container is hidden and there are songs
    if (!repertorioVisible) {
        preview.classList.remove('hidden');
    }

    repertoireList.forEach((item, index) => {
        const el = document.createElement('div');
        el.className = 'repertoire-item group bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 flex items-center justify-between mb-2 transition-colors';

        el.innerHTML = `
            <div class="flex items-center gap-3 overflow-hidden flex-1">
                <span class="text-amber-600 dark:text-amber-500 font-bold text-xs w-4">${index + 1}.</span>
                <i class="fa-solid fa-music text-blue-500"></i>
                <div class="flex-1 min-w-0">
                    <p class="text-sm text-slate-800 dark:text-white font-bold truncate">${escapeHtml(item.name)}</p>
                    <p class="text-[10px] text-slate-500 dark:text-slate-400">${item.slides.length} diapositivas</p>
                </div>
            </div>
            <div class="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onclick="removeRepertoireItem(${index})" class="text-slate-400 hover:text-red-400 p-1">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>
        `;
        list.appendChild(el);
    });

    if (list && typeof Sortable !== 'undefined') {
        new Sortable(list, {
            animation: 150,
            handle: '.repertoire-item',
            onEnd: function (evt) {
                const item = repertoireList.splice(evt.oldIndex, 1)[0];
                repertoireList.splice(evt.newIndex, 0, item);
                renderRepertoireList();
            }
        });
    }
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

function removeRepertoireItem(index) {
    repertoireList.splice(index, 1);
    renderRepertoireList();
}

function handlePptxUpload(input) {
    if (input.files) {
        alert("Nota: Los archivos PPTX externos no pueden combinarse automáticamente.\n\nSolo se pueden unir las canciones creadas en el editor.\n\nPuedes abrir los archivos PPTX por separado y copiar las diapositivas manualmente, o recrear la canción en el editor.");
    }
    input.value = "";
}

function clearRepertoire() {
    if (confirm("¿Borrar toda la lista de repertorio?")) {
        repertoireList = [];
        renderRepertoireList();
    }
}

async function downloadSetlist() {
    if (repertoireList.length === 0) return alert("El repertorio está vacío.");

    const btn = document.querySelector('button[onclick="downloadSetlist()"]');
    const originalText = btn.innerHTML;
    btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Generando PPTX...`;
    btn.disabled = true;

    const baseName = document.getElementById('repertoireFileName').value.trim() || "Repertorio";

    try {
        let pptx = new PptxGenJS();
        pptx.layout = 'LAYOUT_16x9';
        pptx.defineLayout({ name: 'WIDE', width: 10, height: 5.625 });
        pptx.layout = 'WIDE';

        for (const song of repertoireList) {
            const st = song.styles;

            let fontName = "Cambria";
            if (st.font.includes('Arial')) fontName = "Arial";
            else if (st.font.includes('Times')) fontName = "Times New Roman";
            else if (st.font.includes('Impact')) fontName = "Impact";
            else if (st.font.includes('Verdana')) fontName = "Verdana";

            const alignMap = { 'left': 'left', 'center': 'center', 'right': 'right' };
            const vAlignMap = { 'top': 'top', 'center': 'middle', 'bottom': 'bottom' };
            const shadowOpts = st.shadow ? { type: 'outer', angle: 45, blur: 3, offset: 2, opacity: 0.6 } : null;

            // 1. DIAPOSITIVA EN BLANCO (siempre al inicio de cada canción)
            let blankSlide = pptx.addSlide();
            if (st.bgImage) {
                blankSlide.background = { data: st.bgImage };
            } else {
                blankSlide.background = { color: "FFFFFF" };
            }
            // Sin texto - solo fondo

            // 2. RECORRER LAS DIAPOSITIVAS DE LA CANCIÓN
            for (let i = 0; i < song.slides.length; i++) {
                let text = song.slides[i];
                
                // Saltar diapositivas que estén vacías (son las que el usuario NO quería)
                if (text.trim() === "" || text === " ") {
                    continue;
                }
                
                let slide = pptx.addSlide();
                
                if (st.bgImage) {
                    slide.background = { data: st.bgImage };
                } else {
                    slide.background = { color: "FFFFFF" };
                }

                slide.addText(text, {
                    x: 0.5, y: 0.5, w: '90%', h: '80%',
                    fontFace: fontName,
                    fontSize: st.size,
                    color: st.color,
                    bold: st.bold,
                    align: alignMap[st.align] || 'center',
                    valign: vAlignMap[st.valign] || 'middle',
                    shadow: shadowOpts,
                    paraSpaceAfter: 10
                });
            }
        }

        await pptx.writeFile({ fileName: baseName + ".pptx" });

    } catch (err) {
        console.error(err);
        alert("Error generando el repertorio: " + err.message);
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

// --- MOTOR PPTX NATIVO (SINGLE EXPORT) ---
async function downloadPPTX() {
    if (slidesData.length === 0) return alert("No hay diapositivas para exportar.");

    const btn = document.querySelector('button[onclick="downloadPPTX()"]');
    const originalText = btn.innerHTML;
    btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Generando...`;
    btn.disabled = true;

    try {
        let pptx = new PptxGenJS();
        pptx.layout = 'LAYOUT_16x9';
        pptx.defineLayout({ name: 'WIDE', width: 10, height: 5.625 });
        pptx.layout = 'WIDE';

        const fontSelect = document.getElementById('fontFamily').value;
        const fontName = fontSelect.includes('Cambria') ? "Cambria" :
            fontSelect.includes('Arial') ? "Arial" :
                fontSelect.includes('Times') ? "Times New Roman" :
                    fontSelect.includes('Impact') ? "Impact" : "Verdana";

        const fontSize = parseInt(document.getElementById('fontSize').value) || 60;
        const fontColor = document.getElementById('textColor').value.replace('#', '');
        const alignMap = { 'left': 'left', 'center': 'center', 'right': 'right' };
        const vAlignMap = { 'top': 'top', 'center': 'middle', 'bottom': 'bottom' };
        const shadow = document.getElementById('textShadow').checked;
        const isBold = document.getElementById('textBold').checked;
        const shadowOpts = shadow ? { type: 'outer', angle: 45, blur: 3, offset: 2, opacity: 0.6 } : null;

        for (let text of slidesData) {
            let slide = pptx.addSlide();

            if (bgImageData) {
                slide.background = { data: bgImageData };
            } else {
                slide.background = { color: "FFFFFF" };
            }

            slide.addText(text, {
                x: 0.5, y: 0.5, w: '90%', h: '80%',
                fontFace: fontName,
                fontSize: fontSize,
                color: fontColor,
                bold: isBold,
                align: alignMap[currentAlignment] || 'center',
                valign: vAlignMap[currentVerticalAlignment] || 'middle',
                shadow: shadowOpts,
                paraSpaceAfter: 10
            });
        }

        let fileName = document.getElementById('exportFileName').value.trim();
        if (!fileName) fileName = "Presentacion";
        fileName = fileName.replace(/[/\\?%*:|"<>]/g, '-');

        await pptx.writeFile({ fileName: fileName + ".pptx" });

    } catch (err) {
        console.error(err);
        alert("Error generando PowerPoint: " + err.message);
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

// --- EXPORTACIÓN PDF ---
async function exportToPDF() {
    if (!slidesData.length) return alert("Sin contenido.");
    const btn = document.getElementById('btnExportPDF');
    btn.disabled = true;
    document.getElementById('loadingIndicator').classList.remove('hidden');
    try {
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [1920, 1080], hotfixes: ["px_scaling"] });
        const container = document.createElement('div');
        container.style.position = 'fixed'; container.style.left = '-10000px';
        container.style.width = '1920px'; container.style.height = '1080px';
        container.style.lineHeight = '1.3';
        document.body.appendChild(container);

        const font = document.getElementById('fontFamily').value;
        const size = document.getElementById('fontSize').value + 'px';
        const color = document.getElementById('textColor').value;
        const shadow = document.getElementById('textShadow').checked;
        const isBold = document.getElementById('textBold').checked;
        const vAlignMap = { 'top': 'flex-start', 'center': 'center', 'bottom': 'flex-end' };

        for (let i = 0; i < slidesData.length; i++) {
            container.innerHTML = '';
            const slide = document.createElement('div');
            slide.style.width = '100%'; slide.style.height = '100%';
            slide.style.display = 'flex'; slide.style.padding = '50px'; slide.style.boxSizing = 'border-box';
            slide.style.fontFamily = font; slide.style.fontSize = size;
            slide.style.fontWeight = isBold ? 'bold' : 'normal';
            slide.style.color = color; slide.style.textAlign = currentAlignment;
            slide.style.justifyContent = 'center'; slide.style.alignItems = vAlignMap[currentVerticalAlignment];
            if (shadow) slide.style.textShadow = '5px 5px 8px rgba(0,0,0,0.85)';
            if (bgImageData) { slide.style.backgroundImage = `url(${bgImageData})`; slide.style.backgroundSize = 'cover'; slide.style.backgroundPosition = 'center'; }
            else { slide.style.backgroundColor = 'white'; }
            slide.innerHTML = slidesData[i].replace(/\n/g, '<br>');
            container.appendChild(slide);
            await new Promise(r => setTimeout(r, 10));
            const canvas = await html2canvas(slide, { scale: 1, useCORS: true, allowTaint: true, backgroundColor: null });
            const imgData = canvas.toDataURL('image/jpeg', 0.9);
            if (i > 0) pdf.addPage([1920, 1080]);
            pdf.addImage(imgData, 'JPEG', 0, 0, 1920, 1080);
        }
        document.body.removeChild(container);
        let fName = document.getElementById('exportFileName').value || "Slides";
        pdf.save(fName + ".pdf");
    } catch (e) { console.error(e); alert("Error en PDF."); }
    finally { btn.disabled = false; document.getElementById('loadingIndicator').classList.add('hidden'); }
}

// --- PDF MERGER LOGIC ---
function handlePdfSelect(input) {
    if (input.files) {
        const fileList = Array.from(input.files);
        selectedPdfs = [...selectedPdfs, ...fileList];
        renderPdfList();
    }
    input.value = "";
}

function renderPdfList() {
    const list = document.getElementById('pdfList');
    const count = document.getElementById('pdfCount');
    list.innerHTML = '';
    count.innerText = selectedPdfs.length;

    if (selectedPdfs.length === 0) {
        list.innerHTML = '<p class="text-slate-500 text-xs text-center mt-10">No hay archivos seleccionados.</p>';
        return;
    }

    selectedPdfs.forEach((file, index) => {
        const item = document.createElement('div');
        item.className = 'pdf-item';
        item.setAttribute('draggable', 'true');
        item.dataset.index = index;
        item.addEventListener('dragstart', dragStart);
        item.addEventListener('dragover', dragOver);
        item.addEventListener('drop', drop);
        item.addEventListener('dragenter', dragEnter);
        item.addEventListener('dragleave', dragLeave);
        item.addEventListener('dragend', dragEnd);

        item.innerHTML = `
                    <div class="flex items-center gap-3 overflow-hidden pointer-events-none">
                        <i class="fa-solid fa-grip-lines text-slate-500 mr-1 cursor-grab"></i>
                        <i class="fa-solid fa-file-pdf text-red-500 text-lg"></i>
                        <span class="text-sm text-white truncate">${file.name}</span>
                        <span class="text-xs text-slate-500 whitespace-nowrap">(${(file.size / 1024).toFixed(1)} KB)</span>
                    </div>
                    <button onclick="removePdf(${index})" class="text-slate-400 hover:text-red-400 p-1 z-10">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                `;
        list.appendChild(item);
    });
}

function dragStart() { dragStartIndex = +this.dataset.index; this.classList.add('dragging'); }
function dragOver(e) { e.preventDefault(); }
function dragEnter() { this.classList.add('border-blue-500'); }
function dragLeave() { this.classList.remove('border-blue-500'); }
function dragEnd() { this.classList.remove('dragging'); document.querySelectorAll('.pdf-item').forEach(i => i.classList.remove('border-blue-500')); }
function drop() {
    const dragEndIndex = +this.dataset.index;
    swapItems(dragStartIndex, dragEndIndex);
}
function swapItems(fromIndex, toIndex) {
    const itemOne = selectedPdfs[fromIndex];
    const itemTwo = selectedPdfs[toIndex];
    selectedPdfs[fromIndex] = itemTwo;
    selectedPdfs[toIndex] = itemOne;
    renderPdfList();
}
function removePdf(index) { selectedPdfs.splice(index, 1); renderPdfList(); }

async function mergePdfs() {
    if (selectedPdfs.length === 0) return alert("Selecciona al menos un archivo PDF.");
    const btn = document.querySelector('button[onclick="mergePdfs()"]');
    const loader = document.getElementById('mergeLoader');
    btn.disabled = true; btn.classList.add('opacity-50'); loader.classList.remove('hidden');

    try {
        const { PDFDocument } = PDFLib;
        const mergedPdf = await PDFDocument.create();

        for (const file of selectedPdfs) {
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await PDFDocument.load(arrayBuffer);
            const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
            copiedPages.forEach((page) => mergedPdf.addPage(page));
        }

        const pdfBytes = await mergedPdf.save();
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        let fileName = document.getElementById('mergedFileName').value.trim();
        if (!fileName) fileName = "Documento_Unido";
        if (!fileName.toLowerCase().endsWith('.pdf')) fileName += '.pdf';
        link.download = fileName;
        link.click();
    } catch (error) { console.error(error); alert("Error al unir PDFs. Verifica que no estén protegidos."); }
    finally { btn.disabled = false; btn.classList.remove('opacity-50'); loader.classList.add('hidden'); }
}

// --- IMPORTAR CANCIÓN DESDE ARCHIVO TEXTO/MARKDOWN ---
function importSongFromFile() {
    // Crear input de archivo dinámicamente
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.txt,.md,.markdown';
    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (event) => {
            const content = event.target.result;
            parseImportedSong(content);
        };
        reader.readAsText(file, 'UTF-8');
    };
    input.click();
}

function parseImportedSong(content) {
    const lines = content.split('\n');
    
    let title = "";
    let author = "";
    let background = "";
    let lyrics = [];
    let inLyrics = false;
    let inYaml = false;
    
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim();
        
        // Detectar inicio/fin de YAML Front Matter
        if (line === "---") {
            if (i === 0 && !inYaml) {
                inYaml = true;
                continue;
            } else if (inYaml) {
                inYaml = false;
                continue;
            }
        }
        
        if (inYaml) {
            if (line.startsWith('title:')) title = line.replace('title:', '').trim();
            if (line.startsWith('author:')) author = line.replace('author:', '').trim();
            if (line.startsWith('background:')) background = line.replace('background:', '').trim();
            continue;
        }
        
        // Detectar título (# Título) fuera de YAML - Regex más flexible
        if (line.match(/^#+\s*(.*)/)) {
            if (!title) {
                title = line.replace(/^#+\s*/, '').trim();
            }
            continue; // Siempre saltar la línea del título en el body
        }
        
        // Detectar autor (**Autor:**, Autor:, @) - Regex más flexible
        if (line.match(/^(\*\*Autor:\*\*|Autor:|@)\s*(.*)/i)) {
            if (!author) {
                author = line.replace(/^(\*\*Autor:\*\*|Autor:|@)\s*/i, '').trim();
            }
            continue; // Siempre saltar la línea del autor en el body
        }
        
        // Detectar separadores de estrofas (líneas vacías)
        if (line === "") {
            if (inLyrics && lyrics.length > 0 && lyrics[lyrics.length - 1] !== "") {
                lyrics.push("");
            }
            continue;
        }
        
        // Es línea de letra
        if (line && !line.match(/^\[.*\]$/) && !line.match(/^\(.*\)$/)) {
            inLyrics = true;
            lyrics.push(line);
        }
    }
    
    // Cargar al editor
    document.getElementById('songName').value = title || "";
    document.getElementById('songAuthor').value = author || "";
    
    if (lyrics.length > 0) {
        // Limpiar saltos de línea sobrantes al inicio/final
        const lyricsText = lyrics.join('\n').trim();
        document.getElementById('lyricsInput').value = lyricsText;
    }
    
    // Cargar Fondo si existe
    if (background && background !== "null") {
        bgImageData = background;
    } else {
        bgImageData = null;
    }
    
    // Actualizar vista
    updateStyles();
    generateTag();
    processLyrics();
    
    alert(`Canción "${title || 'Importada'}" cargada correctamente.`);
}

// También permitir importar canciones guardadas previamente (exportar como .md)
function exportSongAsMarkdown() {
    const name = document.getElementById('songName').value.trim() || "Sin título";
    const author = document.getElementById('songAuthor').value.trim();
    const lyrics = document.getElementById('lyricsInput').value.trim();
    
    let markdown = "---\n";
    markdown += `title: ${name}\n`;
    if (author) markdown += `author: ${author}\n`;
    if (bgImageData) markdown += `background: ${bgImageData}\n`;
    markdown += "---\n\n";
    
    // Header en el body para compatibilidad con otros lectores MD
    markdown += `# ${name}\n`;
    if (author) {
        markdown += `**Autor:** ${author}\n`;
    }
    markdown += `\n${lyrics}`;
    
    // Descargar archivo
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${name.replace(/[^a-z0-9]/gi, '_')}.md`;
    a.click();
    URL.revokeObjectURL(url);
    
    alert("Canción exportada como archivo .md (con fondo y metadatos)");
}

// --- CONVERTIR PPTX A MD (FORMATO IMPORTABLE) ---
async function convertPptxToMd(input) {
    if (!input.files || input.files.length === 0) return;
    
    const file = input.files[0];
    if (!file.name.toLowerCase().endsWith('.pptx')) {
        alert("Por favor, selecciona un archivo .pptx válido.");
        return;
    }
    
    showGlobalLoader("Analizando PowerPoint...");
    
    try {
        const arrayBuffer = await file.arrayBuffer();
        const zip = await JSZip.loadAsync(arrayBuffer);
        
        // 1. Extraer texto de las diapositivas (slideX.xml)
        const slideFiles = Object.keys(zip.files).filter(name => 
            name.match(/ppt\/slides\/slide\d+\.xml$/)
        ).sort((a, b) => {
            const numA = parseInt(a.match(/\d+/)[0]);
            const numB = parseInt(b.match(/\d+/)[0]);
            return numA - numB;
        });
        
        let allTexts = [];
        let title = "";
        let author = "";
        
        // 2. Extraer metadatos (título y autor) de core.xml
        if (zip.files['docProps/core.xml']) {
            const coreXml = await zip.files['docProps/core.xml'].async('string');
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(coreXml, "text/xml");
            title = xmlDoc.getElementsByTagName("dc:title")[0]?.textContent || "";
            author = xmlDoc.getElementsByTagName("dc:creator")[0]?.textContent || "";
        }

        for (let i = 0; i < slideFiles.length; i++) {
            const slideXml = await zip.files[slideFiles[i]].async('string');
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(slideXml, "text/xml");
            
            // Extraer texto de los nodos <a:t>
            const textNodes = xmlDoc.getElementsByTagName("a:t");
            let slideText = "";
            for (let node of textNodes) {
                slideText += node.textContent + " ";
            }
            slideText = slideText.trim();

            // FILTRO: Ignorar diapositivas que solo contienen basura de la librería o están vacías
            if (slideText && !slideText.toLowerCase().includes("pptxgenjs")) {
                // Si no hay título de metadatos o el título actual es genérico, intentar extraerlo
                if ((!title || title.toLowerCase().includes("pptxgenjs")) && i === 0) {
                    const lines = slideText.split(/\n/);
                    title = lines[0].substring(0, 100).trim();
                    if (lines.length > 1 && !author) author = lines[1].trim();
                } else {
                    allTexts.push(slideText);
                }
            }
        }
        
        // Limpieza final de título y autor por si acaso
        if (title && title.toLowerCase().includes("pptxgenjs")) title = file.name.replace(/\.pptx$/i, '');
        if (author && author.toLowerCase().includes("pptxgenjs")) author = "";
        
        // 3. Construir el contenido MD
        let markdown = "---\n";
        markdown += `title: ${title}\n`;
        if (author) markdown += `author: ${author}\n`;
        markdown += `background: null\n`;
        markdown += `---\n\n`;
        
        markdown += `# ${title}\n`;
        if (author) markdown += `**Autor:** ${author}\n`;
        markdown += `\n`;
        
        // Unir el texto de todas las diapositivas
        if (allTexts.length > 0) {
            markdown += allTexts.join('\n\n');
        } else {
            markdown += "*No se pudo extraer texto significativo del archivo PPTX.*";
        }
        
        // 4. Descargar el archivo MD
        const blob = new Blob([markdown], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const safeName = title.replace(/[^a-z0-9]/gi, '_');
        a.download = `${safeName}.md`;
        a.click();
        URL.revokeObjectURL(url);
        
        alert(`✅ ¡Conversión exitosa!\n\nTítulo: ${title}\nDiapositivas procesadas: ${allTexts.length}\n\nAhora puedes usar el botón "Importar .md" en el editor para cargar la canción.`);
        
    } catch (error) {
        console.error("Error al convertir PPTX:", error);
        alert("Error al procesar el archivo PPTX: " + error.message);
    } finally {
        hideGlobalLoader();
        input.value = ""; // Limpiar input
    }
}

// --- HELPERS DE UI ---
function showGlobalLoader(text) {
    const loader = document.getElementById('globalLoader');
    if (loader) {
        loader.querySelector('p').innerText = text || "Cargando...";
        loader.classList.remove('hidden');
        loader.classList.add('flex');
    }
}

function hideGlobalLoader() {
    const loader = document.getElementById('globalLoader');
    if (loader) {
        loader.classList.add('hidden');
        loader.classList.remove('flex');
    }
}