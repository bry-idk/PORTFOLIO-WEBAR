import {
  GLSL_NOISE,
  createCanvasTexture,
  disposeObject3D,
  easeOutCubic
} from '../shared.js';

/**
 * Experiencia AR — Target 4 (Indice 3 en targets.mind)
 * CUATRO TELEVISORES CRT // INSTALACION AUDIOVISUAL
 *
 * Instalacion espacial de 4 televisores CRT esculpidos (carcasas moldeadas,
 * tubos posteriores, perillas, LEDs, bastidores y cables conectados), cada uno
 * con un shader GLSL independiente: curvatura de tubo, mascara RGB, scanlines,
 * aberracion cromatica, glitch digital, ruido estatico e interferencias.
 */
export function createCRTInstallationExperience(THREE) {
  const root = new THREE.Group();
  root.name = 'CRTInstallationExperience';

  const stage = new THREE.Group();
  stage.position.set(0, -0.33, 0.34);
  root.add(stage);

  let seed = 9404;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };

  /* =========================================================================
     1. ILUMINACION AMBIENTAL Y LUCES DE PANTALLA SINCRONIZADAS
  ========================================================================= */
  const lights = [];

  const hemiLight = new THREE.HemisphereLight(0x6688aa, 0x0b0a14, 0.72);
  hemiLight.userData.baseIntensity = 0.72;
  stage.add(hemiLight);
  lights.push(hemiLight);

  const gallerySpot = new THREE.DirectionalLight(0xbcd8ff, 1.45);
  gallerySpot.userData.baseIntensity = 1.45;
  gallerySpot.position.set(0.35, 1.05, 0.65);
  gallerySpot.castShadow = true;
  gallerySpot.shadow.mapSize.set(512, 512);
  gallerySpot.shadow.camera.near = 0.2;
  gallerySpot.shadow.camera.far = 2.5;
  gallerySpot.shadow.camera.left = -0.6;
  gallerySpot.shadow.camera.right = 0.6;
  gallerySpot.shadow.camera.top = 0.6;
  gallerySpot.shadow.camera.bottom = -0.6;
  gallerySpot.shadow.bias = -0.002;
  gallerySpot.target.position.set(0, 0.14, 0);
  stage.add(gallerySpot, gallerySpot.target);
  lights.push(gallerySpot);

  // Tres PointLights frente al cluster CRT que parpadean con la señal de las pantallas
  const crtLightCyan = new THREE.PointLight(0x00e5ff, 0.95, 1.05, 1.8);
  crtLightCyan.userData.baseIntensity = 0.95;
  crtLightCyan.position.set(-0.18, 0.18, 0.24);

  const crtLightMagenta = new THREE.PointLight(0xff2a9d, 0.95, 1.05, 1.8);
  crtLightMagenta.userData.baseIntensity = 0.95;
  crtLightMagenta.position.set(0.06, 0.34, 0.20);

  const crtLightGreen = new THREE.PointLight(0x28ff88, 0.85, 1.05, 1.8);
  crtLightGreen.userData.baseIntensity = 0.85;
  crtLightGreen.position.set(0.22, 0.14, 0.24);

  stage.add(crtLightCyan, crtLightMagenta, crtLightGreen);
  lights.push(crtLightCyan, crtLightMagenta, crtLightGreen);

  /* =========================================================================
     2. PLINTO DE GALERIA TECNOLOGICA, SOPORTES Y CABLES
  ========================================================================= */
  const floorTex = createCanvasTexture(
    THREE,
    512,
    512,
    (ctx, w, h) => {
      ctx.fillStyle = '#0c0d13';
      ctx.fillRect(0, 0, w, h);

      // Baldosas hexagonales / grilla sutil (guiño a target4.png)
      ctx.strokeStyle = 'rgba(0, 229, 255, 0.10)';
      ctx.lineWidth = 2;
      const step = 32;
      for (let x = 0; x <= w; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y <= h; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Vignette oscuro en bordes
      const vig = ctx.createRadialGradient(w * 0.5, h * 0.5, w * 0.1, w * 0.5, h * 0.5, w * 0.55);
      vig.addColorStop(0, 'rgba(0,0,0,0)');
      vig.addColorStop(1, 'rgba(4,5,8,0.85)');
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, w, h);
    },
    { srgb: true }
  );

  const plinthGeo = new THREE.BoxGeometry(0.76, 0.032, 0.46);
  const plinthMat = new THREE.MeshStandardMaterial({
    map: floorTex,
    roughness: 0.26,
    metalness: 0.42
  });
  const plinth = new THREE.Mesh(plinthGeo, plinthMat);
  plinth.position.y = -0.016;
  plinth.receiveShadow = true;
  stage.add(plinth);

  // Rieles de aluminio negro para sostener los CRT superiores
  const metalRackMat = new THREE.MeshStandardMaterial({
    color: 0x1a1d26,
    roughness: 0.35,
    metalness: 0.85
  });
  const rackPosts = [
    [-0.22, 0.14, -0.11, 0.28],
    [0.04, 0.13, -0.09, 0.26],
    [0.14, 0.13, -0.09, 0.26]
  ];
  for (const [rx, ry, rz, rh] of rackPosts) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.01, rh, 10), metalRackMat);
    post.position.set(rx, ry, rz);
    post.castShadow = true;
    stage.add(post);
  }
  const crossBar = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.34, 8), metalRackMat);
  crossBar.rotation.z = Math.PI / 2;
  crossBar.position.set(-0.06, 0.23, -0.10);
  stage.add(crossBar);

  // Tiras de iluminacion inteligente (Smart Lighting) en bordes del plinto y rack
  const smartLedMatA = new THREE.MeshBasicMaterial({ color: 0x00e5ff, transparent: true, opacity: 0.9 });
  const smartLedMatB = new THREE.MeshBasicMaterial({ color: 0xff2a9d, transparent: true, opacity: 0.9 });
  const stripFront = new THREE.Mesh(new THREE.BoxGeometry(0.74, 0.006, 0.006), smartLedMatA);
  stripFront.position.set(0, 0.002, 0.228);
  const stripRack = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.004, 0.005), smartLedMatB);
  stripRack.position.set(-0.06, 0.238, -0.095);
  const stripLeft = new THREE.Mesh(new THREE.BoxGeometry(0.006, 0.006, 0.44), smartLedMatB);
  stripLeft.position.set(-0.378, 0.002, 0);
  const stripRight = new THREE.Mesh(new THREE.BoxGeometry(0.006, 0.006, 0.44), smartLedMatA);
  stripRight.position.set(0.378, 0.002, 0);
  stage.add(stripFront, stripRack, stripLeft, stripRight);

  // Modulos mecanicos animados (engranajes + pistones lineales de REMINISCENCIA)
  const knobMat = new THREE.MeshStandardMaterial({
    color: 0x9aa2b4,
    roughness: 0.28,
    metalness: 0.85
  });
  const brassMechMat = new THREE.MeshStandardMaterial({
    color: 0xb89658,
    roughness: 0.28,
    metalness: 0.88
  });
  const gears = [];
  function createGear(radius, teeth, mat) {
    const g = new THREE.Group();
    const rim = new THREE.Mesh(new THREE.TorusGeometry(radius, radius * 0.18, 8, 24), mat);
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.28, radius * 0.28, radius * 0.35, 12), mat);
    hub.rotation.x = Math.PI / 2;
    g.add(rim, hub);
    const toothGeo = new THREE.BoxGeometry(radius * 0.24, radius * 0.32, radius * 0.28);
    for (let i = 0; i < teeth; i++) {
      const a = (i / teeth) * Math.PI * 2;
      const tooth = new THREE.Mesh(toothGeo, mat);
      tooth.position.set(Math.cos(a) * (radius + radius * 0.16), Math.sin(a) * (radius + radius * 0.16), 0);
      tooth.rotation.z = a + Math.PI / 2;
      g.add(tooth);
    }
    return g;
  }

  const gearSpecs = [
    { x: -0.02, y: 0.145, z: -0.055, r: 0.032, t: 10, dir: 1, mat: knobMat },
    { x: 0.035, y: 0.185, z: -0.055, r: 0.022, t: 8, dir: -1.45, mat: brassMechMat },
    { x: -0.072, y: 0.175, z: -0.055, r: 0.024, t: 8, dir: -1.35, mat: brassMechMat }
  ];
  for (const gs of gearSpecs) {
    const gear = createGear(gs.r, gs.t, gs.mat);
    gear.position.set(gs.x, gs.y, gs.z);
    gear.userData.dir = gs.dir;
    stage.add(gear);
    gears.push(gear);
  }

  // Dos actuadores / pistones lineales en el soporte derecho
  const pistons = [];
  [0.145, 0.175].forEach((px, idx) => {
    const sleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.009, 0.075, 10), metalRackMat);
    sleeve.position.set(px, 0.075, -0.07);
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.085, 8), knobMat);
    rod.position.set(px, 0.12, -0.07);
    rod.userData = { baseY: 0.12, phase: idx * Math.PI };
    stage.add(sleeve, rod);
    pistons.push(rod);
  });

  // Cables de señal conectados entre los televisores y la base
  const cableMat = new THREE.MeshStandardMaterial({
    color: 0x101218,
    roughness: 0.65,
    metalness: 0.2
  });
  const cablePaths = [
    [
      new THREE.Vector3(-0.22, 0.08, -0.06),
      new THREE.Vector3(-0.28, 0.01, 0.04),
      new THREE.Vector3(-0.08, 0.006, 0.14),
      new THREE.Vector3(0.16, 0.01, 0.08),
      new THREE.Vector3(0.20, 0.07, -0.05)
    ],
    [
      new THREE.Vector3(0.04, 0.28, -0.18),
      new THREE.Vector3(0.08, 0.14, -0.21),
      new THREE.Vector3(-0.05, 0.008, -0.15),
      new THREE.Vector3(-0.21, 0.07, -0.06)
    ],
    [
      new THREE.Vector3(-0.20, 0.29, -0.19),
      new THREE.Vector3(-0.33, 0.15, -0.14),
      new THREE.Vector3(-0.32, 0.008, 0.02)
    ]
  ];
  for (const pts of cablePaths) {
    const curve = new THREE.CatmullRomCurve3(pts);
    const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 22, 0.0055, 6, false), cableMat);
    tube.castShadow = true;
    stage.add(tube);
  }

  /* =========================================================================
     3. SHADERS GLSL INDEPENDIENTES PARA CADA UNO DE LOS 4 TELEVISORES CRT
  ========================================================================= */
  function createCRTScreenMaterial(channelIndex) {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uReveal: { value: 0 },
        uChannel: { value: channelIndex }
      },
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        varying vec3 vNormalView;
        varying vec3 vViewPos;
        void main() {
          vUv = uv;
          vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
          vNormalView = normalize(normalMatrix * normal);
          vViewPos = -mvPos.xyz;
          gl_Position = projectionMatrix * mvPos;
        }
      `,
      fragmentShader: /* glsl */ `
        uniform float uTime;
        uniform float uReveal;
        uniform float uChannel;
        varying vec2 vUv;
        varying vec3 vNormalView;
        varying vec3 vViewPos;
        ${GLSL_NOISE}

        // Curvatura optica de tubo CRT
        vec2 crtDistort(vec2 uv) {
          vec2 c = uv * 2.0 - 1.0;
          vec2 offset = abs(c.yx) / vec2(4.4, 3.8);
          c = c + c * offset * offset;
          return c * 0.5 + 0.5;
        }

        // Canal 0: Tunel/pilares Checker Vortex (guiño a target4.png)
        vec3 channelCheckerVortex(vec2 uv, float t) {
          vec2 p = uv - 0.5;
          float r = max(length(p), 0.025);
          float ang = atan(p.y, p.x);
          float depth = 0.42 / r + t * 1.45;
          float colGrid = floor(mod((ang / 3.14159265) * 6.0 + sin(t * 0.8) * 0.8, 2.0));
          float rowGrid = floor(mod(depth * 2.4, 2.0));
          float checker = abs(colGrid - rowGrid);

          vec3 darkCol = vec3(0.04, 0.03, 0.09);
          vec3 violetCol = vec3(0.46, 0.25, 0.98);
          vec3 cyanCol = vec3(0.05, 0.92, 1.0);
          vec3 base = mix(darkCol, mix(violetCol, cyanCol, 0.5 + 0.5 * sin(depth)), checker);

          // Centro luminoso pulsante + artefactos de bloque
          float centerGlow = exp(-r * 7.5);
          base += cyanCol * centerGlow * 1.1;
          return base * smoothstep(0.02, 0.25, r + 0.12);
        }

        // Canal 1: Osciloscopio de fosforo verde con Lissajous + H-Sync roll
        vec3 channelOscilloscope(vec2 uv, float t) {
          // Ocasional perdida de sincronia vertical
          float rollTrig = step(0.84, fract(t * 0.19));
          uv.y = fract(uv.y + rollTrig * fract(t * 2.8) * 0.35);

          vec3 bg = vec3(0.01, 0.055, 0.03);
          // Grilla calibrada
          vec2 grid = abs(fract(uv * vec2(10.0, 8.0) - 0.5) - 0.5) / 0.05;
          float gridLine = 1.0 - min(min(grid.x, grid.y), 1.0);
          bg += vec3(0.02, 0.22, 0.10) * gridLine * 0.45;

          // Doble trazo de onda harmonica
          float wave1 = 0.5 + 0.24 * sin(uv.x * 16.0 - t * 6.5) * cos(uv.x * 4.0 + t * 2.1);
          float wave2 = 0.5 + 0.14 * sin(uv.x * 29.0 + t * 9.0 + sin(t * 3.0));
          float d1 = abs(uv.y - wave1);
          float d2 = abs(uv.y - wave2);

          float glow1 = exp(-d1 * 48.0);
          float glow2 = exp(-d2 * 36.0);
          vec3 traceCol = vec3(0.2, 1.0, 0.55) * glow1 * 1.35 + vec3(0.65, 1.0, 0.85) * glow2 * 0.7;

          // Pulso circular radar en esquina
          float blip = exp(-length(uv - vec2(0.82, 0.78)) * 22.0) * (0.5 + 0.5 * sin(t * 8.0));
          return bg + traceCol + vec3(0.3, 1.0, 0.5) * blip;
        }

        // Canal 2: Barras SMPTE deconstruidas + onda Degauss + VHS tracking
        vec3 channelBroadcast(vec2 uv, float t) {
          // Onda de desmagnetizacion periodica
          float degauss = pow(max(0.0, sin(t * 0.9)), 8.0);
          float dist = length(uv - 0.5);
          uv += normalize(uv - 0.5 + 0.0001) * sin(dist * 26.0 - t * 14.0) * 0.045 * degauss;

          // Banda de tracking VHS subiendo
          float vhsY = fract(t * 0.28);
          float vhsBand = smoothstep(0.09, 0.0, abs(uv.y - vhsY));
          uv.x += (hash21(vec2(floor(uv.y * 90.0), floor(t * 30.0))) - 0.5) * 0.12 * vhsBand;

          float barIdx = floor(clamp(uv.x, 0.0, 0.999) * 6.0);
          vec3 c0 = vec3(0.92, 0.95, 1.0);
          vec3 c1 = vec3(1.0, 0.82, 0.15);
          vec3 c2 = vec3(0.0, 0.92, 1.0);
          vec3 c3 = vec3(0.18, 0.98, 0.45);
          vec3 c4 = vec3(0.98, 0.16, 0.62);
          vec3 c5 = vec3(0.42, 0.22, 0.95);

          vec3 col = c0;
          if (barIdx > 0.5) col = c1;
          if (barIdx > 1.5) col = c2;
          if (barIdx > 2.5) col = c3;
          if (barIdx > 3.5) col = c4;
          if (barIdx > 4.5) col = c5;

          // Seccion inferior con pulso sinusoidal y nieve
          if (uv.y < 0.26) {
            float sub = 0.5 + 0.5 * sin(uv.x * 38.0 + t * 5.0);
            col = mix(vec3(0.06, 0.04, 0.12), vec3(0.95, 0.35, 0.7), sub);
          }

          col = mix(col, vec3(hash21(uv * 160.0 + t)), vhsBand * 0.72);
          col *= 0.85 + 0.2 * degauss;
          return col;
        }

        // Canal 3: Pasillo liminal arquitectonico + baldosas hexagonales + glitch (guiño a target4.png)
        vec3 channelCyberTopo(vec2 uv, float t) {
          float sliceSeed = floor(uv.y * 16.0);
          float glitchGate = step(0.80, hash21(vec2(sliceSeed, floor(t * 5.2))));
          uv.x += (hash21(vec2(sliceSeed, t * 2.1)) - 0.5) * 0.16 * glitchGate;

          vec2 p = uv - 0.5;
          float ax = max(abs(p.x), 0.025);
          float ay = max(abs(p.y), 0.025);

          // Perspectiva de corredor arquitectonico
          float isFloor = step(abs(p.x) * 0.85, -p.y);
          float isWall = step(abs(p.y) * 1.15, abs(p.x));
          float depth = 0.24 / max(max(ax * 0.9, ay), 0.03);

          // Baldosas en suelo y scanlines en muros
          vec2 floorUv = vec2(p.x / max(-p.y, 0.04) * 3.0, depth * 2.4 - t * 0.9);
          float hexTile = smoothstep(0.08, 0.16, abs(fract(floorUv.x) - 0.5)) *
                          smoothstep(0.08, 0.16, abs(fract(floorUv.y) - 0.5));
          float wallLines = 0.55 + 0.45 * sin(uv.y * 120.0 + depth * 2.0);

          vec3 warmWall = vec3(0.55, 0.46, 0.34) * wallLines;
          vec3 warmFloor = mix(vec3(0.18, 0.11, 0.06), vec3(0.72, 0.50, 0.24), hexTile);
          vec3 hall = mix(warmWall, warmFloor, isFloor);
          hall = mix(hall, vec3(0.32, 0.28, 0.22), (1.0 - isFloor) * (1.0 - isWall));

          // Portal de luz blanca-cyan al fondo del corredor + acento cyber
          float portal = exp(-length(p) * 6.5);
          vec3 portalCol = mix(vec3(1.0, 0.96, 0.88), vec3(0.25, 0.95, 1.0), 0.35 + 0.35 * sin(t * 1.6));
          hall += portalCol * portal * 1.3;

          // Pulso sutil de contorno magenta-cyan en glitches
          float n = fbm2D(uv * 5.0 + t * 0.2);
          hall = mix(hall, vec3(1.0, 0.2, 0.65) * n * 1.4, glitchGate * 0.45);
          return hall;
        }

        vec3 sampleChannel(vec2 uv, float t, float ch) {
          if (ch < 0.5) return channelCheckerVortex(uv, t);
          if (ch < 1.5) return channelOscilloscope(uv, t);
          if (ch < 2.5) return channelBroadcast(uv, t);
          return channelCyberTopo(uv, t);
        }

        void main() {
          vec2 cuv = crtDistort(vUv);

          // Mascara redondeada del bisel del tubo CRT
          if (cuv.x < 0.0 || cuv.x > 1.0 || cuv.y < 0.0 || cuv.y > 1.0) {
            gl_FragColor = vec4(0.015, 0.015, 0.02, uReveal);
            return;
          }

          float t = uTime + uChannel * 7.31;

          // Rafagas de glitch digital periodico independiente por televisor
          float burstNoise = hash21(vec2(floor(t * 3.2), uChannel * 11.0));
          float glitchBurst = smoothstep(0.76, 0.98, burstNoise);
          float rowTear = hash21(vec2(floor(cuv.y * 28.0), floor(t * 18.0))) - 0.5;
          vec2 gUv = cuv;
          gUv.x += rowTear * 0.14 * glitchBurst;

          // Aberracion cromatica RGB (base + pico en glitch)
          float chromaAmt = 0.006 + 0.026 * glitchBurst;
          float r = sampleChannel(gUv + vec2(chromaAmt, 0.0), t, uChannel).r;
          float g = sampleChannel(gUv, t, uChannel).g;
          float b = sampleChannel(gUv - vec2(chromaAmt, 0.0), t, uChannel).b;
          vec3 col = vec3(r, g, b);

          // Ruido estatico analogico (nieve) en transiciones de senal
          float staticWave = pow(max(0.0, sin(t * 0.72 + uChannel * 1.9)), 10.0);
          float snow = hash21(gUv * vec2(220.0, 140.0) + fract(t * 19.0));
          col = mix(col, vec3(snow), 0.08 + 0.55 * staticWave);

          // Scanlines CRT horizontales y subpixeles RGB
          float scanline = 0.78 + 0.22 * sin(cuv.y * 190.0 + t * 3.0);
          float triad = 0.88 + 0.12 * sin(cuv.x * 260.0);
          col *= scanline * triad;

          // Vignette en esquinas del tubo + reflejo sutil Fresnel de vidrio
          vec2 vigVec = cuv * (1.0 - cuv.yx);
          float vig = pow(max(vigVec.x * vigVec.y * 15.0, 0.0), 0.24);
          col *= vig;

          float glassFresnel = pow(1.0 - abs(dot(normalize(vNormalView), normalize(vViewPos))), 3.0);
          col += vec3(0.35, 0.45, 0.65) * glassFresnel * 0.26;

          gl_FragColor = vec4(col * (1.08 + 0.25 * glitchBurst), uReveal);
        }
      `,
      transparent: true
    });
  }

  /* =========================================================================
     4. CONSTRUCCION DE LOS 4 TELEVISORES CRT ESCULPIDOS
  ========================================================================= */
  const casingMat = new THREE.MeshStandardMaterial({
    color: 0x22252f,
    roughness: 0.48,
    metalness: 0.35
  });
  const bezelDarkMat = new THREE.MeshStandardMaterial({
    color: 0x0d0f14,
    roughness: 0.36,
    metalness: 0.5
  });

  // Geometria de pantalla curvada reutilizable
  const screenW = 0.165;
  const screenH = 0.128;
  const curvedScreenGeo = new THREE.PlaneGeometry(screenW, screenH, 16, 12);
  const sp = curvedScreenGeo.attributes.position;
  for (let i = 0; i < sp.count; i++) {
    const sx = sp.getX(i) / (screenW * 0.5);
    const sy = sp.getY(i) / (screenH * 0.5);
    const bulge = Math.max(0, 1 - (sx * sx * 0.42 + sy * sy * 0.42)) * 0.016;
    sp.setZ(i, bulge);
  }
  curvedScreenGeo.computeVertexNormals();

  const screenMaterials = [];
  const beamGeo = new THREE.CylinderGeometry(0.145, 0.075, 0.18, 16, 1, true);
  beamGeo.rotateX(Math.PI / 2);
  beamGeo.translate(0, 0, 0.09);

  function createScreenBeamMaterial(colorHex) {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uReveal: { value: 0 },
        uColor: { value: new THREE.Color(colorHex) }
      },
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        uniform float uTime;
        uniform float uReveal;
        uniform vec3 uColor;
        varying vec2 vUv;
        void main() {
          float fade = smoothstep(0.0, 0.22, vUv.y) * smoothstep(1.0, 0.08, vUv.y);
          float pulse = 0.78 + 0.22 * sin(uTime * 4.5 + vUv.x * 6.0);
          gl_FragColor = vec4(uColor, fade * pulse * 0.095 * uReveal);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide
    });
  }
  const beamMaterials = [];

  function createCRTUnit(channelIdx, ledColorHex) {
    const tv = new THREE.Group();

    // Carcasa frontal principal
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.185, 0.115), casingMat);
    body.castShadow = true;
    body.receiveShadow = true;
    tv.add(body);

    // Marco frontal biselado oscuro alrededor del tubo + panel derecho de controles
    const bezel = new THREE.Mesh(new THREE.BoxGeometry(0.185, 0.148, 0.022), bezelDarkMat);
    bezel.position.set(-0.016, 0.002, 0.052);
    tv.add(bezel);

    // Tubo trasero CRT estrechado (neck + yugo)
    const rearNeck = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.125, 0.095), casingMat);
    rearNeck.position.set(0, 0, -0.095);
    rearNeck.castShadow = true;
    tv.add(rearNeck);

    const yoke = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.052, 0.055, 14), bezelDarkMat);
    yoke.rotation.x = Math.PI / 2;
    yoke.position.set(0, 0, -0.155);
    tv.add(yoke);

    // Rejillas de ventilacion superiores
    for (let v = -2; v <= 2; v++) {
      const vent = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.004, 0.008), bezelDarkMat);
      vent.position.set(0, 0.094, -0.01 + v * 0.016);
      tv.add(vent);
    }

    // Antenas telescopicas en la unidad superior central
    if (channelIdx === 2) {
      [-1, 1].forEach((side) => {
        const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.0012, 0.0024, 0.13, 6), knobMat);
        ant.position.set(side * 0.035, 0.145, -0.01);
        ant.rotation.z = side * -0.42;
        tv.add(ant);
      });
    }

    // Perillas rotatorias analogicas + rejilla de parlante en panel derecho
    const knobGeo = new THREE.CylinderGeometry(0.011, 0.012, 0.014, 14);
    knobGeo.rotateX(Math.PI / 2);
    [0.038, 0.005].forEach((ky) => {
      const knob = new THREE.Mesh(knobGeo, knobMat);
      knob.position.set(0.096, ky, 0.06);
      tv.add(knob);
    });

    // LED de encendido luminoso
    const ledMat = new THREE.MeshBasicMaterial({ color: ledColorHex });
    const led = new THREE.Mesh(new THREE.SphereGeometry(0.0045, 8, 8), ledMat);
    led.position.set(0.096, -0.058, 0.058);
    tv.add(led);

    // Pantalla CRT curva con shader independiente
    const screenMat = createCRTScreenMaterial(channelIdx);
    screenMaterials.push(screenMat);
    const screen = new THREE.Mesh(curvedScreenGeo, screenMat);
    screen.position.set(-0.016, 0.002, 0.063);
    tv.add(screen);

    // Cono de proyeccion luminosa suave emanando de la pantalla
    const beamMat = createScreenBeamMaterial(ledColorHex);
    beamMaterials.push(beamMat);
    const beam = new THREE.Mesh(beamGeo, beamMat);
    beam.position.set(-0.016, 0.002, 0.068);
    tv.add(beam);

    return tv;
  }

  // Composicion espacial escultorica de los 4 televisores
  const crtSpecs = [
    { pos: [-0.21, 0.095, 0.07], rot: [0.0, 0.28, 0.0], scale: 1.06, led: 0x00e5ff },
    { pos: [0.21, 0.095, 0.05], rot: [0.0, -0.32, 0.0], scale: 1.02, led: 0x28ff88 },
    { pos: [0.04, 0.30, -0.06], rot: [0.06, -0.09, -0.03], scale: 1.14, led: 0xff2a9d },
    { pos: [-0.21, 0.305, -0.09], rot: [0.05, 0.25, 0.05], scale: 0.90, led: 0xffb833 }
  ];

  const crtUnits = crtSpecs.map((spec, idx) => {
    const unit = createCRTUnit(idx, spec.led);
    unit.position.set(spec.pos[0], spec.pos[1], spec.pos[2]);
    unit.rotation.set(spec.rot[0], spec.rot[1], spec.rot[2]);
    unit.scale.setScalar(spec.scale);
    unit.userData.baseY = spec.pos[1];
    stage.add(unit);
    return unit;
  });

  /* =========================================================================
     5. PARTICULAS IONIZADAS / ESTATICA FLOTANTE ALREDEDOR DE LOS CRT
  ========================================================================= */
  const sparkCount = 195;
  const spPos = new Float32Array(sparkCount * 3);
  const spPhase = new Float32Array(sparkCount);
  const spHue = new Float32Array(sparkCount);
  for (let i = 0; i < sparkCount; i++) {
    spPos[i * 3] = (rand() - 0.5) * 1.38;
    spPos[i * 3 + 1] = 0.02 + rand() * 0.72;
    spPos[i * 3 + 2] = (rand() - 0.5) * 0.75;
    spPhase[i] = rand() * Math.PI * 2;
    spHue[i] = rand();
  }
  const sparkGeo = new THREE.BufferGeometry();
  sparkGeo.setAttribute('position', new THREE.BufferAttribute(spPos, 3));
  sparkGeo.setAttribute('aPhase', new THREE.BufferAttribute(spPhase, 1));
  sparkGeo.setAttribute('aHue', new THREE.BufferAttribute(spHue, 1));

  const sparkMat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uReveal: { value: 0 }
    },
    vertexShader: /* glsl */ `
      uniform float uTime;
      attribute float aPhase;
      attribute float aHue;
      varying float vAlpha;
      varying float vHue;

      void main() {
        vec3 p = position;
        p.y += sin(uTime * 1.1 + aPhase) * 0.025;
        p.x += cos(uTime * 0.8 + aPhase * 1.4) * 0.018;
        vec4 mvPos = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mvPos;
        // Parpadeo electrico rapido
        float flicker = step(0.25, fract(sin(uTime * 6.0 + aPhase * 12.0) * 43.0));
        gl_PointSize = (8.0 + 4.0 * flicker) * (1.0 / max(-mvPos.z, 0.35));
        vAlpha = 0.35 + 0.55 * flicker;
        vHue = aHue;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uReveal;
      varying float vAlpha;
      varying float vHue;
      void main() {
        vec2 uv = gl_PointCoord - 0.5;
        // Micro pixel/cuadro digital suave
        float d = max(abs(uv.x), abs(uv.y));
        if (d > 0.42) discard;
        vec3 c1 = vec3(0.0, 0.9, 1.0);
        vec3 c2 = vec3(1.0, 0.18, 0.62);
        vec3 c3 = vec3(0.2, 1.0, 0.55);
        vec3 col = mix(c1, mix(c2, c3, step(0.55, vHue)), step(0.32, vHue));
        gl_FragColor = vec4(col, (1.0 - d * 1.8) * vAlpha * uReveal * 0.78);
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const sparks = new THREE.Points(sparkGeo, sparkMat);
  stage.add(sparks);

  /* =========================================================================
     6. UPDATE & DISPOSE
  ========================================================================= */
  function setActive(active) {
    root.visible = active;
    for (const l of lights) l.visible = active;
  }

  function update(dt, elapsed, revealProgress) {
    const rev = easeOutCubic(revealProgress);
    stage.scale.setScalar((0.76 + 0.24 * rev) * 1.34);
    stage.position.y = -0.33 - (1 - rev) * 0.06;

    for (const mat of screenMaterials) {
      mat.uniforms.uTime.value = elapsed;
      mat.uniforms.uReveal.value = rev;
    }
    for (const bm of beamMaterials) {
      bm.uniforms.uTime.value = elapsed;
      bm.uniforms.uReveal.value = rev;
    }
    sparkMat.uniforms.uTime.value = elapsed;
    sparkMat.uniforms.uReveal.value = rev;

    // Engranajes y actuadores mecanicos en movimiento sincronizado
    for (const gear of gears) {
      gear.rotation.z = elapsed * 0.9 * gear.userData.dir;
    }
    for (const rod of pistons) {
      rod.position.y = rod.userData.baseY + Math.sin(elapsed * 2.2 + rod.userData.phase) * 0.022;
    }

    // Iluminacion inteligente dinamica en tiras LED
    smartLedMatA.color.setHSL((0.52 + Math.sin(elapsed * 0.35) * 0.12 + 1) % 1, 0.95, 0.56);
    smartLedMatB.color.setHSL((0.90 + Math.cos(elapsed * 0.42) * 0.12 + 1) % 1, 0.95, 0.58);
    smartLedMatA.opacity = (0.6 + 0.35 * Math.sin(elapsed * 3.5)) * rev;
    smartLedMatB.opacity = (0.6 + 0.35 * Math.cos(elapsed * 3.1)) * rev;

    // Micro flotacion sutil de los monitores superiores para dar sensacion de instalacion viva
    crtUnits[2].position.y = crtUnits[2].userData.baseY + Math.sin(elapsed * 1.2) * 0.005;
    crtUnits[3].position.y = crtUnits[3].userData.baseY + Math.cos(elapsed * 1.1) * 0.006;

    // Parpadeo energetico en sincronia con interferencias
    const pCyan = 0.72 + 0.45 * Math.pow(0.5 + 0.5 * Math.sin(elapsed * 5.2), 3.0);
    const pMag = 0.72 + 0.45 * Math.pow(0.5 + 0.5 * Math.cos(elapsed * 4.4 + 1.1), 3.0);
    const pGreen = 0.72 + 0.45 * Math.pow(0.5 + 0.5 * Math.sin(elapsed * 6.3 + 2.4), 3.0);

    crtLightCyan.intensity = crtLightCyan.userData.baseIntensity * pCyan * rev;
    crtLightMagenta.intensity = crtLightMagenta.userData.baseIntensity * pMag * rev;
    crtLightGreen.intensity = crtLightGreen.userData.baseIntensity * pGreen * rev;
    hemiLight.intensity = hemiLight.userData.baseIntensity * rev;
    gallerySpot.intensity = gallerySpot.userData.baseIntensity * rev;
  }

  function dispose() {
    disposeObject3D(root);
  }

  setActive(false);

  return {
    root,
    setActive,
    update,
    dispose
  };
}
