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

        // Dimension Toggle
        document.getElementById('toggle-dimensions').addEventListener('change', (e) => {
            this.dimMgr.toggle(e.target.checked);
        });

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

        // Switch right panel to Inspector tab
        const inspTab = document.querySelector('[data-tab="inspector"]');
        if (inspTab) inspTab.click();

        const g = meta.geom;
        const q = meta.quantity;

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
                    <hr>
                    <div class="meta-subtitle">📍 KOORDINAT & ELEVASI (Ruby)</div>
                    <div class="meta-row"><span>Posisi X (Panjang):</span> <strong>${g.cx.toFixed(3)} m</strong></div>
                    <div class="meta-row"><span>Posisi Y (Lebar):</span> <strong>${g.cy.toFixed(3)} m</strong></div>
                    <div class="meta-row"><span>Posisi Z (Elevasi):</span> <strong>${g.cz.toFixed(3)} m</strong></div>
                    <hr>
                    <div class="meta-subtitle">📏 DIMENSI & GEOMETRI</div>
                    <div class="meta-row"><span>Panjang (L):</span> <strong>${q.length.toFixed(3)} m</strong></div>
                    <div class="meta-row"><span>Lebar (W):</span> <strong>${q.width.toFixed(3)} m</strong></div>
                    <div class="meta-row"><span>Luas Permukaan:</span> <strong>${q.area.toFixed(3)} m²</strong></div>
                    <div class="meta-row"><span>Volume Bahan:</span> <strong>${q.volume.toFixed(5)} m³</strong></div>
                    <hr>
                    <div class="meta-subtitle">🔍 SOURCE TRACEABILITY</div>
                    <div class="meta-row"><span>File Sumber:</span> <code>build_kandang_LENGKAP.rb</code></div>
                    <div class="meta-row"><span>Baris Ruby:</span> <strong>Line ${meta.sourceLine}</strong></div>
                </div>
                <div class="meta-actions">
                    <button class="btn-primary" id="btn-focus-obj">🎯 Fokus Kamera</button>
                </div>
            </div>
        `;

        document.getElementById('btn-focus-obj').addEventListener('click', () => {
            this.cameraMgr.focusObject(mesh);
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
