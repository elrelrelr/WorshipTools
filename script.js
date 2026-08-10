console.log("Script.js cargado correctamente.");

// --- DATA ---
// Rutas de imágenes que realmente existen en la carpeta
const galleryImages = [
    // Fondos
    'imagenes/fondo1.jpg', 'imagenes/fondo2.jpg', 'imagenes/fondo5.jpg', 'imagenes/fondo6.jpg', 
    'imagenes/fondo7.jpg', 'imagenes/fondo8.jpg', 'imagenes/fondo9.jpg', 'imagenes/fondo10.jpg', 
    'imagenes/fondo11.jpg', 'imagenes/fondo12.jpg', 'imagenes/fondo13.jpg', 'imagenes/fondo14.jpg', 
    'imagenes/fondo15.jpg', 'imagenes/fondo16.jpg', 'imagenes/fondo17.jpg', 'imagenes/fondo18.jpg', 
    'imagenes/fondo19.jpg', 'imagenes/fondo20.jpg', 'imagenes/fondo21.jpg', 'imagenes/fondo22.jpg', 
    'imagenes/fondo23.jpg', 'imagenes/fondo24.jpg', 'imagenes/fondo25.jpg', 'imagenes/fondo26.jpg', 
    'imagenes/fondo27.jpg',
    // GIFs (Se han verificado que solo existen del 1 al 7)
    'imagenes/gif1.gif', 'imagenes/gif2.gif', 'imagenes/gif3.gif', 'imagenes/gif4.gif', 
    'imagenes/gif5.gif', 'imagenes/gif6.gif', 'imagenes/gif7.gif', 'imagenes/gif8.gif', 'imagenes/gif9.gif', 'imagenes/gif10.gif', 'imagenes/gif11.gif', 'imagenes/gif12.gif'
];

// --- ESTADO ---
let slidesData = [];
let bgImageData = null;
let bgRegistry = {}; // { id: "base64data" }
let nextBgId = 1;
let globalBgImageId = null; // ID del fondo global para etiquetas FONDOGENERAL

let currentEditingIndex = -1;
let currentProjectionIndex = -1;

// Selección y Deshacer
let selectedSlides = new Set();
let historyStack = [];
let selectionMode = false;

let currentAlignment = 'center';
let currentVerticalAlignment = 'center';
let generatedTagString = "";

// Estado Tema
let isDarkMode = true;

// Estado Repertoire (PPTX Queue)
let repertoireList = [];
// Estructura: [{ name, slides, styles, bgRegistrySnapshot, insertions: [{ afterSlide: number, slides: array, songName: string }] }]

// Sortable instance for slides
let slidesSortable = null;

// Estado Secciones
let instrumentosVisible = false;
let repertorioVisible = false;
let editorVisible = true;

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
    const themeText = document.getElementById('themeText');
    if (isDarkMode) {
        icon.className = 'fa-solid fa-sun text-yellow-100';
        if (iconMobile) iconMobile.className = 'fa-solid fa-sun text-yellow-100';
        if (themeText) themeText.innerText = 'Modo Claro';
    } else {
        icon.className = 'fa-solid fa-moon text-slate-700 dark:text-slate-200';
        if (iconMobile) iconMobile.className = 'fa-solid fa-moon text-slate-700';
        if (themeText) themeText.innerText = 'Modo Oscuro';
    }
}

