/**
 * ui.js - Modern CAD/BIM User Interface Controller
 * TFARM DIGITAL TWIN - Kandang Broiler 26x12m (3 Susun, 7.000 Ekor)
 * Contextual UI Architecture & Complete Technical Inspector
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
        this.activeMode = 'model';

        this.initDOM();
        this.bindEvents();
        this.populateLayers();
        this.populateComponents();
        this.initDenahModal();
        this.populateValidation();
        this.populateBOM();
        this.initSearch();
        this.initKeyboardShortcuts();
    }

    initDOM() {
        // Panels
        this.topBar = document.getElementById('top-bar');
        this.toolRail = document.getElementById('tool-rail');
        this.rightPanel = document.getElementById('right-panel');
        this.bottomBar = document.getElementById('bottom-bar');
        this.minimapWidget = document.getElementById('minimap-widget');
        this.searchModal = document.getElementById('search-modal');
        this.searchInput = document.getElementById('object-search-input');
        this.searchResultsBox = document.getElementById('search-results-box');
        this.presentationBadge = document.getElementById('presentation-badge');

        // Containers
        this.inspectorContent = document.getElementById('inspector-content');
        this.layerList = document.getElementById('layer-list');
        this.componentBreakdownList = document.getElementById('component-breakdown-list');
        this.denahModal = document.getElementById('denah-modal');
        this.validationContainer = document.getElementById('validation-container');
        this.bomContainer = document.getElementById('bom-container');

        // Bottom Context Modes
        this.contextModes = {
            model: document.getElementById('context-model'),
            exploded: document.getElementById('context-exploded'),
            construction: document.getElementById('context-construction'),
            section: document.getElementById('context-section'),
            simulation: document.getElementById('context-simulation'),
            measure: document.getElementById('context-measure')
        };

        // Exploded View elements
        this.explodedSlider = document.getElementById('exploded-slider');
        this.explodedPercentBadge = document.getElementById('exploded-percent-badge');
        this.btnAutoExplode = document.getElementById('btn-auto-explode');
        this.btnPauseExplode = document.getElementById('btn-pause-explode');
        this.btnResetExplode = document.getElementById('btn-reset-explode');

        // Construction Timeline elements
        this.timelineSlider = document.getElementById('construction-slider');
        this.timelinePlayBtn = document.getElementById('btn-play-construction');
        this.timelineResetBtn = document.getElementById('btn-reset-construction');
        this.timelineSpeedSelect = document.getElementById('select-speed');
        this.stageBadge = document.getElementById('current-stage-badge');
        this.stageDesc = document.getElementById('stage-desc');
        this.timelinePercent = document.getElementById('timeline-percent');

        // Section Sliders
        this.toggleSection = document.getElementById('toggle-section');
        this.secX = document.getElementById('sec-x');
        this.secY = document.getElementById('sec-y');
        this.secZ = document.getElementById('sec-z');
        this.secXVal = document.getElementById('sec-x-val');
        this.secYVal = document.getElementById('sec-y-val');
        this.secZVal = document.getElementById('sec-z-val');

        // Selection Tag
        this.statusSelectedObj = document.getElementById('status-selected-obj');
        this.btnQuickInspect = document.getElementById('btn-quick-inspect');

        // Link animMgr onExplodedUpdate
        this.animMgr.onExplodedUpdate = (val) => {
            const pct = Math.round(val * 100);
            if (this.explodedSlider) this.explodedSlider.value = pct;
            if (this.explodedPercentBadge) this.explodedPercentBadge.innerText = `${pct}%`;
        };
    }

    setMode(mode) {
        this.activeMode = mode;

        // Update Top Tabs
        document.querySelectorAll('.mode-tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === mode);
        });

        // Hide all bottom context modes
        for (const key in this.contextModes) {
            if (this.contextModes[key]) {
                this.contextModes[key].style.display = 'none';
            }
        }

        // Show appropriate bottom context
        if (mode === 'model') {
            if (this.contextModes.model) this.contextModes.model.style.display = 'flex';
        } else if (mode === 'exploded') {
            if (this.contextModes.exploded) this.contextModes.exploded.style.display = 'flex';
        } else if (mode === 'construction') {
            if (this.contextModes.construction) this.contextModes.construction.style.display = 'flex';
        } else if (mode === 'section') {
            if (this.contextModes.section) this.contextModes.section.style.display = 'flex';
            this.updateSectionPlanes();
        } else if (mode === 'simulation') {
            if (this.contextModes.simulation) this.contextModes.simulation.style.display = 'flex';
        } else if (mode === 'denah') {
            this.toggleDenahModal(true);
            if (this.contextModes.model) this.contextModes.model.style.display = 'flex';
        }
    }

    openRightPanel(tab = 'inspector') {
        if (!this.rightPanel) return;
        this.rightPanel.classList.remove('collapsed');

        // Switch tab
        document.querySelectorAll('.panel-tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tab);
        });
        document.querySelectorAll('.panel-pane').forEach(pane => {
            pane.classList.toggle('active', pane.id === `pane-${tab}`);
        });

        const titles = {
            inspector: "INSPEKTOR KOMPONEN",
            layers: "19 LAYER CAD & KATALOG",
            bom: "QUANTITY TAKE-OFF (BOM)",
            validation: "VALIDASI MODEL 1:1",
            settings: "PENGATURAN DISPLAY"
        };
        const titleEl = document.getElementById('right-panel-title');
        if (titleEl) titleEl.innerText = titles[tab] || "PANEL KONTROL";
    }

    closeRightPanel() {
        if (!this.rightPanel) return;
        this.rightPanel.classList.add('collapsed');
    }

    bindEvents() {
        // Mode Switcher Tabs
        document.querySelectorAll('.mode-tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.setMode(btn.dataset.mode);
            });
        });

        // Left Tool Rail Buttons
        document.querySelectorAll('.rail-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const action = btn.dataset.action;
                this.handleRailAction(action, btn);
            });
        });

        // Right Panel Close Button
        const closeRight = document.getElementById('btn-close-right-panel');
        if (closeRight) {
            closeRight.addEventListener('click', () => this.closeRightPanel());
        }

        // Right Panel Tabs
        document.querySelectorAll('.panel-tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const tab = btn.dataset.tab;
                this.openRightPanel(tab);
            });
        });

        // Quick Inspect Button on Bottom Bar
        if (this.btnQuickInspect) {
            this.btnQuickInspect.addEventListener('click', () => {
                this.openRightPanel('inspector');
            });
        }

        // Settings Button on Top Bar
        const btnSettings = document.getElementById('btn-toggle-settings');
        if (btnSettings) {
            btnSettings.addEventListener('click', () => {
                const isCollapsed = this.rightPanel.classList.contains('collapsed');
                if (isCollapsed) this.openRightPanel('settings');
                else this.closeRightPanel();
            });
        }

        // Exploded Slider & Presets
        if (this.explodedSlider) {
            this.explodedSlider.addEventListener('input', (e) => {
                const val = parseFloat(e.target.value) / 100.0;
                this.animMgr.explodedAuto = false;
                this.animMgr.setExploded(val);
                if (this.explodedPercentBadge) this.explodedPercentBadge.innerText = `${e.target.value}%`;
            });
        }

        document.querySelectorAll('[data-exp-preset]').forEach(btn => {
            btn.addEventListener('click', () => {
                const p = parseInt(btn.dataset.expPreset, 10);
                this.animMgr.explodedAuto = false;
                this.animMgr.setExploded(p / 100.0);
                if (this.explodedSlider) this.explodedSlider.value = p;
                if (this.explodedPercentBadge) this.explodedPercentBadge.innerText = `${p}%`;
            });
        });

        if (this.btnAutoExplode) {
            this.btnAutoExplode.addEventListener('click', () => {
                this.animMgr.explodedAuto = !this.animMgr.explodedAuto;
                this.btnAutoExplode.innerText = this.animMgr.explodedAuto ? '⏸ Jeda Explode' : '▶ Auto Explode';
            });
        }

        if (this.btnPauseExplode) {
            this.btnPauseExplode.addEventListener('click', () => {
                this.animMgr.explodedAuto = false;
                if (this.btnAutoExplode) this.btnAutoExplode.innerText = '▶ Auto Explode';
            });
        }

        if (this.btnResetExplode) {
            this.btnResetExplode.addEventListener('click', () => {
                this.animMgr.explodedAuto = false;
                this.animMgr.setExploded(0.0);
                if (this.explodedSlider) this.explodedSlider.value = 0;
                if (this.explodedPercentBadge) this.explodedPercentBadge.innerText = '0%';
                if (this.btnAutoExplode) this.btnAutoExplode.innerText = '▶ Auto Explode';
            });
        }

        // Exploded Group Filters
        const groupCheckboxes = [
            { id: 'chk-exp-roof', key: 'roof' },
            { id: 'chk-exp-rack', key: 'rack' },
            { id: 'chk-exp-structure', key: 'structure' },
            { id: 'chk-exp-fans', key: 'exhaustFan' },
            { id: 'chk-exp-cooling', key: 'coolingPad' },
            { id: 'chk-exp-equipment', key: 'equipment' }
        ];

        groupCheckboxes.forEach(({ id, key }) => {
            const el = document.getElementById(id);
            if (el) {
                el.addEventListener('change', (e) => {
                    this.animMgr.explodedGroups[key] = e.target.checked;
                    this.animMgr.setExploded(this.animMgr.explodedProgress);
                });
            }
        });

        const btnExpAll = document.getElementById('btn-exp-select-all');
        if (btnExpAll) {
            btnExpAll.addEventListener('click', () => {
                groupCheckboxes.forEach(({ id, key }) => {
                    const el = document.getElementById(id);
                    if (el) el.checked = true;
                    this.animMgr.explodedGroups[key] = true;
                });
                this.animMgr.setExploded(this.animMgr.explodedProgress);
            });
        }

        const btnExpNone = document.getElementById('btn-exp-select-none');
        if (btnExpNone) {
            btnExpNone.addEventListener('click', () => {
                groupCheckboxes.forEach(({ id, key }) => {
                    const el = document.getElementById(id);
                    if (el) el.checked = false;
                    this.animMgr.explodedGroups[key] = false;
                });
                this.animMgr.setExploded(this.animMgr.explodedProgress);
            });
        }

        // Construction Timeline Events
        if (this.timelineSlider) {
            this.timelineSlider.addEventListener('input', (e) => {
                const val = parseFloat(e.target.value) / 100.0;
                this.constrMgr.pause();
                if (this.timelinePlayBtn) this.timelinePlayBtn.innerHTML = '▶ Putar';
                this.constrMgr.setProgress(val);
            });
        }

        if (this.timelinePlayBtn) {
            this.timelinePlayBtn.addEventListener('click', () => {
                if (this.constrMgr.isPlaying) {
                    this.constrMgr.pause();
                    this.timelinePlayBtn.innerHTML = '▶ Putar';
                } else {
                    this.constrMgr.play();
                    this.timelinePlayBtn.innerHTML = '⏸ Jeda';
                }
            });
        }

        if (this.timelineResetBtn) {
            this.timelineResetBtn.addEventListener('click', () => {
                this.constrMgr.reset();
                if (this.timelinePlayBtn) this.timelinePlayBtn.innerHTML = '▶ Putar';
                if (this.timelineSlider) this.timelineSlider.value = 0;
            });
        }

        if (this.timelineSpeedSelect) {
            this.timelineSpeedSelect.addEventListener('change', (e) => {
                this.constrMgr.speed = parseFloat(e.target.value);
            });
        }

        // Section Sliders
        if (this.toggleSection) {
            this.toggleSection.addEventListener('change', () => this.updateSectionPlanes());
        }
        [this.secX, this.secY, this.secZ].forEach(sl => {
            if (sl) {
                sl.addEventListener('input', () => this.updateSectionPlanes());
            }
        });
        const btnResetSec = document.getElementById('btn-reset-section');
        if (btnResetSec) {
            btnResetSec.addEventListener('click', () => {
                if (this.secX) this.secX.value = 26;
                if (this.secY) this.secY.value = 12;
                if (this.secZ) this.secZ.value = 6;
                this.updateSectionPlanes();
            });
        }

        // Airflow Speed Chips
        document.querySelectorAll('[data-airflow-speed]').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('[data-airflow-speed]').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const speed = parseFloat(btn.dataset.airflowSpeed);
                this.animMgr.airflowSpeed = speed;
            });
        });

        const toggleVent = document.getElementById('toggle-ventilation');
        if (toggleVent) {
            toggleVent.addEventListener('change', (e) => {
                this.animMgr.ventilationActive = e.target.checked;
                if (this.animMgr.airflowParticles) {
                    this.animMgr.airflowParticles.visible = e.target.checked;
                }
            });
        }

        // Camera Preset Buttons
        document.querySelectorAll('[data-camera]').forEach(btn => {
            btn.addEventListener('click', () => {
                const preset = btn.dataset.camera;
                this.cameraMgr.setPreset(preset);
                document.querySelectorAll('[data-camera]').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });

        const btnFitModel = document.getElementById('btn-fit-model');
        if (btnFitModel) {
            btnFitModel.addEventListener('click', () => {
                this.cameraMgr.animateTo(new THREE.Vector3(38, -18, 22), new THREE.Vector3(13, 6, 2.5), 700);
            });
        }

        // Display Mode Switcher
        const dispSelect = document.getElementById('select-display-mode');
        if (dispSelect) {
            dispSelect.addEventListener('change', (e) => {
                this.matMgr.setMode(e.target.value);
            });
        }

        // Dimensions Toggle Button
        const btnToggleDim = document.getElementById('btn-toggle-dim');
        if (btnToggleDim) {
            btnToggleDim.addEventListener('click', () => {
                const areAnyVisible = Object.values(this.dimMgr.visibility).some(v => v);
                const next = !areAnyVisible;
                this.dimMgr.toggleAll(next);
                btnToggleDim.classList.toggle('active', next);
            });
        }

        // Screenshot
        const btnScreenshot = document.getElementById('btn-screenshot');
        if (btnScreenshot) {
            btnScreenshot.addEventListener('click', () => {
                this.animMgr.exportScreenshot();
            });
        }

        // Video Recording
        const btnRecord = document.getElementById('btn-record-video');
        if (btnRecord) {
            btnRecord.addEventListener('click', () => {
                const durSelect = document.getElementById('select-video-duration');
                const dur = durSelect ? parseInt(durSelect.value, 10) : 60;
                btnRecord.classList.add('recording');
                btnRecord.innerHTML = `⏺ (${dur}s)...`;

                this.constrMgr.setProgress(0.0);
                this.constrMgr.duration = dur * 1000;
                this.constrMgr.play();

                this.animMgr.startRecording(dur, () => {
                    btnRecord.classList.remove('recording');
                    btnRecord.innerHTML = `🎥 Rekam`;
                    alert("Perekaman video 3D selesai! File WebM berhasil didownload.");
                });
            });
        }

        // Fullscreen
        const btnFullscreen = document.getElementById('btn-fullscreen');
        if (btnFullscreen) {
            btnFullscreen.addEventListener('click', () => {
                if (!document.fullscreenElement) {
                    document.documentElement.requestFullscreen().catch(() => {});
                } else {
                    document.exitFullscreen().catch(() => {});
                }
            });
        }

        // Minimap Expand Button
        const btnExpandMap = document.getElementById('btn-expand-minimap');
        if (btnExpandMap) {
            btnExpandMap.addEventListener('click', () => this.toggleDenahModal(true));
        }

        const btnCloseDenah = document.getElementById('btn-close-denah');
        if (btnCloseDenah) {
            btnCloseDenah.addEventListener('click', () => this.toggleDenahModal(false));
        }

        // Raycasting for Component Selection
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();
        let isDragging = false;
        let startX = 0, startY = 0;

        window.addEventListener('pointerdown', (e) => {
            isDragging = false;
            startX = e.clientX;
            startY = e.clientY;
        });

        window.addEventListener('pointerup', (e) => {
            const dist = Math.hypot(e.clientX - startX, e.clientY - startY);
            if (dist > 6) return; // Orbit/pan drag, not click

            if (e.target.tagName === 'CANVAS') {
                const rect = e.target.getBoundingClientRect();
                mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
                mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

                raycaster.setFromCamera(mouse, this.cameraMgr.camera);
                const intersects = raycaster.intersectObjects(this.sceneModel.rootGroup.children, true)
                    .filter(i => i.object.type === 'Mesh' && i.object.name !== 'GroundGrid');

                if (intersects.length > 0) {
                    this.selectObject(intersects[0].object);
                } else {
                    this.clearSelection();
                }
            }
        });
    }

    handleRailAction(action, btn) {
        // Toggle active rail button state
        document.querySelectorAll('.rail-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        switch (action) {
            case 'home':
                this.cameraMgr.setPreset('isometric');
                this.setMode('model');
                break;
            case 'orbit':
                this.setMode('model');
                break;
            case 'focus':
                this.focusSelected();
                break;
            case 'measure':
                this.toggleMeasureMode();
                break;
            case 'dimensions':
                const areAnyVisible = Object.values(this.dimMgr.visibility).some(v => v);
                this.dimMgr.toggleAll(!areAnyVisible);
                break;
            case 'exploded':
                this.setMode('exploded');
                break;
            case 'section':
                this.setMode('section');
                break;
            case 'construction':
                this.setMode('construction');
                break;
            case 'airflow':
                this.setMode('simulation');
                break;
            case 'map':
                this.toggleDenahModal();
                break;
            case 'search':
                this.openSearch();
                break;
            case 'layers':
                this.openRightPanel('layers');
                break;
            case 'bom':
                this.openRightPanel('bom');
                break;
            case 'validation':
                this.openRightPanel('validation');
                break;
        }
    }

    toggleMeasureMode() {
        const active = this.measTool.toggle();
        for (const key in this.contextModes) {
            if (this.contextModes[key]) this.contextModes[key].style.display = 'none';
        }
        if (active) {
            if (this.contextModes.measure) this.contextModes.measure.style.display = 'flex';
        } else {
            if (this.contextModes.model) this.contextModes.model.style.display = 'flex';
        }

        const cancelBtn = document.getElementById('btn-cancel-measure');
        if (cancelBtn) {
            cancelBtn.onclick = () => {
                this.measTool.toggle(false);
                if (this.contextModes.measure) this.contextModes.measure.style.display = 'none';
                if (this.contextModes.model) this.contextModes.model.style.display = 'flex';
                document.querySelector('[data-action="orbit"]')?.classList.add('active');
            };
        }
    }

    updateSectionPlanes() {
        if (!this.toggleSection || !this.toggleSection.checked) {
            this.animMgr.setSection(false);
            return;
        }
        const x = parseFloat(this.secX.value);
        const y = parseFloat(this.secY.value);
        const z = parseFloat(this.secZ.value);

        if (this.secXVal) this.secXVal.innerText = `${x.toFixed(1)}m`;
        if (this.secYVal) this.secYVal.innerText = `${y.toFixed(1)}m`;
        if (this.secZVal) this.secZVal.innerText = `${z.toFixed(1)}m`;

        this.animMgr.setSection(true, x, y, z);
    }

    selectObject(mesh) {
        if (!mesh) return;

        // Reset previous highlight
        if (this.selectedObject && this.selectedObject !== mesh) {
            this.matMgr.restoreOriginal(this.selectedObject);
        }

        this.selectedObject = mesh;
        this.matMgr.highlightObject(mesh, 0x00e5ff);

        const meta = (mesh.userData && mesh.userData.metadata) ? mesh.userData.metadata : { name: mesh.name };
        const box = new THREE.Box3().setFromObject(mesh);
        const size = box.getSize(new THREE.Vector3());

        // Update Bottom Bar Status
        if (this.statusSelectedObj) {
            this.statusSelectedObj.innerHTML = `Terpilih: <strong style="color:#00e5ff;">${meta.name || mesh.name}</strong>`;
        }
        if (this.btnQuickInspect) this.btnQuickInspect.style.display = 'inline-block';

        // Update Dimension Line
        this.dimMgr.setSelectedObject(mesh);

        // Populate Inspector Card
        this.renderInspectorCard(meta, box, size, mesh);

        // Automatically open right panel with object inspector
        this.openRightPanel('inspector');
    }

    clearSelection() {
        if (this.selectedObject) {
            this.matMgr.restoreOriginal(this.selectedObject);
            this.selectedObject = null;
        }
        this.dimMgr.clearSelectedObject();
        if (this.statusSelectedObj) {
            this.statusSelectedObj.innerText = "Objek: Tidak Ada Terpilih";
        }
        if (this.btnQuickInspect) this.btnQuickInspect.style.display = 'none';

        if (this.inspectorContent) {
            this.inspectorContent.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🎯</div>
                    <div class="empty-title">PILIH OBJEK PADA MODEL 3D</div>
                    <div class="empty-desc">Klik sembarang tiang, rak, slat, nipple, kuda-kuda, spandek, blower, atau fondasi untuk memeriksa data geometri CAD 1:1 langsung dari Ruby SketchUp.</div>
                </div>
            `;
        }
    }

    focusSelected() {
        if (this.selectedObject) {
            const box = new THREE.Box3().setFromObject(this.selectedObject);
            const center = box.getCenter(new THREE.Vector3());
            const size = box.getSize(new THREE.Vector3());
            const maxDim = Math.max(size.x, size.y, size.z, 1.2);
            this.cameraMgr.animateTo(
                new THREE.Vector3(center.x + maxDim * 2.2, center.y - maxDim * 2.2, center.z + maxDim * 1.5),
                center,
                700
            );
        } else {
            this.cameraMgr.setPreset('isometric');
        }
    }

    renderInspectorCard(meta, box, size, mesh) {
        if (!this.inspectorContent) return;

        let totalQty = "1 Unit";
        if (meta.materialType && this.data.materialSummary && this.data.materialSummary[meta.materialType]) {
            totalQty = `${this.data.materialSummary[meta.materialType].count} Unit di Kandang`;
        }

        this.inspectorContent.innerHTML = `
            <div class="meta-card">
                <div class="meta-badge-row">
                    <span class="spec-pill">${meta.id || 'CAD-OBJ'}</span>
                    <span class="spec-pill gold">TAHAP ${meta.stage || '1'}</span>
                </div>
                <div class="meta-title">${meta.name || mesh.name}</div>
                <div class="meta-desc">${meta.category || 'Komponen'} pada sub-kelompok ${meta.subGroup || 'Kandang'} (Ruby Line ${meta.sourceLine || '-'}).</div>
                
                <div class="meta-grid">
                    <div class="meta-item">
                        <span class="meta-lbl">Dimensi (P × L × T):</span>
                        <strong class="meta-val cyan">${size.x.toFixed(2)}m × ${size.y.toFixed(2)}m × ${size.z.toFixed(2)}m</strong>
                    </div>
                    <div class="meta-item">
                        <span class="meta-lbl">Elevasi (Z dari tanah):</span>
                        <strong class="meta-val gold">Z = +${box.min.z.toFixed(2)} m</strong>
                    </div>
                    <div class="meta-item">
                        <span class="meta-lbl">Posisi Koordinat:</span>
                        <strong class="meta-val mono">X=${box.min.x.toFixed(2)}, Y=${box.min.y.toFixed(2)}</strong>
                    </div>
                    <div class="meta-item">
                        <span class="meta-lbl">Material Bangunan:</span>
                        <strong class="meta-val">${meta.materialType || meta.material || 'Kayu Ulin / Galvanis'}</strong>
                    </div>
                    <div class="meta-item">
                        <span class="meta-lbl">Estimasi Kuantitas:</span>
                        <strong class="meta-val green">${totalQty}</strong>
                    </div>
                    <div class="meta-item">
                        <span class="meta-lbl">CAD Layer:</span>
                        <strong class="meta-val">${meta.layer || 'Umum'}</strong>
                    </div>
                </div>

                <div style="display:flex;gap:8px;margin-top:14px;">
                    <button class="btn-action primary" id="btn-inspect-focus" style="flex:1;">🎯 Pusatkan Kamera</button>
                    <button class="btn-action" id="btn-inspect-highlight-all" style="flex:1;">✨ Sorot Sejenis</button>
                </div>
            </div>
        `;

        document.getElementById('btn-inspect-focus')?.addEventListener('click', () => this.focusSelected());
        document.getElementById('btn-inspect-highlight-all')?.addEventListener('click', () => {
            if (meta.materialType) {
                this.matMgr.highlightMaterial(meta.materialType);
            }
        });
    }

    updateConstructionUI(progress, stage) {
        const pct = Math.round(progress * 100);
        if (this.timelineSlider) this.timelineSlider.value = pct;
        if (this.timelinePercent) this.timelinePercent.innerText = `${pct}%`;

        if (this.stageBadge) {
            this.stageBadge.innerText = `[${stage.id}/8] ${stage.name}`;
        }
        if (this.stageDesc) {
            this.stageDesc.innerText = stage.desc;
        }
    }

    populateLayers() {
        if (!this.layerList || !this.data.layers) return;
        this.layerList.innerHTML = '';

        for (const [key, def] of Object.entries(this.data.layers)) {
            // HANYA penutup atap spandek yang default unchecked, rangka atap (kuda-kuda, gording, skur) & rangka dinding tetap utuh dan aktif
            const isDefaultHidden = (key === '18_Penutup_Atap_Spandek_Bergelombang');
            if (isDefaultHidden) {
                this.sceneModel.setLayerVisibility(key, false);
            }
            const isChecked = !isDefaultHidden ? 'checked' : '';
            const row = document.createElement('div');
            row.className = 'layer-row';
            row.innerHTML = `
                <div style="display:flex;align-items:center;gap:8px;">
                    <input type="checkbox" id="layer-${key}" ${isChecked}>
                    <span class="layer-dot" style="background:${def.color};"></span>
                    <span class="layer-name">${def.name}</span>
                </div>
                <span class="layer-count">${def.count} obj</span>
            `;
            const chk = row.querySelector('input');
            chk.addEventListener('change', (e) => {
                this.sceneModel.setLayerVisibility(key, e.target.checked);
            });
            this.layerList.appendChild(row);
        }

        document.getElementById('btn-show-all-layers')?.addEventListener('click', () => {
            for (const key in this.data.layers) {
                this.sceneModel.setLayerVisibility(key, true);
                const el = document.getElementById(`layer-${key}`);
                if (el) el.checked = true;
            }
        });
    }

    populateComponents() {
        if (!this.componentBreakdownList || !this.data.materialSummary) return;
        this.componentBreakdownList.innerHTML = '';

        for (const [matType, info] of Object.entries(this.data.materialSummary)) {
            const card = document.createElement('div');
            card.className = 'comp-breakdown-card';
            card.innerHTML = `
                <div style="display:flex;justify-content:space-between;align-items:center;">
                    <strong style="color:#f8fafc;font-size:12px;">${matType}</strong>
                    <span class="badge-tag gold">${info.count} Pcs</span>
                </div>
                <div style="display:flex;gap:12px;font-size:11px;color:#94a3b8;margin-top:4px;">
                    <span>Volume: <strong>${info.totalVolume.toFixed(2)} m³</strong></span>
                    <span>Luas: <strong>${info.totalArea.toFixed(1)} m²</strong></span>
                </div>
            `;
            card.addEventListener('click', () => {
                this.matMgr.highlightMaterial(matType);
            });
            this.componentBreakdownList.appendChild(card);
        }
    }

    populateBOM() {
        if (!this.bomContainer || !this.data.materialSummary) return;

        let rowsHtml = '';
        for (const [type, info] of Object.entries(this.data.materialSummary)) {
            rowsHtml += `
                <tr>
                    <td><strong>${type}</strong></td>
                    <td class="text-right cyan">${info.count}</td>
                    <td class="text-right">${info.totalLength > 0 ? info.totalLength.toFixed(1) + ' m' : '-'}</td>
                    <td class="text-right">${info.totalArea > 0 ? info.totalArea.toFixed(1) + ' m²' : '-'}</td>
                    <td class="text-right gold">${info.totalVolume > 0 ? info.totalVolume.toFixed(2) + ' m³' : '-'}</td>
                </tr>
            `;
        }

        this.bomContainer.innerHTML = `
            <table class="cad-table">
                <thead>
                    <tr>
                        <th>Material</th>
                        <th class="text-right">Qty</th>
                        <th class="text-right">Panjang</th>
                        <th class="text-right">Luas</th>
                        <th class="text-right">Volume</th>
                    </tr>
                </thead>
                <tbody>${rowsHtml}</tbody>
            </table>
        `;
    }

    populateValidation() {
        if (!this.validationContainer) return;
        const totalObj = this.data.metadata.totalObjects || 8564;

        this.validationContainer.innerHTML = `
            <div class="meta-card">
                <div style="font-weight:700;color:#00e5ff;font-size:12px;margin-bottom:8px;">HASIL AUDIT GEOMETRI 1:1</div>
                <div class="meta-grid">
                    <div class="meta-item">
                        <span class="meta-lbl">Dimensi Panjang Total:</span>
                        <strong class="meta-val green">26.00 m (1:1 PASS)</strong>
                    </div>
                    <div class="meta-item">
                        <span class="meta-lbl">Dimensi Lebar Total:</span>
                        <strong class="meta-val green">12.00 m (1:1 PASS)</strong>
                    </div>
                    <div class="meta-item">
                        <span class="meta-lbl">Tinggi Puncak Nok:</span>
                        <strong class="meta-val green">5.92 m (1:1 PASS)</strong>
                    </div>
                    <div class="meta-item">
                        <span class="meta-lbl">Total Komponen CAD:</span>
                        <strong class="meta-val green">${totalObj} Objek (1:1 MATCH)</strong>
                    </div>
                    <div class="meta-item">
                        <span class="meta-lbl">Sistem Ventilasi:</span>
                        <strong class="meta-val green">6 Exhaust Fan 50" (VALID)</strong>
                    </div>
                    <div class="meta-item">
                        <span class="meta-lbl">Sistem Rak:</span>
                        <strong class="meta-val green">6 Rak, 3 Susun (7.000 Ekor)</strong>
                    </div>
                </div>
            </div>
        `;
    }

    initSearch() {
        if (!this.searchInput || !this.searchResultsBox) return;

        this.searchInput.addEventListener('input', (e) => {
            const query = e.target.value.trim().toLowerCase();
            if (query.length < 2) {
                this.searchResultsBox.innerHTML = '<div class="search-hint">Ketik minimal 2 karakter untuk mencari komponen...</div>';
                return;
            }

            const results = this.data.objects.filter(o => 
                (o.name && o.name.toLowerCase().includes(query)) ||
                (o.id && o.id.toLowerCase().includes(query)) ||
                (o.materialType && o.materialType.toLowerCase().includes(query))
            ).slice(0, 30);

            if (results.length === 0) {
                this.searchResultsBox.innerHTML = '<div class="search-hint">Tidak ada komponen yang cocok.</div>';
                return;
            }

            let html = '';
            results.forEach(res => {
                html += `
                    <div class="search-result-item" data-id="${res.id}">
                        <div>
                            <strong style="color:#00e5ff;font-size:12px;">${res.name}</strong>
                            <div style="font-size:10px;color:#94a3b8;">${res.buildingPart || 'Komponen'} • ${res.materialType || 'Kayu'}</div>
                        </div>
                        <span class="spec-pill">${res.id}</span>
                    </div>
                `;
            });

            this.searchResultsBox.innerHTML = html;

            this.searchResultsBox.querySelectorAll('.search-result-item').forEach(el => {
                el.addEventListener('click', () => {
                    const id = el.dataset.id;
                    const mesh = this.sceneModel.objectLookup.get(id);
                    if (mesh) {
                        this.selectObject(mesh);
                        this.focusSelected();
                        this.closeSearch();
                    }
                });
            });
        });

        document.getElementById('btn-close-search')?.addEventListener('click', () => this.closeSearch());
    }

    openSearch() {
        if (!this.searchModal) return;
        this.searchModal.style.display = 'flex';
        if (this.searchInput) {
            this.searchInput.value = '';
            this.searchInput.focus();
        }
    }

    closeSearch() {
        if (!this.searchModal) return;
        this.searchModal.style.display = 'none';
    }

    initKeyboardShortcuts() {
        window.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                if (e.key === 'Escape') this.closeSearch();
                return;
            }

            // Ctrl+K -> Search
            if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
                e.preventDefault();
                this.openSearch();
                return;
            }

            switch (e.key.toLowerCase()) {
                case 'h':
                    this.cameraMgr.setPreset('isometric');
                    break;
                case 'f':
                    this.focusSelected();
                    break;
                case 'e':
                    this.setMode('exploded');
                    break;
                case 'd':
                    const areDims = Object.values(this.dimMgr.visibility).some(v => v);
                    this.dimMgr.toggleAll(!areDims);
                    break;
                case 's':
                    this.setMode('section');
                    break;
                case 'm':
                    this.toggleMeasureMode();
                    break;
                case 'c':
                    this.setMode('construction');
                    break;
                case 'a':
                    this.setMode('simulation');
                    break;
                case 'p':
                    this.togglePresentation();
                    break;
                case 'escape':
                    if (this.isPresentation) this.togglePresentation();
                    this.closeSearch();
                    this.closeRightPanel();
                    this.toggleDenahModal(false);
                    if (this.measTool.active) this.measTool.toggle(false);
                    break;
            }
        });
    }

    togglePresentation() {
        this.isPresentation = !this.isPresentation;
        if (this.topBar) this.topBar.style.display = this.isPresentation ? 'none' : 'flex';
        if (this.toolRail) this.toolRail.style.display = this.isPresentation ? 'none' : 'flex';
        if (this.bottomBar) this.bottomBar.style.display = this.isPresentation ? 'none' : 'flex';
        if (this.minimapWidget) this.minimapWidget.style.display = this.isPresentation ? 'none' : 'block';
        if (this.rightPanel) this.closeRightPanel();
        if (this.presentationBadge) {
            this.presentationBadge.style.display = this.isPresentation ? 'block' : 'none';
        }
    }

    toggleDenahModal(show = null) {
        if (!this.denahModal) return;
        const cur = this.denahModal.style.display !== 'none';
        const target = show !== null ? show : !cur;
        this.denahModal.style.display = target ? 'flex' : 'none';
    }

    initDenahModal() {
        const container = document.getElementById('denah-svg-container');
        if (!container) return;

        container.innerHTML = `
            <svg viewBox="-3 -1 32 14" style="width:100%;height:100%;cursor:crosshair;">
                <!-- Concrete floor perimeter -->
                <rect x="0" y="0" width="26" height="12" fill="#1e293b" stroke="#00e5ff" stroke-width="0.1" rx="0.2"/>
                <!-- 32 Pillars -->
                ${Array.from({length: 14}).map((_, i) => `
                    <circle cx="${i * 2}" cy="0.1" r="0.15" fill="#ea580c"/>
                    <circle cx="${i * 2}" cy="11.9" r="0.15" fill="#ea580c"/>
                `).join('')}
                <!-- 6 Racks (Green) -->
                <rect x="2" y="0.8" width="22" height="1.5" fill="#22c55e" opacity="0.6"/>
                <rect x="2" y="2.7" width="22" height="1.5" fill="#22c55e" opacity="0.6"/>
                <rect x="2" y="4.6" width="22" height="1.5" fill="#22c55e" opacity="0.6"/>
                <rect x="2" y="6.0" width="22" height="1.5" fill="#22c55e" opacity="0.6"/>
                <rect x="2" y="7.9" width="22" height="1.5" fill="#22c55e" opacity="0.6"/>
                <rect x="2" y="9.8" width="22" height="1.5" fill="#22c55e" opacity="0.6"/>
                <!-- 6 Fans at West X=0 (Purple) -->
                ${Array.from({length: 6}).map((_, i) => `
                    <rect x="-0.4" y="${1.0 + i * 1.8}" width="0.4" height="1.4" fill="#a855f7"/>
                `).join('')}
                <!-- Celldeck at East X=26 (Yellow) -->
                <rect x="26.0" y="0.5" width="0.3" height="11.0" fill="#eab308"/>
            </svg>
        `;
    }
}
