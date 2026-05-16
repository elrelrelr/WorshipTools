// --- DATA ---
const galleryImages = [];
for (let i = 1; i <= 23; i++) {
    galleryImages.push(`imagenes/fondo${i}.jpg`);
}

// --- ESTADO ---
let slidesData = [];
let bgImageData = null;
let currentEditingIndex = -1;
let currentProjectionIndex = -1;

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

// Sortable instance for slides
let slidesSortable = null;

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
    
    // Limpiar cualquier etiqueta que pueda haber sido pegada accidentalmente
    if (name.startsWith('#')) {
        // Extraer solo el nombre de la canción de la etiqueta
        const tagMatch = name.match(/^#([^(]+)/);
        if (tagMatch) {
            name = tagMatch[1].trim();
        }
    }
    
    const cleanName = name ? toTitleCase(name) : "";
    const cleanAuthor = author ? toTitleCase(author) : "";

    if (cleanName) {
        const hash = cleanName.replace(/\s+/g, '');
        let initials = "";
        if (cleanAuthor) {
            const words = cleanAuthor.split(/\s+/);
            for (let w of words) {
                if (w.length > 0 && /[a-zA-Z]/.test(w[0])) {
                    initials += w[0].toUpperCase();
                }
            }
        } else {
            initials = "?";
        }
        generatedTagString = `#${hash} (${cleanAuthor || "?"}) (${initials})`;
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
    refreshSlidesFromCurrentState();
}
// Función para actualizar la vista previa en tiempo real cuando cambian los checkboxes
function updateSlidesRealTime() {
    const rawText = document.getElementById('lyricsInput').value;
    if (!rawText.trim() && !document.getElementById('addBlankSlide').checked && !document.getElementById('addTitleSlide').checked) {
        // Si no hay letra y ambos checkboxes están desactivados, mostrar vacío
        slidesData = [];
        renderSlides();
        renderQuickCopyList();
        return;
    }
    
    // Llamar a la función que actualiza las diapositivas (sin regenerar desde el texto si no es necesario)
    refreshSlidesFromCurrentState();
}

// Función que refresca las diapositivas manteniendo la letra actual
// --- ACTUALIZACIÓN EN TIEMPO REAL PARA CHECKBOXES ---
function refreshSlidesFromCurrentState() {
    const rawText = document.getElementById('lyricsInput').value;
    const text = rawText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    
    const maxLines = parseInt(document.getElementById('linesPerSlide').value) || 2;
    const addBlank = document.getElementById('addBlankSlide').checked;
    const addTitle = document.getElementById('addTitleSlide').checked;
    
    const songName = toTitleCase(document.getElementById('songName').value || "Título");
    const songAuthor = toTitleCase(document.getElementById('songAuthor').value || "");
    
    let newSlidesData = [];
    
    if (addBlank) newSlidesData.push(" ");
    if (addTitle) {
        const titleText = songAuthor ? `${songName}\n${songAuthor}` : songName;
        newSlidesData.push(titleText);
    }
    
    if (text.trim().length > 0) {
        const lines = text.split('\n').map(l => l.trim() === "" ? null : l.trim()).filter(l => l !== null);
        
        let chunk = [];
        for (let line of lines) {
            chunk.push(line);
            if (chunk.length >= maxLines) {
                newSlidesData.push(chunk.join('\n'));
                chunk = [];
            }
        }
        if (chunk.length > 0) newSlidesData.push(chunk.join('\n'));
    }
    
    slidesData = newSlidesData;
    renderSlides();
    renderQuickCopyList();
}






function updateSlidesRealTime() {
    // Si no hay letra y ambos checkboxes están desactivados, mostrar vacío
    const rawText = document.getElementById('lyricsInput').value;
    if (!rawText.trim() && !document.getElementById('addBlankSlide').checked && !document.getElementById('addTitleSlide').checked) {
        slidesData = [];
        renderSlides();
        renderQuickCopyList();
        return;
    }
    
    refreshSlidesFromCurrentState();
}

// MODIFICAR processLyrics para usar la nueva función
function processLyrics() {
    generateTag();
    refreshSlidesFromCurrentState();
}

// NUEVA FUNCIÓN: Corrige ortografía, capitalización y evita duplicados con la portada
function cleanAndCorrectLyrics() {
    let rawText = document.getElementById('lyricsInput').value;
    if (!rawText.trim()) return;

    const songName = document.getElementById('songName').value.trim().toLowerCase();
    const songAuthor = document.getElementById('songAuthor').value.trim().toLowerCase();

    // 1. Normalizar saltos de línea
    let lines = rawText.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');

    // 2. Eliminar líneas que sean idénticas al título o autor (evitar duplicados en portada)
    lines = lines.filter(line => {
        const l = line.trim().toLowerCase();
        if (!l) return true; // Mantener líneas vacías para separación
        
        // Quitar si coincide con título o autor o combinación común
        if (songName && l === songName) return false;
        if (songAuthor && l === songAuthor) return false;
        if (songName && songAuthor && (l === `${songName} - ${songAuthor}` || l === `${songName} ${songAuthor}`)) return false;
        
        // Quitar etiquetas de metadatos comunes que vienen al pegar de webs de letras
        if (l.startsWith('título:') || l.startsWith('artista:') || l.startsWith('autor:')) return false;
        
        return true;
    });

    // 3. Limpieza de cada línea
    lines = lines.map(line => {
        let l = line.trim();
        if (!l) return "";

        // Capitalizar primera letra de la línea
        l = l.charAt(0).toUpperCase() + l.slice(1);

        // Eliminar puntuación final innecesaria para diapositivas
        l = l.replace(/[,.;]$/, "");

        // Correcciones ortográficas comunes en español de alabanza
        const corrections = [
            { bad: /\bEspiritu\b/gi, good: "Espíritu" },
            { bad: /\bJesus\b/gi, good: "Jesús" },
            { bad: /\bAmen\b/gi, good: "Amén" },
            { bad: /\bCorazon\b/gi, good: "Corazón" },
            { bad: /\bBendicion\b/gi, good: "Bendición" },
            { bad: /\bOracion\b/gi, good: "Oración" },
            { bad: /\bAdoracion\b/gi, good: "Adoración" },
            { bad: /\bDíos\b/gi, good: "Dios" }, // Error común ponerle tilde a Dios
            { bad: /\bCanci[oó]n\b/gi, good: "Canción" },
            { bad: /\bTi\b/gi, good: "ti" }, // "ti" nunca lleva tilde (error común)
            { bad: /\bS[oó]lo\b/gi, good: "Solo" } // RAE recomienda sin tilde
        ];

        corrections.forEach(c => {
            l = l.replace(c.bad, c.good);
        });
        
        return l;
    });

    // 4. Unir y limpiar saltos de línea excesivos
    let cleanedText = lines.join('\n').replace(/\n{3,}/g, '\n\n').trim();

    document.getElementById('lyricsInput').value = cleanedText;
    
    // Procesar para actualizar vista previa
    processLyrics();
    
    // Notificación visual rápida
    const btn = document.querySelector('span[onclick="cleanAndCorrectLyrics()"]');
    const originalHTML = btn.innerHTML;
    btn.innerHTML = `<i class="fa-solid fa-check"></i> ¡Corregido!`;
    setTimeout(() => btn.innerHTML = originalHTML, 1500);
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
    
    // Resetear opciones automáticas para un inicio limpio
    document.getElementById('addBlankSlide').checked = false;
    document.getElementById('addTitleSlide').checked = false;
    
    // NO resetear bgImageData, currentAlignment, etc. para mantener consistencia
    // bgImageData = null;  // <-- COMENTADO para no perder fondo accidentalmente
    
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
        slide.className = 'slide-preview rounded-lg cursor-grab active:cursor-grabbing';
        slide.dataset.index = i;
        
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
        btnAdd.title = "Agregar Diapositiva en Blanco Antes";
        btnAdd.onclick = (e) => { e.stopPropagation(); addBlankSlideBefore(i); };

        // Botón Eliminar
        const btnDel = document.createElement('button');
        btnDel.className = 'overlay-btn delete';
        btnDel.innerHTML = '<i class="fa-solid fa-trash"></i>';
        btnDel.title = "Eliminar Diapositiva";
        btnDel.onclick = (e) => { e.stopPropagation(); deleteSlide(i); };

        // Botón Proyectar (NUEVO)
        const btnProject = document.createElement('button');
        btnProject.className = 'overlay-btn project';
        btnProject.innerHTML = '<i class="fa-solid fa-desktop"></i>';
        btnProject.title = "Proyectar Diapositiva (Pantalla Completa)";
        btnProject.onclick = (e) => { e.stopPropagation(); openProjection(i); };

        overlay.appendChild(btnProject);
        overlay.appendChild(btnEdit);
        overlay.appendChild(btnAdd);
        overlay.appendChild(btnDel);
        
        slide.appendChild(num);
        slide.appendChild(content);
        slide.appendChild(overlay);
        container.appendChild(slide);
    });
    updateStyles();

    // Destruir instancia anterior de Sortable si existe
    if (slidesSortable) {
        slidesSortable.destroy();
        slidesSortable = null;
    }

    // Inicializar Sortable para las diapositivas
    // Reemplaza la parte de Sortable en renderSlides() con esto:
