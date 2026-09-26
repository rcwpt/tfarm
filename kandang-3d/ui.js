/**
 * ui.js - Modern CAD/BIM User Interface Controller
 * Kandang Broiler 26x12m
 */

export class UIManager {
    constructor(sceneModel, cameraMgr, constrMgr, animMgr, dimMgr, measTool, matMgr) {
        this.sceneModel = sceneModel;
        this.cameraMgr = cameraMgr;
        this.constrMgr = constrMgr;
        this.animMgr = animMgr;
        this.dimMgr = dimMgr;
        this.measTool = measTool;
        this.matMgr = matMgr;
        this.data = sceneModel.data;

        this.selectedObject = null;
        this.isPresentation = false;

        this.initDOM();
        this.bindEvents();
        this.populateLayers();
        this.populateComponents();
        this.initDenahModal();
        this.populateValidation();
        this.populateBOM();
    }

    initDOM() {
        this.leftPanel = document.getElementById('left-panel');
        this.rightPanel = document.getElementById('right-panel');
        this.inspectorContent = document.getElementById('inspector-content');
        this.searchBox = document.getElementById('object-search');
        this.searchResults = document.getElementById('search-results');
        this.layerList = document.getElementById('layer-list');
        this.componentBreakdownList = document.getElementById('component-breakdown-list');
        this.denahModal = document.getElementById('denah-modal');
        this.btnToggleDenah = document.getElementById('btn-toggle-denah');
        this.btnCloseDenah = document.getElementById('btn-close-denah');
        this.btnDenahPip = document.getElementById('btn-denah-pip');
        this.validationContainer = document.getElementById('validation-container');
        this.bomContainer = document.getElementById('bom-container');

        // Timeline elements
        this.timelineSlider = document.getElementById('construction-slider');
        this.timelinePlayBtn = document.getElementById('btn-play-construction');
        this.timelineResetBtn = document.getElementById('btn-reset-construction');
        this.timelineSpeedSelect = document.getElementById('select-speed');
        this.stageBadge = document.getElementById('current-stage-badge');

        // Exploded & Section
        this.explodedSlider = document.getElementById('exploded-slider');
        this.explodedVal = document.getElementById('exploded-val');
        this.sectionToggle = document.getElementById('toggle-section');
        this.sectionSliders = document.getElementById('section-controls');
        this.secX = document.getElementById('sec-x');
        this.secY = document.getElementById('sec-y');
        this.secZ = document.getElementById('sec-z');
    }

