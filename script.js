
        // --- DATA ---
        const galleryImages = [
            "https://keephere.ru/get/31WNLyj5Eq7I_Cl/o/photo_2026-01-26_22-32-48.jpg",
            "https://keephere.ru/get/D7kNLyj5VR5xy2Q/o/photo_2026-01-26_22-30-49.jpg",
            "https://keephere.ru/get/baSNLyj5dS8pR3i/o/photo_2026-01-26_22-28-19.jpg",
            "https://keephere.ru/get/lOVNLyj5l_S_wwE/o/photo_2026-01-26_22-28-16.jpg",
            "https://keephere.ru/get/xS5NLyj5s4Ykhaf/o/photo_2026-01-26_22-28-12.jpg",
            "https://keephere.ru/get/z8lNLyj5zMHQrO1/o/photo_2026-01-26_22-28-07.jpg",
            "https://keephere.ru/get/IZjNLyj57OOtTXs/o/photo_2026-01-26_22-28-04.jpg",
            "https://keephere.ru/get/AqRNLyj6Bf7573d/o/photo_2026-01-26_22-28-35.jpg",
            "https://keephere.ru/get/gAPNLyj6IUDGB-i/o/photo_2026-01-26_22-28-31.jpg",
            "https://keephere.ru/get/HFnNLyj6On757G7/o/photo_2026-01-26_22-28-28.jpg",
            "https://keephere.ru/get/oMMNLyj6VaDkVHu/o/photo_2026-01-26_22-28-23.jpg",
            "https://keephere.ru/get/pO9NLyj613YrdIm/o/photo_2026-01-26_22-12-19.jpg",
            "https://keephere.ru/get/Qq4NLyj7C_9g_L1/o/photo_2026-01-26_22-12-12.jpg",
            "https://keephere.ru/get/CqLNLyj7JL4Fd8_/o/photo_2026-01-26_22-12-08.jpg",
            "https://keephere.ru/get/J5TNLyj7PyBPeJM/o/photo_2026-01-26_22-12-04.jpg",
            "https://keephere.ru/get/8uLNLyj7ydb58IW/o/photo_2026-01-26_22-12-01.jpg",
            "https://keephere.ru/get/kslNLyj75m5Wsjb/o/photo_2026-01-26_22-11-57.jpg",
            "https://keephere.ru/get/neCNLyj7_zj_53k/o/photo_2026-01-26_22-11-52.jpg",
            "https://keephere.ru/get/kAbNLyj8F9Lk65f/o/photo_2026-01-26_22-11-47.jpg",
            "https://keephere.ru/get/Ld7NLyj8MH2DENX/o/photo_2026-01-26_22-12-26.jpg",
            "https://keephere.ru/get/OzlNLyj8Tnl2OPW/o/photo_2026-01-26_22-12-23.jpg",
            "https://keephere.ru/get/PNLyj8XyvBq/o/photo.jpg",
            "https://keephere.ru/get/6tvNLyj682jwIKc/o/photo_2026-01-26_22-12-15.jpg"
        ];

        // --- ESTADO ---
        let slidesData = [];
        let bgImageData = null;
        let currentEditingIndex = -1;
        
        let currentAlignment = 'center'; 
        let currentVerticalAlignment = 'center'; 
        let generatedTagString = "";
        
        // Estado Tema
        let isDarkMode = true;

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
            if(isDarkMode) {
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
            if(isDarkMode) {
                icon.className = 'fa-solid fa-moon';
            } else {
                icon.className = 'fa-solid fa-sun text-yellow-300';
            }
        }
        
        // Estado PDF Merger
        let selectedPdfs = []; 
        let dragStartIndex;

        // Estado Repertoire (PPTX Queue)
        let repertoireList = [];

        // --- NAVEGACIÓN ---
        function scrollToSection(id) {
            document.getElementById(id).scrollIntoView({ behavior: 'smooth' });
        }

        // --- LÓGICA DE TEXTO Y ETIQUETAS ---
        function toTitleCase(str) {
            if(!str) return "";
            return str.replace(/\w\S*/g, function(txt){
                return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
            });
        }

        function generateTag() {
            let name = document.getElementById('songName').value.trim();
            let author = document.getElementById('songAuthor').value.trim();
            const cleanName = name ? toTitleCase(name) : "";
            const cleanAuthor = author ? toTitleCase(author) : "";
            
            if(cleanName) {
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
            
            // Actualizar el nombre de archivo automáticamente si está vacío o tiene valor viejo
            updateFilenamePreview();
            
            return generatedTagString;
        }

        function updateFilenamePreview() {
            // Intenta usar la etiqueta generada como nombre de archivo
            const currentTag = document.getElementById('resultOutput').value;
            // Si la etiqueta tiene valor, la usamos como filename default
            if(currentTag) {
                document.getElementById('exportFileName').value = currentTag;
            } else {
                // Si no hay etiqueta, tratamos de construir algo simple
                let name = document.getElementById('songName').value.trim();
                if(name) {
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
            switch(type) {
                case 'youtube': url = `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`; break;
                case 'lyrics': url = `https://www.google.com/search?q=${encodeURIComponent(q + " letra lyrics")}`; break;
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
            generateTag(); // Regenerar etiqueta por si acaso
            const text = document.getElementById('lyricsInput').value;
            const maxLines = parseInt(document.getElementById('linesPerSlide').value) || 2; 
            const addBlank = document.getElementById('addBlankSlide').checked;
            const addTitle = document.getElementById('addTitleSlide').checked;

            slidesData = [];
            if (addBlank) slidesData.push(" "); 
            if (addTitle) {
                const name = toTitleCase(document.getElementById('songName').value || "Título");
                const auth = toTitleCase(document.getElementById('songAuthor').value || "");
                slidesData.push(`${name}\n\n${auth}`);
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
            document.getElementById('lyricsInput').value = '';
            slidesData = [];
            renderSlides();
            renderQuickCopyList();
        }

        function renderSlides() {
            const container = document.getElementById('slidesContainer');
            container.innerHTML = '';
            document.getElementById('slideCount').innerText = slidesData.length;
            if(slidesData.length === 0) {
                container.innerHTML = `<div class="text-slate-500 text-center col-span-full py-12 border-2 border-dashed border-slate-700 rounded-lg bg-slate-800/50"><i class="fa-solid fa-music text-4xl mb-3 opacity-50"></i><br>Vacío</div>`;
                return;
            }
            slidesData.forEach((text, i) => {
                const slide = document.createElement('div');
                slide.className = 'slide-preview rounded-lg';
                slide.onclick = () => openEditModal(i);
                const num = document.createElement('div');
                num.className = 'slide-number';
                num.innerText = i + 1;
                const content = document.createElement('div');
                content.className = 'slide-content';
                content.innerText = text;
                slide.appendChild(num);
                slide.appendChild(content);
                container.appendChild(slide);
            });
            updateStyles();
        }

        function updateStyles() {
            const font = document.getElementById('fontFamily').value;
            const color = document.getElementById('textColor').value;
            const shadow = document.getElementById('textShadow').checked;
            const isBold = document.getElementById('textBold').checked;
            
            const realSize = parseInt(document.getElementById('fontSize').value);
            const previewSize = Math.max(10, realSize * 0.25); 
            const vAlignMap = { 'top': 'flex-start', 'center': 'center', 'bottom': 'flex-end' };
            
            // Actualizar botones visualmente
            const btnBg = 'bg-slate-700';
            document.getElementById('btnAlignLeft').classList.remove(btnBg);
            document.getElementById('btnAlignCenter').classList.remove(btnBg);
            document.getElementById('btnAlignRight').classList.remove(btnBg);
            if(currentAlignment === 'left') document.getElementById('btnAlignLeft').classList.add(btnBg);
            if(currentAlignment === 'center') document.getElementById('btnAlignCenter').classList.add(btnBg);
            if(currentAlignment === 'right') document.getElementById('btnAlignRight').classList.add(btnBg);

            document.getElementById('btnVAlignTop').classList.remove(btnBg);
            document.getElementById('btnVAlignCenter').classList.remove(btnBg);
            document.getElementById('btnVAlignBottom').classList.remove(btnBg);
            if(currentVerticalAlignment === 'top') document.getElementById('btnVAlignTop').classList.add(btnBg);
            if(currentVerticalAlignment === 'center') document.getElementById('btnVAlignCenter').classList.add(btnBg);
            if(currentVerticalAlignment === 'bottom') document.getElementById('btnVAlignBottom').classList.add(btnBg);

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
                item.style.backgroundImage = `url(${url})`;
                item.onclick = () => selectGalleryImage(url);
                const img = new Image();
                img.src = url;
                img.onload = () => item.classList.remove('animate-pulse');
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
            document.getElementById('editModalIndex').innerText = `#${i+1}`;
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
            if(slidesData.length === 0) {
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
                num.innerText = i+1;
                item.appendChild(num);
                item.appendChild(txtPreview);
                item.appendChild(btn);
                list.appendChild(item);
            });
        }

        // --- REPERTOIRE (PPTX MERGER / SETLIST) LOGIC ---
        
        function addToRepertoire() {
            if (slidesData.length === 0) return alert("No hay diapositivas para agregar.");
            
            // Guardar configuración actual como un "objeto canción"
            const songName = document.getElementById('exportFileName').value || "Canción Sin Nombre";
            const songConfig = {
                id: Date.now(), // ID único
                name: songName,
                slides: [...slidesData], // Copia del array
                styles: {
                    font: document.getElementById('fontFamily').value,
                    size: parseInt(document.getElementById('fontSize').value),
                    color: document.getElementById('textColor').value.replace('#', ''),
                    bold: document.getElementById('textBold').checked,
                    align: currentAlignment,
                    valign: currentVerticalAlignment,
                    shadow: document.getElementById('textShadow').checked,
                    bgImage: bgImageData // La imagen en base64
                }
            };
            
            repertoireList.push(songConfig);
            renderRepertoireList();
            
            // Animación visual de éxito
            const btn = document.querySelector('button[onclick="addToRepertoire()"]');
            const originalHTML = btn.innerHTML;
            btn.innerHTML = `<i class="fa-solid fa-check"></i> ¡Agregado!`;
            btn.classList.add('bg-green-600', 'border-green-500');
            setTimeout(() => {
                btn.innerHTML = originalHTML;
                btn.classList.remove('bg-green-600', 'border-green-500');
            }, 1000);
        }

        function renderRepertoireList() {
            const list = document.getElementById('repertoireList');
            document.getElementById('repertoireCount').innerText = repertoireList.length;
            list.innerHTML = "";

            if (repertoireList.length === 0) {
                list.innerHTML = '<p class="text-slate-500 text-xs text-center mt-10 italic">La lista está vacía.</p>';
                return;
            }

            repertoireList.forEach((song, index) => {
                const item = document.createElement('div');
                item.className = 'repertoire-item group';
                item.innerHTML = `
                    <div class="flex items-center gap-3 overflow-hidden">
                        <span class="text-amber-500 font-bold text-xs w-4">${index + 1}.</span>
                        <div>
                            <p class="text-sm text-white font-bold truncate">${song.name}</p>
                            <p class="text-[10px] text-slate-400">${song.slides.length} slides</p>
                        </div>
                    </div>
                    <div class="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onclick="removeRepertoireItem(${index})" class="text-slate-400 hover:text-red-400">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                `;
                list.appendChild(item);
            });
            
            // Habilitar SortableJS para reordenar
            if(list) {
                 new Sortable(list, {
                    animation: 150,
                    onEnd: function (evt) {
                        const item = repertoireList.splice(evt.oldIndex, 1)[0];
                        repertoireList.splice(evt.newIndex, 0, item);
                        renderRepertoireList(); // Re-renderizar indices
                    }
                });
            }
        }

        function removeRepertoireItem(index) {
            repertoireList.splice(index, 1);
            renderRepertoireList();
        }

        function handlePptxUpload(input) {
            if (input.files) {
                Array.from(input.files).forEach(file => {
                    repertoireList.push({
                        type: 'external',
                        id: Date.now() + Math.random(),
                        name: file.name,
                        file: file
                    });
                });
                renderRepertoireList();
            }
            input.value = "";
        }

        function renderRepertoireList() {
            const list = document.getElementById('repertoireList');
            document.getElementById('repertoireCount').innerText = repertoireList.length;
            list.innerHTML = "";

            if (repertoireList.length === 0) {
                list.innerHTML = '<p class="text-slate-500 text-xs text-center mt-10 italic">La lista está vacía.</p>';
                return;
            }

            repertoireList.forEach((item, index) => {
                const el = document.createElement('div');
                el.className = 'repertoire-item group bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 flex items-center justify-between mb-2 transition-colors';
                
                let iconStr = '<i class="fa-solid fa-music text-blue-500"></i>';
                let subtext = `${item.slides ? item.slides.length + ' slides' : ''}`;

                if (item.type === 'external') {
                    iconStr = '<i class="fa-solid fa-file-powerpoint text-amber-600"></i>';
                    subtext = `Externo (${(item.file.size / 1024).toFixed(1)} KB)`;
                }

                el.innerHTML = `
                    <div class="flex items-center gap-3 overflow-hidden">
                        <span class="text-amber-600 dark:text-amber-500 font-bold text-xs w-4">${index + 1}.</span>
                        <div class="text-lg">${iconStr}</div>
                        <div>
                            <p class="text-sm text-slate-800 dark:text-white font-bold truncate">${item.name}</p>
                            <p class="text-[10px] text-slate-500 dark:text-slate-400">${subtext}</p>
                        </div>
                    </div>
                    <div class="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onclick="removeRepertoireItem(${index})" class="text-slate-400 hover:text-red-400">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                `;
                list.appendChild(el);
            });
            
            if(list) {
                 new Sortable(list, {
                    animation: 150,
                    onEnd: function (evt) {
                        const item = repertoireList.splice(evt.oldIndex, 1)[0];
                        repertoireList.splice(evt.newIndex, 0, item);
                        renderRepertoireList();
                    }
                });
            }
        }

        function clearRepertoire() {
            if(confirm("¿Borrar toda la lista de repertorio?")) {
                repertoireList = [];
                renderRepertoireList();
            }
        }

        async function downloadSetlist() {
            if (repertoireList.length === 0) return alert("El repertorio está vacío.");
            
            const btn = document.querySelector('button[onclick="downloadSetlist()"]');
            const originalText = btn.innerHTML;
            btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Uniendo en Servidor...`;
            btn.disabled = true;

            const baseName = document.getElementById('repertoireFileName').value.trim() || "Repertorio";
            
            try {
                // 1. Prepare files in order
                const filesToSend = [];
                let internalBuffer = [];
                
                // Helper to flush internal buffer to a Blob
                const flushBuffer = async () => {
                   if (internalBuffer.length > 0) {
                       const blob = await generateBlobFromItems(internalBuffer);
                       // Create a File object
                       const file = new File([blob], "internal_segment.pptx", { type: "application/vnd.openxmlformats-officedocument.presentationml.presentation" });
                       filesToSend.push(file);
                       internalBuffer = [];
                   }
                };

                for (const item of repertoireList) {
                    if (item.type === 'external') {
                        await flushBuffer();
                        filesToSend.push(item.file);
                    } else {
                        internalBuffer.push(item);
                    }
                }
                await flushBuffer();

                // 2. Send to Backend
                const formData = new FormData();
                filesToSend.forEach(file => {
                    formData.append('files', file);
                });

                // URL del Backend - CAMBIAR si usas Render
                // Local: http://localhost:3000/merge
                // Render: https://tu-app.onrender.com/merge
                const BACKEND_URL = 'http://localhost:3000/merge'; 
                
                const response = await fetch(BACKEND_URL, {
                    method: 'POST',
                    body: formData
                });

                if (!response.ok) {
                    const errText = await response.text();
                    throw new Error("Server Error: " + errText);
                }

                const blob = await response.blob();
                
                // 3. Download
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = baseName + ".pptx";
                link.click();

            } catch (err) {
                console.error(err);
                if (err.message.includes("Failed to fetch")) {
                    alert("Error: No se pudo conectar con el servidor local.\n\nAsegúrate de ejecutar:\ncd backend\nnpm install\nnode server.js");
                } else {
                    alert("Error: " + err.message);
                }
            } finally {
                btn.innerHTML = originalText;
                btn.disabled = false;
            }
        }

        // Helper: Generates Blob from a list of INTERNAL items
        async function generateBlobFromItems(items) {
            let pptx = new PptxGenJS();
            pptx.layout = 'LAYOUT_16x9';

            for (const song of items) {
                const st = song.styles;
                const fontName = st.font.includes('Cambria') ? "Cambria" : 
                                 st.font.includes('Arial') ? "Arial" : 
                                 st.font.includes('Times') ? "Times New Roman" : 
                                 st.font.includes('Impact') ? "Impact" : "Verdana";
                
                const alignMap = { 'left': 'left', 'center': 'center', 'right': 'right' };
                const vAlignMap = { 'top': 'top', 'center': 'middle', 'bottom': 'bottom' };
                const shadowOpts = st.shadow ? { type: 'outer', angle: 45, blur: 3, offset: 2, opacity: 0.6 } : null;

                for (let text of song.slides) {
                    let slide = pptx.addSlide();
                    if (st.bgImage) { slide.background = { data: st.bgImage }; } 
                    else { slide.background = { color: "FFFFFF" }; }

                    slide.addText(text, {
                        x: 0, y: 0, w: '100%', h: '100%',
                        fontFace: fontName, fontSize: st.size, color: st.color,
                        bold: st.bold, align: alignMap[st.align] || 'center',
                        valign: vAlignMap[st.valign] || 'middle',
                        shadow: shadowOpts, paraSpaceAfter: 10
                    });
                }
            }
            // Return Blob Promise
            return await pptx.write("blob");
        }

        // Helper: Old Logic for single file download
        async function generateSinglePPTX(items, fileName) {
            let pptx = new PptxGenJS();
            pptx.layout = 'LAYOUT_16x9';
             for (const song of items) {
                const st = song.styles;
                const fontName = st.font.includes('Cambria') ? "Cambria" : 
                                 st.font.includes('Arial') ? "Arial" : 
                                 st.font.includes('Times') ? "Times New Roman" : 
                                 st.font.includes('Impact') ? "Impact" : "Verdana";
                const alignMap = { 'left': 'left', 'center': 'center', 'right': 'right' };
                const vAlignMap = { 'top': 'top', 'center': 'middle', 'bottom': 'bottom' };
                const shadowOpts = st.shadow ? { type: 'outer', angle: 45, blur: 3, offset: 2, opacity: 0.6 } : null;

                for (let text of song.slides) {
                    let slide = pptx.addSlide();
                    if (st.bgImage) { slide.background = { data: st.bgImage }; } 
                    else { slide.background = { color: "FFFFFF" }; }

                    slide.addText(text, {
                        x: 0, y: 0, w: '100%', h: '100%',
                        fontFace: fontName, fontSize: st.size, color: st.color,
                        bold: st.bold, align: alignMap[st.align] || 'center',
                        valign: vAlignMap[st.valign] || 'middle',
                        shadow: shadowOpts, paraSpaceAfter: 10
                    });
                }
            }
            await pptx.writeFile({ fileName: fileName + ".pptx" });
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
                
                // Obtener Estilos del DOM ACTUALES
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
                        x: 0, y: 0, w: '100%', h: '100%',
                        fontFace: fontName,
                        fontSize: fontSize, // CORREGIDO: Valor exacto sin multiplicador 0.75
                        color: fontColor,
                        bold: isBold, // CORREGIDO: Usa el valor del checkbox
                        align: alignMap[currentAlignment] || 'center',
                        valign: vAlignMap[currentVerticalAlignment] || 'middle',
                        shadow: shadowOpts,
                        paraSpaceAfter: 10
                    });
                }

                // Usar el nombre del input editable
                let fileName = document.getElementById('exportFileName').value.trim();
                if(!fileName) fileName = "Presentacion";
                // Limpiar caracteres ilegales para nombre de archivo
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

        // Funciones Drag & Drop
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
    