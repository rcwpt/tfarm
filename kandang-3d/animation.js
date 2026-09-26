/**
 * animation.js - Dynamic Animations, Simulators, Exploded View, Section Planes, and Video Recording
 * Source of truth: build_kandang_LENGKAP.rb
 */

export class AnimationManager {
    constructor(scene, camera, renderer, sceneModel) {
        this.scene = scene;
        this.camera = camera;
        this.renderer = renderer;
        this.sceneModel = sceneModel;

        // Mechanical Simulation Flags
        this.ventilationActive = true;
        this.airflowSpeed = 1.0; // 0.0 to 2.0
        this.fanRotationAngle = 0;
        this.shaftRotationAngle = 0;

        // Exploded View
        this.explodedProgress = 0.0;
        this.explodedAuto = false;
        this.explodedDir = 1;
        this.explodedSpeed = 0.35;
        this.onExplodedUpdate = null;
        this.explodedGroups = {
            structure: true,
            roof: true,
            rack: true,
            ventilation: true,
            coolingPad: true,
            exhaustFan: true,
            equipment: true
        };

        // Section Planes
        this.sectionActive = false;
        this.sectionPlanes = [
            new THREE.Plane(new THREE.Vector3(1, 0, 0), 100),   // X plane
            new THREE.Plane(new THREE.Vector3(0, 1, 0), 100),   // Y plane
            new THREE.Plane(new THREE.Vector3(0, 0, -1), 100)   // Z plane
        ];

        // Airflow Particles System
        this.initAirflow();
        // Celldeck Water Trickling System
        this.initWaterFlow();

        // Video Recorder
        this.mediaRecorder = null;
        this.recordedChunks = [];
        this.isRecording = false;
    }

    initAirflow() {
        const particleCount = 1200;
        const geom = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const velocities = new Float32Array(particleCount * 3);

        for (let i = 0; i < particleCount; i++) {
            // Spawn between X=25.8 (Celldeck) and X=0.0 (Blowers)
            positions[i * 3 + 0] = Math.random() * 26.0;
            positions[i * 3 + 1] = 0.5 + Math.random() * 11.0;
            positions[i * 3 + 2] = 0.4 + Math.random() * 2.5;

            velocities[i * 3 + 0] = -(1.8 + Math.random() * 1.2); // moves towards -X (towards blowers)
            velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.1;
            velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.1;
        }

        geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        this.airflowVelocities = velocities;

        const mat = new THREE.PointsMaterial({
            color: 0x4fc3f7,
            size: 0.14,
            transparent: true,
            opacity: 0.75,
            blending: THREE.AdditiveBlending
        });

        this.airflowParticles = new THREE.Points(geom, mat);
        this.airflowParticles.name = "Airflow_Particles";
        this.scene.add(this.airflowParticles);
    }

    initWaterFlow() {
        const dropCount = 400;
        const geom = new THREE.BufferGeometry();
        const positions = new Float32Array(dropCount * 3);

        for (let i = 0; i < dropCount; i++) {
            // Along Celldeck face at X=25.82, Y=0..12, Z=0.65..2.35
            positions[i * 3 + 0] = 25.82 + (Math.random() - 0.5) * 0.05;
            positions[i * 3 + 1] = Math.random() * 12.0;
            positions[i * 3 + 2] = 0.65 + Math.random() * 1.70;
        }

        geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const mat = new THREE.PointsMaterial({
            color: 0x00e5ff,
            size: 0.08,
            transparent: true,
            opacity: 0.85
        });

        this.waterParticles = new THREE.Points(geom, mat);
        this.waterParticles.name = "Water_Particles";
        this.scene.add(this.waterParticles);
    }

        setExploded(val) {
        this.explodedProgress = Math.max(0.0, Math.min(1.0, val));
        const factor = this.explodedProgress;
        const g = this.explodedGroups;

        for (const item of this.sceneModel.meshList) {
            const mesh = item.mesh;
            const orig = item.origPos;
            const part = item.metadata.buildingPart || "";

            let dz = 0;
            let dy = 0;
            let dx = 0;

            if (part === "06 ATAP" || part === "07 MONITOR") {
                if (g.roof) dz = factor * (part === "07 MONITOR" ? 8.5 : 7.0);
            } else if (part === "05 RANGKA ATAP") {
                if (g.roof) dz = factor * 4.5;
            } else if (part === "08 RAK" || part === "09 SLAT/MESH") {
                if (g.rack) {
                    dz = factor * 1.8;
                    dy = (orig.y < 6.0 ? -1 : 1) * factor * 0.8;
                }
            } else if (part === "10 PAKAN" || part === "11 NIPPLE" || part === "14 ALAS KOTORAN") {
                if (g.equipment) dz = factor * 2.2;
            } else if (part === "02 DINDING" || part === "15 TERPAL" || part === "03 STRUKTUR UTAMA") {
                if (g.structure) {
                    if (orig.y < 6.0) dy = -factor * 3.0;
                    else dy = factor * 3.0;
                }
            } else if (part === "12 VENTILASI" || part === "14 MESIN") {
                if (g.exhaustFan || g.ventilation) dx = -factor * 3.5;
            } else if (part === "13 COOLING PAD") {
                if (g.coolingPad) dx = factor * 3.5;
            } else if (part === "01 LANTAI") {
                if (g.structure) dz = -factor * 1.5;
            }

            mesh.position.set(orig.x + dx, orig.y + dy, orig.z + dz);
        }
    }

