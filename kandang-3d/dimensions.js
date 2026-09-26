/**
 * dimensions.js - Interactive CAD Dimension & Elevation System
 * Supports Material-Specific Bounding Dimensions ("Dari Mana ke Mana"),
 * Layer/Category Visibility Filters (Main, Elevations, Grid, Racks, Selected),
 * and Smart Screen-Space Decluttering for Desktop & Mobile.
 * 
 * Source of Truth: build_kandang_LENGKAP.rb
 */

export class DimensionManager {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;

        this.rootGroup = new THREE.Group();
        this.rootGroup.name = "CAD_Dimensions_Root";
        this.scene.add(this.rootGroup);

        // Subgroups for each dimension layer
        this.groups = {
            main: new THREE.Group(),
            elevations: new THREE.Group(),
            grid: new THREE.Group(),
            racks: new THREE.Group(),
            selected: new THREE.Group()
        };

        for (const key in this.groups) {
            this.rootGroup.add(this.groups[key]);
        }

        // Visibility states (Main & Selected on by default, others off to prevent clutter)
        this.visibility = {
            main: true,
            selected: true,
            elevations: false,
            grid: false,
            racks: false
        };

        // Materials
        this.lineMatCyan = new THREE.LineBasicMaterial({ color: 0x00e5ff, linewidth: 2 });
        this.lineMatGold = new THREE.LineBasicMaterial({ color: 0xffb300, linewidth: 2 });
        this.lineMatGreen = new THREE.LineBasicMaterial({ color: 0x00e676, linewidth: 2 });
        this.lineMatDashed = new THREE.LineDashedMaterial({
            color: 0x00b0ff,
            dashSize: 0.25,
            gapSize: 0.15,
            linewidth: 1
        });
        this.lineMatLeader = new THREE.LineDashedMaterial({
            color: 0xffea00,
            dashSize: 0.15,
            gapSize: 0.1,
            linewidth: 1
        });

        this.labels = []; // { pos, el, category, priority }
        this.activeSelectedMesh = null;

