// Enhanced Three.js Starfield with Twinkling and Parallax Effect
let scene, camera, renderer, stars, starVertices = [], mouseX = 0, mouseY = 0, cameraX = 0, cameraY = 0;

function init() {
    // Create the scene
    scene = new THREE.Scene();

    // Create the camera with a starting position further from the stars
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 500;

    // Create the renderer
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById('threejs-background').appendChild(renderer.domElement);

    // Create stars using BufferGeometry for performance
    let starGeometry = new THREE.BufferGeometry();
    for (let i = 0; i < 3000; i++) {
        let x = (Math.random() - 0.5) * 2000;
        let y = (Math.random() - 0.5) * 2000;
        let z = (Math.random() - 0.5) * 2000;
        starVertices.push(x, y, z);
    }
    starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));

    // Add material with subtle glow and opacity for twinkling effect
    let starMaterial = new THREE.PointsMaterial({ 
        color: 0xffffff, 
        size: 1, 
        transparent: true, 
        opacity: 0.8, 
        sizeAttenuation: true
    });

    stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);

    // Add mouse move listener for parallax effect
    document.addEventListener('mousemove', onDocumentMouseMove);

    // Animation loop
    animate();
}

function animate() {
    requestAnimationFrame(animate);

    // Star twinkling effect
    let time = Date.now() * 0.00005;
    stars.material.opacity = 0.75 + 0.25 * Math.sin(time * 5);  // Twinkling effect on opacity
    stars.material.size = 0.7 + 0.3 * Math.sin(time * 5);  // Twinkling effect on size

    // Rotate the stars slowly
    stars.rotation.x += 0.0005;
    stars.rotation.y += 0.0008;

    // Move stars along Z-axis for depth
    stars.geometry.attributes.position.array.forEach((v, i) => {
        if (i % 3 === 2) {
            stars.geometry.attributes.position.array[i] += 0.05;
            if (stars.geometry.attributes.position.array[i] > 1000) {
                stars.geometry.attributes.position.array[i] = -1000;
            }
        }
    });
    stars.geometry.attributes.position.needsUpdate = true;

    // Update camera for parallax effect
    cameraX += (mouseX - cameraX) * 0.05;
    cameraY += (-mouseY - cameraY) * 0.05;
    camera.position.x = cameraX * 0.005;
    camera.position.y = cameraY * 0.005;

    renderer.render(scene, camera);
}

// Mouse move listener for parallax effect
function onDocumentMouseMove(event) {
    mouseX = (event.clientX - window.innerWidth / 2);
    mouseY = (event.clientY - window.innerHeight / 2);
}

// Resize the renderer on window resize
window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
});

// Initialize the scene
init();
