/**
 * app.js - Main Application Bootstrap for Kandang Broiler 3D Digital Twin
 * Source of truth: build_kandang_LENGKAP.rb
 */

import { MaterialManager } from './materials.js';
import { SceneModel } from './scene.js';
import { CameraManager } from './camera.js';
import { setupControls } from './controls.js';
import { DimensionManager } from './dimensions.js';
import { MeasurementTool } from './measurements.js';
import { ConstructionManager } from './construction.js';
import { AnimationManager } from './animation.js';
import { UIManager } from './ui.js';

class KandangApp {
    constructor() {
        this.init();
    }

    init() {
        console.log("🚀 Initializing Kandang Broiler 26x12m 3D Digital Twin...");

        const kandangData = window.KANDANG_DATA;
        if (!kandangData) {
            console.error("❌ Fatal Error: window.KANDANG_DATA not loaded!");
            alert("Gagal memuat data model. Pastikan kandang-data.js tersedia.");
            return;
        }

        // 1. Renderer Setup
        const canvas = document.getElementById('three-canvas');
        this.renderer = new THREE.WebGLRenderer({
            canvas: canvas,
            antialias: true,
            preserveDrawingBuffer: true,
            powerPreference: 'high-performance'
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.localClippingEnabled = true;

        // 2. Scene Setup
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0e1117);
        this.scene.fog = new THREE.FogExp2(0x0e1117, 0.0035);

        // 3. Camera Setup
        this.camera = new THREE.PerspectiveCamera(
            45,
            window.innerWidth / window.innerHeight,
            0.1,
            1500.0
        );
        // CAD Engineering standard: Z is UP!
        this.camera.up.set(0, 0, 1);
        this.camera.position.set(38, -18, 22);

        // 4. Controls Setup
        this.controls = setupControls(this.camera, canvas);

        // 5. Materials
        this.matMgr = new MaterialManager(kandangData.materials);

        // 6. 3D Scene Model
        this.sceneModel = new SceneModel(this.scene, this.matMgr, kandangData);

        // 7. Managers
        this.cameraMgr = new CameraManager(this.camera, this.controls);
        this.dimMgr = new DimensionManager(this.scene, this.camera);
        this.measTool = new MeasurementTool(this.scene, this.camera, canvas);
        this.animMgr = new AnimationManager(this.scene, this.camera, this.renderer, this.sceneModel);

        this.constrMgr = new ConstructionManager(
            this.sceneModel,
            this.cameraMgr,
            (progress, stage) => {
                if (this.uiMgr) {
                    this.uiMgr.updateConstructionUI(progress, stage);
                }
            }
        );

        // 8. UI Controller
        this.uiMgr = new UIManager(
            this.sceneModel,
            this.cameraMgr,
            this.constrMgr,
            this.animMgr,
            this.dimMgr,
            this.measTool,
            this.matMgr
        );

        // Resize Listener
        window.addEventListener('resize', () => this.onWindowResize());

        // Presentation shortcut: press 'P' or 'Escape'
        window.addEventListener('keydown', (e) => {
            if (e.key === 'p' || e.key === 'P') {
                this.uiMgr.togglePresentation();
            }
            if (e.key === 'Escape') {
                if (this.uiMgr.isPresentation) this.uiMgr.togglePresentation();
                if (this.measTool.active) this.measTool.toggle(false);
            }
        });

        // Hide preloader
        const preloader = document.getElementById('preloader');
        if (preloader) {
            preloader.style.opacity = '0';
            setTimeout(() => preloader.style.display = 'none', 500);
        }

        // Start Loop
        this.clock = new THREE.Clock();
        this.animate();
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        const delta = this.clock.getDelta();

        this.controls.update();
        this.cameraMgr.update();
        this.constrMgr.update();
        this.animMgr.update(delta);
        this.dimMgr.updateLabels();

        this.renderer.render(this.scene, this.camera);
    }
}

// Bootstrap when DOM is ready
window.addEventListener('DOMContentLoaded', () => {
    window.app = new KandangApp();
});
