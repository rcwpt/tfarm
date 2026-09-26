/**
 * measurements.js - Interactive Point-to-Point Measurement Tool
 */

export class MeasurementTool {
    constructor(scene, camera, domElement) {
        this.scene = scene;
        this.camera = camera;
        this.domElement = domElement;
        this.active = false;
        this.points = [];
        this.measureGroup = new THREE.Group();
        this.measureGroup.name = "Measurement_Group";
        this.scene.add(this.measureGroup);

        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();

        this.lineMat = new THREE.LineBasicMaterial({ color: 0xff0055, linewidth: 3 });
        this.pointMat = new THREE.MeshBasicMaterial({ color: 0xff0055 });
        this.pointGeo = new THREE.SphereGeometry(0.08, 16, 16);

        this.infoBox = document.createElement('div');
        this.infoBox.className = 'cad-measure-info';
        this.infoBox.style.display = 'none';
        document.body.appendChild(this.infoBox);

        this.setupEvents();
    }

    setupEvents() {
        this.domElement.addEventListener('pointerdown', (e) => {
            if (!this.active || e.button !== 0) return;

            const rect = this.domElement.getBoundingClientRect();
            this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
            this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

            this.raycaster.setFromCamera(this.mouse, this.camera);
            const intersects = this.raycaster.intersectObjects(this.scene.children, true)
                .filter(i => i.object.type === 'Mesh' && i.object.name !== 'GroundGrid');

            if (intersects.length > 0) {
                const pt = intersects[0].point;
                this.addPoint(pt);
            }
        });
    }

    addPoint(pt) {
        if (this.points.length >= 2) {
            this.clear();
        }

        this.points.push(pt.clone());
        const marker = new THREE.Mesh(this.pointGeo, this.pointMat);
        marker.position.copy(pt);
        this.measureGroup.add(marker);

        if (this.points.length === 2) {
            const p1 = this.points[0];
            const p2 = this.points[1];
            const geo = new THREE.BufferGeometry().setFromPoints([p1, p2]);
            const line = new THREE.Line(geo, this.lineMat);
            this.measureGroup.add(line);

            const dist = p1.distanceTo(p2);
            const dx = Math.abs(p2.x - p1.x);
            const dy = Math.abs(p2.y - p1.y);
            const dz = Math.abs(p2.z - p1.z);

            this.infoBox.innerHTML = `
                <div class="measure-title">📐 HASIL PENGUKURAN (CAD)</div>
                <div class="measure-row"><span>Jarak 3D:</span> <strong>${dist.toFixed(3)} m</strong></div>
                <div class="measure-row"><span>ΔX (Panjang):</span> <strong>${dx.toFixed(3)} m</strong></div>
                <div class="measure-row"><span>ΔY (Lebar):</span> <strong>${dy.toFixed(3)} m</strong></div>
                <div class="measure-row"><span>ΔZ (Elevasi):</span> <strong>${dz.toFixed(3)} m</strong></div>
                <div class="measure-hint">Klik titik berikutnya untuk mengukur lagi</div>
            `;
            this.infoBox.style.display = 'block';
        } else {
            this.infoBox.innerHTML = `
                <div class="measure-title">📐 PENGUKURAN AKTIF</div>
                <div>Titik 1 terpilih: (${pt.x.toFixed(2)}, ${pt.y.toFixed(2)}, ${pt.z.toFixed(2)})</div>
                <div>Klik titik ke-2 pada model...</div>
            `;
            this.infoBox.style.display = 'block';
        }
    }

    clear() {
        this.points = [];
        while (this.measureGroup.children.length > 0) {
            this.measureGroup.remove(this.measureGroup.children[0]);
        }
        this.infoBox.style.display = 'none';
    }

    toggle(active) {
        this.active = active !== undefined ? active : !this.active;
        if (!this.active) {
            this.clear();
        } else {
            this.infoBox.innerHTML = `
                <div class="measure-title">📐 MODE UKUR JARAK AKTIF</div>
                <div>Klik titik pertama pada sembarang komponen model...</div>
            `;
            this.infoBox.style.display = 'block';
        }
        return this.active;
    }
}
