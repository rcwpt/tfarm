/**
 * construction.js - 8-Stage Construction Sequence & Animation Manager
 * Source of truth: build_kandang_LENGKAP.rb stages [1/8] to [8/8]
 */

export class ConstructionManager {
    constructor(sceneModel, cameraManager, onProgressUpdate) {
        this.sceneModel = sceneModel;
        this.cameraManager = cameraManager;
        this.onProgressUpdate = onProgressUpdate;

        this.isPlaying = false;
        this.currentProgress = 1.0; // 0.0 to 1.0
        this.speed = 1.0; // 0.5x, 1x, 2x
        this.duration = 60000; // default 60s total duration
        this.lastTime = 0;

        this.stages = [
            {
                num: 1,
                name: "Pondasi & Lantai Cor",
                range: [0.0, 0.12],
                desc: "Pondasi umpak beton bertulang 30x30x40cm & 4 bidang lantai cor tebal 3cm",
                cam: { pos: new THREE.Vector3(13, -15, 12), target: new THREE.Vector3(13, 6, 0) }
            },
            {
                num: 2,
                name: "Got Drainase & Papan Ulin",
                range: [0.12, 0.22],
                desc: "3 jalur parit got 20x20cm cor semen L=25m & penutup papan kayu ulin tebal 2.5cm",
                cam: { pos: new THREE.Vector3(6, -4, 6), target: new THREE.Vector3(6, 4, 0) }
            },
            {
                num: 3,
                name: "Tiang Komposit Kayu Besi 15x10",
                range: [0.22, 0.35],
                desc: "32 tiang komposit (2 bilah kayu besi 5x10x3m + balok jepit spacer & tiang peninggi kap atas)",
                cam: { pos: new THREE.Vector3(30, -10, 8), target: new THREE.Vector3(13, 6, 2) }
            },
            {
                num: 4,
                name: "Rangka Dinding Vertikal & Sabuk",
                range: [0.35, 0.48],
                desc: "Rangka dinding kayu papan 1.5x6cm spasi 30cm, 3 lapis sabuk keliling & kusen pintu",
                cam: { pos: new THREE.Vector3(13, -12, 6), target: new THREE.Vector3(13, 0, 2) }
            },
            {
                num: 5,
                name: "Rangka Rak 3 Susun & Equipment",
                range: [0.48, 0.65],
                desc: "6 lajur rak 3 susun (Rak A, B1, B2, C1, C2, D), slat mesh, pintu galvanis, talang pakan 24m & nipple drinker",
                cam: { pos: new THREE.Vector3(13, 4, 4), target: new THREE.Vector3(13, 6, 1.5) }
            },
            {
                num: 6,
                name: "Exhaust Fan 50in & Mesin Kubota",
                range: [0.65, 0.77],
                desc: "6 unit box fan 50 inch (11 louvers, 6 blade propeller stainless) & mesin diesel Kubota RD110TTB + as puli",
                cam: { pos: new THREE.Vector3(-8, 6, 4), target: new THREE.Vector3(0, 6, 2) }
            },
            {
                num: 7,
                name: "Terpal Dinding & Celldeck Cooling Pad",
                range: [0.77, 0.88],
                desc: "Dinding terpal biru A8 tinggi 2.97m & Celldeck fluted cooling pad 7090 cellulose 12x1.7m + talang stainless",
                cam: { pos: new THREE.Vector3(32, 6, 4), target: new THREE.Vector3(26, 6, 2) }
            },
            {
                num: 8,
                name: "Kuda-Kuda, Gording & Atap Spandek",
                range: [0.88, 1.0],
                desc: "14 bentang kuda-kuda 12m, skur 5x10, 13 gording canted miring, 180 lembar spandek bergelombang (6m & 2m) & plafon",
                cam: { pos: new THREE.Vector3(34, -14, 18), target: new THREE.Vector3(13, 6, 4.5) }
            }
        ];
    }

    setProgress(val, autoCamera = false) {
        this.currentProgress = Math.max(0.0, Math.min(1.0, val));
        this.applyProgress();
        if (this.onProgressUpdate) {
            this.onProgressUpdate(this.currentProgress, this.getCurrentStage());
        }
        if (autoCamera) {
            const st = this.getCurrentStage();
            if (st && st.cam) {
                this.cameraManager.animateTo(st.cam.pos, st.cam.target, 800);
            }
        }
    }

    getCurrentStage() {
        for (const st of this.stages) {
            if (this.currentProgress >= st.range[0] && this.currentProgress <= st.range[1]) {
                return st;
            }
        }
        return this.stages[this.stages.length - 1];
    }

    setStage(stageNum) {
        const st = this.stages.find(s => s.num === stageNum);
        if (st) {
            this.setProgress(st.range[1], true);
        }
    }

    play() {
        this.isPlaying = true;
        this.lastTime = performance.now();
        if (this.currentProgress >= 1.0) {
            this.currentProgress = 0.0;
        }
    }

    pause() {
        this.isPlaying = false;
    }

    reset() {
        this.isPlaying = false;
        this.setProgress(0.0);
    }

    applyProgress() {
        // Iterate through all mesh objects in sceneModel
        const allObjects = this.sceneModel.meshList;
        if (!allObjects) return;

        const p = this.currentProgress;

        for (const item of allObjects) {
            const stage = item.metadata.stage;
            const stageDef = this.stages[stage - 1];
            if (!stageDef) continue;

            const [startP, endP] = stageDef.range;
            const mesh = item.mesh;

            if (p < startP) {
                mesh.visible = false;
            } else if (p >= endP) {
                mesh.visible = true;
                // restore original position and scale exactly
                mesh.position.copy(item.origPos);
                mesh.scale.copy(item.origScale);
            } else {
                // Assembly in progress for this stage
                mesh.visible = true;
                const localT = (p - startP) / (endP - startP);

                // Construction animation: objects emerge smoothly
                if (stage === 3) {
                    // Columns rise from below ground into exact final height
                    const riseOffset = (1.0 - localT) * -3.0;
                    mesh.position.set(item.origPos.x, item.origPos.y, item.origPos.z + riseOffset);
                    mesh.scale.copy(item.origScale);
                } else if (stage === 8) {
                    // Trusses / Roof lower into place from crane height
                    const lowerOffset = (1.0 - localT) * 4.0;
                    mesh.position.set(item.origPos.x, item.origPos.y, item.origPos.z + lowerOffset);
                    mesh.scale.copy(item.origScale);
                } else {
                    // Scale into place proportionally based on original dimensions
                    const s = Math.max(0.001, localT);
                    mesh.position.copy(item.origPos);
                    mesh.scale.set(item.origScale.x * s, item.origScale.y * s, item.origScale.z * s);
                }
            }
        }
    }

    update() {
        if (!this.isPlaying) return;
        const now = performance.now();
        const delta = now - this.lastTime;
        this.lastTime = now;

        const progressDelta = (delta / this.duration) * this.speed;
        let newP = this.currentProgress + progressDelta;

        if (newP >= 1.0) {
            newP = 1.0;
            this.isPlaying = false;
            // Completed state camera tour
            this.cameraManager.setPreset('isometric');
        }

        this.setProgress(newP);
    }
}
