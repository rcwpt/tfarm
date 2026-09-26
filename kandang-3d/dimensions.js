/**
 * dimensions.js - CAD Dimension and Elevation System
 * Based strictly on Ruby coordinates from build_kandang_LENGKAP.rb
 */

export class DimensionManager {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;
        this.dimensionGroup = new THREE.Group();
        this.dimensionGroup.name = "CAD_Dimensions_Group";
        this.scene.add(this.dimensionGroup);
        this.visible = true;

        this.lineMaterial = new THREE.LineBasicMaterial({ color: 0x00e5ff, linewidth: 2 });
        this.dashedMaterial = new THREE.LineDashedMaterial({
            color: 0x00b0ff,
            dashSize: 0.2,
            gapSize: 0.1,
            linewidth: 1
        });
        this.leaderMaterial = new THREE.LineBasicMaterial({ color: 0xffea00, linewidth: 1 });

        this.labels = [];
        this.initDimensions();
    }

    initDimensions() {
        // 1. Overall Length: 26.00 m along X (at Y = -1.5, Z = 0)
        this.addLinearDimension(
            new THREE.Vector3(0, -1.8, 0),
            new THREE.Vector3(26, -1.8, 0),
            "26.00 m (Panjang Bangunan)",
            new THREE.Vector3(0, 1, 0)
        );

        // 2. Overall Width: 12.00 m along Y (at X = 27.5, Z = 0)
        this.addLinearDimension(
            new THREE.Vector3(27.8, 0, 0),
            new THREE.Vector3(27.8, 12, 0),
            "12.00 m (Lebar Bentang)",
            new THREE.Vector3(-1, 0, 0)
        );

        // 3. Key Benchmark Elevations (Ruby Source of Truth):
        const elevations = [
            { z: 0.00, label: "+0.00 m (Lantai Cor Dasar / Got)" },
            { z: 0.03, label: "+0.03 m (Permukaan Lantai Beton)" },
            { z: 0.25, label: "+0.25 m (Lantai Ayam Susun 1)" },
            { z: 0.95, label: "+0.95 m (Alas Kotoran Susun 2)" },
            { z: 1.20, label: "+1.20 m (Lantai Ayam Susun 2)" },
            { z: 1.90, label: "+1.90 m (Alas Kotoran Susun 3)" },
            { z: 2.15, label: "+2.15 m (Lantai Ayam Susun 3)" },
            { z: 2.85, label: "+2.85 m (Top Rangka Rak / Sabuk Dinding)" },
            { z: 2.97, label: "+2.97 m (Puncak Tiang Dinding & Terpal)" },
            { z: 3.00, label: "+3.00 m (Balok Tarik Kuda-Kuda)" },
            { z: 4.30, label: "+4.30 m (Tiang Peninggi Kap Atas Kolom B-C)" },
            { z: 4.90, label: "+4.90 m (Puncak Kaki Kuda Utama Sayap)" },
            { z: 5.76, label: "+5.76 m (Kaki Rafter Topi Monitor)" },
            { z: 5.86, label: "+5.86 m (Gording Puncak Topi Monitor Nok)" },
            { z: 5.92, label: "+5.92 m (Puncak Nok Spandek Monitor)" }
        ];

        // Place elevation tower markers at East End (X = -1.2, Y = 12.5)
        const towerX = -1.2;
        const towerY = 12.5;

        // Vertical benchmark line
        const vertGeo = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(towerX, towerY, -0.4),
            new THREE.Vector3(towerX, towerY, 6.2)
        ]);
        const vertLine = new THREE.Line(vertGeo, this.lineMaterial);
        this.dimensionGroup.add(vertLine);

        elevations.forEach(e => {
            // Horizontal leader tick
            const tickGeo = new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(towerX, towerY, e.z),
                new THREE.Vector3(towerX + 0.6, towerY, e.z)
            ]);
            const tick = new THREE.Line(tickGeo, this.leaderMaterial);
            this.dimensionGroup.add(tick);

            // Text label
            this.createOverlayLabel(new THREE.Vector3(towerX + 0.7, towerY, e.z), e.label);
        });

        // 4. Column Spacing Grid Lines along X (0, 2, 6, 10, 14, 18, 22, 26m)
        const xGrid = [0, 2, 6, 10, 14, 18, 22, 26];
        xGrid.forEach((gx, idx) => {
            const gridGeo = new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(gx, -1.0, 0),
                new THREE.Vector3(gx, 13.0, 0)
            ]);
            const gridLine = new THREE.Line(gridGeo, this.dashedMaterial);
            gridLine.computeLineDistances();
            this.dimensionGroup.add(gridLine);
            this.createOverlayLabel(new THREE.Vector3(gx, -1.2, 0), `As X${idx+1}: ${gx}m`);
        });

        // 5. Column Spacing Grid Lines along Y (0, 4, 8, 12m)
        const yGrid = [0, 4, 8, 12];
        const yNames = ['A (Utara)', 'B (Tengah)', 'C (Tengah)', 'D (Selatan)'];
        yGrid.forEach((gy, idx) => {
            const gridGeo = new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(-1.0, gy, 0),
                new THREE.Vector3(27.0, gy, 0)
            ]);
            const gridLine = new THREE.Line(gridGeo, this.dashedMaterial);
            gridLine.computeLineDistances();
            this.dimensionGroup.add(gridLine);
            this.createOverlayLabel(new THREE.Vector3(-1.4, gy, 0), `As ${yNames[idx]}`);
        });

        // 6. Got Drainage Dimensions (3 lines: Y=2m, 6m, 10m)
        [2.0, 6.0, 10.0].forEach((gy, i) => {
            this.createOverlayLabel(new THREE.Vector3(0.5, gy + 0.1, 0.05), `Got #${i+1} L=25m, W=20cm`);
        });
    }

    addLinearDimension(p1, p2, text, normal) {
        const points = [p1, p2];
        const geo = new THREE.BufferGeometry().setFromPoints(points);
        const line = new THREE.Line(geo, this.lineMaterial);
        this.dimensionGroup.add(line);

        // Arrows / ticks at ends
        const tickLen = 0.3;
        const tick1 = new THREE.BufferGeometry().setFromPoints([
            p1.clone().addScaledVector(normal, -tickLen),
            p1.clone().addScaledVector(normal, tickLen)
        ]);
        const tick2 = new THREE.BufferGeometry().setFromPoints([
            p2.clone().addScaledVector(normal, -tickLen),
            p2.clone().addScaledVector(normal, tickLen)
        ]);
        this.dimensionGroup.add(new THREE.Line(tick1, this.lineMaterial));
        this.dimensionGroup.add(new THREE.Line(tick2, this.lineMaterial));

        // Center label position
        const mid = p1.clone().add(p2).multiplyScalar(0.5).addScaledVector(normal, 0.4);
        this.createOverlayLabel(mid, text);
    }

    createOverlayLabel(pos3d, text) {
        const el = document.createElement('div');
        el.className = 'cad-dimension-tag';
        el.innerText = text;
        el.style.position = 'absolute';
        el.style.pointerEvents = 'none';
        el.style.transform = 'translate(-50%, -50%)';
        document.getElementById('canvas-overlay').appendChild(el);
        this.labels.push({ pos: pos3d, el: el });
    }

    updateLabels() {
        if (!this.visible) {
            this.labels.forEach(l => l.el.style.display = 'none');
            return;
        }

        const width = window.innerWidth;
        const height = window.innerHeight;
        const tempV = new THREE.Vector3();

        this.labels.forEach(l => {
            tempV.copy(l.pos);
            tempV.project(this.camera);

            // Check if in front of camera
            if (tempV.z > 1) {
                l.el.style.display = 'none';
                return;
            }

            const x = (tempV.x * 0.5 + 0.5) * width;
            const y = (-(tempV.y * 0.5) + 0.5) * height;

            l.el.style.display = 'block';
            l.el.style.left = `${x}px`;
            l.el.style.top = `${y}px`;
        });
    }

    toggle(show) {
        this.visible = show !== undefined ? show : !this.visible;
        this.dimensionGroup.visible = this.visible;
        this.labels.forEach(l => l.el.style.display = this.visible ? 'block' : 'none');
    }
}
