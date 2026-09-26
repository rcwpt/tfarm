/**
 * materials.js - Material Manager for Kandang Broiler 3D
 * Source of truth: build_kandang_LENGKAP.rb
 */

export class MaterialManager {
    constructor(materialsData) {
        this.materialsData = materialsData;
        this.currentMode = 'realistic'; // realistic | technical | wireframe | xray | transparent
        this.materialCache = {};
        this.initMaterials();
    }

    initMaterials() {
        for (const [key, def] of Object.entries(this.materialsData)) {
            const color = new THREE.Color(def.color);
            const opacity = def.alpha !== undefined ? def.alpha : 1.0;
            const transparent = opacity < 1.0;

            // Realistic PBR
            const realisticMat = new THREE.MeshStandardMaterial({
                color: color,
                roughness: def.roughness !== undefined ? def.roughness : 0.6,
                metalness: def.metalness !== undefined ? def.metalness : 0.1,
                opacity: opacity,
                transparent: transparent,
                side: THREE.DoubleSide
            });

            // Technical (category-based or bright vibrant color)
            const techColor = this.getTechnicalColor(key, color);
            const technicalMat = new THREE.MeshStandardMaterial({
                color: techColor,
                roughness: 0.5,
                metalness: 0.1,
                side: THREE.DoubleSide
            });

            // Wireframe
            const wireframeMat = new THREE.MeshBasicMaterial({
                color: color.clone().multiplyScalar(1.2),
                wireframe: true
            });

            // X-Ray
            const xrayMat = new THREE.MeshLambertMaterial({
                color: color,
                transparent: true,
                opacity: 0.28,
                depthWrite: false,
                side: THREE.DoubleSide
            });

            // Transparent
            const transparentMat = new THREE.MeshStandardMaterial({
                color: color,
                transparent: true,
                opacity: 0.45,
                roughness: 0.3,
                side: THREE.DoubleSide
            });

            this.materialCache[key] = {
                realistic: realisticMat,
                technical: technicalMat,
                wireframe: wireframeMat,
                xray: xrayMat,
                transparent: transparentMat,
                current: realisticMat
            };
        }

        // Selection highlight material
        this.highlightMaterial = new THREE.MeshBasicMaterial({
            color: 0x00e5ff,
            wireframe: false,
            transparent: true,
            opacity: 0.85
        });
        
        this.outlineMaterial = new THREE.MeshBasicMaterial({
            color: 0xffea00,
            wireframe: true
        });
    }

    getTechnicalColor(key, defaultColor) {
        if (key.includes('beton') || key.includes('got')) return new THREE.Color('#78909c');
        if (key.includes('kayu_besi')) return new THREE.Color('#e65100');
        if (key.includes('kayu')) return new THREE.Color('#ffb74d');
        if (key.includes('slat')) return new THREE.Color('#4caf50');
        if (key.includes('galvanis')) return new THREE.Color('#90a4ae');
        if (key.includes('talang')) return new THREE.Color('#00bcd4');
        if (key.includes('pipa')) return new THREE.Color('#29b6f6');
        if (key.includes('nipple')) return new THREE.Color('#f44336');
        if (key.includes('drip_cup')) return new THREE.Color('#ffeb3b');
        if (key.includes('box_fan') || key.includes('louver') || key.includes('blade') || key.includes('motor')) return new THREE.Color('#ab47bc');
        if (key.includes('diesel') || key.includes('puli')) return new THREE.Color('#d32f2f');
        if (key.includes('terpal')) return new THREE.Color('#1976d2');
        if (key.includes('celldeck')) return new THREE.Color('#ff9800');
        if (key.includes('spandek') || key.includes('rib')) return new THREE.Color('#0288d1');
        return defaultColor;
    }

    getMaterial(key) {
        if (!this.materialCache[key]) {
            return new THREE.MeshStandardMaterial({ color: 0x888888, side: THREE.DoubleSide });
        }
        return this.materialCache[key][this.currentMode];
    }

    setMode(mode) {
        if (!['realistic', 'technical', 'wireframe', 'xray', 'transparent'].includes(mode)) return;
        this.currentMode = mode;
        for (const key in this.materialCache) {
            this.materialCache[key].current = this.materialCache[key][mode];
        }
    }

    enableClipping(planes) {
        for (const key in this.materialCache) {
            for (const mode in this.materialCache[key]) {
                const mat = this.materialCache[key][mode];
                if (mat && mat.isMaterial) {
                    mat.clippingPlanes = planes;
                    mat.clipShadows = true;
                    mat.needsUpdate = true;
                }
            }
        }
    }
}
