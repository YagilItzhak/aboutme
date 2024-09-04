// Enhanced Three.js Starfield with Color, Depth, and Motion Effects
let scene, camera, renderer, stars, starVertices = [], mouseX = 0, mouseY = 0, cameraX = 0, cameraY = 0;

function init() {
    // Create the scene
    scene = new THREE.Scene();

    // Create the camera with a slight distance
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 500;

    // Create the renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById('threejs-background').appendChild(renderer.domElement);

    // Create stars using BufferGeometry for performance
    let starGeometry = new THREE.BufferGeometry();
    let starColors = [];
    for (let i = 0; i < 5000; i++) {
        let x = (Math.random() - 0.5) * 3000;
        let y = (Math.random() - 0.5) * 3000;
        let z = (Math.random() - 0.5) * 3000;
        starVertices.push(x, y, z);

        // Add random color for each star (from blue to white to yellow)
        let color = new THREE.Color();
        color.setHSL(Math.random() * 0.2 + 0.6, 0.7, Math.random() * 0.5 + 0.5);
        starColors.push(color.r, color.g, color.b);
    }
    starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
    starGeometry.setAttribute('color', new THREE.Float32BufferAttribute(starColors, 3));

    // Add material with depth scaling and color blending
    let starMaterial = new THREE.PointsMaterial({
        size: 1.5,
        vertexColors: true, // Enable vertex coloring for individual stars
        sizeAttenuation: true, // Size based on distance
        transparent: true,
        opacity: 0.8
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

    // Star twinkling effect using sine wave
    let time = Date.now() * 0.00005;
    stars.material.opacity = 0.75 + 0.25 * Math.sin(time * 5);  // Adjust opacity to create twinkling effect
    stars.material.size = 1.5 + 0.5 * Math.sin(time * 5);  // Adjust size for twinkling

    // Slowly rotate the star field
    stars.rotation.x += 0.0002;
    stars.rotation.y += 0.0004;

    // Move stars along Z-axis for a slow drift
    stars.geometry.attributes.position.array.forEach((v, i) => {
        if (i % 3 === 2) {
            stars.geometry.attributes.position.array[i] += 0.05;
            if (stars.geometry.attributes.position.array[i] > 1500) {
                stars.geometry.attributes.position.array[i] = -1500;
            }
        }
    });
    stars.geometry.attributes.position.needsUpdate = true;

    // Smooth parallax effect
    cameraX += (mouseX - cameraX) * 0.02;
    cameraY += (-mouseY - cameraY) * 0.02;
    camera.position.x = cameraX * 0.005;
    camera.position.y = cameraY * 0.005;

    // Slowly move the camera forward to simulate drifting through space
    camera.position.z -= 0.1;
    if (camera.position.z < 400) {
        camera.position.z = 500;
    }

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