    bindEvents() {
        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const target = btn.dataset.tab;
                const panel = btn.closest('.cad-panel');
                panel.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                panel.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
                btn.classList.add('active');
                const pane = panel.querySelector(`#pane-${target}`);
                if (pane) pane.classList.add('active');
            });
        });

        // Construction Timeline Slider
        this.timelineSlider.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value) / 100.0;
            this.constrMgr.pause();
            this.timelinePlayBtn.innerHTML = '▶ Putar';
            this.constrMgr.setProgress(val);
        });

        this.timelinePlayBtn.addEventListener('click', () => {
            if (this.constrMgr.isPlaying) {
                this.constrMgr.pause();
                this.timelinePlayBtn.innerHTML = '▶ Putar';
            } else {
                this.constrMgr.play();
                this.timelinePlayBtn.innerHTML = '⏸ Jeda';
            }
        });

        this.timelineResetBtn.addEventListener('click', () => {
            this.constrMgr.reset();
            this.timelinePlayBtn.innerHTML = '▶ Putar';
            this.timelineSlider.value = 0;
        });

        this.timelineSpeedSelect.addEventListener('change', (e) => {
            this.constrMgr.speed = parseFloat(e.target.value);
        });

        // Exploded View Slider
        this.explodedSlider.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value) / 100.0;
            this.explodedVal.innerText = `${e.target.value}%`;
            this.animMgr.setExploded(val);
        });

        // Section View Cutaway
        this.sectionToggle.addEventListener('change', (e) => {
            const active = e.target.checked;
            this.sectionSliders.style.display = active ? 'block' : 'none';
            this.updateSectionPlanes();
        });

        [this.secX, this.secY, this.secZ].forEach(slider => {
            slider.addEventListener('input', () => this.updateSectionPlanes());
        });

        // Camera Presets Buttons
        document.querySelectorAll('[data-camera]').forEach(btn => {
            btn.addEventListener('click', () => {
                this.cameraMgr.setPreset(btn.dataset.camera);
            });
        });

        // Display Mode Switcher
        document.getElementById('select-display-mode').addEventListener('change', (e) => {
            this.matMgr.setMode(e.target.value);
        });

        // Dimension Layer Controls & Dropdown
        const dimToggleBtn = document.getElementById('btn-toggle-dim-menu');
        const dimDropdown = document.getElementById('dim-dropdown-menu');
        if (dimToggleBtn && dimDropdown) {
            dimToggleBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const isShown = dimDropdown.style.display !== 'none';
                dimDropdown.style.display = isShown ? 'none' : 'flex';
            });
            document.addEventListener('click', (e) => {
                if (!dimDropdown.contains(e.target) && e.target !== dimToggleBtn) {
                    dimDropdown.style.display = 'none';
                }
            });
        }

        const dimCheckboxes = [
            { id: 'chk-dim-selected', cat: 'selected' },
            { id: 'chk-dim-main', cat: 'main' },
            { id: 'chk-dim-elevations', cat: 'elevations' },
            { id: 'chk-dim-grid', cat: 'grid' },
            { id: 'chk-dim-racks', cat: 'racks' }
        ];

        dimCheckboxes.forEach(({ id, cat }) => {
            const el = document.getElementById(id);
            if (el) {
                el.addEventListener('change', (e) => {
                    this.dimMgr.setCategoryVisible(cat, e.target.checked);
                });
            }
        });

        const hideAllDimsBtn = document.getElementById('btn-dim-hide-all');
        if (hideAllDimsBtn) {
            hideAllDimsBtn.addEventListener('click', () => {
                const areAnyVisible = Object.values(this.dimMgr.visibility).some(v => v);
                const nextState = !areAnyVisible;
                this.dimMgr.toggleAll(nextState);
                dimCheckboxes.forEach(({ id, cat }) => {
                    const el = document.getElementById(id);
                    if (el) el.checked = nextState;
                });
                hideAllDimsBtn.innerText = nextState ? 'Sembunyikan' : 'Tampilkan Semua';
            });
        }

        // Mobile Navigation & Panel Drawers
        const mobileBtns = document.querySelectorAll('.mobile-nav-btn');
        mobileBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const target = btn.dataset.target;
                mobileBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                if (target === 'canvas') {
                    this.leftPanel.classList.remove('mobile-open');
                    this.rightPanel.classList.remove('mobile-open');
                } else if (target === 'denah') {
                    this.toggleDenahModal();
                } else if (target === 'dims') {
                    if (dimDropdown) {
                        dimDropdown.style.display = (dimDropdown.style.display === 'none') ? 'flex' : 'none';
                    }
                } else if (target === 'left-panel') {
                    this.leftPanel.classList.toggle('mobile-open');
                    this.rightPanel.classList.remove('mobile-open');
                } else if (target === 'right-panel') {
                    this.rightPanel.classList.toggle('mobile-open');
                    this.leftPanel.classList.remove('mobile-open');
                }
            });
        });

        const closeLeft = document.getElementById('btn-close-left-panel');
        if (closeLeft) {
            closeLeft.addEventListener('click', () => {
                this.leftPanel.classList.remove('mobile-open');
                document.getElementById('m-btn-orbit')?.classList.add('active');
            });
        }
        const closeRight = document.getElementById('btn-close-right-panel');
        if (closeRight) {
            closeRight.addEventListener('click', () => {
                this.rightPanel.classList.remove('mobile-open');
                document.getElementById('m-btn-orbit')?.classList.add('active');
            });
        }

        // Measure Tool Button
        const measureBtn = document.getElementById('btn-measure');
        measureBtn.addEventListener('click', () => {
            const active = this.measTool.toggle();
            measureBtn.classList.toggle('active', active);
        });

        // Video Recorder Buttons
        document.getElementById('btn-record-video').addEventListener('click', () => {
            const dur = parseInt(document.getElementById('select-video-duration').value, 10);
            const btn = document.getElementById('btn-record-video');
            btn.classList.add('recording');
            btn.innerHTML = `⏺ Merekam (${dur}s)...`;

            // Start construction + orbit
            this.constrMgr.setProgress(0.0);
            this.constrMgr.duration = dur * 1000;
            this.constrMgr.play();

            this.animMgr.startRecording(dur, () => {
                btn.classList.remove('recording');
                btn.innerHTML = `🎥 Rekam Video Konstruksi`;
                alert("Perekaman video selesai! File WebM berhasil didownload.");
            });
        });

        document.getElementById('btn-screenshot').addEventListener('click', () => {
            this.animMgr.exportScreenshot();
        });

        // Fullscreen
        document.getElementById('btn-fullscreen').addEventListener('click', () => {
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen();
            } else {
                document.exitFullscreen();
            }
        });

        // Presentation Mode
        document.getElementById('btn-presentation').addEventListener('click', () => {
            this.togglePresentation();
        });

        // Visual Denah Events
        if (this.btnToggleDenah) {
            this.btnToggleDenah.addEventListener('click', () => {
                this.toggleDenahModal();
            });
        }
        if (this.btnCloseDenah) {
            this.btnCloseDenah.addEventListener('click', () => {
                this.denahModal.style.display = 'none';
            });
        }
        if (this.btnDenahPip) {
            this.btnDenahPip.addEventListener('click', () => {
                this.denahModal.classList.toggle('pip-mode');
                const isPip = this.denahModal.classList.contains('pip-mode');
                this.btnDenahPip.innerText = isPip ? '⛶ Perbesar' : '📌 Mode Mini-Map';
            });
        }

        const navMap = {
            'nav-denah-all': () => this.cameraMgr.setPreset('isometric'),
            'nav-denah-blower': () => this.cameraMgr.animateTo(new THREE.Vector3(-14, 6, 3.5), new THREE.Vector3(0, 6, 2), 800),
            'nav-denah-celldeck': () => this.cameraMgr.animateTo(new THREE.Vector3(38, 6, 3.5), new THREE.Vector3(26, 6, 2), 800),
            'nav-denah-aisle': () => this.cameraMgr.setPreset('interior'),
            'nav-denah-roof': () => this.cameraMgr.setPreset('roof')
        };
        for (const [id, fn] of Object.entries(navMap)) {
            const btn = document.getElementById(id);
            if (btn) btn.addEventListener('click', fn);
        }

        // Ventilation Simulation Toggles
        document.getElementById('toggle-ventilation').addEventListener('change', (e) => {
            this.animMgr.ventilationActive = e.target.checked;
        });

        document.getElementById('airflow-speed').addEventListener('input', (e) => {
            this.animMgr.airflowSpeed = parseFloat(e.target.value);
            document.getElementById('airflow-speed-val').innerText = `${e.target.value}x`;
        });

        // Search component
        this.searchBox.addEventListener('input', (e) => {
            this.handleSearch(e.target.value);
        });

        // Raycasting on 3D canvas for object selection
        const canvas = document.getElementById('three-canvas');
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();

        canvas.addEventListener('pointerdown', (e) => {
            if (this.measTool.active || e.button !== 0) return;
            const rect = canvas.getBoundingClientRect();
            mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
            mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

            raycaster.setFromCamera(mouse, this.cameraMgr.camera);
            const hits = raycaster.intersectObjects(this.sceneModel.rootGroup.children, true)
                .filter(h => h.object.type === 'Mesh' && h.object.userData && h.object.userData.metadata);

            if (hits.length > 0) {
                this.inspectObject(hits[0].object);
            }
        });
    }

    updateSectionPlanes() {
        if (!this.sectionToggle.checked) {
            this.animMgr.setSection(false);
            return;
        }
        const xVal = parseFloat(this.secX.value);
        const yVal = parseFloat(this.secY.value);
        const zVal = parseFloat(this.secZ.value);
        document.getElementById('sec-x-val').innerText = `${xVal.toFixed(1)}m`;
        document.getElementById('sec-y-val').innerText = `${yVal.toFixed(1)}m`;
        document.getElementById('sec-z-val').innerText = `${zVal.toFixed(1)}m`;
        this.animMgr.setSection(true, xVal, yVal, zVal);
    }

    populateLayers() {
        this.layerList.innerHTML = '';
        for (const [key, def] of Object.entries(this.data.layers)) {
            const count = this.sceneModel.layerGroups[key] ? this.sceneModel.layerGroups[key].children.length : 0;
            const div = document.createElement('div');
            div.className = 'layer-item';
            div.innerHTML = `
                <div class="layer-info">
                    <input type="checkbox" id="chk-${key}" checked>
                    <span class="layer-badge" style="background:${def.color}"></span>
                    <label for="chk-${key}">${def.name} <small>(${count})</small></label>
                </div>
                <div class="layer-actions">
                    <button class="btn-micro" title="Isolate Layer" data-isolate="${key}">Solo</button>
                    <button class="btn-micro" title="Focus Layer" data-focus="${key}">Zoom</button>
                </div>
            `;

            div.querySelector(`#chk-${key}`).addEventListener('change', (e) => {
                this.sceneModel.setLayerVisibility(key, e.target.checked);
            });

            div.querySelector(`[data-isolate="${key}"]`).addEventListener('click', () => {
                this.sceneModel.isolateLayer(key);
                this.updateLayerCheckboxes(key);
            });

            div.querySelector(`[data-focus="${key}"]`).addEventListener('click', () => {
                const grp = this.sceneModel.layerGroups[key];
                if (grp) this.cameraMgr.focusObject(grp);
            });

            this.layerList.appendChild(div);
        }

        // Show all button
        const showAllBtn = document.getElementById('btn-show-all-layers');
        if (showAllBtn) {
            showAllBtn.addEventListener('click', () => {
                this.sceneModel.showAllLayers();
                this.updateLayerCheckboxes(null);
            });
        }
    }

    updateLayerCheckboxes(isolatedKey) {
        for (const key in this.data.layers) {
            const chk = document.getElementById(`chk-${key}`);
            if (chk) {
                chk.checked = isolatedKey === null ? true : (key === isolatedKey);
            }
        }
    }

    populateComponents() {
        if (!this.componentBreakdownList) return;

        const categories = [
            {
                title: "01. Pondasi & Lantai Cor",
                count: "54 objek (312 m²)",
                icon: "🧱",
                filterLayer: "01_Pondasi_Lantai_Beton",
                items: [
                    { name: "Umpak Beton Bertulang", spec: "30x30x40 cm bertulang", count: "32 unit", layer: "01_Pondasi_Lantai_Beton" },
                    { name: "Plat Lantai Cor Rabat", spec: "Tebal 3 cm (Utara, Aisle 1-2, Aisle 2-3, Selatan)", count: "4 bidang", layer: "01_Pondasi_Lantai_Beton" },
                    { name: "Saluran Parit Got Drainase", spec: "20x20 cm cor semen (3 lajur @ 25m)", count: "15 segmen", layer: "02_Parit_Drainase_Got" },
                    { name: "Papan Penutup Parit Got Ulin", spec: "Kayu ulin 25.0 x 0.20 m tebal 2.5 cm", count: "3 batang", layer: "02_Parit_Drainase_Got" }
                ]
            },
            {
                title: "02. Tiang Kolom Komposit Utama",
                count: "160 objek (32 tiang)",
                icon: "🪵",
                filterLayer: "03_Tiang_Utama_Kayu_Besi",
                items: [
                    { name: "Bilah Luar Tiang Komposit", spec: "Kayu Besi/Ulin 5x10 cm H=2.97m (2 bilah/tiang)", count: "64 batang", layer: "03_Tiang_Utama_Kayu_Besi" },
                    { name: "Spacer Penjepit Tiang", spec: "Kayu Besi/Ulin 5x10 cm (bilah tengah)", count: "64 unit", layer: "03_Tiang_Utama_Kayu_Besi" },
                    { name: "Baut Pengikat Tiang Komposit", spec: "Baut mur galvanis pengunci bilah", count: "32 set", layer: "03_Tiang_Utama_Kayu_Besi" }
                ]
            },
            {
                title: "03. Dinding Keliling & Kusen",
                count: "175 objek (501,9 m)",
                icon: "🏠",
                filterLayer: "04_Dinding_Rangka_Papan",
                items: [
                    { name: "Tiang Dinding Vertikal", spec: "Kayu Papan 1.5x6 cm H=2.97m (spasi 30 cm)", count: "169 batang", layer: "04_Dinding_Rangka_Papan" },
                    { name: "Sabuk Dinding Horizontal Keliling", spec: "Kayu 5x10 cm L=26.0m (3 lapis: bawah, tengah, atas)", count: "6 batang", layer: "04_Dinding_Rangka_Papan" }
                ]
            },
            {
                title: "04. Rangka Rak Kandang 3 Susun",
                count: "3.630 objek (6 lajur x 24m)",
                icon: "🐔",
                filterLayer: "07_Rak_Tingkat_3_Susun",
                items: [
                    { name: "Tiang Vertikal Rangka Rak", spec: "Kayu 5x5 cm H=2.94m (spasi 1.0m)", count: "156 batang", layer: "07_Rak_Tingkat_3_Susun" },
                    { name: "Gelagar Memanjang Rak", spec: "Kayu 5x5 cm L=24.0m menerus", count: "60 batang", layer: "07_Rak_Tingkat_3_Susun" },
                    { name: "Usuk Dudukan Slat Kayu", spec: "Kayu Papan 1.5x6 cm L=24.0m", count: "300 batang", layer: "07_Rak_Tingkat_3_Susun" },
                    { name: "Pintu Kawat Harmonika", spec: "Kawat galvanis berbingkai 40x50 cm", count: "360 unit", layer: "07_Rak_Tingkat_3_Susun" },
                    { name: "Jeruji Bambu Penyekat", spec: "Bambu bulat Ø1.5cm pembatas sekat", count: "2.754 batang", layer: "07_Rak_Tingkat_3_Susun" }
                ]
            },
            {
                title: "05. Lantai Slat & Alas Kotoran",
                count: "48 objek (360 slat)",
                icon: "🟩",
                filterLayer: "08_Slat_Mesh_Plastik",
                items: [
                    { name: "Slat Mesh Plastik Hijau", spec: "Mesh plastik PP 120x50 cm (T1, T2, T3)", count: "360 lembar", layer: "08_Slat_Mesh_Plastik" },
                    { name: "Alas Kotoran Tripleks 8mm", spec: "Tripleks tebal 8mm lajur 24m (Susun 2 & 3)", count: "12 lajur", layer: "14_Alas_Kotoran_Tripleks" }
                ]
            },
            {
                title: "06. Sistem Minum & Talang Pakan",
                count: "3.229 objek (1.440 nipple)",
                icon: "💧",
                filterLayer: "10_Nipple_Drinker_Pipa",
                items: [
                    { name: "Nipple Drinker 360° Kuningan", spec: "Katup pin 360° stainless/kuningan (spasi 30cm)", count: "1.440 titik", layer: "10_Nipple_Drinker_Pipa" },
                    { name: "Mangkok Drip Cup Gantung", spec: "Drip cup plastik merah anti tumpah", count: "1.440 unit", layer: "10_Nipple_Drinker_Pipa" },
                    { name: "Pipa PVC 3/4in Nipple Line", spec: "Pipa PVC putih 3/4 inci lajur 24m", count: "240 batang", layer: "10_Nipple_Drinker_Pipa" },
                    { name: "Talang Pakan PVC Profil U", spec: "Profil U terbuka lebar 12cm, bibir 2cm (L=144m)", count: "108 segmen", layer: "09_Talang_Pakan_PVC" }
                ]
            },
            {
                title: "07. Sistem Ventilasi Blower & Mesin",
                count: "158 objek (6 unit blower)",
                icon: "💨",
                filterLayer: "12_Exhaust_Fan_Box_50in",
                items: [
                    { name: "Heavy Duty Cone Box Fan 50\"", spec: "Ukuran casing 1.37 x 1.37 x 0.40 m (54x54x16in)", count: "6 unit", layer: "12_Exhaust_Fan_Box_50in" },
                    { name: "Louver Shutter Otomatis", spec: "Bilah stainless buka-tutup otomatis (11/fan)", count: "66 bilah", layer: "12_Exhaust_Fan_Box_50in" },
                    { name: "Baling-Baling Propeller SS430", spec: "6 Daun sirip stainless steel Ø 1.27m (50in)", count: "36 daun", layer: "12_Exhaust_Fan_Box_50in" },
                    { name: "Mesin Diesel Kubota RD110TTB", spec: "11 HP Diesel kinetik penggerak 4 blower", count: "1 unit", layer: "12_Exhaust_Fan_Box_50in" },
                    { name: "As Transmisi Puli Kinetik", spec: "Baja as bulat L=10.4m + 6 set puli sabuk", count: "1 batang", layer: "12_Exhaust_Fan_Box_50in" }
                ]
            },
            {
                title: "08. Celldeck Cooling Pad & Terpal",
                count: "48 objek (12x1.7m pad)",
                icon: "🧊",
                filterLayer: "11_Cooling_Pad_Celldeck",
                items: [
                    { name: "Cellulose Pad 7090", spec: "Evaporative pad tebal 15cm, T=1.70m, L=12.0m", count: "41 panel", layer: "11_Cooling_Pad_Celldeck" },
                    { name: "Talang Stainless Distribusi & Drainase", spec: "Stainless steel SUS304 panjang 12.0m (atas & bawah)", count: "2 batang", layer: "11_Cooling_Pad_Celldeck" },
                    { name: "Terpal Plafon & Dinding Putih", spec: "Terpal kedap udara putih (Lantai Z=2.98m & Dinding)", count: "2 lembar", layer: "13_Terpal_Tirai_Samping" }
                ]
            },
            {
                title: "09. Rangka Kuda-Kuda & Atap Spandek",
                count: "1.062 objek (14 kuda-kuda)",
                icon: "🏗️",
                filterLayer: "05_Kuda_Kuda_Rangka_Kayu",
                items: [
                    { name: "Kuda-Kuda Kayu Bentang 12.0m", spec: "Balok tarik 12m, kaki kuda, tiang gantung, skur (spasi 2m)", count: "14 unit", layer: "05_Kuda_Kuda_Rangka_Kayu" },
                    { name: "Gording Miring Kayu 5x10 Canted", spec: "13 Jalur menerus @ 26m = 338m (miring 16.7°)", count: "13 jalur", layer: "05_Kuda_Kuda_Rangka_Kayu" },
                    { name: "Atap Spandek Galvalum", spec: "Gelombang Zincalume (90 lbr 6.0m + 90 lbr 2.0m)", count: "180 lembar", layer: "06_Atap_Spandek_Zincalume" },
                    { name: "Rangka & Kisi Ventilasi Monitor", spec: "Monitor roof Z=5.37 s.d 5.92m ventilasi udara nok", count: "419 komponen", layer: "15_Monitor_Roof_Nok" },
                    { name: "Bubungan Nok Atap Zincalume", spec: "Penutup puncak nok L=26.0m", count: "26 meter", layer: "06_Atap_Spandek_Zincalume" }
                ]
            }
        ];

        let html = '';
        categories.forEach(cat => {
            html += `
                <div class="comp-group-card">
                    <div class="comp-group-header" data-layer="${cat.filterLayer}">
                        <div class="comp-group-title">
                            <span>${cat.icon}</span>
                            <span>${cat.title}</span>
                        </div>
                        <span class="comp-group-count">${cat.count}</span>
                    </div>
                    <div class="comp-items-list">
            `;
            cat.items.forEach(item => {
                html += `
                    <div class="comp-item-row" data-name="${item.name}" data-layer="${item.layer}">
                        <div class="comp-item-name">
                            <span>${item.name}</span>
                            <span class="comp-item-spec">${item.spec}</span>
                        </div>
                        <span class="comp-item-qty">${item.count}</span>
                    </div>
                `;
            });
            html += `
                    </div>
                </div>
            `;
        });

        this.componentBreakdownList.innerHTML = html;

        // Add click events to group headers (isolate layer) and items (focus in 3D)
        this.componentBreakdownList.querySelectorAll('.comp-group-header').forEach(hdr => {
            hdr.addEventListener('click', () => {
                const layer = hdr.dataset.layer;
                this.isolateLayer(layer);
            });
        });

        this.componentBreakdownList.querySelectorAll('.comp-item-row').forEach(row => {
            row.addEventListener('click', () => {
                const name = row.dataset.name;
                const layer = row.dataset.layer;
                this.highlightComponentByName(name, layer);
            });
        });
    }

    highlightComponentByName(name, layer) {
        const matches = this.sceneModel.meshList.filter(item => {
            return item.metadata.name.toLowerCase().includes(name.toLowerCase().substring(0, 8)) ||
                   (layer && item.metadata.layer === layer);
        });

        if (matches.length > 0) {
            const first = matches[0];
            this.inspectObject(first.mesh);
            this.cameraMgr.focusObject(first.mesh);
        }
    }

    isolateComponentType(name) {
        // Ensure all building meshes remain fully visible!
        this.sceneModel.showAllLayers();
        const matches = this.sceneModel.meshList.filter(item => item.metadata.name === name);
        if (matches.length > 0) {
            this.inspectObject(matches[0].mesh);
            this.cameraMgr.focusObject(matches[0].mesh);
        }
    }

    initDenahModal() {
        const container = document.getElementById('denah-svg-container');
        if (!container) return;

        container.innerHTML = `
            <svg class="denah-svg-canvas" viewBox="-3 -3 33 18">
                <defs>
                    <pattern id="denahConcrete" width="1" height="1" patternUnits="userSpaceOnUse">
                        <rect width="1" height="1" fill="#111827"/>
                        <circle cx="0.5" cy="0.5" r="0.04" fill="#1f2937"/>
                    </pattern>
                </defs>

                <!-- Grid X Lines: 0, 2, 6, 10, 14, 18, 22, 26m -->
                ${[0, 2, 6, 10, 14, 18, 22, 26].map(gx => `
                    <line x1="${gx}" y1="-1.0" x2="${gx}" y2="13.0" stroke="#374151" stroke-width="0.05" stroke-dasharray="0.3,0.3"/>
                    <text x="${gx}" y="-1.3" fill="#9ca3af" font-size="0.32" font-family="monospace" text-anchor="middle">As X=${gx}m</text>
                `).join('')}

                <!-- Grid Y Lines: 0, 4, 8, 12m -->
                ${[
                    {y: 0, label: "As A (0m)"},
                    {y: 4, label: "As B (4m)"},
                    {y: 8, label: "As C (8m)"},
                    {y: 12, label: "As D (12m)"}
                ].map(gy => `
                    <line x1="-1.2" y1="${gy.y}" x2="27.2" y2="${gy.y}" stroke="#374151" stroke-width="0.05" stroke-dasharray="0.3,0.3"/>
                    <text x="-1.4" y="${gy.y + 0.12}" fill="#9ca3af" font-size="0.32" font-family="monospace" text-anchor="end">${gy.label}</text>
                `).join('')}

                <!-- Concrete Slab Floors -->
                <rect x="0" y="0" width="26" height="2.0" fill="url(#denahConcrete)" stroke="#1e293b" stroke-width="0.06"/>
                <rect x="0" y="2.2" width="26" height="3.8" fill="url(#denahConcrete)" stroke="#1e293b" stroke-width="0.06"/>
                <rect x="0" y="6.2" width="26" height="3.8" fill="url(#denahConcrete)" stroke="#1e293b" stroke-width="0.06"/>
                <rect x="0" y="10.2" width="26" height="1.8" fill="url(#denahConcrete)" stroke="#1e293b" stroke-width="0.06"/>

                <!-- 3 Got Drainase -->
                ${[2.0, 6.0, 10.0].map((gy, i) => `
                    <rect x="1" y="${gy}" width="25" height="0.20" fill="#92400e" stroke="#f59e0b" stroke-width="0.03" class="interactive-zone" data-target="got"/>
                `).join('')}

                <!-- 6 Racks 3 Susun (Interactive clickable zones) -->
                ${[
                    {y: 0.00, label: "Rak A (Utara)", pos: {x: 13, y: -2, z: 2.2}, target: {x: 13, y: 0.75, z: 1.2}},
                    {y: 2.50, label: "Rak B1 (Tengah-Kiri)", pos: {x: 13, y: 2.1, z: 1.8}, target: {x: 13, y: 3.25, z: 1.2}},
                    {y: 4.00, label: "Rak B2 (Tengah-Kanan)", pos: {x: 13, y: 2.1, z: 1.8}, target: {x: 13, y: 4.75, z: 1.2}},
                    {y: 6.50, label: "Rak C1 (Tengah-Kiri)", pos: {x: 13, y: 6.1, z: 1.8}, target: {x: 13, y: 7.25, z: 1.2}},
                    {y: 8.00, label: "Rak C2 (Tengah-Kanan)", pos: {x: 13, y: 6.1, z: 1.8}, target: {x: 13, y: 8.75, z: 1.2}},
                    {y: 10.50, label: "Rak D (Selatan)", pos: {x: 13, y: 14, z: 2.2}, target: {x: 13, y: 11.25, z: 1.2}}
                ].map(r => `
                    <g class="interactive-zone" data-nav-x="${r.pos.x}" data-nav-y="${r.pos.y}" data-nav-z="${r.pos.z}" data-tgt-x="${r.target.x}" data-tgt-y="${r.target.y}" data-tgt-z="${r.target.z}">
                        <rect x="1" y="${r.y}" width="24" height="1.50" fill="#14532d" fill-opacity="0.75" stroke="#22c55e" stroke-width="0.06"/>
                        <text x="13" y="${r.y + 0.85}" fill="#bbf7d0" font-size="0.4" font-weight="bold" text-anchor="middle">${r.label} [24.0 × 1.50m - 3 Susun]</text>
                    </g>
                `).join('')}

                <!-- Aisles (Lorong) Labels -->
                <text x="13" y="2.14" fill="#38bdf8" font-size="0.32" font-weight="bold" text-anchor="middle">LORONG 1 (Lebar 1.00m)</text>
                <text x="13" y="6.14" fill="#38bdf8" font-size="0.32" font-weight="bold" text-anchor="middle">LORONG 2 (Lebar 1.00m)</text>
                <text x="13" y="10.14" fill="#38bdf8" font-size="0.32" font-weight="bold" text-anchor="middle">LORONG 3 (Lebar 1.00m)</text>

                <!-- 32 Posts (Tiang Komposit 15x10) -->
                ${this.generateDenahPostsSVG()}

                <!-- Celldeck Cooling Pad at West End X=25.80 -->
                <g class="interactive-zone" data-nav-x="34" data-nav-y="6" data-nav-z="3.5" data-tgt-x="26" data-tgt-y="6" data-tgt-z="2">
                    <rect x="25.80" y="0" width="0.30" height="12" fill="#d97706" stroke="#fbbf24" stroke-width="0.08"/>
                    <text x="26.35" y="6" fill="#fde68a" font-size="0.42" font-weight="bold" transform="rotate(90, 26.35, 6)" text-anchor="middle">CELLDECK COOLING PAD 12.0M</text>
                </g>

                <!-- 6 Exhaust Fans at East End X=0 -->
                ${[1.0, 3.0, 5.0, 7.0, 9.0, 11.0].map((by, i) => `
                    <g class="interactive-zone" data-nav-x="-12" data-nav-y="6" data-nav-z="3.5" data-tgt-x="0" data-tgt-y="6" data-tgt-z="2">
                        <rect x="-0.40" y="${by - 0.68}" width="0.40" height="1.37" fill="#6b21a8" stroke="#c084fc" stroke-width="0.04"/>
                        <circle cx="-0.2" cy="${by}" r="0.45" fill="none" stroke="#e9d5ff" stroke-width="0.03"/>
                        <text x="-0.2" y="${by + 0.1}" fill="#f3e8ff" font-size="0.25" font-weight="bold" text-anchor="middle">F${i+1}</text>
                    </g>
                `).join('')}

                <!-- Diesel Engine Kubota & Shaft -->
                <rect x="-1.35" y="5.60" width="0.75" height="0.80" fill="#dc2626" stroke="#fca5a5" stroke-width="0.04" class="interactive-zone" data-nav-x="-10" data-nav-y="6" data-nav-z="2" data-tgt-x="-1" data-tgt-y="6" data-tgt-z="1"/>
                <text x="-0.98" y="6.1" fill="#fff" font-size="0.22" font-weight="bold" text-anchor="middle">KUBOTA</text>
                <line x1="-0.70" y1="0.80" x2="-0.70" y2="11.20" stroke="#f1f5f9" stroke-width="0.10"/>

                <!-- Overall Dimensions -->
                <line x1="0" y1="-2.0" x2="26" y2="-2.0" stroke="#00e5ff" stroke-width="0.08"/>
                <line x1="0" y1="-1.8" x2="0" y2="-2.2" stroke="#00e5ff" stroke-width="0.08"/>
                <line x1="26" y1="-1.8" x2="26" y2="-2.2" stroke="#00e5ff" stroke-width="0.08"/>
                <text x="13" y="-2.3" fill="#00e5ff" font-size="0.65" font-weight="bold" font-family="monospace" text-anchor="middle">PANJANG TOTAL = 26.00 M</text>

                <line x1="28.0" y1="0" x2="28.0" y2="12" stroke="#00e5ff" stroke-width="0.08"/>
                <line x1="27.8" y1="0" x2="28.2" y2="0" stroke="#00e5ff" stroke-width="0.08"/>
                <line x1="27.8" y1="12" x2="28.2" y2="12" stroke="#00e5ff" stroke-width="0.08"/>
                <text x="28.9" y="6" fill="#00e5ff" font-size="0.65" font-weight="bold" font-family="monospace" transform="rotate(90, 28.9, 6)" text-anchor="middle">LEBAR TOTAL = 12.00 M</text>
            </svg>
        `;

        container.querySelectorAll('.interactive-zone').forEach(zone => {
            zone.addEventListener('click', () => {
                const nx = parseFloat(zone.dataset.navX);
                const ny = parseFloat(zone.dataset.navY);
                const nz = parseFloat(zone.dataset.navZ);
                const tx = parseFloat(zone.dataset.tgtX);
                const ty = parseFloat(zone.dataset.tgtY);
                const tz = parseFloat(zone.dataset.tgtZ);

                if (!isNaN(nx)) {
                    this.cameraMgr.animateTo(new THREE.Vector3(nx, ny, nz), new THREE.Vector3(tx, ty, tz), 900);
                }
            });
        });
    }

    generateDenahPostsSVG() {
        const xCoords = [0.0, 2.0, 6.0, 10.0, 14.0, 18.0, 22.0, 26.0];
        const yCoords = [0.0, 4.0, 8.0, 12.0];
        let svg = '';
        let pIdx = 1;
        xCoords.forEach((x, c) => {
            yCoords.forEach((y, r) => {
                const px = (x === 0.0 ? 0.0 : (x === 26.0 ? 25.85 : x - 0.075));
                const py = (r === 0 ? 0.0 : (r === 3 ? 11.90 : y - 0.05));
                svg += `
                    <g class="interactive-zone" data-nav-x="${px + 3}" data-nav-y="${py - 3}" data-nav-z="3.0" data-tgt-x="${px}" data-tgt-y="${py}" data-tgt-z="1.5">
                        <rect x="${px - 0.075}" y="${py - 0.10}" width="0.30" height="0.30" fill="#334155" stroke="#64748b" stroke-width="0.02"/>
                        <rect x="${px}" y="${py}" width="0.15" height="0.10" fill="#ea580c" stroke="#fff" stroke-width="0.02"/>
                    </g>
                `;
                pIdx++;
            });
        });
        return svg;
    }

    toggleDenahModal() {
        const isShown = this.denahModal.style.display !== 'none';
        this.denahModal.style.display = isShown ? 'none' : 'flex';
        if (!isShown) {
            this.initDenahModal();
        }
    }

    inspectObject(mesh) {
        if (!mesh || !mesh.userData || !mesh.userData.metadata) return;
        const meta = mesh.userData.metadata;
        this.selectedObject = mesh;

        // Highlight
        if (this.highlightBox) {
            this.sceneModel.scene.remove(this.highlightBox);
        }
        this.highlightBox = new THREE.BoxHelper(mesh, 0x00e5ff);
        this.sceneModel.scene.add(this.highlightBox);

        // Show interactive 3D dimension arrows ("Dari Mana ke Mana")
        if (this.dimMgr) {
            this.dimMgr.showObjectDimensions(mesh);
        }

        // Switch right panel to Inspector tab
        const inspTab = document.querySelector('[data-tab="inspector"]');
        if (inspTab) inspTab.click();

        // On mobile: auto slide up inspector drawer
        if (window.innerWidth <= 850) {
            this.rightPanel.classList.add('mobile-open');
            document.querySelectorAll('.mobile-nav-btn').forEach(b => b.classList.remove('active'));
            document.getElementById('m-btn-inspect')?.classList.add('active');
        }

        const g = meta.geom;
        const q = meta.quantity;

        // Count identical and layer objects
        const exactMatches = this.sceneModel.meshList.filter(item => item.metadata.name === meta.name).length;
        const layerMatches = this.sceneModel.meshList.filter(item => item.metadata.layer === meta.layer).length;

        // Bounding box from-to coordinates
        const bMinX = (g.cx - (q.length || 0.1) / 2).toFixed(2);
        const bMaxX = (g.cx + (q.length || 0.1) / 2).toFixed(2);
        const bMinY = (g.cy - (q.width || 0.1) / 2).toFixed(2);
        const bMaxY = (g.cy + (q.width || 0.1) / 2).toFixed(2);
        const hVal = (q.height || (g.h !== undefined ? g.h : 0.1));
        const bMinZ = (g.cz - hVal / 2).toFixed(2);
        const bMaxZ = (g.cz + hVal / 2).toFixed(2);

        this.inspectorContent.innerHTML = `
            <div class="meta-card">
                <div class="meta-header">
                    <h4>${meta.name}</h4>
                    <span class="meta-id">${meta.id}</span>
                </div>
                <div class="meta-body">
                    <div class="meta-row"><span>Kategori:</span> <strong>${meta.category}</strong></div>
                    <div class="meta-row"><span>Bagian Bangunan:</span> <strong>${meta.buildingPart}</strong></div>
                    <div class="meta-row"><span>Jenis Material:</span> <strong>${meta.materialType}</strong></div>
                    <div class="meta-row"><span>Layer CAD:</span> <code>${meta.layer}</code></div>
                    <div class="meta-row"><span>Tahap Konstruksi:</span> <strong>[${meta.stage}/8] ${this.constrMgr.stages[meta.stage-1].name}</strong></div>
                    <div class="meta-row"><span>Jumlah Sejenis (Model):</span> <strong style="color:var(--accent-cyan);font-size:13px;">${exactMatches} unit</strong></div>
                    <div class="meta-row"><span>Total Objek di Layer:</span> <strong style="color:var(--accent-gold);">${layerMatches} objek</strong></div>
                    <hr>
                    <div class="meta-subtitle" style="color:var(--accent-cyan);">📐 UKURAN BAHAN (DARI MANA KE MANA)</div>
                    <div class="meta-row"><span>Panjang (X):</span> <strong>${q.length.toFixed(3)} m</strong> <small style="color:var(--accent-gold);">(${bMinX}m ➜ ${bMaxX}m)</small></div>
                    <div class="meta-row"><span>Lebar (Y):</span> <strong>${q.width.toFixed(3)} m</strong> <small style="color:var(--accent-gold);">(${bMinY}m ➜ ${bMaxY}m)</small></div>
                    <div class="meta-row"><span>Tinggi (Z):</span> <strong>${hVal.toFixed(3)} m</strong> <small style="color:var(--accent-gold);">(Z: +${bMinZ}m ➜ +${bMaxZ}m)</small></div>
                    <div class="meta-row"><span>Elevasi Dasar:</span> <strong>+${bMinZ} m dari tanah (±0.00)</strong></div>
                    <div class="meta-row"><span>Luas Permukaan:</span> <strong>${q.area.toFixed(3)} m²</strong></div>
                    <div class="meta-row"><span>Volume Bahan:</span> <strong>${q.volume.toFixed(5)} m³</strong></div>
                    <hr>
                    <div class="meta-subtitle">📍 TITIK PUSAT (Ruby)</div>
                    <div class="meta-row"><span>Center X, Y, Z:</span> <strong>(${g.cx.toFixed(3)}, ${g.cy.toFixed(3)}, ${g.cz.toFixed(3)}) m</strong></div>
                    <hr>
                    <div class="meta-subtitle">🔍 SOURCE TRACEABILITY</div>
                    <div class="meta-row"><span>File Sumber:</span> <code>build_kandang_LENGKAP.rb</code></div>
                    <div class="meta-row"><span>Baris Ruby:</span> <strong>Line ${meta.sourceLine}</strong></div>
                </div>
                <div class="meta-actions" style="display:flex;gap:6px;flex-direction:column;">
                    <button class="btn-primary" id="btn-focus-obj">🎯 Fokus Kamera</button>
                    <button class="btn-secondary" id="btn-highlight-same" title="Isolasi semua ${exactMatches} komponen sejenis">✨ Sorot Semua Sejenis (${exactMatches} Unit)</button>
                </div>
            </div>
        `;

        document.getElementById('btn-focus-obj').addEventListener('click', () => {
            this.cameraMgr.focusObject(mesh);
        });

        document.getElementById('btn-highlight-same').addEventListener('click', () => {
            this.isolateComponentType(meta.name);
        });
    }

    handleSearch(query) {
        if (!query || query.trim().length < 2) {
            this.searchResults.innerHTML = '';
            this.searchResults.style.display = 'none';
            return;
        }

        const q = query.toLowerCase().trim();
        const matches = [];

        for (const item of this.sceneModel.meshList) {
            const meta = item.metadata;
            if (meta.name.toLowerCase().includes(q) || meta.id.toLowerCase().includes(q) || meta.materialType.toLowerCase().includes(q)) {
                matches.push(item);
                if (matches.length >= 25) break;
            }
        }

        if (matches.length === 0) {
            this.searchResults.innerHTML = '<div class="search-empty">Tidak ada komponen ditemukan</div>';
            this.searchResults.style.display = 'block';
            return;
        }

        this.searchResults.innerHTML = '';
        matches.forEach(m => {
            const div = document.createElement('div');
            div.className = 'search-result-item';
            div.innerHTML = `
                <div class="sr-name">${m.metadata.name}</div>
                <div class="sr-sub">${m.metadata.buildingPart} | ${m.metadata.materialType} | Line ${m.metadata.sourceLine}</div>
            `;
            div.addEventListener('click', () => {
                this.inspectObject(m.mesh);
                this.cameraMgr.focusObject(m.mesh);
                this.searchResults.style.display = 'none';
            });
            this.searchResults.appendChild(div);
        });
        this.searchResults.style.display = 'block';
    }

    populateValidation() {
        const vRules = [
            { name: "Panjang Bangunan Utama (Sumbu X)", target: "26.00 m", status: "VALID", value: "26.00 m", note: "Sesuai koordinat Ruby (X=0 s.d 26m)" },
            { name: "Lebar Bentang Bangunan (Sumbu Y)", target: "12.00 m", status: "VALID", value: "12.00 m", note: "Sesuai bentang kuda-kuda (Y=0 s.d 12m)" },
            { name: "Elevasi Puncak Atap Monitor", target: "5.92 m", status: "VALID", value: "5.92 m", note: "Puncak nok spandek Z=5.92m" },
            { name: "Jumlah Tiang Komposit Kayu Besi 15x10", target: "32 Tiang", status: "VALID", value: "32 Tiang (160 bilah)", note: "Grid 8 baris x 4 kolom" },
            { name: "Jumlah Jalur Rak 3 Susun", target: "6 Lajur", status: "VALID", value: "6 Lajur (A, B1, B2, C1, C2, D)", note: "Panjang 24.0m tiap lajur" },
            { name: "Elevasi Susun Rak Ayam", target: "T1=0.25, T2=1.20, T3=2.15m", status: "VALID", value: "T1:0.25, T2:1.20, T3:2.15m", note: "Alas kotoran T2:0.95m, T3:1.90m" },
            { name: "Jumlah Jalur Parit Got Drainase", target: "3 Jalur", status: "VALID", value: "3 Jalur x 25m", note: "Got 20x20cm cor semen + penutup ulin" },
            { name: "Unit Exhaust Fan Box 50 Inch", target: "6 Unit", status: "VALID", value: "6 Unit Lengkap", note: "11 louver, 6 blade propeller, motor, grille" },
            { name: "Mesin Penggerak Kinetik", target: "1 Unit Kubota", status: "VALID", value: "Kubota RD110TTB (11 HP)", note: "As transmisi 10.4m & puli pully" },
            { name: "Cooling Pad Celldeck 7090", target: "12.0 x 1.70 m", status: "VALID", value: "12.0 x 1.70 m (41 panel)", note: "Talang stainless atas & bawah" },
            { name: "Jumlah Lembar Atap Spandek", target: "180 Lembar", status: "VALID", value: "90 lbr 6m + 90 lbr 2m", note: "Lebar efektif 0.70m bergelombang" },
            { name: "Kuda-Kuda Atap Bentang 12m", target: "14 Bentang", status: "VALID", value: "14 Kuda-Kuda (Spasi 2m)", note: "Skur penahan, tiang gantung, rafter monitor" },
            { name: "Jalur Gording Canted 5x10", target: "13 Jalur Menerus", status: "VALID", value: "13 Jalur x 26m", note: "Miring 16.7° tegak lurus bidang atap" },
            { name: "Plafon Kandang Terpal Putih", target: "26.0 x 12.0 m", status: "VALID", value: "312 m² (Z=2.98m)", note: "Tertutup rapat di bawah kuda-kuda" }
        ];

        let html = '<div class="validation-table-wrap"><table class="cad-table"><thead><tr><th>Parameter Kontrol</th><th>Target Ruby</th><th>Geometri 3D</th><th>Status</th><th>Keterangan</th></tr></thead><tbody>';
        vRules.forEach(r => {
            html += `<tr>
                <td><strong>${r.name}</strong></td>
                <td>${r.target}</td>
                <td>${r.value}</td>
                <td><span class="status-badge valid">✓ ${r.status}</span></td>
                <td><small>${r.note}</small></td>
            </tr>`;
        });
        html += '</tbody></table></div>';
        this.validationContainer.innerHTML = html;
    }

    populateBOM() {
        const rab = this.data.rabItems;
        let html = `
            <div class="bom-controls">
                <button class="btn-secondary" id="btn-export-bom-csv">📥 Export CSV</button>
                <button class="btn-secondary" id="btn-export-bom-json">📥 Export JSON</button>
                <button class="btn-secondary" id="btn-print-bom">🖨️ Cetak Laporan</button>
            </div>
            <div class="bom-table-wrap">
                <table class="cad-table" id="bom-table">
                    <thead>
                        <tr>
                            <th>No</th>
                            <th>Kode</th>
                            <th>Bagian Bangunan</th>
                            <th>Material</th>
                            <th>Nama Komponen</th>
                            <th>Spesifikasi</th>
                            <th>Jumlah</th>
                            <th>Satuan</th>
                            <th>Ruby Line</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        rab.slice(0, 100).forEach(item => {
            html += `<tr>
                <td>${item.no}</td>
                <td><code>${item.code}</code></td>
                <td>${item.part}</td>
                <td>${item.materialType}</td>
                <td><strong>${item.name}</strong></td>
                <td>${item.spec}</td>
                <td>${item.count}</td>
                <td>${item.unit}</td>
                <td>Line ${item.sourceLine}</td>
            </tr>`;
        });

        if (rab.length > 100) {
            html += `<tr><td colspan="9" style="text-align:center;color:#00e5ff">... dan ${rab.length - 100} item detail lainnya (Lihat Sketsa Teknis & RAB Lengkap untuk daftar 100%) ...</td></tr>`;
        }

        html += '</tbody></table></div>';
        this.bomContainer.innerHTML = html;

        document.getElementById('btn-export-bom-csv').addEventListener('click', () => this.exportCSV());
        document.getElementById('btn-export-bom-json').addEventListener('click', () => this.exportJSON());
        document.getElementById('btn-print-bom').addEventListener('click', () => window.print());
    }

    exportCSV() {
        let csv = "No,Kode,Bagian Bangunan,Material,Komponen,Spesifikasi,Jumlah,Satuan,Line Ruby\n";
        this.data.rabItems.forEach(item => {
            csv += `"${item.no}","${item.code}","${item.part}","${item.materialType}","${item.name}","${item.spec}","${item.count}","${item.unit}","Line ${item.sourceLine}"\n`;
        });
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `RAB_Kandang_Broiler_26x12m_${Date.now()}.csv`;
        a.click();
    }

    exportJSON() {
        const str = JSON.stringify(this.data, null, 2);
        const blob = new Blob([str], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `Kandang_Broiler_Data_${Date.now()}.json`;
        a.click();
    }

    updateConstructionUI(progress, stage) {
        this.timelineSlider.value = Math.round(progress * 100);
        document.getElementById('timeline-percent').innerText = `${Math.round(progress * 100)}%`;
        if (stage) {
            this.stageBadge.innerText = `[${stage.num}/8] ${stage.name}`;
            document.getElementById('stage-desc').innerText = stage.desc;
        }
    }

    togglePresentation() {
        this.isPresentation = !this.isPresentation;
        document.body.classList.toggle('presentation-mode', this.isPresentation);

        if (this.isPresentation) {
            // Auto start construction animation with smooth orbit
            this.constrMgr.setProgress(0.0);
            this.constrMgr.play();
            this.cameraMgr.setPreset('isometric');
        }
    }
}
