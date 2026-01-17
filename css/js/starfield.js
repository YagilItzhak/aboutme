'use strict';

/**
 * Starfield background powered by Three.js.
 * Features:
 * - Typed-array star simulation
 * - Mouse parallax camera
 * - Raycast hover explosions (desktop only, reduced-motion aware)
 * - Occasional falling stars (desktop only, reduced-motion aware)
 *
 * Assumptions:
 * - `THREE` is available globally
 * - An element with id `threejs-background` exists
 * - `config.json` matches the expected shape used below
 */
(async () => {
  /** @type {string} */
  const CONFIG_URL = 'config.json';

  /** @type {StarConfig|null} */
  const config = await loadConfig(CONFIG_URL);
  if (!config) return;

  /** @type {Env} */
  const env = detectEnvironment(config);

  /** @type {StarfieldState} */
  const state = createState(config, env);

  initThree(state, config, env);
  addEventListeners(state, config, env);
  startLoop(state, config, env);

  /**
   * Loads configuration JSON.
   * @param {string} url
   * @returns {Promise<StarConfig|null>}
   */
  async function loadConfig(url) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return /** @type {StarConfig} */ (await res.json());
    } catch (err) {
      console.error('Failed to load config.json:', err);
      return null;
    }
  }

  /**
   * Detects device and motion preferences.
   * @param {StarConfig} config
   * @returns {Env}
   */
  function detectEnvironment(config) {
    const isMobile =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );

    const prefersReducedMotion =
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const starCount = isMobile ? config.starField.countMobile : config.starField.countDesktop;

    return {
      isMobile,
      prefersReducedMotion,
      shouldRaycast: !isMobile && !prefersReducedMotion,
      starCount,
    };
  }

  /**
   * Allocates runtime state and typed arrays.
   * @param {StarConfig} config
   * @param {Env} env
   * @returns {StarfieldState}
   */
  function createState(config, env) {
    const count = env.starCount;

    const EXPLOSION_COLOR = new THREE.Color(
      config.explosion.color.r,
      config.explosion.color.g,
      config.explosion.color.b
    );

    const FALLING_COLOR = new THREE.Color(
      config.fallingStar.color.r,
      config.fallingStar.color.g,
      config.fallingStar.color.b
    );

    return {
      scene: /** @type {any} */ (null),
      camera: /** @type {any} */ (null),
      renderer: /** @type {any} */ (null),
      stars: /** @type {any} */ (null),
      geometry: /** @type {any} */ (null),
      material: /** @type {any} */ (null),

      pos: new Float32Array(count * 3),
      vel: new Float32Array(count),
      color: new Float32Array(count * 3),
      baseColor: new Float32Array(count * 3),

      exploded: new Uint8Array(count),
      falling: new Uint8Array(count),
      explosionData: new Float32Array(count * config.explosionData.size),

      clock: new THREE.Clock(),
      lastRaycastAt: 0,
      mouseMoved: false,

      raycaster: new THREE.Raycaster(),
      mouse: new THREE.Vector2(),
      mouseX: 0,
      mouseY: 0,
      camX: 0,
      camY: 0,

      EXPLOSION_COLOR,
      FALLING_COLOR,
    };
  }

  /**
   * Initializes scene, camera, renderer, and star field.
   * @param {StarfieldState} state
   * @param {StarConfig} config
   * @param {Env} env
   */
  function initThree(state, config, env) {
    state.scene = new THREE.Scene();
    state.scene.fog = new THREE.FogExp2(0x0a0e27, 0.00025);

    state.camera = new THREE.PerspectiveCamera(
      config.camera.fov,
      window.innerWidth / window.innerHeight,
      config.camera.near,
      config.camera.far
    );
    state.camera.position.z = config.camera.initialZ;

    state.renderer = new THREE.WebGLRenderer({
      antialias: !env.isMobile,
      alpha: true,
      powerPreference: 'high-performance',
    });

    const maxPixelRatio = env.isMobile
      ? config.performance.pixelRatioMaxMobile
      : config.performance.pixelRatioMaxDesktop;

    state.renderer.setPixelRatio(Math.min(window.devicePixelRatio, maxPixelRatio));
    state.renderer.setSize(window.innerWidth, window.innerHeight);
    state.renderer.setClearColor(0x0a0e27, 1);

    const mount = document.getElementById('threejs-background');
    if (!mount) {
      console.error('Missing #threejs-background mount element.');
      return;
    }
    mount.appendChild(state.renderer.domElement);

    initStarField(state, config, env);
  }

  /**
   * Creates geometry, attributes, material, and Points mesh.
   * @param {StarfieldState} state
   * @param {StarConfig} config
   * @param {Env} env
   */
  function initStarField(state, config, env) {
    const count = env.starCount;

    const sizes = new Float32Array(count);
    const opacities = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const p = i * 3;

      state.pos[p] = (Math.random() - 0.5) * config.starField.fieldSize;
      state.pos[p + 1] = (Math.random() - 0.5) * config.starField.fieldSize;
      state.pos[p + 2] = (Math.random() - 0.5) * config.starField.fieldSize;

      state.vel[i] =
        config.starField.speedMin + Math.random() * config.starField.speedRange;

      const c = new THREE.Color();
      c.setHSL(
        Math.random() * config.starColor.hueRange + config.starColor.hueMin,
        config.starColor.saturation,
        Math.random() * config.starColor.lightnessRange + config.starColor.lightnessMin
      );

      state.color[p] = state.baseColor[p] = c.r;
      state.color[p + 1] = state.baseColor[p + 1] = c.g;
      state.color[p + 2] = state.baseColor[p + 2] = c.b;

      sizes[i] = config.starField.size;
      opacities[i] = config.starField.opacity;
    }

    state.geometry = new THREE.BufferGeometry();
    state.geometry.setAttribute('position', new THREE.BufferAttribute(state.pos, 3));
    state.geometry.setAttribute('color', new THREE.BufferAttribute(state.color, 3));
    state.geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    state.geometry.setAttribute('opacity', new THREE.BufferAttribute(opacities, 1));

    state.material = createStarMaterial(state);
    state.stars = new THREE.Points(state.geometry, state.material);
    state.scene.add(state.stars);
  }

  /**
   * Creates the shader material for star points.
   * @param {StarfieldState} state
   * @returns {THREE.ShaderMaterial}
   */
  function createStarMaterial(state) {
    return new THREE.ShaderMaterial({
      uniforms: {
        pixelRatio: { value: state.renderer.getPixelRatio() },
      },
      vertexShader: `
        attribute float size;
        attribute float opacity;
        attribute vec3 color;
        varying vec3 vColor;
        varying float vOpacity;
        uniform float pixelRatio;

        void main() {
          vColor = color;
          vOpacity = opacity;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * pixelRatio * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vOpacity;

        void main() {
          float dist = length(gl_PointCoord - vec2(0.5));
          if (dist > 0.5) discard;

          float alpha = (1.0 - dist * 2.0) * vOpacity;
          gl_FragColor = vec4(vColor, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
  }

  /**
   * Starts the requestAnimationFrame loop.
   * @param {StarfieldState} state
   * @param {StarConfig} config
   * @param {Env} env
   */
  function startLoop(state, config, env) {
    requestAnimationFrame(function frame() {
      requestAnimationFrame(frame);

      const now = performance.now();
      const dt = state.clock.getDelta();

      updateStars(state, config, env, dt, now);

      if (!env.prefersReducedMotion) {
        updateCameraParallax(state, config);
      }

      if (shouldPerformRaycast(state, config, env, now)) {
        performRaycast(state, config);
        state.lastRaycastAt = now;
        state.mouseMoved = false;
      }

      state.renderer.render(state.scene, state.camera);
    });
  }

  /**
   * Updates camera position based on mouse input.
   * @param {StarfieldState} state
   * @param {StarConfig} config
   */
  function updateCameraParallax(state, config) {
    state.camX += (state.mouseX - state.camX) * config.parallax.smoothing;
    state.camY += (-state.mouseY - state.camY) * config.parallax.smoothing;

    state.camera.position.x = state.camX * config.camera.parallaxFactor;
    state.camera.position.y = state.camY * config.camera.parallaxFactor;
  }

  /**
   * Determines if raycasting should run.
   * @param {StarfieldState} state
   * @param {StarConfig} config
   * @param {Env} env
   * @param {number} now
   * @returns {boolean}
   */
  function shouldPerformRaycast(state, config, env, now) {
    if (!env.shouldRaycast) return false;
    if (!state.mouseMoved) return false;
    return now - state.lastRaycastAt > config.raycasting.throttleMs;
  }

  /**
   * Updates star positions and visual attributes.
   * @param {StarfieldState} state
   * @param {StarConfig} config
   * @param {Env} env
   * @param {number} dt
   * @param {number} now
   */
  function updateStars(state, config, env, dt, now) {
    const step = env.isMobile
      ? config.performance.mobileUpdateInterval
      : config.performance.desktopUpdateInterval;

    const sizes = /** @type {Float32Array} */ (state.geometry.attributes.size.array);
    const opacities = /** @type {Float32Array} */ (state.geometry.attributes.opacity.array);

    for (let i = 0; i < env.starCount; i += step) {
      const p = i * 3;

      if (state.falling[i]) {
        updateFallingStar(state, config, i, p);
        continue;
      }

      if (!state.exploded[i]) {
        updateNormalStar(state, config, env, i, p, dt);
        continue;
      }

      updateExplodingStar(state, config, i, p, sizes, opacities, now);
    }

    markGeometryDirty(state);
  }

  /**
   * Updates a normal star (forward motion, possible falling transition, respawn).
   * @param {StarfieldState} state
   * @param {StarConfig} config
   * @param {Env} env
   * @param {number} i
   * @param {number} p
   * @param {number} dt
   */
  function updateNormalStar(state, config, env, i, p, dt) {
    state.pos[p + 2] += state.vel[i] * dt * config.starField.velocityMultiplier;

    if (shouldCreateFallingStar(env, config)) {
      createFallingStar(state, i, p);
    }

    if (state.pos[p + 2] > config.camera.far) {
      resetStar(state, config, i);
    }
  }

  /**
   * Updates a falling star and resets it if it leaves bounds.
   * @param {StarfieldState} state
   * @param {StarConfig} config
   * @param {number} i
   * @param {number} p
   */
  function updateFallingStar(state, config, i, p) {
    state.pos[p + 1] -= config.fallingStar.speed;
    state.pos[p + 2] += config.fallingStar.speed;

    if (isStarOutOfBounds(state, config, p)) {
      resetFallingStar(state, config, i);
    }
  }

  /**
   * Updates an exploding star using stored explosion data.
   * @param {StarfieldState} state
   * @param {StarConfig} config
   * @param {number} i
   * @param {number} p
   * @param {Float32Array} sizes
   * @param {Float32Array} opacities
   * @param {number} now
   */
  function updateExplodingStar(state, config, i, p, sizes, opacities, now) {
    const stride = config.explosionData.size;
    const base = i * stride;
    const idx = config.explosionData.indices;

    state.pos[p] += state.explosionData[base + idx.vx];
    state.pos[p + 1] += state.explosionData[base + idx.vy];
    state.pos[p + 2] += state.explosionData[base + idx.vz];

    state.explosionData[base + idx.vx] *= config.explosion.velocityDecay;
    state.explosionData[base + idx.vy] *= config.explosion.velocityDecay;
    state.explosionData[base + idx.vz] *= config.explosion.velocityDecay;

    const t = (now - state.explosionData[base + idx.startTime]) / config.explosion.durationMs;

    state.color[p] = THREE.MathUtils.lerp(
      state.explosionData[base + idx.colorR],
      state.baseColor[p],
      t
    );
    state.color[p + 1] = THREE.MathUtils.lerp(
      state.explosionData[base + idx.colorG],
      state.baseColor[p + 1],
      t
    );
    state.color[p + 2] = THREE.MathUtils.lerp(
      state.explosionData[base + idx.colorB],
      state.baseColor[p + 2],
      t
    );

    const scale = state.explosionData[base + idx.scale] * config.explosion.scaleDecay;
    state.explosionData[base + idx.scale] = scale;

    sizes[i] = scale;
    opacities[i] = scale / config.explosion.opacityDivisor;

    if (now - state.explosionData[base + idx.startTime] > config.explosion.durationMs) {
      resetStar(state, config, i);
    }
  }

  /**
   * Marks geometry attributes as changed.
   * @param {StarfieldState} state
   */
  function markGeometryDirty(state) {
    state.geometry.attributes.position.needsUpdate = true;
    state.geometry.attributes.color.needsUpdate = true;
    state.geometry.attributes.size.needsUpdate = true;
    state.geometry.attributes.opacity.needsUpdate = true;
  }

  /**
   * Checks bounds for falling behavior.
   * @param {StarfieldState} state
   * @param {StarConfig} config
   * @param {number} p
   * @returns {boolean}
   */
  function isStarOutOfBounds(state, config, p) {
    return state.pos[p + 1] < -config.camera.far || state.pos[p + 2] > config.camera.far;
  }

  /**
   * Whether a normal star should become a falling star.
   * @param {Env} env
   * @param {StarConfig} config
   * @returns {boolean}
   */
  function shouldCreateFallingStar(env, config) {
    if (env.isMobile) return false;
    if (env.prefersReducedMotion) return false;
    return Math.random() < config.fallingStar.probability;
  }

  /**
   * Starts falling-star state and sets color.
   * @param {StarfieldState} state
   * @param {number} i
   * @param {number} p
   */
  function createFallingStar(state, i, p) {
    state.falling[i] = 1;
    state.color[p] = state.FALLING_COLOR.r;
    state.color[p + 1] = state.FALLING_COLOR.g;
    state.color[p + 2] = state.FALLING_COLOR.b;
  }

  /**
   * Resets a falling star back to normal, restores base color.
   * @param {StarfieldState} state
   * @param {StarConfig} config
   * @param {number} i
   */
  function resetFallingStar(state, config, i) {
    state.falling[i] = 0;

    const p = i * 3;
    state.pos[p] = (Math.random() - 0.5) * config.starField.fieldSize;
    state.pos[p + 1] = (Math.random() - 0.5) * config.starField.fieldSize;
    state.pos[p + 2] = -config.camera.far;

    state.color[p] = state.baseColor[p];
    state.color[p + 1] = state.baseColor[p + 1];
    state.color[p + 2] = state.baseColor[p + 2];
  }

  /**
   * Resets any star back to initial state.
   * @param {StarfieldState} state
   * @param {StarConfig} config
   * @param {number} i
   */
  function resetStar(state, config, i) {
    const p = i * 3;

    state.pos[p] = (Math.random() - 0.5) * config.starField.fieldSize;
    state.pos[p + 1] = (Math.random() - 0.5) * config.starField.fieldSize;
    state.pos[p + 2] = -config.camera.far;

    state.exploded[i] = 0;

    const sizes = /** @type {Float32Array} */ (state.geometry.attributes.size.array);
    const opacities = /** @type {Float32Array} */ (state.geometry.attributes.opacity.array);
    sizes[i] = config.starField.size;
    opacities[i] = config.starField.opacity;

    state.color[p] = state.baseColor[p];
    state.color[p + 1] = state.baseColor[p + 1];
    state.color[p + 2] = state.baseColor[p + 2];
  }

  /**
   * Raycasts against the points cloud and explodes the first hit.
   * @param {StarfieldState} state
   * @param {StarConfig} config
   */
  function performRaycast(state, config) {
    state.raycaster.setFromCamera(state.mouse, state.camera);
    state.raycaster.params.Points.threshold = config.raycasting.threshold;

    const hits = state.raycaster.intersectObject(state.stars);
    if (hits.length > 0) explodeStar(state, config, hits[0].index);
  }

  /**
   * Starts an explosion for a star.
   * @param {StarfieldState} state
   * @param {StarConfig} config
   * @param {number} i
   */
  function explodeStar(state, config, i) {
    if (state.exploded[i]) return;
    state.exploded[i] = 1;

    const p = i * 3;
    const stride = config.explosionData.size;
    const base = i * stride;
    const idx = config.explosionData.indices;

    state.explosionData[base + idx.vx] = (Math.random() - 0.5) * config.explosion.speed;
    state.explosionData[base + idx.vy] = (Math.random() - 0.5) * config.explosion.speed;
    state.explosionData[base + idx.vz] = (Math.random() - 0.5) * config.explosion.speed;

    state.explosionData[base + idx.scale] = config.explosion.size;
    state.explosionData[base + idx.startTime] = performance.now();

    state.explosionData[base + idx.colorR] = state.EXPLOSION_COLOR.r;
    state.explosionData[base + idx.colorG] = state.EXPLOSION_COLOR.g;
    state.explosionData[base + idx.colorB] = state.EXPLOSION_COLOR.b;

    state.color[p] = state.EXPLOSION_COLOR.r;
    state.color[p + 1] = state.EXPLOSION_COLOR.g;
    state.color[p + 2] = state.EXPLOSION_COLOR.b;

    const sizes = /** @type {Float32Array} */ (state.geometry.attributes.size.array);
    const opacities = /** @type {Float32Array} */ (state.geometry.attributes.opacity.array);
    sizes[i] = config.explosion.size;
    opacities[i] = 1.0;
  }

  /**
   * Installs mousemove and resize handlers.
   * @param {StarfieldState} state
   * @param {StarConfig} config
   * @param {Env} env
   */
  function addEventListeners(state, config, env) {
    if (!env.isMobile) {
      document.addEventListener('mousemove', (e) => handleMouseMove(state, e), {
        passive: true,
      });
    }
    window.addEventListener('resize', () => handleResize(state, config));
  }

  /**
   * Updates mouse input for parallax and raycasting.
   * @param {StarfieldState} state
   * @param {MouseEvent} e
   */
  function handleMouseMove(state, e) {
    state.mouseX = e.clientX - window.innerWidth / 2;
    state.mouseY = e.clientY - window.innerHeight / 2;

    state.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    state.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

    state.mouseMoved = true;
  }

  /**
   * Debounced resize handler.
   * @param {StarfieldState} state
   * @param {StarConfig} config
   */
  function handleResize(state, config) {
    clearTimeout(handleResize._t);
    handleResize._t = setTimeout(() => {
      state.renderer.setSize(window.innerWidth, window.innerHeight);
      state.camera.aspect = window.innerWidth / window.innerHeight;
      state.camera.updateProjectionMatrix();
    }, config.performance.resizeDebounceMs);
  }
})();
