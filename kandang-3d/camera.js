/**
 * camera.js - Camera management and presets
 * Kandang Broiler 26x12m
 */

export class CameraManager {
    constructor(camera, controls) {
        this.camera = camera;
        this.controls = controls;
        this.isTransitioning = false;
        this.targetPos = new THREE.Vector3();
        this.targetLook = new THREE.Vector3();
        this.startPos = new THREE.Vector3();
        this.startLook = new THREE.Vector3();
        this.transProgress = 0;
        this.transDuration = 1000; // ms
        this.startTime = 0;

        // Kandang Bounding Center
        this.center = new THREE.Vector3(13.0, 6.0, 2.5);

        this.presets = {
            isometric: {
                pos: new THREE.Vector3(38, -18, 22),
                target: this.center.clone()
            },
            top: {
                pos: new THREE.Vector3(13.0, 6.0, 36.0),
                target: this.center.clone()
            },
            front: { // Celldeck side (+X / West wall)
                pos: new THREE.Vector3(42.0, 6.0, 3.5),
                target: new THREE.Vector3(26.0, 6.0, 3.0)
            },
            back: { // Blower side (-X / East wall)
                pos: new THREE.Vector3(-16.0, 6.0, 3.5),
                target: new THREE.Vector3(0.0, 6.0, 3.0)
            },
            left: { // South side (+Y wall)
                pos: new THREE.Vector3(13.0, 32.0, 5.0),
                target: this.center.clone()
            },
            right: { // North side (-Y wall)
                pos: new THREE.Vector3(13.0, -20.0, 5.0),
                target: this.center.clone()
            },
            interior: { // Inside aisle walkway between Rak B1 & Rak B2
                pos: new THREE.Vector3(2.5, 4.75, 1.6),
                target: new THREE.Vector3(24.0, 4.75, 1.6)
            },
            roof: {
                pos: new THREE.Vector3(13.0, -6.0, 16.0),
                target: new THREE.Vector3(13.0, 6.0, 4.5)
            },
            structure: {
                pos: new THREE.Vector3(28.0, -8.0, 9.0),
                target: new THREE.Vector3(13.0, 6.0, 2.5)
            }
        };
    }

    setPreset(name) {
        if (!this.presets[name]) return;
        const p = this.presets[name];
        this.animateTo(p.pos, p.target, 900);
    }

    focusObject(object) {
        if (!object) return;
        const box = new THREE.Box3().setFromObject(object);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z, 1.0);
        
        const dist = maxDim * 2.2;
        const targetPos = center.clone().add(new THREE.Vector3(dist * 0.7, -dist * 0.7, dist * 0.6));
        this.animateTo(targetPos, center, 750);
    }

    animateTo(pos, target, duration = 800) {
        this.startPos.copy(this.camera.position);
        this.startLook.copy(this.controls.target);
        this.targetPos.copy(pos);
        this.targetLook.copy(target);
        this.transDuration = duration;
        this.startTime = performance.now();
        this.isTransitioning = true;
    }

    update() {
        if (!this.isTransitioning) return;
        const elapsed = performance.now() - this.startTime;
        let t = Math.min(elapsed / this.transDuration, 1.0);
        // smooth easeInOutCubic
        const ease = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

        this.camera.position.lerpVectors(this.startPos, this.targetPos, ease);
        this.controls.target.lerpVectors(this.startLook, this.targetLook, ease);
        this.controls.update();

        if (t >= 1.0) {
            this.isTransitioning = false;
        }
    }
}
