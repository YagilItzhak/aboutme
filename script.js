// Basic Three.js Setup
let scene, camera, renderer, stars;

function init() {
    // Create the scene
    scene = new THREE.Scene();

    // Create the camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 1;

    // Create the renderer
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById('threejs-background').appendChild(renderer.domElement);

    // Add stars
    stars = new THREE.Group();
    for (let i = 0; i < 1000; i++) {
        let starGeometry = new THREE.SphereGeometry(0.01, 24, 24);
        let starMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
        let star = new THREE.Mesh(starGeometry, starMaterial);

        star.position.x = Math.random() * 2 - 1;
        star.position.y = Math.random() * 2 - 1;
        star.position.z = Math.random() * 2 - 1;
        star.position.multiplyScalar(Math.random() * 10 + 1);

        stars.add(star);
    }
    scene.add(stars);

    // Animation loop
    animate();
}

function animate() {
    requestAnimationFrame(animate);

    // Rotate the stars
    stars.rotation.x += 0.0005;
    stars.rotation.y += 0.0005;

    renderer.render(scene, camera);
}

// Resize the renderer on window resize
window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
});

// Initialize the scene
init();

