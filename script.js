let scene, camera, renderer, stars, starGeometry, starMaterial, starPositions, starVelocities;
let mouseX = 0, mouseY = 0, cameraX = 0, cameraY = 0;
let starCount = 10000;  // Increased number of stars for a denser field

function init() {
    setupScene();
    setupCamera();
    setupRenderer();
    setupStars();
    addEventListeners();
    animate(); // Start the animation loop
}

function setupScene() {
    scene = new THREE.Scene();
}

function setupCamera() {
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1500);
    camera.position.z = 1000;
}

function setupRenderer() {
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById('threejs-background').appendChild(renderer.domElement);
}

// Setup stars using instancing for better performance
function setupStars() {
    starGeometry = new THREE.BufferGeometry();
    starPositions = new Float32Array(starCount * 3); // Store positions
    starVelocities = new Float32Array(starCount); // Store velocities for each star

    let starColors = new Float32Array(starCount * 3); // Store colors
    for (let i = 0; i < starCount; i++) {
        let i3 = i * 3;
        // Randomize initial position of each star
        starPositions[i3] = (Math.random() - 0.5) * 6000;
        starPositions[i3 + 1] = (Math.random() - 0.5) * 6000;
        starPositions[i3 + 2] = (Math.random() - 0.5) * 6000;

        // Assign each star a random velocity (faster stars for deeper stars)
        starVelocities[i] = 0.02 + Math.random() * 0.1;

        // Set star color, with slight hue variations for each star
        let color = new THREE.Color();
        color.setHSL(Math.random() * 0.2 + 0.6, 0.7, Math.random() * 0.5 + 0.5);
        starColors[i3] = color.r;
        starColors[i3 + 1] = color.g;
        starColors[i3 + 2] = color.b;
    }

    starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starGeometry.setAttribute('color', new THREE.BufferAttribute(starColors, 3));

    starMaterial = new THREE.PointsMaterial({
        size: 2.5,
        vertexColors: true,
        sizeAttenuation: true,  // Star size affected by depth
        transparent: true,
        opacity: 0.9,
        depthWrite: false,
        blending: THREE.AdditiveBlending,  // Additive blending for glowing effect
    });

    stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);
}

function animate() {
    requestAnimationFrame(animate);

    updateStars();  // Move and update stars
    smoothParallax();  // Parallax effect with mouse
    applyMotionBlur();  // Apply basic motion blur effect

    renderer.render(scene, camera);
}

function updateStars() {
    for (let i = 0; i < starCount; i++) {
        let i3 = i * 3;
        starPositions[i3 + 2] += starVelocities[i];  // Move stars along the Z-axis

        // Reset stars that go too far in depth to simulate looping
        if (starPositions[i3 + 2] > 1500) {
            starPositions[i3 + 2] = -1500;
            starPositions[i3] = (Math.random() - 0.5) * 6000;
            starPositions[i3 + 1] = (Math.random() - 0.5) * 6000;
        }

        // Gradually shift colors as stars move
        let colorIndex = i * 3;
        starMaterial.color.setHSL(Math.sin(starPositions[i3 + 2] * 0.001) * 0.15 + 0.6, 0.7, 0.5);
    }
    stars.geometry.attributes.position.needsUpdate = true;  // Inform Three.js of position changes
}

function smoothParallax() {
    cameraX += (mouseX - cameraX) * 0.05;
    cameraY += (-mouseY - cameraY) * 0.05;

    camera.position.x = cameraX * 0.02;  // Apply parallax effect
    camera.position.y = cameraY * 0.02;
}

function applyMotionBlur() {
    starMaterial.size = 2.5 + 1.5 * Math.sin(Date.now() * 0.001);  // Size variation for twinkling effect
}

// Event listeners for mouse and resizing
function addEventListeners() {
    document.addEventListener('mousemove', onDocumentMouseMove);
    window.addEventListener('resize', onWindowResize);
}

function onDocumentMouseMove(event) {
    mouseX = (event.clientX - window.innerWidth / 2);
    mouseY = (event.clientY - window.innerHeight / 2);
}

function onWindowResize() {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
}

// Initialize the starfield
init();