    setSection(active, xVal = 26.0, yVal = 12.0, zVal = 6.0) {
        this.sectionActive = active;
        if (!active) {
            this.renderer.clippingPlanes = [];
            return;
        }

        // Setup clipping planes
        // Plane X cuts from xVal towards -X
        this.sectionPlanes[0].set(new THREE.Vector3(-1, 0, 0), xVal);
        // Plane Y cuts from yVal towards -Y
        this.sectionPlanes[1].set(new THREE.Vector3(0, -1, 0), yVal);
        // Plane Z cuts from zVal towards -Z
        this.sectionPlanes[2].set(new THREE.Vector3(0, 0, -1), zVal);

        this.renderer.clippingPlanes = this.sectionPlanes;
        this.renderer.localClippingEnabled = true;
    }

    update(delta = 0.016) {
        // 1. Mechanical Rotation (Fans & Shafts)
        if (this.ventilationActive) {
            const rotSpeed = 8.0 * this.airflowSpeed * delta;
            this.fanRotationAngle += rotSpeed;
            this.shaftRotationAngle += rotSpeed * 1.2;

            // Rotate propeller blade meshes in sceneModel
            if (this.sceneModel.rotatingFans) {
                this.sceneModel.rotatingFans.forEach(rf => {
                    rf.rotation.x = this.fanRotationAngle;
                });
            }

            // Rotate transmission pulleys
            // Transmission shaft strictly static
        }

        // 2. Airflow Particles Update
        if (this.airflowParticles && this.ventilationActive) {
            const posAttr = this.airflowParticles.geometry.attributes.position;
            const positions = posAttr.array;
            const count = positions.length / 3;

            for (let i = 0; i < count; i++) {
                positions[i * 3 + 0] += this.airflowVelocities[i * 3 + 0] * this.airflowSpeed * delta * 5.0;

                // Loop particle back to Celldeck when reaching fans
                if (positions[i * 3 + 0] < -0.4) {
                    positions[i * 3 + 0] = 25.8 + Math.random() * 0.2;
                    positions[i * 3 + 1] = 0.5 + Math.random() * 11.0;
                    positions[i * 3 + 2] = 0.4 + Math.random() * 2.5;
                }
            }
            posAttr.needsUpdate = true;
            this.airflowParticles.visible = true;
        } else if (this.airflowParticles) {
            this.airflowParticles.visible = false;
        }

        // 3. Water Trickling Update
        if (this.waterParticles && this.ventilationActive) {
            const posAttr = this.waterParticles.geometry.attributes.position;
            const positions = posAttr.array;
            const count = positions.length / 3;

            for (let i = 0; i < count; i++) {
                positions[i * 3 + 2] -= 1.8 * delta; // falls down Z
                if (positions[i * 3 + 2] < 0.65) {
                    positions[i * 3 + 2] = 2.35; // reset to top gutter
                }
            }
            posAttr.needsUpdate = true;
            this.waterParticles.visible = true;
        } else if (this.waterParticles) {
            this.waterParticles.visible = false;
        }
    }

    // MediaRecorder API: Record Construction & Orbit into WebM Video
    startRecording(durationSeconds = 30, onFinish) {
        if (this.isRecording) return;
        this.recordedChunks = [];

        const stream = this.renderer.domElement.captureStream(30); // 30 FPS
        const options = { mimeType: 'video/webm;codecs=vp9' };
        
        try {
            this.mediaRecorder = new MediaRecorder(stream, options);
        } catch (e) {
            this.mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
        }

        this.mediaRecorder.ondataavailable = (e) => {
            if (e.data && e.data.size > 0) {
                this.recordedChunks.push(e.data);
            }
        };

        this.mediaRecorder.onstop = () => {
            const blob = new Blob(this.recordedChunks, { type: 'video/webm' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Kandang_Broiler_26x12m_Construction_${Date.now()}.webm`;
            a.click();
            URL.revokeObjectURL(url);
            this.isRecording = false;
            if (onFinish) onFinish();
        };

        this.mediaRecorder.start();
        this.isRecording = true;

        // Auto-stop after specified duration
        setTimeout(() => {
            if (this.isRecording) {
                this.mediaRecorder.stop();
            }
        }, durationSeconds * 1000);
    }

    stopRecording() {
        if (this.isRecording && this.mediaRecorder) {
            this.mediaRecorder.stop();
        }
    }

    exportScreenshot() {
        this.renderer.render(this.scene, this.camera);
        const dataURL = this.renderer.domElement.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = dataURL;
        a.download = `Kandang_Broiler_26x12m_CAD_${Date.now()}.png`;
        a.click();
    }
}
