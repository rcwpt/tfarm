/**
 * scene.js - 3D Scene Builder & Hierarchy Architecture
 * Source of truth: build_kandang_LENGKAP.rb
 */

export class SceneModel {
    constructor(scene, materialManager, kandangData) {
        this.scene = scene;
        this.matMgr = materialManager;
        this.data = kandangData;

        this.rootGroup = new THREE.Group();
        this.rootGroup.name = "Kandang_Broiler_26x12m";
        this.scene.add(this.rootGroup);

        this.layerGroups = {};
        this.meshList = [];
        this.objectLookup = new Map();

        // Mechanical animation targets
        this.rotatingFans = [];
        this.transmissionShaft = null;

        this.initLayers();
        this.initEnvironment();
        this.buildGeometry();
    }

    initLayers() {
        for (const [key, def] of Object.entries(this.data.layers)) {
            const grp = new THREE.Group();
            grp.name = key;
            grp.userData = { layerKey: key, layerName: def.name, stage: def.stage };
            this.rootGroup.add(grp);
            this.layerGroups[key] = grp;
        }
    }

    initEnvironment() {
        // CAD Engineering Grid (Ground)
        const gridHelper = new THREE.GridHelper(60, 60, 0x00e5ff, 0x223344);
        gridHelper.name = "GroundGrid";
        gridHelper.rotation.x = Math.PI / 2; // Three.js Y-up to Z-up orientation
        gridHelper.position.set(13.0, 6.0, -0.405);
        this.scene.add(gridHelper);

        // Ground Plane (Paving/Site)
        const groundGeo = new THREE.PlaneGeometry(80, 80);
        const groundMat = new THREE.MeshStandardMaterial({
            color: 0x161a22,
            roughness: 0.95,
            metalness: 0.05
        });
        const ground = new THREE.Mesh(groundGeo, groundMat);
        ground.name = "GroundPlane";
        ground.position.set(13.0, 6.0, -0.41);
        this.scene.add(ground);

        // Lighting Architecture
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.65);
        this.scene.add(ambientLight);

        const hemiLight = new THREE.HemisphereLight(0xffffff, 0x334455, 0.45);
        hemiLight.position.set(13, 6, 25);
        this.scene.add(hemiLight);

        // Sun Directional Light
        const sunLight = new THREE.DirectionalLight(0xfff8e7, 0.95);
        sunLight.position.set(35, -25, 40);
        sunLight.castShadow = true;
        sunLight.shadow.mapSize.width = 2048;
        sunLight.shadow.mapSize.height = 2048;
        sunLight.shadow.camera.near = 1;
        sunLight.shadow.camera.far = 100;
        sunLight.shadow.camera.left = -30;
        sunLight.shadow.camera.right = 30;
        sunLight.shadow.camera.top = 30;
        sunLight.shadow.camera.bottom = -30;
        this.scene.add(sunLight);

        // Fill Light for Interior Aisles & Under-Roof
        const fillLight1 = new THREE.DirectionalLight(0xbbdefb, 0.4);
        fillLight1.position.set(-20, 25, 15);
        this.scene.add(fillLight1);