        this.initAllDimensions();
        this.applyVisibility();
    }

    initAllDimensions() {
        this.initMainDimensions();
        this.initElevationDimensions();
        this.initGridDimensions();
        this.initRackDimensions();
    }

    /* 1. Overall Main Dimensions (26.0m x 12.0m x 5.92m) */
    initMainDimensions() {
        // Overall Length: 26.00 m along X (at Y = -1.8, Z = 0)
        this.addDimensionLine(
            this.groups.main,
            new THREE.Vector3(0, -1.8, 0),
            new THREE.Vector3(26, -1.8, 0),
            "PANJANG BANGUNAN = 26.00 M (X: 0 ➜ 26m)",
            new THREE.Vector3(0, -1, 0),
            this.lineMatCyan,
            'main',
            10
        );

        // Overall Width: 12.00 m along Y (at X = 27.8, Z = 0)
        this.addDimensionLine(
            this.groups.main,
            new THREE.Vector3(27.8, 0, 0),
            new THREE.Vector3(27.8, 12, 0),
            "LEBAR BENTANG = 12.00 M (Y: 0 ➜ 12m)",
            new THREE.Vector3(1, 0, 0),
            this.lineMatCyan,
            'main',
            10
        );

        // Overall Height: 5.92 m at East Ridge (X = -1.8, Y = 6.0)
        this.addDimensionLine(
            this.groups.main,
            new THREE.Vector3(-1.8, 6.0, 0),
            new THREE.Vector3(-1.8, 6.0, 5.92),
            "TINGGI PUNCAK NOK = 5.92 M (Z: 0 ➜ +5.92m)",
            new THREE.Vector3(-1, 0, 0),
            this.lineMatCyan,
            'main',
            10
        );
    }

    /* 2. Key Benchmark Elevations (Datum Z) */
    initElevationDimensions() {
        const elevations = [
            { z: 0.00, label: "±0.00 m Dasar Tanah / Parit Got", p: 8 },
            { z: 0.25, label: "+0.25 m Lantai Slat Ayam Susun 1", p: 7 },
            { z: 0.95, label: "+0.95 m Alas Kotoran Susun 2", p: 5 },
            { z: 1.20, label: "+1.20 m Lantai Slat Ayam Susun 2", p: 7 },
            { z: 1.90, label: "+1.90 m Alas Kotoran Susun 3", p: 5 },
            { z: 2.15, label: "+2.15 m Lantai Slat Ayam Susun 3", p: 7 },
            { z: 3.00, label: "+3.00 m Balok Tarik Kuda-Kuda", p: 8 },
            { z: 4.30, label: "+4.30 m Tiang Peninggi Kap Kolom B-C", p: 6 },
            { z: 4.90, label: "+4.90 m Puncak Sayap Kaki Kuda", p: 7 },
            { z: 5.92, label: "+5.92 m Puncak Tertinggi Nok Spandek", p: 9 }
        ];

        const towerX = -2.2;
        const towerY = 12.8;

        // Vertical Datum Pole
        const vertGeo = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(towerX, towerY, 0),
            new THREE.Vector3(towerX, towerY, 6.1)
        ]);
        this.groups.elevations.add(new THREE.Line(vertGeo, this.lineMatGold));

        elevations.forEach(e => {
            const tickGeo = new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(towerX, towerY, e.z),
                new THREE.Vector3(towerX + 0.8, towerY, e.z)
            ]);
            this.groups.elevations.add(new THREE.Line(tickGeo, this.lineMatGold));
            this.createOverlayLabel(
                new THREE.Vector3(towerX + 0.9, towerY, e.z),
                e.label,
                'elevations',
                e.p,
                'tag-elevation'
            );
        });
    }

    /* 3. Column Spacing Grid Lines (As X and As Y) */
    initGridDimensions() {
        // Grid X: 0, 2, 6, 10, 14, 18, 22, 26m
        const xGrid = [
            { x: 0, label: "As X1: 0.0m" },
            { x: 2, label: "As X2: 2.0m (Spasi 2m)" },
            { x: 6, label: "As X3: 6.0m (Spasi 4m)" },
            { x: 10, label: "As X4: 10.0m (Spasi 4m)" },
            { x: 14, label: "As X5: 14.0m (Spasi 4m)" },
            { x: 18, label: "As X6: 18.0m (Spasi 4m)" },
            { x: 22, label: "As X7: 22.0m (Spasi 4m)" },
            { x: 26, label: "As X8: 26.0m (Spasi 4m)" }
        ];

        xGrid.forEach((g, idx) => {
            const gridGeo = new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(g.x, -0.8, 0),
                new THREE.Vector3(g.x, 12.8, 0)
            ]);
            const line = new THREE.Line(gridGeo, this.lineMatDashed);
            line.computeLineDistances();
            this.groups.grid.add(line);
            this.createOverlayLabel(new THREE.Vector3(g.x, -1.0, 0), g.label, 'grid', 6, 'tag-grid');
        });

        // Grid Y: As A, B, C, D (0, 4, 8, 12m)
        const yGrid = [
            { y: 0, label: "As A (Utara): Y=0.0m" },
            { y: 4, label: "As B (Tengah): Y=4.0m (Bentang 4m)" },
            { y: 8, label: "As C (Tengah): Y=8.0m (Bentang 4m)" },
            { y: 12, label: "As D (Selatan): Y=12.0m (Bentang 4m)" }
        ];

        yGrid.forEach(g => {
            const gridGeo = new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(-0.8, g.y, 0),
                new THREE.Vector3(26.8, g.y, 0)
            ]);
            const line = new THREE.Line(gridGeo, this.lineMatDashed);
            line.computeLineDistances();
            this.groups.grid.add(line);
            this.createOverlayLabel(new THREE.Vector3(-1.0, g.y, 0), g.label, 'grid', 6, 'tag-grid');
        });
    }

    /* 4. Rack & Aisle Dimensions (6 lajur rak + 3 lorong 1.0m + 3 got) */
    initRackDimensions() {
        const racks = [
            { y: 0.75, name: "Rak A (Lebar 1.50m)" },
            { y: 2.10, name: "Lorong 1 (Lebar 1.00m)" },
            { y: 3.25, name: "Rak B1 (Lebar 1.50m)" },
            { y: 4.75, name: "Rak B2 (Lebar 1.50m)" },
            { y: 6.10, name: "Lorong 2 (Lebar 1.00m)" },
            { y: 7.25, name: "Rak C1 (Lebar 1.50m)" },
            { y: 8.75, name: "Rak C2 (Lebar 1.50m)" },
            { y: 10.10, name: "Lorong 3 (Lebar 1.00m)" },
            { y: 11.25, name: "Rak D (Lebar 1.50m)" }
        ];

        racks.forEach(r => {
            this.createOverlayLabel(new THREE.Vector3(13.0, r.y, 0.15), r.name, 'racks', 5, 'tag-rack');
        });
    }

    /* ==========================================================================
       INTERACTIVE MATERIAL / COMPONENT DIMENSIONS ("DARI MANA KE MANA")
       Calculates exact 3D start/end coordinates of clicked/inspected material
       and renders dimension leaders, ticks, and floating HUD callouts.
       ========================================================================== */
    showObjectDimensions(mesh) {
        if (!mesh) return;
        this.clearObjectDimensions();
        this.activeSelectedMesh = mesh;

        const box = new THREE.Box3().setFromObject(mesh);
        if (box.isEmpty()) return;

        const min = box.min;
        const max = box.max;
        const meta = (mesh.userData && mesh.userData.metadata) ? mesh.userData.metadata : { name: mesh.name || "Komponen Terpilih" };

        const dx = Math.max(0.01, max.x - min.x);
        const dy = Math.max(0.01, max.y - min.y);
        const dz = Math.max(0.01, max.z - min.z);

        const group = this.groups.selected;
        const mat = this.lineMatGold;

        // 1. Length (Sumbu X) Dimension Line: from min.x to max.x
        const offset = 0.15;
        this.addDimensionLine(
            group,
            new THREE.Vector3(min.x, min.y - offset, min.z),
            new THREE.Vector3(max.x, min.y - offset, min.z),
            `Panjang (X): ${dx.toFixed(2)}m (dari X=${min.x.toFixed(2)} ke X=${max.x.toFixed(2)}m)`,
            new THREE.Vector3(0, -1, 0),
            mat,
            'selected',
            10,
            'tag-selected-dim'
        );

        // 2. Width (Sumbu Y) Dimension Line: from min.y to max.y
        this.addDimensionLine(
            group,
            new THREE.Vector3(min.x - offset, min.y, min.z),
            new THREE.Vector3(min.x - offset, max.y, min.z),
            `Lebar (Y): ${dy.toFixed(2)}m (dari Y=${min.y.toFixed(2)} ke Y=${max.y.toFixed(2)}m)`,
            new THREE.Vector3(-1, 0, 0),
            mat,
            'selected',
            10,
            'tag-selected-dim'
        );

        // 3. Height (Sumbu Z) Dimension Line: from min.z to max.z
        this.addDimensionLine(
            group,
            new THREE.Vector3(min.x - offset, min.y - offset, min.z),
            new THREE.Vector3(min.x - offset, min.y - offset, max.z),
            `Tinggi (Z): ${dz.toFixed(2)}m (Elevasi Z=+${min.z.toFixed(2)} ke +${max.z.toFixed(2)}m)`,
            new THREE.Vector3(0, -1, 0),
            mat,
            'selected',
            10,
            'tag-selected-dim'
        );

        // 4. Ground Datum Leader (from Z=0 to bottom of component)
        if (min.z > 0.08) {
            const datumGeo = new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(min.x, min.y, 0),
                new THREE.Vector3(min.x, min.y, min.z)
            ]);
            const datumLine = new THREE.Line(datumGeo, this.lineMatLeader);
            datumLine.computeLineDistances();
            group.add(datumLine);

            this.createOverlayLabel(
                new THREE.Vector3(min.x, min.y, min.z * 0.5),
                `Elevasi Dasar: +${min.z.toFixed(2)}m dari tanah ±0.00`,
                'selected',
                9,
                'tag-selected-datum'
            );
        }

        // Show selected group
        this.visibility.selected = true;
        this.groups.selected.visible = true;
    }

    clearObjectDimensions() {
        this.activeSelectedMesh = null;
        // Clear 3D lines in selected group
        while (this.groups.selected.children.length > 0) {
            const child = this.groups.selected.children[0];
            this.groups.selected.remove(child);
            if (child.geometry) child.geometry.dispose();
        }
        // Remove DOM labels of selected category
        this.labels = this.labels.filter(item => {
            if (item.category === 'selected') {
                if (item.el && item.el.parentNode) {
                    item.el.parentNode.removeChild(item.el);
                }
                return false;
            }
            return true;
        });
    }

    /* Helper to add CAD dimension line with leader ticks & text */
    addDimensionLine(group, p1, p2, text, normal, mat, category, priority = 5, extraClass = '') {
        const points = [p1, p2];
        const geo = new THREE.BufferGeometry().setFromPoints(points);
        group.add(new THREE.Line(geo, mat));

        // Dimension end ticks
        const tickLen = 0.25;
        const tick1 = new THREE.BufferGeometry().setFromPoints([
            p1.clone().addScaledVector(normal, -tickLen),
            p1.clone().addScaledVector(normal, tickLen)
        ]);
        const tick2 = new THREE.BufferGeometry().setFromPoints([
            p2.clone().addScaledVector(normal, -tickLen),
            p2.clone().addScaledVector(normal, tickLen)
        ]);
        group.add(new THREE.Line(tick1, mat));
        group.add(new THREE.Line(tick2, mat));

        // Center label position
        const mid = p1.clone().add(p2).multiplyScalar(0.5).addScaledVector(normal, 0.35);
        this.createOverlayLabel(mid, text, category, priority, extraClass);
    }

    /* Creates 2D overlay HTML tag */
    createOverlayLabel(pos3d, text, category, priority = 5, extraClass = '') {
        const container = document.getElementById('canvas-overlay');
        if (!container) return;

        const el = document.createElement('div');
        el.className = `cad-dimension-tag ${extraClass} dim-cat-${category}`;
        el.innerText = text;
        el.dataset.category = category;
        el.dataset.priority = priority;
        container.appendChild(el);

        this.labels.push({
            pos: pos3d,
            el: el,
            category: category,
            priority: priority
        });
    }

    /* Set visibility for a specific category layer */
    setCategoryVisible(cat, isVisible) {
        if (this.visibility.hasOwnProperty(cat)) {
            this.visibility[cat] = isVisible;
            if (this.groups[cat]) {
                this.groups[cat].visible = isVisible;
            }
            this.applyVisibility();
        }
    }

    toggleAll(isVisible) {
        for (const cat in this.visibility) {
            this.visibility[cat] = isVisible;
            if (this.groups[cat]) {
                this.groups[cat].visible = isVisible;
            }
        }
        this.applyVisibility();
    }

    applyVisibility() {
        for (const cat in this.groups) {
            const isVis = this.visibility[cat] === true;
            this.groups[cat].visible = isVis;
        }
        this.updateLabels();
    }

    /* Screen projection & smart decluttering */
    updateLabels() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        const tempV = new THREE.Vector3();

        // Screen-space position cache for collision checking
        const visiblePositions = [];
        const minDistancePx = (width < 768) ? 36 : 28; // Tighter on mobile

        // Sort labels by priority (higher priority rendered first)
        const sortedLabels = [...this.labels].sort((a, b) => b.priority - a.priority);

        sortedLabels.forEach(l => {
            // Check if this category is visible
            if (!this.visibility[l.category]) {
                l.el.style.display = 'none';
                return;
            }

            tempV.copy(l.pos);
            tempV.project(this.camera);

            // Hide if behind camera or outside view frustum
            if (tempV.z > 1.0 || tempV.x < -1.1 || tempV.x > 1.1 || tempV.y < -1.1 || tempV.y > 1.1) {
                l.el.style.display = 'none';
                return;
            }

            const screenX = (tempV.x * 0.5 + 0.5) * width;
            const screenY = (-(tempV.y * 0.5) + 0.5) * height;

            // Decluttering: avoid overlapping labels (except for selected object dimensions)
            if (l.category !== 'selected') {
                let hasCollision = false;
                for (const pos of visiblePositions) {
                    const dx = Math.abs(pos.x - screenX);
                    const dy = Math.abs(pos.y - screenY);
                    if (dx < minDistancePx * 2.2 && dy < minDistancePx) {
                        hasCollision = true;
                        break;
                    }
                }
                if (hasCollision) {
                    l.el.style.display = 'none';
                    return;
                }
            }

            visiblePositions.push({ x: screenX, y: screenY });

            l.el.style.display = 'block';
            l.el.style.left = `${screenX}px`;
            l.el.style.top = `${screenY}px`;
        });
    }

    toggle(show) {
        const target = show !== undefined ? show : !this.rootGroup.visible;
        this.rootGroup.visible = target;
        if (!target) {
            this.labels.forEach(l => l.el.style.display = 'none');
        } else {
            this.applyVisibility();
        }
    }
}
