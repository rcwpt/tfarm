/**
 * controls.js - OrbitControls wrapper and interaction settings
 */

export function setupControls(camera, domElement) {
    const controls = new THREE.OrbitControls(camera, domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = true;
    controls.minDistance = 0.5;
    controls.maxDistance = 150.0;
    controls.maxPolarAngle = Math.PI / 2 + 0.05; // allow slightly below ground view
    controls.target.set(13.0, 6.0, 2.5);
    controls.update();
    return controls;
}
