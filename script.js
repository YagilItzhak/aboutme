let scene, camera, renderer, stars, starGeometry, starMaterial, starPositions, starVelocities;
let starColors, originalColors;  // Store current and original colors
let mouseX = 0, mouseY = 0, cameraX = 0, cameraY = 0;
let starCount = 10000;
let raycaster = new THREE.Raycaster();
let mouse = new THREE.Vector2();
let explodedStars = {};
let explosionDuration = 1000;  // Explosion duration in milliseconds

function init() {
    setupScene();
    setupCamera();
    setupRenderer();
    setupStars();
    addEventListeners();
    animate();
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

function setupStars() {
    starGeometry = new THREE.BufferGeometry();
    starPositions = new Float32Array(starCount * 3);
    starVelocities = new Float32Array(starCount);
    starColors = new Float32Array(starCount * 3);  // Store current star colors
    originalColors = new Float32Array(starCount * 3);  // Store original colors

    for (let i = 0; i < starCount; i++) {
        let i3 = i * 3;
        starPositions[i3] = (Math.random() - 0.5) * 6000;
        starPositions[i3 + 1] = (Math.random() - 0.5) * 6000;
        starPositions[i3 + 2] = (Math.random() - 0.5) * 6000;

        // Assign random velocity
        starVelocities[i] = 0.02 + Math.random() * 0.1;

        // Set initial color for each star
        let color = new THREE.Color();
        color.setHSL(Math.random() * 0.5 + 0.5, 0.7, Math.random() * 0.5 + 0.5);
        starColors[i3] = color.r;
        starColors[i3 + 1] = color.g;
        starColors[i3 + 2] = color.b;

        // Save the original color for later use
        originalColors[i3] = color.r;
        originalColors[i3 + 1] = color.g;
        originalColors[i3 + 2] = color.b;
    }

    starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starGeometry.setAttribute('color', new THREE.BufferAttribute(starColors, 3));

    starMaterial = new THREE.PointsMaterial({
        size: 2.5,
        vertexColors: true,
        sizeAttenuation: true,
        transparent: true,
        opacity: 0.9,
        depthWrite: false,
        blending: THREE.AdditiveBlending
    });

    stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);
}

function animate() {
    requestAnimationFrame(animate);
    updateStars();
    smoothParallax();
    checkForStarHover();
    renderer.render(scene, camera);
}

function updateStars() {
    for (let i = 0; i < starCount; i++) {
        let i3 = i * 3;

        if (!explodedStars[i]) {
            // Normal star behavior (drifting through space)
            starPositions[i3 + 2] += starVelocities[i];

            if (starPositions[i3 + 2] > 1500) {
                starPositions[i3 + 2] = -1500;
                starPositions[i3] = (Math.random() - 0.5) * 6000;
                starPositions[i3 + 1] = (Math.random() - 0.5) * 6000;
            }
        } else {
            let explosionData = explodedStars[i];

            // Move exploded star particles
            starPositions[i3] += explosionData.vx;
            starPositions[i3 + 1] += explosionData.vy;
            starPositions[i3 + 2] += explosionData.vz;

            // Gradually reduce velocity (deceleration)
            explosionData.vx *= 0.98;
            explosionData.vy *= 0.98;
            explosionData.vz *= 0.98;

            // Interpolate color from explosion color back to original
            let elapsedTime = Date.now() - explosionData.startTime;
            let progress = elapsedTime / explosionDuration;

            starColors[i3] = THREE.MathUtils.lerp(explosionData.explosionColor.r, originalColors[i3], progress);
            starColors[i3 + 1] = THREE.MathUtils.lerp(explosionData.explosionColor.g, originalColors[i3 + 1], progress);
            starColors[i3 + 2] = THREE.MathUtils.lerp(explosionData.explosionColor.b, originalColors[i3 + 2], progress);

            // Fade the size and opacity over time
            explosionData.scale *= 0.95;
            starMaterial.size = explosionData.scale;
            starMaterial.opacity = explosionData.scale / 5;

            // Reset star after explosion duration
            if (elapsedTime > explosionDuration) {
                resetStar(i);
            }
        }
    }

    stars.geometry.attributes.position.needsUpdate = true;
    stars.geometry.attributes.color.needsUpdate = true;
}

// Smooth parallax effect based on mouse movement
function smoothParallax() {
    cameraX += (mouseX - cameraX) * 0.05;
    cameraY += (-mouseY - cameraY) * 0.05;

    camera.position.x = cameraX * 0.02;
    camera.position.y = cameraY * 0.02;
}

// Check if the mouse is hovering over any stars and trigger explosion
function checkForStarHover() {
    raycaster.setFromCamera(mouse, camera);

    let intersects = raycaster.intersectObject(stars);

    if (intersects.length > 0) {
        let index = intersects[0].index;
        explodeStar(index);
    }
}

// Explode a star by giving it a random velocity and changing its color
function explodeStar(index) {
    if (!explodedStars[index]) {
        let i3 = index * 3;

        // Set random velocities for the explosion
        explodedStars[index] = {
            vx: (Math.random() - 0.5) * 50,
            vy: (Math.random() - 0.5) * 50,
            vz: (Math.random() - 0.5) * 50,
            scale: 5,  // Start with a larger size for explosion
            startTime: Date.now(),
            explosionColor: new THREE.Color(1, 0.8, 0.5)  // Explosion color (e.g., bright orange)
        };

        // Immediately set the star's color to the explosion color
        starColors[i3] = explodedStars[index].explosionColor.r;
        starColors[i3 + 1] = explodedStars[index].explosionColor.g;
        starColors[i3 + 2] = explodedStars[index].explosionColor.b;

        starMaterial.size = explodedStars[index].scale;
        starMaterial.opacity = 1.0;
    }
}

// Reset a star to its initial state
function resetStar(index) {
    let i3 = index * 3;
    starPositions[i3] = (Math.random() - 0.5) * 6000;
    starPositions[i3 + 1] = (Math.random() - 0.5) * 6000;
    starPositions[i3 + 2] = -1500;

    delete explodedStars[index];

    // Restore original size and opacity
    starMaterial.size = 2.5;
    starMaterial.opacity = 0.9;

    // Reset color back to the original color
    starColors[i3] = originalColors[i3];
    starColors[i3 + 1] = originalColors[i3 + 1];
    starColors[i3 + 2] = originalColors[i3 + 2];
}

// Update mouse coordinates for raycasting
function onDocumentMouseMove(event) {
    mouseX = (event.clientX - window.innerWidth / 2);
    mouseY = (event.clientY - window.innerHeight / 2);

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

// Handle window resizing
function onWindowResize() {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
}

// Event listeners for mouse and resizing
function addEventListeners() {
    document.addEventListener('mousemove', onDocumentMouseMove);
    window.addEventListener('resize', onWindowResize);
}

// Initialize the starfield
init();