        const fillLight2 = new THREE.PointLight(0xffffff, 0.5, 30);
        fillLight2.position.set(13, 6, 2.5); // Inside kandang center
        this.scene.add(fillLight2);
    }

    buildGeometry() {
        const objects = this.data.objects;
        const total = objects.length;

        for (let i = 0; i < total; i++) {
            const obj = objects[i];
            const mat = this.matMgr.getMaterial(obj.material);
            const lGroup = this.layerGroups[obj.layer] || this.rootGroup;

            let mesh = null;

            if (obj.type === 'box') {
                const g = obj.geom;
                const bGeo = new THREE.BoxGeometry(g.w, g.d, g.h);
                mesh = new THREE.Mesh(bGeo, mat);
                mesh.position.set(g.cx, g.cy, g.cz);
                mesh.scale.set(1, 1, 1);
            } else if (obj.type === 'sloped_beam' || obj.type === 'canted_gording') {
                mesh = this.createPrismMesh(obj.geom.pts, mat);
                mesh.scale.set(1, 1, 1);
            } else if (obj.type === 'quad_sheet') {
                mesh = this.createQuadMesh(obj.geom.pts, mat);
                mesh.scale.set(1, 1, 1);
            }

            if (mesh) {
                mesh.name = obj.name;
                mesh.userData = {
                    id: obj.id,
                    metadata: obj
                };

                // Shadow properties
                mesh.castShadow = (obj.category === 'Struktur Utama' || obj.category === 'Atap' || obj.category === 'Pondasi');
                mesh.receiveShadow = true;

                lGroup.add(mesh);
                this.objectLookup.set(obj.id, mesh);

                this.meshList.push({
                    mesh: mesh,
                    origPos: mesh.position.clone(),
                    origScale: mesh.scale.clone(),
                    metadata: obj
                });

                // Detect transmission shaft
                if (obj.name.includes("As Transmisi")) {
                    this.transmissionShaft = mesh;
                }
            }
        }

        this.setupFanRotors();
    }

    setupFanRotors() {
        // Group propeller blades for each of the 6 exhaust fans into rotating rotor groups
        const blowerNames = [
            "Blower A 50in Box Fan (Diesel Kinetik)",
            "Blower B 50in Box Fan (Motor Listrik)",
            "Blower C 50in Box Fan (Diesel Kinetik)",
            "Blower D 50in Box Fan (Diesel Kinetik)",
            "Blower E 50in Box Fan (Motor Listrik)",
            "Blower F 50in Box Fan (Diesel Kinetik)"
        ];

        blowerNames.forEach(bName => {
            const fanGroup = this.layerGroups["12_Exhaust_Fan_Box_50in"];
            if (!fanGroup) return;

            // Find all 6 blades belonging to this blower
            const blades = [];
            let hubCenter = null;

            fanGroup.children.forEach(child => {
                if (child.name.startsWith(bName) && child.name.includes("Blade #")) {
                    blades.push(child);
                }
                if (child.name.startsWith(bName) && child.name.includes("Hub Motor")) {
                    hubCenter = child.position.clone();
                }
            });

            if (blades.length === 6 && hubCenter) {
                const rotorGroup = new THREE.Group();
                rotorGroup.name = `${bName} - Rotor`;
                rotorGroup.position.copy(hubCenter);
                fanGroup.add(rotorGroup);

                blades.forEach(b => {
                    // Reparent blade to rotorGroup
                    b.position.sub(hubCenter);
                    rotorGroup.add(b);
                });

                this.rotatingFans.push(rotorGroup);
            }
        });
    }

    createPrismMesh(pts, material) {
        // 8 vertices prism
        const geo = new THREE.BufferGeometry();
        const positions = [];

        // 6 faces of box/prism
        const faces = [
            [0, 3, 2, 1], // bottom
            [4, 5, 6, 7], // top
            [0, 1, 5, 4], // side 1
            [2, 3, 7, 6], // side 2
            [1, 2, 6, 5], // side 3
            [3, 0, 4, 7]  // side 4
        ];

        faces.forEach(f => {
            const [i0, i1, i2, i3] = f;
            const p0 = pts[i0], p1 = pts[i1], p2 = pts[i2], p3 = pts[i3];
            // Tri 1: p0, p1, p2
            positions.push(p0[0], p0[1], p0[2]);
            positions.push(p1[0], p1[1], p1[2]);
            positions.push(p2[0], p2[1], p2[2]);
            // Tri 2: p0, p2, p3
            positions.push(p0[0], p0[1], p0[2]);
            positions.push(p2[0], p2[1], p2[2]);
            positions.push(p3[0], p3[1], p3[2]);
        });

        geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geo.computeVertexNormals();

        return new THREE.Mesh(geo, material);
    }

    createQuadMesh(pts, material) {
        const geo = new THREE.BufferGeometry();
        const [p0, p1, p2, p3] = pts;

        const positions = [
            p0[0], p0[1], p0[2],
            p1[0], p1[1], p1[2],
            p2[0], p2[1], p2[2],

            p0[0], p0[1], p0[2],
            p2[0], p2[1], p2[2],
            p3[0], p3[1], p3[2]
        ];

        geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geo.computeVertexNormals();

        return new THREE.Mesh(geo, material);
    }

    setLayerVisibility(layerKey, visible) {
        if (this.layerGroups[layerKey]) {
            this.layerGroups[layerKey].visible = visible;
        }
    }

    isolateLayer(targetLayerKey) {
        for (const [key, grp] of Object.entries(this.layerGroups)) {
            grp.visible = (key === targetLayerKey);
        }
    }

    showAllLayers() {
        for (const grp of Object.values(this.layerGroups)) {
            grp.visible = true;
        }
    }
}
