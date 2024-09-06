// Constants to avoid magic numbers
const STAR_COUNT = 10000;
const STAR_SIZE = 2.5;
const STAR_OPACITY = 0.9;
const CAMERA_FOV = 75;
const CAMERA_NEAR = 0.1;
const CAMERA_FAR = 1500;
const CAMERA_INITIAL_Z = 1000;
const STAR_FIELD_SIZE = 6000;
const STAR_SPEED_MIN = 0.02;
const STAR_SPEED_RANGE = 0.1;
const EXPLOSION_SPEED_MULTIPLIER = 50;
const EXPLOSION_SIZE_INITIAL = 5;
const EXPLOSION_OPACITY_DIVISOR = 5;
const EXPLOSION_COLOR = new THREE.Color(1, 0.8, 0.5);  // Bright orange
const PARALLAX_SMOOTHING = 0.05;
const EXPLOSION_DECAY = 0.95;
const EXPLOSION_DURATION = 1000;  // In milliseconds
const FALLING_STAR_PROBABILITY = 0.0001;  // Probability of a star becoming a falling star
const FALLING_STAR_SPEED = 3;             // Speed of falling stars
const FALLING_STAR_COLOR = new THREE.Color(1, 1, 1);  // White color for falling stars

let scene, camera, renderer, stars, starGeometry, starMaterial, starPositions, starVelocities;
let starColors, originalColors;
let mouseX = 0, mouseY = 0, cameraX = 0, cameraY = 0;
let raycaster = new THREE.Raycaster();
let mouse = new THREE.Vector2();
let explodedStars = {};
let fallingStars = {};  // Track falling stars
let clock = new THREE.Clock(); // Time management

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
    camera = new THREE.PerspectiveCamera(CAMERA_FOV, window.innerWidth / window.innerHeight, CAMERA_NEAR, CAMERA_FAR);
    camera.position.z = CAMERA_INITIAL_Z;
}

function setupRenderer() {
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById('threejs-background').appendChild(renderer.domElement);
}

function setupStars() {
    starGeometry = new THREE.BufferGeometry();
    starPositions = new Float32Array(STAR_COUNT * 3);
    starVelocities = new Float32Array(STAR_COUNT);
    starColors = new Float32Array(STAR_COUNT * 3);
    originalColors = new Float32Array(STAR_COUNT * 3);

    for (let i = 0; i < STAR_COUNT; i++) {
        let i3 = i * 3;
        starPositions[i3] = (Math.random() - 0.5) * STAR_FIELD_SIZE;
        starPositions[i3 + 1] = (Math.random() - 0.5) * STAR_FIELD_SIZE;
        starPositions[i3 + 2] = (Math.random() - 0.5) * STAR_FIELD_SIZE;

        starVelocities[i] = STAR_SPEED_MIN + Math.random() * STAR_SPEED_RANGE;

        let color = new THREE.Color();
        color.setHSL(Math.random() * 0.5 + 0.5, 0.7, Math.random() * 0.5 + 0.5);
        starColors[i3] = color.r;
        starColors[i3 + 1] = color.g;
        starColors[i3 + 2] = color.b;

        originalColors[i3] = color.r;
        originalColors[i3 + 1] = color.g;
        originalColors[i3 + 2] = color.b;
    }

    starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starGeometry.setAttribute('color', new THREE.BufferAttribute(starColors, 3));

    starMaterial = new THREE.PointsMaterial({
        size: STAR_SIZE,
        vertexColors: true,
        sizeAttenuation: true,
        transparent: true,
        opacity: STAR_OPACITY,
        depthWrite: false,
        blending: THREE.AdditiveBlending
    });

    stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);
}

function animate() {
    let delta = clock.getDelta();
    updateStars(delta);
    smoothParallax();
    checkForStarHover();
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}

function updateStars(delta) {
    for (let i = 0; i < STAR_COUNT; i++) {
        let i3 = i * 3;

        // Check if the star is a falling star
        if (fallingStars[i]) {
            updateFallingStar(i, i3);
        } else if (!explodedStars[i]) {
            // Normal star behavior
            starPositions[i3 + 2] += starVelocities[i] * delta * 60;

            // Randomly trigger a star to become a falling star
            if (Math.random() < FALLING_STAR_PROBABILITY) {
                triggerFallingStar(i);
            }

            if (starPositions[i3 + 2] > CAMERA_FAR) {
                resetStar(i);
            }
        } else {
            // Handle exploded stars
            updateExplosion(i, i3);
        }
    }

    stars.geometry.attributes.position.needsUpdate = true;
    stars.geometry.attributes.color.needsUpdate = true;
}

function triggerFallingStar(index) {
    let i3 = index * 3;
    fallingStars[index] = true;

    // Give the star a brighter color
    starColors[i3] = FALLING_STAR_COLOR.r;
    starColors[i3 + 1] = FALLING_STAR_COLOR.g;
    starColors[i3 + 2] = FALLING_STAR_COLOR.b;
}