function toggleEditor() {
    const container = document.getElementById('editorContainer');
    const icon = document.getElementById('editorIcon');
    const text = document.getElementById('editorText');

    editorVisible = !editorVisible;

    if (editorVisible) {
        container.classList.remove('hidden');
        icon.className = 'fa-solid fa-chevron-up';
        text.innerText = 'Ocultar';
    } else {
        container.classList.add('hidden');
        icon.className = 'fa-solid fa-chevron-down';
        text.innerText = 'Mostrar';
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
        // Remover tildes y acentos (para el resultado etiqueta)
        generatedTagString = generatedTagString.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
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
function insertBlankSlide() {
    const input = document.getElementById('lyricsInput');
    const val = input.value.trim();
    input.value = "[VACIO]\n\n" + (val ? val : "");
    processLyrics();
}

function insertTitleSlide() {
    const songName = toTitleCase(document.getElementById('songName').value || "Título");
    const songAuthor = toTitleCase(document.getElementById('songAuthor').value || "");
    const titleText = songAuthor ? `${songName}\n(${songAuthor})` : songName;
    const input = document.getElementById('lyricsInput');
    const val = input.value.trim();
    input.value = "[TITULO]\n" + titleText + "\n\n" + (val ? val : "");
    processLyrics();
}

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
    
    const maxLines = parseInt(document.getElementById('linesPerSlide').value) || 1;
    const addBlank = document.getElementById('addBlankSlide').checked;
    const addTitle = document.getElementById('addTitleSlide').checked;
    
    const songName = toTitleCase(document.getElementById('songName').value || "Título");
    const songAuthor = toTitleCase(document.getElementById('songAuthor').value || "");
    
    let newSlidesData = [];
    
    if (addBlank) newSlidesData.push({ text: " ", isTitle: false, bgEffect: false });
    if (addTitle) {
        const titleText = songAuthor ? `${songName}\n(${songAuthor})` : songName;
        newSlidesData.push({ text: titleText, isTitle: true, bgEffect: false });
    }
    
    if (text.trim().length > 0) {
        const lines = text.split('\n').map(l => l.trim());
        
        let chunk = [];
        let isTitleChunk = false;
        let bgEffectChunk = false;
        let bgImageIdChunk = null;
        let currentGlobalBgId = null; // Para FONDOGENERAL
        
        for (let idx = 0; idx < lines.length; idx++) {
            let line = lines[idx];
            if (line === "") continue;
            
            let isBlankTag = false;
            while (true) {
                if (line.toUpperCase().startsWith('[TITULO]')) {
                    isTitleChunk = true;
                    line = line.substring(8).trim();
                    continue;
                }
                if (line.toUpperCase().startsWith('[FONDO_OSCURO]')) {
                    bgEffectChunk = 'dark';
                    line = line.substring(14).trim();
                    continue;
                }
                if (line.toUpperCase().startsWith('[ATENUADO]')) {
                    bgEffectChunk = 'dark';
                    line = line.substring(10).trim();
                    continue;
                }
                if (line.toUpperCase().startsWith('[FONDO_CLARO]')) {
                    bgEffectChunk = 'light';
                    line = line.substring(13).trim();
                    continue;
                }
                if (line.toUpperCase().startsWith('[VACIO]')) {
                    isBlankTag = true;
                    line = line.substring(7).trim();
                    continue;
                }
                if (line.toUpperCase().startsWith('[FONDOGENERAL:')) {
                    const match = line.match(/^\[FONDOGENERAL:([^\]]+)\]/i);
                    if (match) {
                        currentGlobalBgId = match[1];
                        bgImageIdChunk = currentGlobalBgId; // Aplicar global a este slide
                        line = line.substring(match[0].length).trim();
                        continue;
                    }
                }
                if (line.toUpperCase().startsWith('[FONDO:')) {
                    const match = line.match(/^\[FONDO:([^\]]+)\]/i);
                    if (match) {
                        bgImageIdChunk = match[1];
                        currentGlobalBgId = null; // FONDO individual rompe el global
                        line = line.substring(match[0].length).trim();
                        continue;
                    }
                }
                break;
            }
            
            if (isBlankTag) {
                if (chunk.length > 0) {
                    if (isTitleChunk && songAuthor) {
                        for (let i = 0; i < chunk.length; i++) {
                            if (chunk[i].toLowerCase() === songAuthor.toLowerCase()) {
                                chunk[i] = `(${chunk[i]})`;
                            }
                        }
                    }
                    newSlidesData.push({ text: chunk.join('\n'), isTitle: isTitleChunk, bgEffect: bgEffectChunk, bgImageId: bgImageIdChunk });
                    chunk = [];
                }
                newSlidesData.push({ text: " ", isTitle: isTitleChunk, bgEffect: bgEffectChunk, bgImageId: bgImageIdChunk });
                isTitleChunk = false;
                bgEffectChunk = false;
                bgImageIdChunk = null;
                if (line === "") continue;
            }
            
            if (line === "") continue;
            
            chunk.push(line);
            
            let flush = chunk.length >= maxLines;
            if (isTitleChunk && chunk.length === 1) {
                let hasAuthorNext = false;
                for (let k = idx + 1; k < lines.length; k++) {
                    if (lines[k].startsWith('[')) break;
                    if (lines[k].trim() !== "") {
                        if (lines[k].trim().startsWith('(') && lines[k].trim().endsWith(')')) {
                            hasAuthorNext = true;
                        }
                        break;
                    }
                }
                if (hasAuthorNext) {
                    flush = false;
                }
            } else if (isTitleChunk && chunk.length >= 2) {
                flush = true;
            }
            
            if (flush) {
                if (isTitleChunk && songAuthor) {
                    for (let i = 0; i < chunk.length; i++) {
                        if (chunk[i].toLowerCase() === songAuthor.toLowerCase()) {
                            chunk[i] = `(${chunk[i]})`;
                        }
                    }
                }
                newSlidesData.push({ text: chunk.join('\n'), isTitle: isTitleChunk, bgEffect: bgEffectChunk, bgImageId: bgImageIdChunk });
                chunk = [];
                isTitleChunk = false;
                bgEffectChunk = false;
                // Mantener currentGlobalBgId para el siguiente slide
                bgImageIdChunk = currentGlobalBgId;
            }
        }
        if (chunk.length > 0) {
            if (isTitleChunk && songAuthor) {
                for (let i = 0; i < chunk.length; i++) {
                    if (chunk[i].toLowerCase() === songAuthor.toLowerCase()) {
                        chunk[i] = `(${chunk[i]})`;
                    }
                }
            }
            newSlidesData.push({ text: chunk.join('\n'), isTitle: isTitleChunk, bgEffect: bgEffectChunk, bgImageId: bgImageIdChunk });
        }
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
    syncSlidesToLyrics();
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
        
        // Quitar etiquetas de metadatos comunes que vienen al pegar de webs de letras
        if (l.startsWith('título:') || l.startsWith('artista:') || l.startsWith('autor:')) return false;
        
        return true;
    });

    // 3. Limpieza de cada línea (solo capitaliza primera línea de cada estrofa)
    let prevLineEmpty = true;
    lines = lines.map(line => {
        let l = line.trim();
        if (!l) {
            prevLineEmpty = true;
            return "";
        }

        // Solo capitalizar si es la primera línea después de un salto (inicio de estrofa)
        if (prevLineEmpty) {
            l = l.charAt(0).toUpperCase() + l.slice(1);
        }
        prevLineEmpty = false;

        // Eliminar puntuación final innecesaria para diapositivas
        l = l.replace(/[,.;]$/, "");

        // Correcciones ortográficas comunes en español de alabanza y gramática general
        const corrections = [
            // Divinidad (Asegurar tildes y mayúsculas en contextos de adoración)
            { bad: /\bEspiritu\b/gi, good: "Espíritu" },
            { bad: /\bJesus\b/gi, good: "Jesús" },
            { bad: /\bCorazon\b/gi, good: "Corazón" },
            { bad: /\bBendicion\b/gi, good: "Bendición" },
            { bad: /\bOracion\b/gi, good: "Oración" },
            { bad: /\bAdoracion\b/gi, good: "Adoración" },
            { bad: /\bExaltacion\b/gi, good: "Exaltación" },
            { bad: /\bProclamacion\b/gi, good: "Proclamación" },
            { bad: /\bRedencion\b/gi, good: "Redención" },
            { bad: /\bSalvacion\b/gi, good: "Salvación" },
            { bad: /\bComunion\b/gi, good: "Comunión" },
            { bad: /\bResurreccion\b/gi, good: "Resurrección" },
            { bad: /\bPasión\b/gi, good: "Pasión" },
            { bad: /\bUncion\b/gi, good: "Unción" },
            { bad: /\bLiberacion\b/gi, good: "Liberación" },
            { bad: /\bPerdon\b/gi, good: "Perdón" },
            { bad: /\bCreacion\b/gi, good: "Creación" },
            { bad: /\bNacion\b/gi, good: "Nación" },
            { bad: /\bTentacion\b/gi, good: "Tentación" },
            { bad: /\bDireccion\b/gi, good: "Dirección" },

            // Palabras frecuentes en cantos
            { bad: /\bAmen\b/gi, good: "Amén" },
            { bad: /\bCanci[oó]n\b/gi, good: "Canción" },
            { bad: /\bAlabare\b/gi, good: "Alabaré" },
            { bad: /\bCantare\b/gi, good: "Cantaré" },
            { bad: /\bAdorare\b/gi, good: "Adoraré" },
            { bad: /\bBuscare\b/gi, good: "Buscaré" },
            { bad: /\bEstare\b/gi, good: "Estaré" },
            { bad: /\bReinara\b/gi, good: "Reinará" },
            { bad: /\bVendra\b/gi, good: "Vendrá" },
            { bad: /\bSera\b/gi, good: "Será" },
            { bad: /\bAlla\b/gi, good: "Allá" },
            { bad: /\bAqui\b/gi, good: "Aquí" },
            { bad: /\bAsi\b/gi, good: "Así" },
            { bad: /\bIncomparable\b/gi, good: "Incomparable" },
            { bad: /\bMajestad\b/gi, good: "Majestad" },
            { bad: /\bSantidad\b/gi, good: "Santidad" },
            { bad: /\bEternidad\b/gi, good: "Eternidad" },
            { bad: /\bPro jimo\b/gi, good: "Prójimo" },
            { bad: /\bProjimo\b/gi, good: "Prójimo" },

            // Errores de tildación "excesiva" o incorrecta (RAE)
            { bad: /\bDíos\b/gi, good: "Dios" },    // Dios no lleva tilde
            { bad: /\bTi\b/gi, good: "ti" },        // ti no lleva tilde
            { bad: /\bFe\b/gi, good: "fe" },        // fe no lleva tilde
            { bad: /\bDio\b/gi, good: "dio" },      // dio no lleva tilde
            { bad: /\bVio\b/gi, good: "vio" },      // vio no lleva tilde
            { bad: /\bFue\b/gi, good: "fue" },      // fue no lleva tilde
            { bad: /\bFui\b/gi, good: "fui" },      // fui no lleva tilde
            { bad: /\bS[oó]lo\b/gi, good: "Solo" }, // Solo ya no lleva tilde según RAE
            { bad: /\bEspirítu\b/gi, good: "Espíritu" }, // Error de tilde en la i
            { bad: /\bAngel\b/gi, good: "Ángel" }
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
    slidesData.forEach((slideObj, i) => {
        const slide = document.createElement('div');
        slide.className = 'slide-preview rounded-lg cursor-grab active:cursor-grabbing';
        slide.dataset.index = i;
        
        const num = document.createElement('div');
        num.className = 'slide-number';
        num.innerText = i + 1;
        
        const content = document.createElement('div');
        content.className = 'slide-content';
        content.innerText = slideObj.text;
        
        // Multi-select checkbox (visible only in selection mode or when selected)
        const checkboxWrap = document.createElement('div');
        checkboxWrap.className = 'slide-checkbox-wrap';
        checkboxWrap.innerHTML = `<input type="checkbox" class="slide-checkbox accent-blue-600 cursor-pointer shadow-sm rounded" ${selectedSlides.has(i) ? 'checked' : ''}>`;
        checkboxWrap.onclick = (e) => {
            e.stopPropagation();
            toggleSlideSelection(i);
        };
        slide.appendChild(checkboxWrap);
        if (selectedSlides.has(i)) {
            slide.classList.add('selected-slide', 'ring-2', 'ring-blue-500');
        }

        // Click on the slide itself toggles selection when in selection mode
        slide.addEventListener('click', function(e) {
            if (selectionMode) {
                toggleSlideSelection(i);
            }
        });

        // Overlay de acciones
        const overlay = document.createElement('div');
        overlay.className = 'slide-overlay';

        const createBtn = (cls, icon, tooltip, onClick) => {
            const btn = document.createElement('button');
            btn.className = `overlay-btn ${cls} custom-tooltip-container`;
            btn.innerHTML = `<i class="${icon}"></i><span class="custom-tooltip">${tooltip}</span>`;
            btn.onclick = onClick;
            return btn;
        };

        const btnTitle = createBtn(
            `title-toggle ${slideObj.isTitle ? 'active' : ''}`, 
            'fa-solid fa-heading', 
            slideObj.isTitle ? "Quitar Título" : "Marcar como Título", 
            (e) => { 
                e.stopPropagation(); 
                slidesData[i].isTitle = !slidesData[i].isTitle;
                syncSlidesToLyrics();
                renderSlides();
            }
        );

        const btnProject = createBtn('project', 'fa-solid fa-desktop', "Proyectar", (e) => { e.stopPropagation(); openProjection(i); });
        const btnEdit = createBtn('', 'fa-solid fa-pen', "Editar", (e) => { e.stopPropagation(); openEditModal(i); });
        const btnBg = createBtn('bg-individual', 'fa-solid fa-image', "Fondo propio", (e) => { 
            e.stopPropagation(); 
            window.targetBgSlideIndex = i;
            openGallery('individual');
        });
        const btnAdd = createBtn('add', 'fa-solid fa-plus', "Agregar Vacío", (e) => { e.stopPropagation(); addBlankSlideBefore(i); });
        const btnDel = createBtn('delete', 'fa-solid fa-trash', "Eliminar Diapositiva", (e) => { e.stopPropagation(); deleteSlide(i); });

        // Botón Arrastrar (Handle) - MODIFICADO para tener tooltip a la izquierda
        const dragHandle = document.createElement('div');
        dragHandle.className = 'drag-handle custom-tooltip-container';
        dragHandle.innerHTML = '<i class="fa-solid fa-grip-vertical"></i><span class="custom-tooltip tooltip-left">Arrastrar</span>';
        
        // Per-slide background check - show indicator if this slide has its own bg
        const hasOwnBg = slideObj.bgImageId && bgRegistry[slideObj.bgImageId];
        if (hasOwnBg) {
            slide.classList.add('own-bg');
        }

        overlay.appendChild(btnTitle);
        overlay.appendChild(btnProject);
        overlay.appendChild(btnEdit);
        overlay.appendChild(btnBg);
        overlay.appendChild(btnAdd);
        overlay.appendChild(btnDel);

        const dimBtn = document.createElement('div');
        let effectIcon = 'fa-circle-half-stroke';
        let effectTooltip = 'Oscurecer Fondo';
        let activeClass = '';
        if (slideObj.bgEffect === 'dark') {
            effectIcon = 'fa-moon';
            effectTooltip = 'Aclarar Fondo';
            activeClass = 'active-dark';
        } else if (slideObj.bgEffect === 'light') {
            effectIcon = 'fa-sun';
            effectTooltip = 'Fondo Normal';
            activeClass = 'active-light';
        }

        dimBtn.className = `dim-btn custom-tooltip-container ${activeClass}`;
        dimBtn.innerHTML = `<i class="fa-solid ${effectIcon}"></i><span class="custom-tooltip tooltip-right">${effectTooltip}</span>`;
        dimBtn.onclick = (e) => { 
            e.stopPropagation(); 
            if (!slidesData[i].bgEffect) slidesData[i].bgEffect = 'dark';
            else if (slidesData[i].bgEffect === 'dark') slidesData[i].bgEffect = 'light';
            else slidesData[i].bgEffect = false;
            syncSlidesToLyrics();
            renderSlides();
        };

        overlay.appendChild(dimBtn);

        slide.appendChild(dragHandle);
        slide.appendChild(content);
        slide.appendChild(overlay);
        // Apply per-slide background if this slide has its own bgImageId
        if (slideObj.bgImageId && bgRegistry[slideObj.bgImageId]) {
            const bgData = bgRegistry[slideObj.bgImageId];
            if (slideObj.bgEffect === 'light') {
                slide.style.backgroundImage = `linear-gradient(rgba(255,255,255,0.8), rgba(255,255,255,0.8)), url(${bgData})`;
            } else if (slideObj.bgEffect === 'dark') {
                slide.style.backgroundImage = `linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7)), url(${bgData})`;
            } else {
                slide.style.backgroundImage = `url(${bgData})`;
            }
            slide.style.backgroundSize = 'cover';
            slide.style.backgroundPosition = 'center';
            slide.style.backgroundColor = 'transparent';
        }
        container.appendChild(slide);
    });
    updateStyles();

    // Destruir instancia anterior de Sortable si existe
    if (slidesSortable) {
        slidesSortable.destroy();
        slidesSortable = null;
    }

    // Inicializar Sortable para las diapositivas
    if (container && typeof Sortable !== 'undefined' && slidesData.length > 0) {
        slidesSortable = new Sortable(container, {
            animation: 300,
            ghostClass: 'dragging-ghost',
            dragClass: 'dragging-class',
            handle: '.drag-handle', // USAR EL HANDLE
            delay: 0,
            delayOnTouchOnly: false,
            touchStartThreshold: 10,
            scroll: true,
            bubbleScroll: true,
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
    const currentSlide = slidesData[currentProjectionIndex];
    const slideText = currentSlide ? currentSlide.text : "";
    const isTitle = currentSlide ? currentSlide.isTitle : false;
    const bgEffect = currentSlide ? currentSlide.bgEffect : false;
    const transparency = document.getElementById('bgTransparency').checked;

    // Estilos actuales
    const font = document.getElementById('fontFamily').value;
    let color = document.getElementById('textColor').value;
    const shadow = document.getElementById('textShadow').checked;
    const shadowColor = document.getElementById('shadowColor') ? document.getElementById('shadowColor').value : '#000000';
    const isBold = document.getElementById('textBold').checked;
    const size = parseInt(document.getElementById('fontSize').value) || 55;
    const vAlignMap = { 'top': 'flex-start', 'center': 'center', 'bottom': 'flex-end' };
    const hAlignMap = { 'left': 'flex-start', 'center': 'center', 'right': 'flex-end' };

    // Limpiar contenido anterior
    content.innerHTML = '';
    content.style.backgroundSize = 'cover';
    content.style.backgroundPosition = 'center';
    content.style.backgroundRepeat = 'no-repeat';
    
    // Configurar Fondo (check per-slide bgImageId first)
    let bgToUse = bgImageData;
    if (currentSlide.bgImageId && bgRegistry[currentSlide.bgImageId]) {
        bgToUse = bgRegistry[currentSlide.bgImageId];
    }
    if (bgToUse) {
        if (bgEffect === 'light') {
            content.style.backgroundImage = `linear-gradient(rgba(255,255,255,0.8), rgba(255,255,255,0.8)), url(${bgToUse})`;
        } else if (bgEffect === 'dark') {
            content.style.backgroundImage = `linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7)), url(${bgToUse})`;
        } else if (transparency) {
            content.style.backgroundImage = `linear-gradient(rgba(255,255,255,0.8), rgba(255,255,255,0.8)), url(${bgToUse})`;
        } else {
            content.style.backgroundImage = `url(${bgToUse})`;
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
    textDiv.style.textShadow = shadow ? `3px 3px 6px ${shadowColor}` : 'none';
    
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
    if (isTitle) finalFontSize *= 1.1;
    finalFontSize = Math.max(24, Math.min(isTitle ? 132 : 120, finalFontSize));
    
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
    // Save to undo history
    const deletedSlide = { ...slidesData[index] };
    historyStack.push({
        type: 'deleteSingle',
        data: { index: index, slide: deletedSlide },
        description: `Eliminar diapositiva #${index + 1}`
    });

    slidesData.splice(index, 1);
    selectedSlides.delete(index);
    document.getElementById('addBlankSlide').checked = false;
    document.getElementById('addTitleSlide').checked = false;
    syncSlidesToLyrics();
    renderSlides();
    renderQuickCopyList();
    updateActionBar();
}

function addBlankSlideBefore(index) {
    slidesData.splice(index, 0, { text: " ", isTitle: false, bgEffect: false });
    historyStack.push({
        type: 'addBlank',
        data: { index: index },
        description: `Agregar slide vacío en #${index + 1}`
    });
    document.getElementById('addBlankSlide').checked = false;
    document.getElementById('addTitleSlide').checked = false;
    syncSlidesToLyrics();
    renderSlides();
    renderQuickCopyList();
    updateActionBar();
}

// Sincroniza los cambios manuales de la vista previa de vuelta al área de texto
function syncSlidesToLyrics() {
    let lyricsToSync = [...slidesData];

    const textArray = lyricsToSync.map(s => {
        let prefix = "";
        if (s.isTitle) prefix += "[TITULO]\n";
        if (s.bgEffect === 'dark') prefix += "[FONDO_OSCURO]\n";
        if (s.bgEffect === 'light') prefix += "[FONDO_CLARO]\n";
        if (s.bgImageId) prefix += `[FONDO:${s.bgImageId}]\n`;
        
        let slideText = s.text.trim();
        if (slideText === "") {
            prefix += "[VACIO]";
            return prefix;
        }
        return prefix + s.text;
    });
    document.getElementById('lyricsInput').value = textArray.join('\n\n');
    
    document.getElementById('addBlankSlide').checked = false;
    document.getElementById('addTitleSlide').checked = false;
}

// Sincroniza fondo global usando etiquetas FONDOGENERAL
function syncGlobalBackground(bgId) {
    console.log("syncGlobalBackground called with bgId:", bgId);
    
    // Usar syncSlidesToLyrics que ya tiene la lógica correcta para estructurar los slides
    // Primero, actualizar slidesData para que todos los slides tengan el bgImageId del fondo global
    slidesData.forEach(slide => {
        slide.bgImageId = bgId;
    });
    
    // Luego sincronizar con el textarea
    syncSlidesToLyrics();
    
    // Reemplazar todas las etiquetas [FONDO:ID] por [FONDOGENERAL:ID]
    const rawText = document.getElementById('lyricsInput').value;
    const text = rawText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const newText = text.replace(/\[FONDO:([^\]]+)\]/gi, `[FONDOGENERAL:${bgId}]`);
    document.getElementById('lyricsInput').value = newText;
    
    console.log("syncGlobalBackground completed, textarea updated");
}

// Sincroniza solo el cambio de fondo individual sin regenerar todo
function syncSingleSlideBgChange(slideIndex) {
    const slide = slidesData[slideIndex];
    if (!slide) return;
    
    // Actualizar solo el tag FONDO en el textarea para este slide específico
    const rawText = document.getElementById('lyricsInput').value;
    const text = rawText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const lines = text.split('\n');
    
    // Encontrar el slide correspondiente en el texto
    let currentSlideIndex = 0;
    let newText = [];
    let i = 0;
    
    while (i < lines.length && currentSlideIndex <= slideIndex) {
        let line = lines[i];
        let isTitle = false;
        let bgEffect = false;
        let bgImageId = null;
        let isBlank = false;
        let hadFondoGeneral = false;
        
        // Procesar tags
        while (true) {
            if (line.toUpperCase().startsWith('[TITULO]')) {
                isTitle = true;
                line = line.substring(8).trim();
                continue;
            }
            if (line.toUpperCase().startsWith('[FONDO_OSCURO]')) {
                bgEffect = 'dark';
                line = line.substring(14).trim();
                continue;
            }
            if (line.toUpperCase().startsWith('[FONDO_CLARO]')) {
                bgEffect = 'light';
                line = line.substring(13).trim();
                continue;
            }
            if (line.toUpperCase().startsWith('[VACIO]')) {
                isBlank = true;
                line = line.substring(7).trim();
                continue;
            }
            if (line.toUpperCase().startsWith('[FONDOGENERAL:')) {
                hadFondoGeneral = true;
                const match = line.match(/^\[FONDOGENERAL:([^\]]+)\]/i);
                if (match) {
                    line = line.substring(match[0].length).trim();
                    continue;
                }
            }
            if (line.toUpperCase().startsWith('[FONDO:')) {
                const match = line.match(/^\[FONDO:([^\]]+)\]/i);
                if (match) {
                    bgImageId = match[1];
                    line = line.substring(match[0].length).trim();
                    continue;
                }
            }
            break;
        }
        
        if (line === "" && !isBlank) {
            i++;
            continue;
        }
        
        if (currentSlideIndex === slideIndex) {
            // Este es el slide que queremos modificar
            let prefix = "";
            if (isTitle) prefix += "[TITULO]\n";
            if (bgEffect === 'dark') prefix += "[FONDO_OSCURO]\n";
            if (bgEffect === 'light') prefix += "[FONDO_CLARO]\n";
            // Usar FONDO: para fondos individuales, rompe FONDOGENERAL
            if (slide.bgImageId) prefix += `[FONDO:${slide.bgImageId}]\n`;
            if (isBlank) prefix += "[VACIO]";
            
            newText.push(prefix + line);
        } else {
            // Mantener el slide original
            let originalPrefix = "";
            if (isTitle) originalPrefix += "[TITULO]\n";
            if (bgEffect === 'dark') originalPrefix += "[FONDO_OSCURO]\n";
            if (bgEffect === 'light') originalPrefix += "[FONDO_CLARO]\n";
            if (bgImageId) originalPrefix += `[FONDO:${bgImageId}]\n`;
            else if (hadFondoGeneral) {
                // Si tenía FONDOGENERAL, mantenerlo
                originalPrefix += `[FONDOGENERAL:${globalBgImageId}]\n`;
            }
            if (isBlank) originalPrefix += "[VACIO]";
            
            newText.push(originalPrefix + line);
        }
        
        currentSlideIndex++;
        i++;
    }
    
    document.getElementById('lyricsInput').value = newText.join('\n\n');
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

    const activeClasses = ['bg-slate-300', 'dark:bg-slate-700'];
    const removeActive = (id) => document.getElementById(id).classList.remove(...activeClasses);
    const addActive = (id) => document.getElementById(id).classList.add(...activeClasses);

    removeActive('btnAlignLeft');
    removeActive('btnAlignCenter');
    removeActive('btnAlignRight');
    if (currentAlignment === 'left') addActive('btnAlignLeft');
    if (currentAlignment === 'center') addActive('btnAlignCenter');
    if (currentAlignment === 'right') addActive('btnAlignRight');

    removeActive('btnVAlignTop');
    removeActive('btnVAlignCenter');
    removeActive('btnVAlignBottom');
    if (currentVerticalAlignment === 'top') addActive('btnVAlignTop');
    if (currentVerticalAlignment === 'center') addActive('btnVAlignCenter');
    if (currentVerticalAlignment === 'bottom') addActive('btnVAlignBottom');

    document.querySelectorAll('.slide-preview').forEach(slide => {
        const idx = parseInt(slide.dataset.index);
        const slideObj = slidesData[idx];
        // Check if this slide has its own background (bgImageId from FONDO: or FONDOGENERAL:)
        const hasOwnBg = slideObj && slideObj.bgImageId && bgRegistry[slideObj.bgImageId];
        if (hasOwnBg) {
            // Apply the slide's specific background
            const bgData = bgRegistry[slideObj.bgImageId];
            if (slideObj.bgEffect === 'light') {
                slide.style.backgroundImage = `linear-gradient(rgba(255,255,255,0.8), rgba(255,255,255,0.8)), url(${bgData})`;
            } else if (slideObj.bgEffect === 'dark') {
                slide.style.backgroundImage = `linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7)), url(${bgData})`;
            } else {
                slide.style.backgroundImage = `url(${bgData})`;
            }
            slide.style.backgroundSize = 'cover';
            slide.style.backgroundPosition = 'center';
            slide.style.backgroundColor = 'transparent';
        } else {
            // Fall back to legacy bgImageData if no specific background
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
let galleryMode = 'global'; // 'global' | 'individual' | 'multi'

function openGallery(mode) {
    galleryMode = mode || 'global';
    const grid = document.getElementById('galleryGrid');
    grid.innerHTML = '';
    console.log("Cargando galería con " + galleryImages.length + " imágenes...");
    
    galleryImages.forEach(url => {
        const item = document.createElement('div');
        item.className = 'gallery-item bg-slate-700 animate-pulse';
        item.onclick = () => selectGalleryImage(url);

        const img = document.createElement('img');
        
        img.onload = () => {
            item.classList.remove('animate-pulse');
            item.style.backgroundColor = 'transparent';
        };
        
        img.onerror = () => {
            console.warn("No se pudo cargar: " + url);
            // En lugar de borrarlo, podemos mostrar un placeholder o simplemente ocultarlo
            item.classList.remove('animate-pulse');
            item.innerHTML = '<div class="text-[8px] text-slate-500 flex items-center justify-center h-full">Error</div>';
        };
        
        img.src = url;
        img.loading = 'lazy';
        img.className = 'w-full h-full object-cover rounded-lg';

        item.appendChild(img);
        grid.appendChild(item);
    });
    
    document.getElementById('galleryModal').classList.remove('hidden');
    document.getElementById('galleryModal').classList.add('flex');
}

function closeGallery() {
    document.getElementById('galleryModal').classList.add('hidden');
    document.getElementById('galleryModal').classList.remove('flex');
    galleryMode = 'global';
}

function galleryUploadFromPC() {
    const prevMode = galleryMode;
    closeGallery();
    if (prevMode === 'global') {
        // Upload as global background
        document.getElementById('bgImageInput').click();
    } else {
        // Upload for individual/multi slides
        document.getElementById('individualBgImageInput').click();
    }
}

async function selectGalleryImage(url) {
    document.getElementById('globalLoader').classList.remove('hidden');
    document.getElementById('globalLoader').classList.add('flex');

    try {
        const response = await fetch(url);
        const blob = await response.blob();
        const reader = new FileReader();
        reader.onloadend = () => {
            const dataUrl = reader.result;
            if (galleryMode === 'individual' && window.targetBgSlideIndex !== undefined) {
                // Assign to specific slide
                const bgId = `gallery_${nextBgId++}`;
                bgRegistry[bgId] = dataUrl;
                slidesData[window.targetBgSlideIndex].bgImageId = bgId;
                // Sync all slides to maintain consistency
                syncSlidesToLyrics();
                renderSlides();
                // Reset target index after use
                window.targetBgSlideIndex = undefined;
            } else if (galleryMode === 'multi' && selectedSlides.size > 0) {
                // Assign to all selected slides
                const bgId = `gallery_${nextBgId++}`;
                bgRegistry[bgId] = dataUrl;
                for (let idx of selectedSlides) {
                    if (idx >= 0 && idx < slidesData.length) {
                        slidesData[idx].bgImageId = bgId;
                    }
                }
                syncSlidesToLyrics();
                renderSlides();
            } else {
                // Default: global background - use FONDOGENERAL tag
                console.log("Applying global background, galleryMode:", galleryMode);
                const bgId = `global_${nextBgId++}`;
                bgRegistry[bgId] = dataUrl;
                globalBgImageId = bgId;
                console.log("bgId:", bgId, "globalBgImageId:", globalBgImageId);
                // Add FONDOGENERAL tag to all slides
                syncGlobalBackground(bgId);
                renderSlides();
            }
            document.getElementById('globalLoader').classList.add('hidden');
            document.getElementById('globalLoader').classList.remove('flex');
            closeGallery();
        };
        reader.readAsDataURL(blob);
    } catch (error) {
        console.error(error);
        alert("Error al cargar imagen. Intenta con otra.");
        document.getElementById('globalLoader').classList.add('hidden');
        document.getElementById('globalLoader').classList.remove('flex');
        closeGallery();
    }
}

function openEditModal(i) {
    currentEditingIndex = i;
    document.getElementById('editModalIndex').innerText = `#${i + 1}`;
    document.getElementById('editSlideText').value = slidesData[i].text;
    document.getElementById('editModal').classList.remove('hidden');
    document.getElementById('editModal').classList.add('flex');
}

function closeEditModal() {
    document.getElementById('editModal').classList.add('hidden');
    document.getElementById('editModal').classList.remove('flex');
}

function saveEditSlide() {
    if (currentEditingIndex > -1) {
        slidesData[currentEditingIndex].text = document.getElementById('editSlideText').value;
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
    slidesData.forEach((slideObj, i) => {
        const text = slideObj.text;
        const item = document.createElement('div');
        item.className = 'copy-block bg-slate-800 border border-slate-700 rounded-lg p-3 flex justify-between items-center group';
        const txtPreview = document.createElement('div');
        txtPreview.className = 'text-xs text-slate-300 font-mono whitespace-pre truncate mr-2 flex-1';
        let prefix = '';
        if (slideObj.isTitle) prefix += '[TITULO] ';
        if (slideObj.bgEffect === 'dark') prefix += '[OSCURO] ';
        if (slideObj.bgEffect === 'light') prefix += '[CLARO] ';
        txtPreview.innerText = prefix + text.replace(/\n/g, ' ↵ ');
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

    // Save snapshot of bgRegistry entries referenced by this song's slides
    let songBgRegistry = {};
    for (let s of slidesData) {
        if (s.bgImageId && bgRegistry[s.bgImageId]) {
            songBgRegistry[s.bgImageId] = bgRegistry[s.bgImageId];
        }
    }
    
    // También incluir fondos de inserciones si existen (IDs que empiezan con 'insertion_')
    let insertionBgCount = 0;
    for (let bgId in bgRegistry) {
        if (bgId.startsWith('insertion_') && bgRegistry[bgId]) {
            songBgRegistry[bgId] = bgRegistry[bgId];
            insertionBgCount++;
        }
    }
    console.log("Saved insertion backgrounds:", insertionBgCount, "Total bgRegistrySnapshot keys:", Object.keys(songBgRegistry).length);

    const songConfig = {
        id: Date.now(),
        type: 'internal',
        name: songName,
        slides: [...slidesData],
        bgRegistrySnapshot: songBgRegistry,
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

        // Calcular total de diapositivas incluyendo inserciones
        const processedSlides = processSongInsertions(item);
        const totalSlides = processedSlides.length;
        const insertionCount = item.insertions ? item.insertions.length : 0;

        el.innerHTML = `
            <div class="flex items-center gap-3 overflow-hidden flex-1">
                <span class="text-amber-600 dark:text-amber-500 font-bold text-xs w-4">${index + 1}.</span>
                <i class="fa-solid fa-music text-blue-500"></i>
                <div class="flex-1 min-w-0">
                    <p class="text-sm text-slate-800 dark:text-white font-bold truncate">${escapeHtml(item.name)}</p>
                    <p class="text-[10px] text-slate-500 dark:text-slate-400">${totalSlides} diapositivas${insertionCount > 0 ? ` (+${insertionCount} inserción${insertionCount > 1 ? 'es' : ''})` : ''}</p>
                </div>
            </div>
            <div class="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onclick="openInsertionModal(${index})" class="text-slate-400 hover:text-purple-400 p-1" title="Insertar canción">
                    <i class="fa-solid fa-code-merge"></i>
                </button>
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
    // Restore per-slide backgrounds - clear first to avoid mixing with other songs
    bgRegistry = {};
    if (song.bgRegistrySnapshot) {
        Object.assign(bgRegistry, song.bgRegistrySnapshot);
        console.log("Restored bgRegistrySnapshot with keys:", Object.keys(song.bgRegistrySnapshot));
    }

    // Cargar letra (slides) con inserciones procesadas
    let processedSlides = processSongInsertions(song);
    let slidesToLoad = processedSlides.map(s => {
        if (typeof s === 'string') return { text: s, isTitle: false };
        return { ...s };
    });
    
    const textArray = slidesToLoad.map(s => {
        let prefix = "";
        if (s.isTitle) prefix += "[TITULO]\n";
        if (s.bgEffect === 'dark') prefix += "[FONDO_OSCURO]\n";
        if (s.bgEffect === 'light') prefix += "[FONDO_CLARO]\n";
        if (s.bgImageId) prefix += `[FONDO:${s.bgImageId}]\n`;
        
        let slideText = s.text.trim();
        if (slideText === "") {
            prefix += "[VACIO]";
            return prefix;
        }
        return prefix + s.text;
    });
    document.getElementById('lyricsInput').value = textArray.join('\n\n');

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

// --- INSERCIÓN DE CANCIONES EN REPERTORIO ---
let currentInsertionSongIndex = null;
let insertionHistory = []; // Historial para deshacer

// Función para procesar inserciones de una canción
function processSongInsertions(song) {
    if (!song.insertions || song.insertions.length === 0) {
        return song.slides;
    }
    
    let processedSlides = [];
    let insertionIndex = 0;
    
    for (let i = 0; i < song.slides.length; i++) {
        processedSlides.push(song.slides[i]);
        
        // Verificar si hay inserciones después de este slide
        while (insertionIndex < song.insertions.length && 
               song.insertions[insertionIndex].afterSlide === i) {
            const insertion = song.insertions[insertionIndex];
            
            // Restaurar fondos de esta inserción al bgRegistry global
            if (insertion.bgRegistry) {
                Object.assign(bgRegistry, insertion.bgRegistry);
            }
            
            // Agregar todas las diapositivas copiadas de la inserción
            if (insertion.slides && insertion.slides.length > 0) {
                insertion.slides.forEach(slide => {
                    processedSlides.push(slide);
                });
            }
            
            insertionIndex++;
        }
    }
    
    return processedSlides;
}

// Función auxiliar para mezclar bgRegistry de inserciones
function mergeInsertionBgRegistries(song) {
    if (!song.insertions || song.insertions.length === 0) {
        return;
    }
    
    // Para cada inserción, necesitamos asegurar que los fondos existan en bgRegistry
    // Las inserciones copian slides con bgImageId, pero esos IDs podrían no existir
    // en el bgRegistry de la canción principal
    // Como las inserciones son copias independientes, generamos nuevos IDs únicos
    let idMap = {};
    let nextId = nextBgId;
    
    song.insertions.forEach(insertion => {
        insertion.slides.forEach(slide => {
            if (slide.bgImageId) {
                // Si este ID ya fue mapeado, usar el nuevo ID
                if (idMap[slide.bgImageId]) {
                    slide.bgImageId = idMap[slide.bgImageId];
                } else {
                    // Generar nuevo ID único para esta canción
                    const newId = `insertion_${nextId++}`;
                    idMap[slide.bgImageId] = newId;
                    
                    // Copiar los datos del fondo si existen en algún lugar
                    // Nota: Como las inserciones son copias independientes, no tenemos acceso
                    // al bgRegistry original. Los fondos deberían haberse copiado como parte
                    // de la inserción, pero necesitamos asegurarnos de que existan.
                    // Por ahora, si el fondo no existe, el slide no tendrá fondo.
                    slide.bgImageId = newId;
                }
            }
        });
    });
    
    nextBgId = nextId;
}

function openInsertionModal(songIndex) {
    currentInsertionSongIndex = songIndex;
    const song = repertoireList[songIndex];
    const modal = document.getElementById('insertionModal');
    const slideSelect = document.getElementById('insertionSlideSelect');
    const songSelect = document.getElementById('insertionSongSelect');
    
    // Llenar select de diapositivas
    slideSelect.innerHTML = '';
    for (let i = 0; i < song.slides.length; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = `Diapositiva ${i + 1}`;
        slideSelect.appendChild(option);
    }
    
    // Llenar select de canciones (excluyendo la actual)
    songSelect.innerHTML = '';
    repertoireList.forEach((item, index) => {
        if (index !== songIndex) {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = `${index + 1}. ${item.name}`;
            songSelect.appendChild(option);
        }
    });
    
    // Mostrar inserciones actuales si existen
    if (song.insertions && song.insertions.length > 0) {
        document.getElementById('currentInsertions').classList.remove('hidden');
        renderInsertionsList(song);
    } else {
        document.getElementById('currentInsertions').classList.add('hidden');
    }
    
    // Habilitar/deshabilitar botón de deshacer según historial
    const undoBtn = document.getElementById('undoInsertionBtn');
    const hasHistory = insertionHistory.some(h => h.songIndex === songIndex);
    undoBtn.disabled = !hasHistory;
    
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

function closeInsertionModal() {
    const modal = document.getElementById('insertionModal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    currentInsertionSongIndex = null;
}

function undoInsertion() {
    if (currentInsertionSongIndex === null || insertionHistory.length === 0) return;
    
    // Buscar el último estado guardado para esta canción
    const lastHistoryIndex = insertionHistory.map((h, i) => ({ ...h, originalIndex: i }))
        .filter(h => h.songIndex === currentInsertionSongIndex)
        .pop();
    
    if (!lastHistoryIndex) return;
    
    const song = repertoireList[currentInsertionSongIndex];
    
    // Restaurar estado anterior
    if (lastHistoryIndex.previousInsertions.length === 0) {
        song.insertions = [];
    } else {
        song.insertions = JSON.parse(JSON.stringify(lastHistoryIndex.previousInsertions));
    }
    
    // Eliminar del historial
    insertionHistory.splice(lastHistoryIndex.originalIndex, 1);
    
    // Actualizar UI
    renderRepertoireList();
    renderInsertionsList(song);
    
    // Deshabilitar botón de deshacer si no hay más historial
    const hasHistory = insertionHistory.some(h => h.songIndex === currentInsertionSongIndex);
    document.getElementById('undoInsertionBtn').disabled = !hasHistory;
    
    // Cargar en el editor para mostrar el resultado
    loadFromRepertoire(currentInsertionSongIndex);
}

function addInsertion() {
    if (currentInsertionSongIndex === null) return;
    
    const slideIndex = parseInt(document.getElementById('insertionSlideSelect').value);
    const songIndex = parseInt(document.getElementById('insertionSongSelect').value);
    
    if (isNaN(slideIndex) || isNaN(songIndex)) {
        alert('Selecciona una diapositiva y una canción');
        return;
    }
    
    const song = repertoireList[currentInsertionSongIndex];
    const insertedSong = repertoireList[songIndex];
    
    // Guardar estado anterior en historial
    insertionHistory.push({
        songIndex: currentInsertionSongIndex,
        previousInsertions: song.insertions ? JSON.parse(JSON.stringify(song.insertions)) : []
    });
    
    if (!song.insertions) song.insertions = [];
    
    // Copiar las diapositivas de la canción a insertar (copia independiente)
    // También copiar los fondos por diapositiva si existen
    // IMPORTANTE: Convertir FONDOGENERAL a FONDO individual para evitar conflictos
    // cuando se mezclan canciones con diferentes fondos globales
    
    // Primero, detectar si hay un fondo global (todos los slides tienen el mismo bgImageId)
    let globalBgId = null;
    if (insertedSong.slides.length > 0) {
        const firstSlide = insertedSong.slides[0];
        if (typeof firstSlide !== 'string' && firstSlide.bgImageId) {
            const allHaveSameBg = insertedSong.slides.every(s => {
                if (typeof s === 'string') return false;
                return s.bgImageId === firstSlide.bgImageId;
            });
            if (allHaveSameBg) {
                globalBgId = firstSlide.bgImageId;
            }
        }
    }
    
    // Crear un bgRegistry local para esta inserción
    let insertionBgRegistry = {};
    
    const copiedSlides = insertedSong.slides.map(slide => {
        if (typeof slide === 'string') return { text: slide, isTitle: false };
        const slideCopy = { ...slide };
        
        // Si el slide tiene un fondo individual, copiar los datos del fondo
        if (slide.bgImageId && insertedSong.bgRegistrySnapshot && insertedSong.bgRegistrySnapshot[slide.bgImageId]) {
            // Si es parte de un fondo global, crear un ID único para este slide específico
            // para evitar conflictos con otros FONDOGLOBALES
            if (globalBgId && slide.bgImageId === globalBgId) {
                const newBgId = `insertion_slide_${nextBgId++}`;
                insertionBgRegistry[newBgId] = insertedSong.bgRegistrySnapshot[slide.bgImageId];
                bgRegistry[newBgId] = insertedSong.bgRegistrySnapshot[slide.bgImageId];
                slideCopy.bgImageId = newBgId;
            } else {
                // Es un fondo individual normal
                const newBgId = `insertion_${nextBgId++}`;
                insertionBgRegistry[newBgId] = insertedSong.bgRegistrySnapshot[slide.bgImageId];
                bgRegistry[newBgId] = insertedSong.bgRegistrySnapshot[slide.bgImageId];
                slideCopy.bgImageId = newBgId;
            }
        }
        return slideCopy;
    });
    
    // Verificar si ya existe una inserción en la misma posición
    const existingIndex = song.insertions.findIndex(ins => ins.afterSlide === slideIndex);
    if (existingIndex !== -1) {
        song.insertions[existingIndex].slides = copiedSlides;
        song.insertions[existingIndex].songName = insertedSong.name;
        song.insertions[existingIndex].bgRegistry = insertionBgRegistry;
    } else {
        song.insertions.push({ afterSlide: slideIndex, slides: copiedSlides, songName: insertedSong.name, bgRegistry: insertionBgRegistry });
    }
    
    // Ordenar inserciones por posición
    song.insertions.sort((a, b) => a.afterSlide - b.afterSlide);
    
    renderRepertoireList();
    renderInsertionsList(song);
    
    // Habilitar botón de deshacer
    document.getElementById('undoInsertionBtn').disabled = false;
    
    // Cargar en el editor para mostrar el resultado inmediatamente
    loadFromRepertoire(currentInsertionSongIndex);
    
    // Cerrar el modal
    closeInsertionModal();
}

function renderInsertionsList(song) {
    const list = document.getElementById('insertionsList');
    list.innerHTML = '';
    
    if (!song.insertions || song.insertions.length === 0) {
        list.innerHTML = '<p class="text-slate-500 italic">Sin inserciones</p>';
        return;
    }
    
    song.insertions.forEach((ins, idx) => {
        const div = document.createElement('div');
        div.className = 'flex justify-between items-center bg-slate-700 rounded p-2';
        div.innerHTML = `
            <span class="text-slate-300">Después de slide ${ins.afterSlide + 1}: <strong>${ins.songName}</strong> (${ins.slides.length} diapositivas)</span>
            <button onclick="removeInsertion(${idx})" class="text-red-400 hover:text-red-300">
                <i class="fa-solid fa-times"></i>
            </button>
        `;
        list.appendChild(div);
    });
}

function removeInsertion(insertionIndex) {
    if (currentInsertionSongIndex === null) return;
    
    const song = repertoireList[currentInsertionSongIndex];
    song.insertions.splice(insertionIndex, 1);
    
    if (song.insertions.length === 0) {
        document.getElementById('currentInsertions').classList.add('hidden');
    }
    
    renderRepertoireList();
    renderInsertionsList(song);
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

function sendAllRepertoireToEditor() {
    if (repertoireList.length === 0) return alert("El repertorio está vacío.");
    if (slidesData.length > 0) {
        if (!confirm("Esto reemplazará la canción actual en el editor por todo el repertorio. ¿Continuar?")) return;
    }
    
    // Merge bgRegistry from all songs - clear first to avoid mixing
    bgRegistry = {};
    let mergedBgRegistry = {};
    repertoireList.forEach(song => {
        if (song.bgRegistrySnapshot) {
            Object.assign(mergedBgRegistry, song.bgRegistrySnapshot);
        }
    });
    Object.assign(bgRegistry, mergedBgRegistry);

    let allSlides = [];
    repertoireList.forEach(song => {
        // Procesar inserciones para cada canción
        let processedSlides = processSongInsertions(song);
        let slidesToLoad = processedSlides.map(s => {
            if (typeof s === 'string') return { text: s, isTitle: false, bgEffect: false };
            return { ...s };
        });
        allSlides = allSlides.concat(slidesToLoad);
    });
    
    const textArray = allSlides.map(s => {
        let prefix = "";
        if (s.isTitle) prefix += "[TITULO]\n";
        if (s.bgEffect === 'dark') prefix += "[FONDO_OSCURO]\n";
        if (s.bgEffect === 'light') prefix += "[FONDO_CLARO]\n";
        if (s.bgImageId) prefix += `[FONDO:${s.bgImageId}]\n`;
        
        let slideText = s.text.trim();
        if (slideText === "") {
            prefix += "[VACIO]";
            return prefix;
        }
        return prefix + s.text;
    });
    document.getElementById('lyricsInput').value = textArray.join('\n\n');
    
    document.getElementById('addBlankSlide').checked = false;
    document.getElementById('addTitleSlide').checked = false;
    
    // Clear song name and author since it's a mix
    document.getElementById('songName').value = "Repertorio Completo";
    document.getElementById('songAuthor').value = "";
    
    updateStyles();
    generateTag();
    processLyrics();
    
    scrollToSection('diapositivas');
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
        pptx.defineLayout({ name: 'WIDE', width: 10, height: 5.625 });
        pptx.layout = 'WIDE';

        for (let idx = 0; idx < repertoireList.length; idx++) {
            const song = repertoireList[idx];
            const st = song.styles;
            const masterName = `MASTER_SONG_${idx}`;

            // DEFINIR MASTER PARA ESTA CANCIÓN (Evita duplicar imágenes y corrupción)
            let masterObj = { title: masterName, objects: [] };
            if (st.bgImage) {
                masterObj.objects.push({ 
                    image: { x: 0, y: 0, w: 10, h: 5.625, data: st.bgImage, sizing: { type: 'cover' } } 
                });
                if (st.bgTransparency) {
                    masterObj.objects.push({ 
                        rect: { x: 0, y: 0, w: 10, h: 5.625, fill: { color: 'FFFFFF', transparency: 20 } } 
                    });
                }
            } else {
                masterObj.background = { color: 'FFFFFF' };
            }
            pptx.defineSlideMaster(masterObj);

            let fontName = getFontFamilyName(st.font);
            const alignMap = { 'left': 'left', 'center': 'center', 'right': 'right' };
            const vAlignMap = { 'top': 'top', 'center': 'middle', 'bottom': 'bottom' };
            const shadowOpts = st.shadow ? { type: 'outer', angle: 45, blur: 3, offset: 2, opacity: 0.6 } : null;

            // DIAPOSITIVA EN BLANCO
            pptx.addSlide({ masterName: masterName });

            // RECORRER LAS DIAPOSITIVAS DE LA CANCIÓN CON INSERCIONES
            let processedSlides = processSongInsertions(song);
            
            // Generar diapositivas del PPTX
            for (let slideObj of processedSlides) {
                let text = (typeof slideObj === 'string' ? slideObj : slideObj.text).trim() || " ";
                const isTitle = typeof slideObj === 'string' ? false : slideObj.isTitle;
                let slideFontSize = isTitle ? Math.min(st.size * 1.1, 132) : st.size;
                
                let slide = pptx.addSlide({ masterName: masterName });

                slide.addText(text, {
                    x: 0.5, y: 0.5, w: '90%', h: '80%',
                    fontFace: fontName,
                    fontSize: slideFontSize,
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

// Función auxiliar para limpiar el prefijo DataURL y evitar corrupción en PPTX
function getBase64Data(data) {
    if (!data) return null;
    if (data.includes('base64,')) return data.split('base64,')[1];
    return data;
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
        pptx.defineLayout({ name: 'WIDE', width: 10, height: 5.625 });
        pptx.layout = 'WIDE';

        // DEFINIR MASTER PARA ESTA PRESENTACIÓN (Soluciona corrupción y fallas en 2da slide)
        let mastersCreated = {};
        
        function defineMaster(bgId, dataUrl) {
            const mName = bgId ? `MASTER_${bgId}` : "GLOBAL_BG_MASTER";
            if (mastersCreated[mName]) return mName;
            
            let mObj = { title: mName, objects: [] };
            if (dataUrl) {
                mObj.objects.push({ 
                    image: { x: 0, y: 0, w: 10, h: 5.625, data: dataUrl, sizing: { type: 'cover' } } 
                });
                if (document.getElementById('bgTransparency').checked) {
                    mObj.objects.push({ 
                        rect: { x: 0, y: 0, w: 10, h: 5.625, fill: { color: 'FFFFFF', transparency: 20 } } 
                    });
                }
            } else {
                mObj.background = { color: 'FFFFFF' };
            }
            pptx.defineSlideMaster(mObj);
            mastersCreated[mName] = true;
            return mName;
        }

        const globalMaster = defineMaster(null, bgImageData);
        for (let key in bgRegistry) {
            defineMaster(key, bgRegistry[key]);
        }

        const fontSelect = document.getElementById('fontFamily').value;
        const fontName = getFontFamilyName(fontSelect);
        const fontSize = parseInt(document.getElementById('fontSize').value) || 60;
        const fontColor = document.getElementById('textColor').value.replace('#', '');
        const alignMap = { 'left': 'left', 'center': 'center', 'right': 'right' };
        const vAlignMap = { 'top': 'top', 'center': 'middle', 'bottom': 'bottom' };
        const shadow = document.getElementById('textShadow').checked;
        const shadowColor = document.getElementById('shadowColor') ? document.getElementById('shadowColor').value.replace('#', '') : '000000';
        const isBold = document.getElementById('textBold').checked;
        const shadowOpts = shadow ? { type: 'outer', color: shadowColor, angle: 45, blur: 3, offset: 2, opacity: 0.6 } : null;

        for (let rawSlide of slidesData) {
            let text = rawSlide.text.trim() || " ";
            let slideFontSize = rawSlide.isTitle ? Math.min(fontSize * 1.1, 132) : fontSize;
            let slideMaster = globalMaster;
            if (rawSlide.bgImageId && mastersCreated[`MASTER_${rawSlide.bgImageId}`]) {
                slideMaster = `MASTER_${rawSlide.bgImageId}`;
            }
            let slide = pptx.addSlide({ masterName: slideMaster });

            if (rawSlide.bgEffect === 'dark') {
                slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: '100%', h: '100%', fill: { color: '000000', transparency: 70 } });
            } else if (rawSlide.bgEffect === 'light') {
                slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: '100%', h: '100%', fill: { color: 'FFFFFF', transparency: 20 } });
            }

            slide.addText(text, {
                x: 0.5, y: 0.5, w: '90%', h: '80%',
                fontFace: fontName,
                fontSize: slideFontSize,
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

        const shadowColor = document.getElementById('shadowColor') ? document.getElementById('shadowColor').value : '#000000';
        for (let i = 0; i < slidesData.length; i++) {
            container.innerHTML = '';
            const slideObj = slidesData[i];
            const slideSize = slideObj.isTitle ? (parseInt(size) * 1.1) + 'px' : size;
            const slide = document.createElement('div');
            slide.style.width = '100%'; slide.style.height = '100%';
            slide.style.display = 'flex'; slide.style.padding = '50px'; slide.style.boxSizing = 'border-box';
            slide.style.fontFamily = font; slide.style.fontSize = slideSize;
            slide.style.fontWeight = isBold ? 'bold' : 'normal';
            slide.style.color = color; slide.style.textAlign = currentAlignment;
            slide.style.justifyContent = 'center'; slide.style.alignItems = vAlignMap[currentVerticalAlignment];
            if (shadow) slide.style.textShadow = `5px 5px 8px ${shadowColor}`;
            const transparency = document.getElementById('bgTransparency').checked;
            
            let bgDataToUse = bgImageData;
            if (slideObj.bgImageId && bgRegistry[slideObj.bgImageId]) {
                bgDataToUse = bgRegistry[slideObj.bgImageId];
            }

            if (bgDataToUse) {
                if (slideObj.bgEffect === 'light') {
                    slide.style.backgroundImage = `linear-gradient(rgba(255,255,255,0.8), rgba(255,255,255,0.8)), url(${bgDataToUse})`;
                } else if (slideObj.bgEffect === 'dark') {
                    slide.style.backgroundImage = `linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7)), url(${bgDataToUse})`;
                } else if (transparency) {
                    slide.style.backgroundImage = `linear-gradient(rgba(255,255,255,0.8), rgba(255,255,255,0.8)), url(${bgDataToUse})`;
                } else {
                    slide.style.backgroundImage = `url(${bgDataToUse})`;
                }
                slide.style.backgroundSize = 'cover';
                slide.style.backgroundPosition = 'center';
            } else {
                slide.style.backgroundColor = 'white';
            }
            slide.innerHTML = slideObj.text.replace(/\n/g, '<br>');
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
                // MODIFICADO: Regex para capturar Base64 entre comillas o directamente
                const bgMatch = line.match(/background:\s*["']?(.*?)["']?$/i);
                background = bgMatch ? bgMatch[1].trim() : "";
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
    markdown += `background: "${bgImageData || ''}"\n`;
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
        let lyricsToExport = slidesData.map(s => ({...s}));
        
        // Si la portada está activada automáticamente, la removemos del texto de letra
        if (addTitle && lyricsToExport.length > 0) {
            const titleText = author ? `${cleanName}\n${author}` : cleanName;
            const blankIndex = addBlank ? 1 : 0;
            const slide = lyricsToExport[blankIndex];
            if (slide && slide.isTitle && (slide.text === titleText || slide.text === cleanName)) {
                lyricsToExport.splice(blankIndex, 1);
            }
        }
        
        // Si el slide vacío está activado automáticamente, lo removemos
        if (addBlank && lyricsToExport.length > 0 && lyricsToExport[0].text.trim() === "") {
            lyricsToExport.splice(0, 1);
        }
        
        // Unir con doble salto de línea para preservar la estructura de diapositivas
        const textArray = lyricsToExport.map(s => {
            let prefix = "";
            if (s.isTitle) prefix += "[TITULO]\n";
            if (s.bgEffect === 'dark') prefix += "[FONDO_OSCURO]\n";
            if (s.bgEffect === 'light') prefix += "[FONDO_CLARO]\n";
            return prefix + s.text;
        });
        markdown += textArray.join('\n\n');
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

// --- PER-SLIDE / MULTI-SELECT BACKGROUND ---
function handleIndividualBgUpload(input) {
    if (!input.files || !input.files[0]) return;

    // Check if we're in multi-select mode (from action bar or individual selection)
    if (selectedSlides.size > 0) {
        // Apply to all selected slides
        const reader = new FileReader();
        reader.onload = (e) => {
            const dataUrl = e.target.result;
            const bgId = `indiv_${nextBgId++}`;
            bgRegistry[bgId] = dataUrl;
            for (let idx of selectedSlides) {
                if (idx >= 0 && idx < slidesData.length) {
                    slidesData[idx].bgImageId = bgId;
                }
            }
            syncSlidesToLyrics();
            renderSlides();
        };
        reader.readAsDataURL(input.files[0]);
        input.value = "";
        return;
    }

    // Single slide mode (from hover overlay)
    const targetIndex = window.targetBgSlideIndex;
    if (targetIndex === undefined || targetIndex < 0 || targetIndex >= slidesData.length) {
        alert("Selecciona primero una diapositiva (usa el botón Fondo en el hover).");
        return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
        const dataUrl = e.target.result;
        const bgId = `indiv_${nextBgId++}`;
        bgRegistry[bgId] = dataUrl;
        slidesData[targetIndex].bgImageId = bgId;
        syncSlidesToLyrics();
        renderSlides();
    };
    reader.readAsDataURL(input.files[0]);
    input.value = "";
}

// --- MULTI-SELECT FUNCTIONS ---
function toggleSlideSelection(index) {
    const slide = document.querySelector(`.slide-preview[data-index="${index}"]`);
    const checkbox = slide ? slide.querySelector('.slide-checkbox') : null;
    if (selectedSlides.has(index)) {
        selectedSlides.delete(index);
        if (slide) slide.classList.remove('selected-slide', 'ring-2', 'ring-blue-500');
        if (checkbox) checkbox.checked = false;
    } else {
        selectedSlides.add(index);
        if (slide) slide.classList.add('selected-slide', 'ring-2', 'ring-blue-500');
        if (checkbox) checkbox.checked = true;
    }
    updateActionBar();
}

function toggleSelectionMode() {
    selectionMode = !selectionMode;
    const btn = document.getElementById('btnSelectionMode');
    const container = document.getElementById('slidesContainer');
    if (selectionMode) {
        btn.classList.remove('bg-green-600', 'hover:bg-green-700', 'border-green-500');
        btn.classList.add('bg-red-600', 'hover:bg-red-700', 'border-red-500');
        btn.innerHTML = '<i class="fa-solid fa-xmark"></i> <span class="hidden sm:inline">Cancelar</span>';
        container.classList.add('selection-mode');
        // Show checkboxes
        document.querySelectorAll('.slide-checkbox-wrap').forEach(w => w.classList.add('visible'));
    } else {
        btn.classList.remove('bg-red-600', 'hover:bg-red-700', 'border-red-500');
        btn.classList.add('bg-green-600', 'hover:bg-green-700', 'border-green-500');
        btn.innerHTML = '<i class="fa-solid fa-check-double"></i> <span class="hidden sm:inline">Seleccionar</span>';
        container.classList.remove('selection-mode');
        clearSelection();
        // Hide checkboxes
        document.querySelectorAll('.slide-checkbox-wrap').forEach(w => w.classList.remove('visible'));
    }
}

function updateActionBar() {
    const bar = document.getElementById('multiSelectActionBar');
    const countSpan = document.getElementById('selectedCount');
    const undoBtn = document.getElementById('btnUndo');
    if (selectedSlides.size > 0) {
        bar.classList.remove('hidden');
        bar.classList.add('flex');
        countSpan.innerText = `${selectedSlides.size} seleccionada(s)`;
    } else {
        bar.classList.add('hidden');
        bar.classList.remove('flex');
    }
    undoBtn.disabled = historyStack.length === 0;
}

function clearSelection() {
    selectedSlides.clear();
    document.querySelectorAll('.slide-preview').forEach(s => {
        s.classList.remove('selected-slide', 'ring-2', 'ring-blue-500');
        const cb = s.querySelector('.slide-checkbox');
        if (cb) cb.checked = false;
    });
    updateActionBar();
}

function deleteSelectedSlides() {
    if (selectedSlides.size === 0) return;
    if (!confirm(`¿Eliminar ${selectedSlides.size} diapositiva(s) seleccionada(s)?`)) return;

    // Save to undo history
    const indices = Array.from(selectedSlides).sort((a, b) => b - a);
    const deletedSlides = indices.map(i => ({ index: i, slide: { ...slidesData[i] } }));
    historyStack.push({
        type: 'deleteMultiple',
        data: deletedSlides,
        description: `Eliminar ${deletedSlides.length} diapositiva(s)`
    });

    // Remove from highest index to lowest to avoid index shifting
    for (let idx of indices) {
        slidesData.splice(idx, 1);
    }
    clearSelection();
    document.getElementById('addBlankSlide').checked = false;
    document.getElementById('addTitleSlide').checked = false;
    syncSlidesToLyrics();
    renderSlides();
    renderQuickCopyList();
    updateActionBar();
}

function undoAction() {
    if (historyStack.length === 0) return;
    const action = historyStack.pop();

    if (action.type === 'deleteMultiple') {
        // Restore deleted slides at their original positions
        for (let item of action.data) {
            slidesData.splice(item.index, 0, item.slide);
        }
    } else if (action.type === 'deleteSingle') {
        slidesData.splice(action.data.index, 0, action.data.slide);
    } else if (action.type === 'addBlank') {
        slidesData.splice(action.data.index, 1);
    }

    clearSelection();
    document.getElementById('addBlankSlide').checked = false;
    document.getElementById('addTitleSlide').checked = false;
    syncSlidesToLyrics();
    renderSlides();
    renderQuickCopyList();
    updateActionBar();
}

// --- Exportar funciones al scope global ---
window.handleIndividualBgUpload = handleIndividualBgUpload;
window.updateActionBar = updateActionBar;
window.clearSelection = clearSelection;
window.deleteSelectedSlides = deleteSelectedSlides;
window.undoAction = undoAction;
window.toggleSelectionMode = toggleSelectionMode;
window.toggleSlideSelection = toggleSlideSelection;

// --- NUEVAS FUNCIONES ---
async function pasteLyricsFromClipboard() {
    try {
        const text = await navigator.clipboard.readText();
        if (text) {
            const input = document.getElementById('lyricsInput');
            const startPos = input.selectionStart;
            const endPos = input.selectionEnd;
            input.value = input.value.substring(0, startPos) + text + input.value.substring(endPos, input.value.length);
            input.focus();
            
            updateSlidesRealTime();
            
            const btn = document.querySelector('span[onclick="pasteLyricsFromClipboard()"]');
            if(btn) {
                const originalHTML = btn.innerHTML;
                btn.innerHTML = `<i class="fa-solid fa-check"></i> Pegado`;
                setTimeout(() => btn.innerHTML = originalHTML, 1500);
            }
        }
    } catch (err) {
        console.error('Error al pegar: ', err);
        alert('No se pudo acceder al portapapeles automáticamente. Pega el texto manualmente con Ctrl+V.');
    }
}

window.addEventListener('scroll', () => {
    const scrollBtn = document.getElementById('scrollBtn');
    if (!scrollBtn) return;
    
    // Mostrar siempre el botón de scroll
    scrollBtn.style.display = 'flex';
    
    const isAtBottom = (window.innerHeight + window.scrollY) >= document.body.offsetHeight - 50;
    const isAtTop = window.scrollY < 100;
    
    if (isAtBottom) {
        scrollBtn.innerHTML = '<i class="fa-solid fa-arrow-up"></i>';
        scrollBtn.setAttribute('data-direction', 'up');
    } else if (isAtTop) {
        scrollBtn.innerHTML = '<i class="fa-solid fa-arrow-down"></i>';
        scrollBtn.setAttribute('data-direction', 'down');
    } else {
        // En medio: mostrar flecha hacia abajo por defecto
        scrollBtn.innerHTML = '<i class="fa-solid fa-arrow-down"></i>';
        scrollBtn.setAttribute('data-direction', 'down');
    }
});

window.toggleScroll = function() {
    const scrollBtn = document.getElementById('scrollBtn');
    if (scrollBtn.getAttribute('data-direction') === 'up') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    }
};

// --- BÚSQUEDA EN LETRA ---
let currentSearchIndex = 0;
let searchMatches = [];

function searchInLyrics() {
    const searchTerm = document.getElementById('lyricsSearch').value;
    const textarea = document.getElementById('lyricsInput');
    const countDisplay = document.getElementById('searchCount');
    
    if (!searchTerm) {
        countDisplay.classList.add('hidden');
        return;
    }
    
    const text = textarea.value;
    const matches = text.toLowerCase().split(searchTerm.toLowerCase()).length - 1;
    
    if (matches > 0) {
        countDisplay.classList.remove('hidden');
        countDisplay.textContent = `${matches} coincidencia(s)`;
    } else {
        countDisplay.classList.remove('hidden');
        countDisplay.textContent = '0 coincidencias';
    }
}

// --- PANTALLA COMPLETA PARA LETRA ---
let lyricsFontSize = 18;

function openLyricsFullscreen() {
    const modal = document.getElementById('lyricsFullscreenModal');
    const textContent = document.getElementById('lyricsFullscreenText');
    const textarea = document.getElementById('lyricsInput');
    
    textContent.textContent = textarea.value || 'No hay letra para mostrar.';
    updateLyricsLineCount();
    
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    document.body.style.overflow = 'hidden';
}

function closeLyricsFullscreen() {
    const modal = document.getElementById('lyricsFullscreenModal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    document.body.style.overflow = '';
    
    // Limpiar búsqueda
    document.getElementById('lyricsFullscreenSearch').value = '';
    document.getElementById('lyricsFullscreenText').innerHTML = document.getElementById('lyricsFullscreenText').textContent;
}

function increaseLyricsFontSize() {
    if (lyricsFontSize < 48) {
        lyricsFontSize += 2;
        updateLyricsFontSize();
    }
}

function decreaseLyricsFontSize() {
    if (lyricsFontSize > 12) {
        lyricsFontSize -= 2;
        updateLyricsFontSize();
    }
}

function updateLyricsFontSize() {
    const textElement = document.getElementById('lyricsFullscreenText');
    const display = document.getElementById('lyricsFontSizeDisplay');
    textElement.style.fontSize = lyricsFontSize + 'px';
    display.textContent = lyricsFontSize + 'px';
}

function updateLyricsLineCount() {
    const text = document.getElementById('lyricsFullscreenText').textContent;
    const lines = text.split('\n').filter(line => line.trim()).length;
    document.getElementById('lyricsLineCount').textContent = `${lines} líneas`;
}

// --- BÚSQUEDA EN PANTALLA COMPLETA ---
let fullscreenSearchIndex = 0;
let fullscreenMatches = [];

function searchInFullscreenLyrics() {
    const searchTerm = document.getElementById('lyricsFullscreenSearch').value;
    const textElement = document.getElementById('lyricsFullscreenText');
    const originalText = textElement.textContent;
    const countDisplay = document.getElementById('fullscreenSearchCount');
    
    if (!searchTerm) {
        textElement.innerHTML = originalText;
        countDisplay.textContent = '0/0';
        fullscreenMatches = [];
        fullscreenSearchIndex = 0;
        return;
    }
    
    const regex = new RegExp(`(${escapeRegExp(searchTerm)})`, 'gi');
    const matches = originalText.match(regex);
    
    if (matches) {
        fullscreenMatches = matches;
        fullscreenSearchIndex = 0;
        
        const highlightedText = originalText.replace(regex, '<mark class="bg-yellow-500 text-black px-1 rounded">$1</mark>');
        textElement.innerHTML = highlightedText;
        
        countDisplay.textContent = `1/${matches.length}`;
        scrollToFirstMatch();
    } else {
        textElement.innerHTML = originalText;
        countDisplay.textContent = '0/0';
        fullscreenMatches = [];
    }
}

function findNextMatch() {
    if (fullscreenMatches.length === 0) return;
    
    fullscreenSearchIndex = (fullscreenSearchIndex + 1) % fullscreenMatches.length;
    document.getElementById('fullscreenSearchCount').textContent = `${fullscreenSearchIndex + 1}/${fullscreenMatches.length}`;
    scrollToMatch(fullscreenSearchIndex);
}

function findPreviousMatch() {
    if (fullscreenMatches.length === 0) return;
    
    fullscreenSearchIndex = (fullscreenSearchIndex - 1 + fullscreenMatches.length) % fullscreenMatches.length;
    document.getElementById('fullscreenSearchCount').textContent = `${fullscreenSearchIndex + 1}/${fullscreenMatches.length}`;
    scrollToMatch(fullscreenSearchIndex);
}

function scrollToFirstMatch() {
    const marks = document.querySelectorAll('#lyricsFullscreenText mark');
    if (marks.length > 0) {
        marks[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

function scrollToMatch(index) {
    const marks = document.querySelectorAll('#lyricsFullscreenText mark');
    if (marks[index]) {
        marks[index].scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Cerrar modal con ESC
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const modal = document.getElementById('lyricsFullscreenModal');
        if (!modal.classList.contains('hidden')) {
            closeLyricsFullscreen();
        }
    }
});

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    // Establecer fecha del próximo domingo por defecto en el input de Repertorio
    const repFileNameInput = document.getElementById('repertoireFileName');
    if (repFileNameInput) {
        const today = new Date();
        const dayOfWeek = today.getDay();
        const daysUntilSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
        const nextSunday = new Date(today);
        nextSunday.setDate(today.getDate() + daysUntilSunday);
        
        const meses = ["agosto", "septiembre", "octubre", "noviembre", "diciembre", "enero", "febrero", "marzo", "abril", "mayo", "junio", "julio"];
        // Arreglando el índice de los meses
        const nombresMeses = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
        
        const day = String(nextSunday.getDate()).padStart(2, '0');
        const month = nombresMeses[nextSunday.getMonth()];
        const year = nextSunday.getFullYear();
        
        repFileNameInput.value = `domingo ${day} ${month} ${year}`;
    }
});