if (container && typeof Sortable !== 'undefined' && slidesData.length > 0) {
    // Destruir instancia anterior si existe
    if (slidesSortable) {
        slidesSortable.destroy();
        slidesSortable = null;
    }
    
    slidesSortable = new Sortable(container, {
        animation: 300,
        ghostClass: 'dragging-ghost',
        dragClass: 'dragging-class',
        handle: '.slide-preview',
        delay: 0, // Sin delay para respuesta inmediata
        delayOnTouchOnly: false,
        touchStartThreshold: 10, // Mayor umbral para evitar scroll accidental
        scroll: true,
        bubbleScroll: true,
        preventOnFilter: false,
        onStart: function() {
            container.style.cursor = 'grabbing';
        },
        onEnd: function(evt) {
            container.style.cursor = '';
            if (evt.oldIndex !== evt.newIndex) {
                const item = slidesData.splice(evt.oldIndex, 1)[0];
                slidesData.splice(evt.newIndex, 0, item);
                
                document.getElementById('addBlankSlide').checked = false;
                document.getElementById('addTitleSlide').checked = false;
                
                renderSlides();
                syncSlidesToLyrics();
                renderQuickCopyList();
            }
        }
    });
}
}

// --- PROYECCIÓN (PANTALLA COMPLETA) ---
let touchStartX = 0;
function openProjection(index) {
    currentProjectionIndex = index;
    renderProjectionSlide();
    
    const modal = document.getElementById('projectionModal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    
    // Intentar activar Fullscreen
    if (modal.requestFullscreen) {
        modal.requestFullscreen().catch(err => {
            console.log('Fullscreen no disponible:', err);
        });
    }

    // Agregar listeners para swipe en móviles
    let touchStartX = 0;
    let touchEndX = 0;
    
    const handleTouchStart = (e) => {
        touchStartX = e.changedTouches[0].screenX;
    };
    
    const handleTouchEnd = (e) => {
        touchEndX = e.changedTouches[0].screenX;
        const swipeThreshold = 50;
        if (touchStartX - touchEndX > swipeThreshold) {
            nextProjectionSlide();
        } else if (touchEndX - touchStartX > swipeThreshold) {
            prevProjectionSlide();
        }
    };
    
    modal.addEventListener('touchstart', handleTouchStart, { passive: true });
    modal.addEventListener('touchend', handleTouchEnd, { passive: true });
    
    // Guardar referencias para limpiar después
    modal._touchStartHandler = handleTouchStart;
    modal._touchEndHandler = handleTouchEnd;
}

function closeProjection() {
    const modal = document.getElementById('projectionModal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    
    // Limpiar listeners
    if (modal._touchStartHandler) {
        modal.removeEventListener('touchstart', modal._touchStartHandler);
        modal.removeEventListener('touchend', modal._touchEndHandler);
    }
    
    currentProjectionIndex = -1;
    
    if (document.fullscreenElement) {
        document.exitFullscreen();
    }
}

function renderProjectionSlide() {
    if (currentProjectionIndex < 0 || currentProjectionIndex >= slidesData.length) return;
    
    const content = document.getElementById('projectionContent');
    const slideText = slidesData[currentProjectionIndex];
    const transparency = document.getElementById('bgTransparency').checked;

    // Estilos actuales
    const font = document.getElementById('fontFamily').value;
    let color = document.getElementById('textColor').value;
    const shadow = document.getElementById('textShadow').checked;
    const isBold = document.getElementById('textBold').checked;
    const size = parseInt(document.getElementById('fontSize').value) || 55;
    const vAlignMap = { 'top': 'flex-start', 'center': 'center', 'bottom': 'flex-end' };
    const hAlignMap = { 'left': 'flex-start', 'center': 'center', 'right': 'flex-end' };

    // Limpiar contenido anterior
    content.innerHTML = '';
    content.style.backgroundSize = 'cover';
    content.style.backgroundPosition = 'center';
    content.style.backgroundRepeat = 'no-repeat';
    
    // Configurar Fondo
    if (bgImageData) {
        if (transparency) {
            content.style.backgroundImage = `linear-gradient(rgba(255,255,255,0.8), rgba(255,255,255,0.8)), url(${bgImageData})`;
        } else {
            content.style.backgroundImage = `url(${bgImageData})`;
        }
        content.style.backgroundColor = 'transparent';
    } else {
        // SIN FONDO: usar blanco
        content.style.backgroundColor = '#FFFFFF';
        content.style.backgroundImage = 'none';
    }

    // Crear contenedor de texto
    const textDiv = document.createElement('div');
    textDiv.className = 'projection-text';
    textDiv.innerText = slideText;
    
    // Aplicar estilos al texto
    textDiv.style.fontFamily = font;
    textDiv.style.color = color;
    textDiv.style.textAlign = currentAlignment;
    textDiv.style.fontWeight = isBold ? 'bold' : 'normal';
    textDiv.style.textShadow = shadow ? '3px 3px 6px rgba(0,0,0,0.8)' : 'none';
    
    // CORRECCIÓN: Mejor cálculo del tamaño de fuente responsivo
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    let baseFontSize = size;
    
    // Escalar basado en el tamaño de la pantalla (más preciso)
    if (windowWidth < 768) {
        baseFontSize = Math.max(24, size * 0.6);
    } else if (windowWidth < 1024) {
        baseFontSize = Math.max(32, size * 0.8);
    } else {
        baseFontSize = size;
    }
    
    // Ajustar aún más basado en la altura de la pantalla
    const scaleByHeight = windowHeight / 768;
    let finalFontSize = Math.min(baseFontSize * scaleByHeight, size * 1.2);
    finalFontSize = Math.max(24, Math.min(120, finalFontSize));
    
    textDiv.style.fontSize = `${finalFontSize}px`;
    
    // Configurar alineación vertical y horizontal
    textDiv.style.display = 'flex';
    textDiv.style.flexDirection = 'column';
    textDiv.style.justifyContent = vAlignMap[currentVerticalAlignment];
    textDiv.style.alignItems = hAlignMap[currentAlignment];
    textDiv.style.width = '85%';
    textDiv.style.height = '85%';
    textDiv.style.padding = '5%';
    textDiv.style.margin = '0';
    textDiv.style.lineHeight = '1.3';
    textDiv.style.whiteSpace = 'pre-wrap';
    textDiv.style.wordBreak = 'break-word';
    textDiv.style.boxSizing = 'border-box';
    
    // Asegurar que el texto no se desborde
    textDiv.style.overflow = 'auto';
    textDiv.style.maxHeight = '100%';
    
    content.appendChild(textDiv);
    
    // Agregar indicador de página (opcional)
    const pageIndicator = document.createElement('div');
    pageIndicator.style.position = 'absolute';
    pageIndicator.style.bottom = '20px';
    pageIndicator.style.right = '20px';
    pageIndicator.style.backgroundColor = 'rgba(0,0,0,0.5)';
    pageIndicator.style.color = 'white';
    pageIndicator.style.padding = '5px 10px';
    pageIndicator.style.borderRadius = '20px';
    pageIndicator.style.fontSize = '12px';
    pageIndicator.style.fontFamily = 'monospace';
    pageIndicator.innerText = `${currentProjectionIndex + 1} / ${slidesData.length}`;
    content.appendChild(pageIndicator);
}

function nextProjectionSlide() {
    if (currentProjectionIndex < slidesData.length - 1) {
        currentProjectionIndex++;
        renderProjectionSlide();
    }
}

function prevProjectionSlide() {
    if (currentProjectionIndex > 0) {
        currentProjectionIndex--;
        renderProjectionSlide();
    }
}

function handleSwipe(start, end) {
    const threshold = 50; // Pixeles mínimos para detectar swipe
    if (start - end > threshold) {
        // Swipe a la izquierda -> Siguiente
        nextProjectionSlide();
    } else if (end - start > threshold) {
        // Swipe a la derecha -> Anterior
        prevProjectionSlide();
    }
}

function closeProjection() {
    const modal = document.getElementById('projectionModal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    currentProjectionIndex = -1;
    
    if (document.fullscreenElement) {
        document.exitFullscreen();
    }
}

// Escuchar teclas para navegación
document.addEventListener('keydown', (e) => {
    // Si la proyección está activa
    if (currentProjectionIndex !== -1) {
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === ' ' || e.key === 'PageDown') {
            e.preventDefault();
            nextProjectionSlide();
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp' || e.key === 'Backspace' || e.key === 'PageUp') {
            e.preventDefault();
            prevProjectionSlide();
        } else if (e.key === 'Escape') {
            e.preventDefault();
            closeProjection();
        }
    }

    if (e.key === 'Escape') {
        closeEditModal();
        closeGallery();
        if (!document.getElementById('quickCopyPanel').classList.contains('translate-x-full')) {
            toggleQuickCopy();
        }
    }
});

function deleteSlide(index) {
    slidesData.splice(index, 1);
    // Si borramos, también desactivamos opciones automáticas para mantener sincronía total
    document.getElementById('addBlankSlide').checked = false;
    document.getElementById('addTitleSlide').checked = false;
    syncSlidesToLyrics();
    renderSlides();
    renderQuickCopyList();
}

function addBlankSlideBefore(index) {
    slidesData.splice(index, 0, " ");
    // Si agregamos manualmente, desactivamos opciones automáticas
    document.getElementById('addBlankSlide').checked = false;
    document.getElementById('addTitleSlide').checked = false;
    syncSlidesToLyrics();
    renderSlides();
    renderQuickCopyList();
}

// Sincroniza los cambios manuales de la vista previa de vuelta al área de texto
function syncSlidesToLyrics() {
    // Al sincronizar manualmente (reordenar, editar, etc), 
    // filtramos las diapositivas que se generan AUTOMÁTICAMENTE por el procesador (Título y Portada)
    // para evitar duplicarlas cuando el usuario vuelva a presionar "Procesar".
    
    let lyricsToSync = [...slidesData];
    
    // Si la primera diapositiva coincide con el Nombre/Autor actual, es probable que sea la de título automática
    const currentName = toTitleCase(document.getElementById('songName').value || "Título");
    const currentAuth = toTitleCase(document.getElementById('songAuthor').value || "");
    const titleText = `${currentName}\n${currentAuth}`;
    
    // Solo removemos si están activas las opciones automáticas, indicando que queremos que el textarea
    // sea solo la letra "pura".
    const addBlank = document.getElementById('addBlankSlide').checked;
    const addTitle = document.getElementById('addTitleSlide').checked;
    
    if (addTitle && lyricsToSync.length > 0) {
        // Buscamos si la de título está al inicio (considerando el blanco opcional)
        const possibleTitleIndex = addBlank ? 1 : 0;
        if (lyricsToSync[possibleTitleIndex] === titleText || lyricsToSync[possibleTitleIndex] === currentName) {
            lyricsToSync.splice(possibleTitleIndex, 1);
        }
    }
    if (addBlank && lyricsToSync.length > 0 && lyricsToSync[0].trim() === "") {
        lyricsToSync.splice(0, 1);
    }

    // Unir con doble salto de línea
    document.getElementById('lyricsInput').value = lyricsToSync.join('\n\n');
}

function updateStyles() {
    const font = document.getElementById('fontFamily').value;
    const color = document.getElementById('textColor').value;
    const shadow = document.getElementById('textShadow').checked;
    const isBold = document.getElementById('textBold').checked;

    const realSize = parseInt(document.getElementById('fontSize').value);
    const previewSize = Math.max(10, realSize * 0.25);
    
    // Mapeo para Flexbox (con flex-direction: column)
    const vAlignMap = { 'top': 'flex-start', 'center': 'center', 'bottom': 'flex-end' };
    const hAlignMap = { 'left': 'flex-start', 'center': 'center', 'right': 'flex-end' };

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
        const transparency = document.getElementById('bgTransparency').checked;
        if (bgImageData) {
            if (transparency) {
                slide.style.backgroundImage = `linear-gradient(rgba(255,255,255,0.8), rgba(255,255,255,0.8)), url(${bgImageData})`;
            } else {
                slide.style.backgroundImage = `url(${bgImageData})`;
            }
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
            // Alineación Vertical con justify-content (en column)
            content.style.justifyContent = vAlignMap[currentVerticalAlignment];
            // Alineación Horizontal con align-items (en column)
            content.style.alignItems = hAlignMap[currentAlignment];
            
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
        // Al editar manualmente, desactivamos las opciones automáticas 
        // para que el textarea refleje exactamente el cambio y no se dupliquen al procesar
        document.getElementById('addBlankSlide').checked = false;
        document.getElementById('addTitleSlide').checked = false;
        
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
            bgImage: bgImageData,
            bgTransparency: document.getElementById('bgTransparency').checked
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
                <button onclick="loadFromRepertoire(${index})" class="text-slate-400 hover:text-blue-400 p-1" title="Cargar en el Editor">
                    <i class="fa-solid fa-arrow-up-from-bracket"></i>
                </button>
                <button onclick="removeRepertoireItem(${index})" class="text-slate-400 hover:text-red-400 p-1" title="Eliminar">
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

function loadFromRepertoire(index) {
    const song = repertoireList[index];
    if (!song) return;

    if (slidesData.length > 0) {
        if (!confirm("Esto reemplazará la canción actual en el editor. ¿Continuar?")) return;
    }

    // Cargar metadatos
    // Intentar separar nombre de autor si están unidos con " - "
    const parts = song.name.split(' - ');
    document.getElementById('songName').value = parts[0] || "";
    document.getElementById('songAuthor').value = parts[1] || "";

    // Cargar estilos
    const st = song.styles;
    if (st) {
        document.getElementById('fontFamily').value = st.font;
        document.getElementById('fontSize').value = st.size;
        document.getElementById('textColor').value = '#' + st.color;
        document.getElementById('textBold').checked = st.bold;
        document.getElementById('textShadow').checked = st.shadow;
        currentAlignment = st.align;
        currentVerticalAlignment = st.valign;
        bgImageData = st.bgImage;
        document.getElementById('bgTransparency').checked = st.bgTransparency || false;
    }

    // Cargar letra (slides)
    // Usamos las diapositivas guardadas y las unimos con doble salto de línea
    // Pero primero filtramos las que son automáticas (Título/Blanco) si es que están guardadas ahí
    let slidesToLoad = [...song.slides];
    
    // El sync ya debería haber limpiado la letra antes de guardar, 
    // pero por seguridad las unimos y dejamos que processLyrics haga su magia
    document.getElementById('lyricsInput').value = slidesToLoad.join('\n\n');

    // Resetear opciones automáticas para que no se dupliquen al procesar
    document.getElementById('addBlankSlide').checked = false;
    document.getElementById('addTitleSlide').checked = false;

    // Actualizar todo
    updateStyles();
    generateTag();
    processLyrics();
    
    // Hacer scroll al editor
    scrollToSection('diapositivas');
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
            
            // CORRECCIÓN: Usar la función auxiliar para obtener el nombre de la fuente
            let fontName = getFontFamilyName(st.font);

            const alignMap = { 'left': 'left', 'center': 'center', 'right': 'right' };
            const vAlignMap = { 'top': 'top', 'center': 'middle', 'bottom': 'bottom' };
            const shadowOpts = st.shadow ? { type: 'outer', angle: 45, blur: 3, offset: 2, opacity: 0.6 } : null;

            // DIAPOSITIVA EN BLANCO (siempre al inicio de cada canción)
            let blankSlide = pptx.addSlide();
            if (st.bgImage) {
                blankSlide.background = { data: st.bgImage };
            } else {
                blankSlide.background = { color: "FFFFFF" };
            }

            // RECORRER LAS DIAPOSITIVAS DE LA CANCIÓN
            for (let i = 0; i < song.slides.length; i++) {
                let text = song.slides[i].trim() || " ";
                
                let slide = pptx.addSlide();
                
                if (st.bgImage) {
                    slide.background = { data: st.bgImage };
                    if (st.bgTransparency) {
                        slide.addShape(pptx.ShapeType.rect, {
                            x: 0, y: 0, w: '100%', h: '100%',
                            fill: { color: 'FFFFFF', transparency: 20 }
                        });
                    }
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
                    paraSpaceAfter: 0,
                    shrinkText: true
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

//pon esto en el lugar correcto
function getFontFamilyName(fontValue) {
    if (fontValue.includes('Arial')) return "Arial";
    if (fontValue.includes('Times')) return "Times New Roman";
    if (fontValue.includes('Impact')) return "Impact";
    if (fontValue.includes('Verdana')) return "Verdana";
    return "Cambria"; // Default
}

// --- PPTX ---
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
        // CORRECCIÓN: Usar la función auxiliar
        const fontName = getFontFamilyName(fontSelect);

        const fontSize = parseInt(document.getElementById('fontSize').value) || 60;
        const fontColor = document.getElementById('textColor').value.replace('#', '');
        const alignMap = { 'left': 'left', 'center': 'center', 'right': 'right' };
        const vAlignMap = { 'top': 'top', 'center': 'middle', 'bottom': 'bottom' };
        const shadow = document.getElementById('textShadow').checked;
        const isBold = document.getElementById('textBold').checked;
        const shadowOpts = shadow ? { type: 'outer', angle: 45, blur: 3, offset: 2, opacity: 0.6 } : null;

        for (let rawText of slidesData) {
            let text = rawText.trim() || " ";
            let slide = pptx.addSlide();

            if (bgImageData) {
                slide.background = { data: bgImageData };
                if (document.getElementById('bgTransparency').checked) {
                    slide.addShape(pptx.ShapeType.rect, {
                        x: 0, y: 0, w: '100%', h: '100%',
                        fill: { color: 'FFFFFF', transparency: 20 }
                    });
                }
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
                paraSpaceAfter: 0,
                shrinkText: true
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
            const transparency = document.getElementById('bgTransparency').checked;
            if (bgImageData) {
                if (transparency) {
                    slide.style.backgroundImage = `linear-gradient(rgba(255,255,255,0.8), rgba(255,255,255,0.8)), url(${bgImageData})`;
                } else {
                    slide.style.backgroundImage = `url(${bgImageData})`;
                }
                slide.style.backgroundSize = 'cover';
                slide.style.backgroundPosition = 'center';
            } else {
                slide.style.backgroundColor = 'white';
            }
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

// 1. PRIMERO: Función auxiliar de limpieza
function cleanLyricsText(text) {
    if (!text) return text;
    
    // Eliminar líneas que parecen metadatos YAML
    const lines = text.split('\n');
    const cleanedLines = lines.filter(line => {
        const lowerLine = line.trim().toLowerCase();
        // Filtrar líneas que parecen configuraciones YAML
        const isYamlLine = 
            lowerLine.startsWith('title:') ||
            lowerLine.startsWith('author:') ||
            lowerLine.startsWith('background:') ||
            lowerLine.startsWith('addblank') ||
            lowerLine.startsWith('addtitle') ||
            lowerLine.startsWith('linesperslide') ||
            lowerLine.startsWith('fontfamily') ||
            lowerLine.startsWith('fontsize') ||
            lowerLine.startsWith('textcolor') ||
            lowerLine.startsWith('textbold') ||
            lowerLine.startsWith('textshadow') ||
            lowerLine.startsWith('alignment') ||
            lowerLine.startsWith('verticalalignment') ||
            lowerLine.startsWith('bgtransparency') ||
            lowerLine === '---';
        
        return !isYamlLine;
    });
    
    return cleanedLines.join('\n');
}

// 2. SEGUNDO: Función auxiliar para parsear booleanos de YAML
function parseYamlBoolean(value) {
    if (typeof value === 'boolean') return value;
    const str = String(value).toLowerCase().trim();
    return str === 'true' || str === 'yes' || str === '1';
}

// 3. TERCERO: Función principal de importación
function parseImportedSong(content) {
    // Normalización inicial de saltos de línea
    const normalizedContent = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const lines = normalizedContent.split('\n');
    
    let title = "";
    let author = "";
    let background = "";
    let lyrics = [];
    let inYaml = false;
    let yamlTitle = "";
    let yamlAuthor = "";
    
    // PRIMERA PASADA: Extraer metadatos YAML y configuración
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim();
        
        // Detectar inicio/fin de YAML front matter
        if (line === "---") {
            if (i === 0 && !inYaml) {
                inYaml = true;
                continue;
            } else if (inYaml) {
                inYaml = false;
                continue;
            }
        }
        
        // Extraer metadatos YAML y configuración
        if (inYaml) {
            // Metadatos básicos
            if (line.toLowerCase().startsWith('title:')) {
                yamlTitle = line.substring(6).trim();
            } 
            else if (line.toLowerCase().startsWith('author:')) {
                yamlAuthor = line.substring(7).trim();
            } 
            else if (line.toLowerCase().startsWith('background:')) {
                background = line.substring(11).trim();
                if (background === 'null' || background === '') {
                    background = null;
                }
            }
            // CONFIGURACIÓN DE DIAPOSITIVAS
            else if (line.toLowerCase().startsWith('addblankSlide:')) {
                const val = line.substring(14).trim();
                document.getElementById('addBlankSlide').checked = parseYamlBoolean(val);
            }
            else if (line.toLowerCase().startsWith('addtitleslide:')) {
                const val = line.substring(14).trim();
                document.getElementById('addTitleSlide').checked = parseYamlBoolean(val);
            }
            else if (line.toLowerCase().startsWith('linesperslide:')) {
                const val = parseInt(line.substring(14).trim());
                if (!isNaN(val) && val >= 1 && val <= 8) {
                    document.getElementById('linesPerSlide').value = val;
                    document.getElementById('linesVal').innerText = val;
                }
            }
            // CONFIGURACIÓN DE FUENTE Y ESTILO
            else if (line.toLowerCase().startsWith('fontfamily:')) {
                const val = line.substring(11).trim();
                const fontSelect = document.getElementById('fontFamily');
                const optionExists = Array.from(fontSelect.options).some(opt => opt.value === val);
                if (optionExists) {
                    fontSelect.value = val;
                }
            }
            else if (line.toLowerCase().startsWith('fontsize:')) {
                const val = parseInt(line.substring(9).trim());
                if (!isNaN(val) && val >= 8 && val <= 200) {
                    document.getElementById('fontSize').value = val;
                }
            }
            else if (line.toLowerCase().startsWith('textcolor:')) {
                const val = line.substring(10).trim();
                if (val.match(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)) {
                    document.getElementById('textColor').value = val;
                }
            }
            else if (line.toLowerCase().startsWith('textbold:')) {
                const val = line.substring(9).trim();
                document.getElementById('textBold').checked = parseYamlBoolean(val);
            }
            else if (line.toLowerCase().startsWith('textshadow:')) {
                const val = line.substring(11).trim();
                document.getElementById('textShadow').checked = parseYamlBoolean(val);
            }
            // CONFIGURACIÓN DE ALINEACIÓN
            else if (line.toLowerCase().startsWith('alignment:')) {
                const val = line.substring(10).trim();
                if (['left', 'center', 'right'].includes(val)) {
                    currentAlignment = val;
                }
            }
            else if (line.toLowerCase().startsWith('verticalalignment:')) {
                const val = line.substring(18).trim();
                if (['top', 'center', 'bottom'].includes(val)) {
                    currentVerticalAlignment = val;
                }
            }
            // CONFIGURACIÓN DE FONDO
            else if (line.toLowerCase().startsWith('bgtransparency:')) {
                const val = line.substring(15).trim();
                document.getElementById('bgTransparency').checked = parseYamlBoolean(val);
            }
            continue;
        }
    }
    
    // SEGUNDA PASADA: Extraer título, autor y letra del cuerpo (si no estaban en YAML)
    let foundTitle = false;
    let foundAuthor = false;
    
    for (let i = 0; i < lines.length; i++) {
        let rawLine = lines[i];
        let line = rawLine.trim();
        
        // Saltar líneas vacías al principio
        if (line === "" && !foundTitle && !foundAuthor && lyrics.length === 0) continue;
        
        // Detectar título Markdown (# Título)
        const titleMatch = line.match(/^#+\s+(.+)$/);
        if (titleMatch && !foundTitle && !yamlTitle) {
            title = titleMatch[1].trim();
            foundTitle = true;
            continue;
        }
        
        // Detectar autor (varios formatos)
        const authorMatch1 = line.match(/^\*\*Autor:\*\*\s*(.+)$/i);
        const authorMatch2 = line.match(/^Autor:\s*(.+)$/i);
        const authorMatch3 = line.match(/^@\s*(.+)$/i);
        
        if ((authorMatch1 || authorMatch2 || authorMatch3) && !foundAuthor && !yamlAuthor) {
            const match = authorMatch1 || authorMatch2 || authorMatch3;
            author = match[1].trim();
            foundAuthor = true;
            continue;
        }
        
        // Si ya pasamos los metadatos, todo lo demás es letra
        if (foundTitle || foundAuthor || !line.match(/^#|^\*\*Autor|^Autor:|^@/)) {
            lyrics.push(rawLine);
        }
    }
    
    // Priorizar metadatos YAML sobre los del cuerpo
    if (yamlTitle) title = yamlTitle;
    if (yamlAuthor) author = yamlAuthor;
    
    // Limpiar título de posibles caracteres no deseados
    title = title.replace(/[#*_]/g, '').trim();
    author = author.replace(/[#*_]/g, '').trim();
    
    // Si el título parece una etiqueta (#Algo), extraer solo el nombre
    if (title.startsWith('#')) {
        const tagMatch = title.match(/^#([^(]+)/);
        if (tagMatch) {
            title = tagMatch[1].trim();
        }
    }
    
    // Si no hay título, usar un valor por defecto
    if (!title) title = "Canción sin título";
    
    // Limpiar la letra: eliminar líneas que sean solo metadatos repetidos
    const cleanLyrics = lyrics.filter(line => {
        const trimmed = line.trim();
        if (trimmed === "") return true;
        // Eliminar líneas que sean exactamente el título o autor ya procesados
        if (trimmed === `# ${title}`) return false;
        if (trimmed === `**Autor:** ${author}`) return false;
        if (trimmed === `Autor: ${author}`) return false;
        if (trimmed === `@${author}`) return false;
        return true;
    });
    
    // ASIGNAR VALORES AL EDITOR
    document.getElementById('songName').value = title;
    document.getElementById('songAuthor').value = author || "";
    
    // Unir la letra con saltos de línea
    let lyricsText = cleanLyrics.join('\n');
    
    // === APLICAR LIMPIEZA ADICIONAL ===
    lyricsText = cleanLyricsText(lyricsText);
    
    // Eliminar saltos de línea excesivos al inicio y final
    lyricsText = lyricsText.replace(/^\n+/, '').replace(/\n+$/, '');
    document.getElementById('lyricsInput').value = lyricsText;
    
    // Cargar fondo si existe y es válido
    if (background && background !== 'null' && background !== '' && background !== 'null') {
        if (background.startsWith('http') || background.startsWith('data:') || background.startsWith('/')) {
            bgImageData = background;
        } else {
            bgImageData = null;
        }
    } else {
        bgImageData = null;
    }
    
    // Actualizar los estilos visuales
    updateStyles();
    
    // Generar la etiqueta automáticamente
    generateTag();
    
    // Procesar las diapositivas con la nueva configuración
    processLyrics();
    
    // Mostrar mensaje de éxito con los datos cargados
    let configLoaded = [];
    if (document.getElementById('addBlankSlide').checked) configLoaded.push("Slide vacío");
    if (document.getElementById('addTitleSlide').checked) configLoaded.push("Portada");
    
    alert(`✅ Canción importada correctamente!\n\n` +
          `📌 Título: ${title}\n` +
          `✍️ Autor: ${author || "(No especificado)"}\n` +
          `📄 Diapositivas: ${slidesData.length} generadas\n` +
          `⚙️ Configuración: ${configLoaded.length ? configLoaded.join(', ') : 'Ninguna'}\n` +
          `🖼️ Fondo: ${bgImageData ? 'Cargado' : 'Sin fondo'}`);
}

// También permitir importar canciones guardadas previamente (exportar como .md)
function exportSongAsMarkdown() {
    const name = document.getElementById('songName').value.trim() || "Sin título";
    const author = document.getElementById('songAuthor').value.trim();
    
    // Limpiar el nombre de cualquier formato de etiqueta
    let cleanName = name;
    if (cleanName.startsWith('#')) {
        const tagMatch = cleanName.match(/^#([^(]+)/);
        if (tagMatch) {
            cleanName = tagMatch[1].trim();
        }
    }
    
    // Obtener la configuración actual
    const addBlank = document.getElementById('addBlankSlide').checked;
    const addTitle = document.getElementById('addTitleSlide').checked;
    const linesPerSlide = document.getElementById('linesPerSlide').value;
    const fontFamily = document.getElementById('fontFamily').value;
    const fontSize = document.getElementById('fontSize').value;
    const textColor = document.getElementById('textColor').value;
    const textBold = document.getElementById('textBold').checked;
    const textShadow = document.getElementById('textShadow').checked;
    const alignment = currentAlignment;
    const verticalAlignment = currentVerticalAlignment;
    const bgTransparency = document.getElementById('bgTransparency').checked;
    
    // Construir el front matter YAML mejorado con toda la configuración
    let markdown = "---\n";
    markdown += `title: ${cleanName}\n`;
    if (author) markdown += `author: ${author}\n`;
    markdown += `background: ${bgImageData || 'null'}\n`;
    markdown += `addBlankSlide: ${addBlank}\n`;
    markdown += `addTitleSlide: ${addTitle}\n`;
    markdown += `linesPerSlide: ${linesPerSlide}\n`;
    markdown += `fontFamily: ${fontFamily}\n`;
    markdown += `fontSize: ${fontSize}\n`;
    markdown += `textColor: ${textColor}\n`;
    markdown += `textBold: ${textBold}\n`;
    markdown += `textShadow: ${textShadow}\n`;
    markdown += `alignment: ${alignment}\n`;
    markdown += `verticalAlignment: ${verticalAlignment}\n`;
    markdown += `bgTransparency: ${bgTransparency}\n`;
    markdown += "---\n\n";
    
    // Título en formato Markdown
    markdown += `# ${cleanName}\n\n`;
    
    // Autor en formato legible
    if (author) {
        markdown += `**Autor:** ${author}\n\n`;
    }
    
    // La letra (usando slidesData para preservar la estructura exacta)
    if (slidesData.length > 0) {
        // Filtrar la portada y slide vacío si están marcados como automáticos
        let lyricsToExport = [...slidesData];
        
        // Si la portada está activada automáticamente, la removemos del texto de letra
        if (addTitle && lyricsToExport.length > 0) {
            const titleText = author ? `${cleanName}\n${author}` : cleanName;
            const blankIndex = addBlank ? 1 : 0;
            if (lyricsToExport[blankIndex] === titleText || lyricsToExport[blankIndex] === cleanName) {
                lyricsToExport.splice(blankIndex, 1);
            }
        }
        
        // Si el slide vacío está activado automáticamente, lo removemos
        if (addBlank && lyricsToExport.length > 0 && lyricsToExport[0].trim() === "") {
            lyricsToExport.splice(0, 1);
        }
        
        // Unir con doble salto de línea para preservar la estructura de diapositivas
        markdown += lyricsToExport.join('\n\n');
    } else {
        // Fallback al textarea
        const lyrics = document.getElementById('lyricsInput').value.trim();
        markdown += lyrics;
    }
    
    // Asegurar que termine con un salto de línea
    if (!markdown.endsWith('\n')) {
        markdown += '\n';
    }
    
    // Descargar archivo
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const safeName = cleanName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    a.download = `${safeName}.md`;
    a.click();
    URL.revokeObjectURL(url);
    
    // Mostrar resumen de lo exportado
    let configSummary = [];
    if (addBlank) configSummary.push("Slide vacío");
    if (addTitle) configSummary.push("Portada");
    configSummary.push(`${linesPerSlide} líneas/diapositiva`);
    
    alert(`✅ Canción exportada correctamente!\n\n` +
          `📌 Archivo: ${safeName}.md\n` +
          `📋 Título: ${cleanName}\n` +
          `✍️ Autor: ${author || "(No especificado)"}\n` +
          `⚙️ Configuración: ${configSummary.join(', ')}\n` +
          `🖼️ Fondo: ${bgImageData ? 'Incluido' : 'No incluido'}\n\n` +
          `💡 Puedes importar este archivo usando el botón "Importar .md"`);
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
        
        let title = "";
        let author = "";
        let extractedSlides = [];
        
        // 2. Extraer metadatos (título y autor) de core.xml
        if (zip.files['docProps/core.xml']) {
            const coreXml = await zip.files['docProps/core.xml'].async('string');
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(coreXml, "text/xml");
            title = xmlDoc.getElementsByTagName("dc:title")[0]?.textContent || "";
            author = xmlDoc.getElementsByTagName("dc:creator")[0]?.textContent || "";
        }

        // 3. Extraer y limpiar texto de cada diapositiva
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
            
            // FILTRO MEJORADO: Ignorar diapositivas que contienen metadatos YAML o configuraciones
            const lowerText = slideText.toLowerCase();
            const isMetadataSlide = 
                lowerText.includes("title:") ||
                lowerText.includes("author:") ||
                lowerText.includes("background:") ||
                lowerText.includes("addblank") ||
                lowerText.includes("addtitle") ||
                lowerText.includes("linesperslide") ||
                lowerText.includes("fontfamily") ||
                lowerText.includes("fontsize") ||
                lowerText.includes("textcolor") ||
                lowerText.includes("textbold") ||
                lowerText.includes("textshadow") ||
                lowerText.includes("alignment") ||
                lowerText.includes("verticalalignment") ||
                lowerText.includes("bgtransparency") ||
                lowerText === "---" ||
                slideText === "";
            
            // También filtrar diapositivas que solo contienen "---" o son de la librería
            const isLibraryText = lowerText.includes("pptxgenjs");
            
            if (slideText && !isMetadataSlide && !isLibraryText) {
                extractedSlides.push(slideText);
            }
        }
        
        // Limpieza final de título y autor
        if (title && (title.toLowerCase().includes("pptxgenjs") || title === "")) {
            title = file.name.replace(/\.pptx$/i, '');
        }
        if (author && author.toLowerCase().includes("pptxgenjs")) {
            author = "";
        }
        
        // Si no se encontró título, usar el nombre del archivo
        if (!title) {
            title = file.name.replace(/\.pptx$/i, '');
        }
        
        // Si el título parece una etiqueta (#Algo), extraer solo el nombre
        if (title.startsWith('#')) {
            const tagMatch = title.match(/^#([^(]+)/);
            if (tagMatch) {
                title = tagMatch[1].trim();
            }
        }
        
        // Limpiar título y autor de caracteres especiales
        title = title.replace(/[#*_]/g, '').trim();
        author = author.replace(/[#*_]/g, '').trim();
        
        // 4. CONSTRUIR EL NUEVO FORMATO MD
        let markdown = "---\n";
        markdown += `title: ${title}\n`;
        if (author) markdown += `author: ${author}\n`;
        markdown += `background: null\n`;
        
        // CONFIGURACIÓN PREDETERMINADA (sensata para worship)
        markdown += `addBlankSlide: false\n`;  // CAMBIADO: false por defecto
        markdown += `addTitleSlide: false\n`;  // CAMBIADO: false por defecto
        markdown += `linesPerSlide: 2\n`;
        markdown += `fontFamily: Cambria\n`;
        markdown += `fontSize: 55\n`;
        markdown += `textColor: #000000\n`;
        markdown += `textBold: true\n`;
        markdown += `textShadow: false\n`;
        markdown += `alignment: center\n`;
        markdown += `verticalAlignment: center\n`;
        markdown += `bgTransparency: false\n`;
        markdown += "---\n\n";
        
        // Título en formato Markdown
        markdown += `# ${title}\n\n`;
        
        // Autor en formato legible
        if (author) {
            markdown += `**Autor:** ${author}\n\n`;
        }
        
        // LA LETRA: Unir solo las diapositivas que son contenido real
        if (extractedSlides.length > 0) {
            // Limpiar cada slide
            const cleanedSlides = extractedSlides.map(slide => {
                // Eliminar espacios múltiples
                return slide.replace(/\s+/g, ' ').trim();
            });
            markdown += cleanedSlides.join('\n\n');
        } else {
            markdown += "*No se pudo extraer texto significativo del archivo PPTX.*";
        }
        
        // Asegurar que termine con un salto de línea
        if (!markdown.endsWith('\n')) {
            markdown += '\n';
        }
        
        // 5. Descargar el archivo MD
        const blob = new Blob([markdown], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const safeName = title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        a.download = `${safeName}.md`;
        a.click();
        URL.revokeObjectURL(url);
        
        alert(`✅ ¡Conversión exitosa!\n\n` +
              `📌 Título: ${title}\n` +
              `✍️ Autor: ${author || "(No detectado)"}\n` +
              `📄 Diapositivas de contenido: ${extractedSlides.length}\n` +
              `⚙️ Configuración: addBlankSlide: false, addTitleSlide: false\n\n` +
              `💡 Las opciones de portada y slide vacío están DESACTIVADAS por defecto,\n` +
              `   ya que el PPTX original ya contiene su propia estructura.`);
        
    } catch (error) {
        console.error("Error al convertir PPTX:", error);
        alert("Error al procesar el archivo PPTX: " + error.message);
    } finally {
        hideGlobalLoader();
        input.value = "";
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