function updateFallingStar(index, i3) {
    // Move the falling star quickly across the screen
    starPositions[i3 + 1] -= FALLING_STAR_SPEED; // Falling down
    starPositions[i3 + 2] += FALLING_STAR_SPEED; // Moving forward

    // Reset the star once it moves out of bounds
    if (starPositions[i3 + 1] < -CAMERA_FAR || starPositions[i3 + 2] > CAMERA_FAR) {
        resetFallingStar(index);
    }
}

function resetFallingStar(index) {
    fallingStars[index] = false; // No longer a falling star

    let i3 = index * 3;
    // Reset the star position like a normal star
    starPositions[i3] = (Math.random() - 0.5) * STAR_FIELD_SIZE;
    starPositions[i3 + 1] = (Math.random() - 0.5) * STAR_FIELD_SIZE;
    starPositions[i3 + 2] = -CAMERA_FAR;

    // Reset the star's color to its original color
    starColors[i3] = originalColors[i3];
    starColors[i3 + 1] = originalColors[i3 + 1];
    starColors[i3 + 2] = originalColors[i3 + 2];
}

function updateExplosion(i, i3) {
    let explosionData = explodedStars[i];

    starPositions[i3] += explosionData.vx;
    starPositions[i3 + 1] += explosionData.vy;
    starPositions[i3 + 2] += explosionData.vz;

    explosionData.vx *= 0.98;
    explosionData.vy *= 0.98;
    explosionData.vz *= 0.98;

    let elapsedTime = Date.now() - explosionData.startTime;
    let progress = elapsedTime / EXPLOSION_DURATION;

    starColors[i3] = THREE.MathUtils.lerp(explosionData.explosionColor.r, originalColors[i3], progress);
    starColors[i3 + 1] = THREE.MathUtils.lerp(explosionData.explosionColor.g, originalColors[i3 + 1], progress);
    starColors[i3 + 2] = THREE.MathUtils.lerp(explosionData.explosionColor.b, originalColors[i3 + 2], progress);

    explosionData.scale *= EXPLOSION_DECAY;
    starMaterial.size = explosionData.scale;
    starMaterial.opacity = explosionData.scale / EXPLOSION_OPACITY_DIVISOR;

    if (elapsedTime > EXPLOSION_DURATION) {
        resetStar(i);
    }
}

function smoothParallax() {
    cameraX += (mouseX - cameraX) * PARALLAX_SMOOTHING;
    cameraY += (-mouseY - cameraY) * PARALLAX_SMOOTHING;

    camera.position.x = cameraX * 0.02;
    camera.position.y = cameraY * 0.02;
}

function checkForStarHover() {
    raycaster.setFromCamera(mouse, camera);
    let intersects = raycaster.intersectObject(stars);

    if (intersects.length > 0) {
        explodeStar(intersects[0].index);
    }
}

function explodeStar(index) {
    if (!explodedStars[index]) {
        let i3 = index * 3;
        explodedStars[index] = {
            vx: (Math.random() - 0.5) * EXPLOSION_SPEED_MULTIPLIER,
            vy: (Math.random() - 0.5) * EXPLOSION_SPEED_MULTIPLIER,
            vz: (Math.random() - 0.5) * EXPLOSION_SPEED_MULTIPLIER,
            scale: EXPLOSION_SIZE_INITIAL,
            startTime: Date.now(),
            explosionColor: EXPLOSION_COLOR
        };

        starColors[i3] = explodedStars[index].explosionColor.r;
        starColors[i3 + 1] = explodedStars[index].explosionColor.g;
        starColors[i3 + 2] = explodedStars[index].explosionColor.b;

        starMaterial.size = explodedStars[index].scale;
        starMaterial.opacity = 1.0;
    }
}

function resetStar(index) {
    let i3 = index * 3;
    starPositions[i3] = (Math.random() - 0.5) * STAR_FIELD_SIZE;
    starPositions[i3 + 1] = (Math.random() - 0.5) * STAR_FIELD_SIZE;
    starPositions[i3 + 2] = -CAMERA_FAR;

    delete explodedStars[index];

    starMaterial.size = STAR_SIZE;
    starMaterial.opacity = STAR_OPACITY;

    starColors[i3] = originalColors[i3];
    starColors[i3 + 1] = originalColors[i3 + 1];
    starColors[i3 + 2] = originalColors[i3 + 2];
}

function onDocumentMouseMove(event) {
    mouseX = (event.clientX - window.innerWidth / 2);
    mouseY = (event.clientY - window.innerHeight / 2);

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

function onWindowResize() {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
}

function addEventListeners() {
    document.addEventListener('mousemove', onDocumentMouseMove);
    window.addEventListener('resize', onWindowResize);
}

// Initialize the starfield
init();