import {
  GLSL_NOISE,
  createCanvasTexture,
  createSoftGlowTexture,
  createStarFlareTexture,
  disposeObject3D,
  easeOutCubic
} from '../shared.js';

/**
 * Experiencia AR — Target-Titulo (Indice 1 en targets.mind)
 * SPATIAL SYSTEMS // PORTADA INTERACTIVA 2026
 *
 * Representacion visual del concepto Spatial Systems:
 * hipercubo y prismas cristalinos anidados con shader de nebulosa interna y Fresnel,
 * nucleo estelar de 4 puntas, esferas de obsidiana iridiscente, anillos de telemetria,
 * cinta galactica de 260 particulas, pixeles arquitectonicos y reticula espacial holografica.
 */
export function createSpatialSystemsExperience(THREE) {
  const root = new THREE.Group();
  root.name = 'SpatialSystemsExperience';

  const stage = new THREE.Group();
  stage.position.set(0, 0.0, 0.34);
  root.add(stage);

  let seed = 2026;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };

  /* =========================================================================
     1. ILUMINACION ESPACIAL DE CONTRASTE ALTO
  ========================================================================= */
  const lights = [];

  const hemiLight = new THREE.HemisphereLight(0xd4b8ff, 0x0b0e18, 1.0);
  hemiLight.userData.baseIntensity = 1.0;
  stage.add(hemiLight);
  lights.push(hemiLight);

  const keyLight = new THREE.DirectionalLight(0xf3ebff, 2.0);
  keyLight.userData.baseIntensity = 2.0;
  keyLight.position.set(-0.5, 0.9, 0.75);
  stage.add(keyLight);
  lights.push(keyLight);

  const violetRim = new THREE.DirectionalLight(0x8b5cf6, 1.6);
  violetRim.userData.baseIntensity = 1.6;
  violetRim.position.set(0.65, -0.3, -0.6);
  stage.add(violetRim);
  lights.push(violetRim);

  const coreLight = new THREE.PointLight(0xb874ff, 1.35, 1.1, 1.8);
  coreLight.userData.baseIntensity = 1.35;
  coreLight.position.set(0, 0.04, 0.05);
  stage.add(coreLight);
  lights.push(coreLight);

  const emeraldAccentLight = new THREE.PointLight(0x00ff88, 0.55, 0.85, 2.0);
  emeraldAccentLight.userData.baseIntensity = 0.55;
  emeraldAccentLight.position.set(0, -0.32, 0.08);
  stage.add(emeraldAccentLight);
  lights.push(emeraldAccentLight);

  /* =========================================================================
     2. RETICULA ESPACIAL HOLOGRAFICA EN LA BASE (GLSL)
  ========================================================================= */
  const gridGeo = new THREE.CircleGeometry(0.54, 64);
  gridGeo.rotateX(-Math.PI / 2);
  const gridMat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uReveal: { value: 0 }
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
      varying vec2 vUv;

      void main() {
        vec2 p = (vUv - 0.5) * 2.0;
        float r = length(p);
        float ang = atan(p.y, p.x);

        // Anillos polares finos
        float rings = smoothstep(0.018, 0.0, abs(fract(r * 4.5) - 0.5) - 0.45);
        // Lineas radiales cada 45 grados
        float radLines = smoothstep(0.025, 0.0, abs(sin(ang * 4.0))) * step(0.18, r);
        // Onda expansiva de escaneo espacial
        float scanR = fract(uTime * 0.28);
        float pulse = smoothstep(0.06, 0.0, abs(r - scanR)) * (1.0 - scanR);

        // Grilla cartesiana sutil
        vec2 g = abs(fract(p * 6.0) - 0.5);
        float cart = smoothstep(0.03, 0.0, min(g.x, g.y)) * 0.25;

        float fade = smoothstep(1.0, 0.3, r);
        vec3 violet = vec3(0.66, 0.34, 1.0);
        vec3 mint = vec3(0.0, 1.0, 0.53);
        vec3 col = violet * (rings * 0.8 + radLines * 0.5 + cart) + mix(violet, mint, 0.55) * pulse * 1.4;

        float alpha = (rings * 0.65 + radLines * 0.35 + cart + pulse * 0.9) * fade * uReveal;
        gl_FragColor = vec4(col, clamp(alpha, 0.0, 0.9));
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide
  });
  const baseGrid = new THREE.Mesh(gridGeo, gridMat);
  baseGrid.position.set(0, -0.35, 0);
  stage.add(baseGrid);

  /* =========================================================================
     3. MONOLITO CENTRAL: PRISMAS DE NEBULOSA CRISTALINA + WIREFRAMES
  ========================================================================= */
  const monolithGroup = new THREE.Group();
  monolithGroup.position.set(0, 0.03, 0);
  stage.add(monolithGroup);

  const nebulaCrystalMat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uReveal: { value: 0 },
      uTint: { value: new THREE.Color(0x9d5cff) }
    },
    vertexShader: /* glsl */ `
      varying vec3 vNormalView;
      varying vec3 vViewDir;
      varying vec3 vLocalPos;
      void main() {
        vLocalPos = position;
        vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
        vNormalView = normalize(normalMatrix * normal);
        vViewDir = normalize(-mvPos.xyz);
        gl_Position = projectionMatrix * mvPos;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      uniform float uReveal;
      uniform vec3 uTint;
      varying vec3 vNormalView;
      varying vec3 vViewDir;
      varying vec3 vLocalPos;
      ${GLSL_NOISE}

      void main() {
        float ndotv = abs(dot(normalize(vNormalView), normalize(vViewDir)));
        float fresnel = pow(1.0 - ndotv, 2.0);

        // Nebulosa organica animada en el interior del cristal (referencia target-titulo.png)
        vec2 nUv = vLocalPos.xy * 6.5 + vLocalPos.zy * 4.5;
        float neb1 = fbm2D(nUv + vec2(uTime * 0.14, -uTime * 0.11));
        float neb2 = fbm2D(nUv * 1.9 - vec2(uTime * 0.1, uTime * 0.16));
        float wisp = smoothstep(0.32, 0.85, neb1 * 0.65 + neb2 * 0.45);

        // Micro cuadrantes digitales sutiles en facetas
        vec2 px = floor(vLocalPos.xy * 26.0 + vLocalPos.z * 14.0);
        float pixelAccent = step(0.86, hash21(px + floor(uTime * 0.8))) * 0.35;

        vec3 obsidian = vec3(0.03, 0.03, 0.06);
        vec3 silver = vec3(0.92, 0.96, 1.0);
        // Dispersion dicroica en borde Fresnel (amatista -> cian/esmeralda -> plata)
        vec3 dichroic = mix(uTint, vec3(0.18, 0.95, 0.82), pow(fresnel, 1.6) * 0.45);
        vec3 col = mix(obsidian, dichroic, wisp * 0.72 + fresnel * 0.5);
        col += silver * (pow(wisp, 3.0) * 0.68 + fresnel * 0.62 + pixelAccent);

        float alpha = (0.30 + wisp * 0.34 + fresnel * 0.48) * uReveal;
        gl_FragColor = vec4(col, clamp(alpha, 0.0, 0.94));
      }
    `,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide
  });

  const wireVioletMat = new THREE.LineBasicMaterial({
    color: 0xc084fc,
    transparent: true,
    opacity: 0.9
  });
  const wireWhiteMat = new THREE.LineBasicMaterial({
    color: 0xf5f3ff,
    transparent: true,
    opacity: 0.78
  });

  function createCrystalPrism(w, h, d, lineMat) {
    const grp = new THREE.Group();
    const geo = new THREE.BoxGeometry(w, h, d);
    const mesh = new THREE.Mesh(geo, nebulaCrystalMat);
    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geo), lineMat);
    grp.add(mesh, edges);
    return grp;
  }

  // Cubo principal + prisma secundario anidado en contrarotacion + bloques arquitectonicos
  const mainPrism = createCrystalPrism(0.22, 0.22, 0.22, wireWhiteMat);
  mainPrism.rotation.set(0.58, 0.78, 0.15);

  const innerPrism = createCrystalPrism(0.165, 0.165, 0.165, wireVioletMat);
  innerPrism.rotation.set(-0.42, 0.35, 0.62);

  const upperBlock = createCrystalPrism(0.13, 0.12, 0.13, wireVioletMat);
  upperBlock.position.set(-0.02, 0.145, -0.02);
  upperBlock.rotation.set(0.55, 0.78, 0.12);

  const lowerBlock = createCrystalPrism(0.11, 0.10, 0.11, wireWhiteMat);
  lowerBlock.position.set(0.02, -0.155, 0.02);
  lowerBlock.rotation.set(0.58, 0.78, 0.15);

  monolithGroup.add(mainPrism, innerPrism, upperBlock, lowerBlock);

  // Nucleo estelar central + astrolabio giroscopico 3D + destello de 4 puntas
  const coreGeo = new THREE.OctahedronGeometry(0.042, 0);
  const coreMat = new THREE.MeshBasicMaterial({ color: 0xf7ecff });
  const starCore = new THREE.Mesh(coreGeo, coreMat);
  monolithGroup.add(starCore);

  const gyroMat = new THREE.MeshBasicMaterial({
    color: 0x00ff88,
    transparent: true,
    opacity: 0.78
  });
  const gyroMatViolet = new THREE.MeshBasicMaterial({
    color: 0xd8b4fe,
    transparent: true,
    opacity: 0.82
  });
  const gyroA = new THREE.Mesh(new THREE.TorusGeometry(0.078, 0.0016, 6, 48), gyroMatViolet);
  const gyroB = new THREE.Mesh(new THREE.TorusGeometry(0.092, 0.0014, 6, 48), gyroMat);
  const gyroC = new THREE.Mesh(new THREE.TorusGeometry(0.106, 0.0014, 6, 48), gyroMatViolet);
  monolithGroup.add(gyroA, gyroB, gyroC);

  const glowTex = createSoftGlowTexture(THREE, 128);
  const flareTex = createStarFlareTexture(THREE, 128);
  const coreHalo = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: glowTex,
      color: 0xc084fc,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    })
  );
  coreHalo.scale.setScalar(0.24);
  monolithGroup.add(coreHalo);

  const starSprite = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: flareTex,
      color: 0xffffff,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    })
  );
  starSprite.position.set(0, 0, 0.11);
  starSprite.scale.setScalar(0.18);
  monolithGroup.add(starSprite);

  // Haz holografico vertical conectando la reticula base con el monolito
  const beamColGeo = new THREE.CylinderGeometry(0.12, 0.21, 0.36, 28, 1, true);
  beamColGeo.translate(0, 0.18, 0);
  const beamColMat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uReveal: { value: 0 }
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
      varying vec2 vUv;
      void main() {
        float stripe = 0.5 + 0.5 * sin(vUv.x * 24.0 + uTime * 1.4);
        float fade = smoothstep(0.0, 0.25, vUv.y) * smoothstep(1.0, 0.15, vUv.y);
        vec3 col = mix(vec3(0.0, 1.0, 0.53), vec3(0.66, 0.34, 1.0), vUv.y);
        gl_FragColor = vec4(col, fade * (0.06 + 0.08 * stripe) * uReveal);
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide
  });
  const holoBeam = new THREE.Mesh(beamColGeo, beamColMat);
  holoBeam.position.set(0, -0.35, 0);
  stage.add(holoBeam);

  // Red nodal 3D conectando nucleo, esferas y nodos arquitectonicos
  const nodePts = [
    new THREE.Vector3(0, 0.03, 0),
    new THREE.Vector3(0.175, 0.175, 0.04),
    new THREE.Vector3(0, 0.03, 0),
    new THREE.Vector3(-0.22, 0.14, -0.08),
    new THREE.Vector3(0, 0.03, 0),
    new THREE.Vector3(0.08, -0.22, -0.02),
    new THREE.Vector3(0.175, 0.175, 0.04),
    new THREE.Vector3(0.32, 0.20, -0.02),
    new THREE.Vector3(-0.22, 0.14, -0.08),
    new THREE.Vector3(-0.31, 0.17, 0.02)
  ];
  const networkGeo = new THREE.BufferGeometry().setFromPoints(nodePts);
  const networkMat = new THREE.LineBasicMaterial({
    color: 0x00ff88,
    transparent: true,
    opacity: 0.45
  });
  const networkLines = new THREE.LineSegments(networkGeo, networkMat);
  stage.add(networkLines);

  /* =========================================================================
     4. ESFERAS DE OBSIDIANA IRIDISCENTE & ANILLOS ORBITALES DE TELEMETRIA
  ========================================================================= */
  const sphereTex = createCanvasTexture(
    THREE,
    512,
    512,
    (ctx, w, h) => {
      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0.0, '#0a0912');
      grad.addColorStop(0.55, '#19102e');
      grad.addColorStop(1.0, '#4c1d95');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Polvo estelar y microporos metalicos
      for (let i = 0; i < 2500; i++) {
        const bright = Math.random() > 0.85;
        ctx.fillStyle = bright
          ? `rgba(225, 200, 255, ${0.2 + Math.random() * 0.5})`
          : `rgba(124, 58, 237, ${0.08 + Math.random() * 0.22})`;
        ctx.fillRect(Math.random() * w, Math.random() * h, 1.5, 1.5);
      }
    },
    { srgb: true }
  );

  const obsidianSphereMat = new THREE.MeshPhysicalMaterial({
    map: sphereTex,
    roughness: 0.24,
    metalness: 0.82,
    clearcoat: 0.65,
    clearcoatRoughness: 0.15,
    emissive: 0x240b47,
    emissiveIntensity: 0.5,
    envMapIntensity: 1.4
  });

  // Esfera protagonista superior-derecha con destello + 2 satelites orbitales
  const heroSphere = new THREE.Mesh(new THREE.SphereGeometry(0.078, 32, 24), obsidianSphereMat);
  heroSphere.position.set(0.175, 0.175, 0.04);
  const heroFlare = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: flareTex,
      color: 0xd8b4fe,
      transparent: true,
      opacity: 0.72,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    })
  );
  heroFlare.position.set(-0.04, 0.05, 0.06);
  heroFlare.scale.setScalar(0.11);
  heroSphere.add(heroFlare);
  stage.add(heroSphere);

  const satSphereA = new THREE.Mesh(new THREE.SphereGeometry(0.026, 20, 16), obsidianSphereMat);
  const satSphereB = new THREE.Mesh(new THREE.SphereGeometry(0.019, 18, 14), obsidianSphereMat);
  stage.add(satSphereA, satSphereB);

  // Anillos orbitales de telemetria (GLSL con haces luminosos viajando)
  const orbitRingMat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uReveal: { value: 0 },
      uColorA: { value: new THREE.Color(0x9333ea) },
      uColorB: { value: new THREE.Color(0xe9d5ff) }
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
      uniform vec3 uColorA;
      uniform vec3 uColorB;
      varying vec2 vUv;

      void main() {
        float pulse1 = pow(0.5 + 0.5 * sin(vUv.x * 6.2831853 * 2.0 - uTime * 2.6), 4.0);
        float pulse2 = pow(0.5 + 0.5 * sin(vUv.x * 6.2831853 * 3.0 + uTime * 1.9), 6.0);
        float core = 1.0 - abs(vUv.y - 0.5) * 2.0;
        vec3 col = mix(uColorA, uColorB, pulse1 * 0.7 + pulse2 * 0.5);
        float alpha = pow(max(core, 0.0), 1.4) * (0.35 + 0.65 * max(pulse1, pulse2)) * uReveal;
        gl_FragColor = vec4(col * 1.25, alpha);
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide
  });

  const orbitRing1 = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.0028, 8, 96), orbitRingMat);
  orbitRing1.position.set(0.01, 0.02, 0);
  orbitRing1.rotation.set(1.25, -0.35, 0.25);

  const orbitRing2 = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.0022, 8, 96), orbitRingMat);
  orbitRing2.position.set(0.05, 0.14, 0.02);
  orbitRing2.rotation.set(1.18, 0.42, -0.32);

  stage.add(orbitRing1, orbitRing2);

  /* =========================================================================
     5. ARQUITECTURA DE CIRCUITOS, PLACAS & PIXELES DIGITALES FLOTANTES
  ========================================================================= */
  const circuitMat = new THREE.MeshBasicMaterial({
    color: 0xa855f7,
    transparent: true,
    opacity: 0.72
  });
  const pixelMintMat = new THREE.MeshBasicMaterial({ color: 0x00ff88 });
  const pixelVioletMat = new THREE.MeshBasicMaterial({ color: 0x9333ea });

  // Placas arquitectonicas translucidas en base y parte superior (como target-titulo.png)
  const glassSlabMat = new THREE.MeshPhysicalMaterial({
    color: 0x241345,
    roughness: 0.18,
    metalness: 0.5,
    transparent: true,
    opacity: 0.55,
    clearcoat: 0.8
  });
  const slabAGeo = new THREE.BoxGeometry(0.22, 0.005, 0.14);
  const slabA = new THREE.Mesh(slabAGeo, glassSlabMat);
  slabA.add(new THREE.LineSegments(new THREE.EdgesGeometry(slabAGeo), wireVioletMat));
  slabA.position.set(0.08, -0.22, -0.02);
  slabA.rotation.set(0.18, 0.45, -0.15);

  const slabBGeo = new THREE.BoxGeometry(0.10, 0.13, 0.005);
  const slabB = new THREE.Mesh(slabBGeo, glassSlabMat);
  slabB.add(new THREE.LineSegments(new THREE.EdgesGeometry(slabBGeo), wireVioletMat));
  slabB.position.set(-0.22, 0.14, -0.08);
  slabB.rotation.set(0.0, 0.35, 0.0);

  stage.add(slabA, slabB);

  // Trazos verticales tecnicos con nodos cuadrados
  const traceGroup = new THREE.Group();
  const traceSpecs = [
    [-0.31, 0.02, 0.02, 0.30],
    [0.32, 0.04, -0.02, 0.32],
    [-0.18, -0.11, 0.06, 0.22],
    [0.22, -0.12, 0.05, 0.24]
  ];
  for (const [tx, ty, tz, th] of traceSpecs) {
    const line = new THREE.Mesh(new THREE.BoxGeometry(0.0022, th, 0.0022), circuitMat);
    line.position.set(tx, ty, tz);
    const node = new THREE.Mesh(
      new THREE.BoxGeometry(0.011, 0.011, 0.011),
      tx > 0 ? pixelVioletMat : pixelMintMat
    );
    node.position.set(tx, ty + th * 0.5, tz);
    traceGroup.add(line, node);
  }
  stage.add(traceGroup);

  // Pixeles digitales flotantes (instanciados)
  const pixelCount = 60;
  const pixelGeo = new THREE.BoxGeometry(0.012, 0.012, 0.012);
  const pixelInst = new THREE.InstancedMesh(pixelGeo, pixelVioletMat, pixelCount);
  const pixelSeeds = [];
  const dummy = new THREE.Object3D();
  for (let i = 0; i < pixelCount; i++) {
    const side = i % 2 === 0 ? -1 : 1;
    const px = side * (0.26 + rand() * 0.26);
    const py = (rand() - 0.5) * 0.92;
    const pz = (rand() - 0.5) * 0.42;
    const sc = 0.5 + rand() * 1.1;
    pixelSeeds.push({ px, py, pz, sc, phase: rand() * Math.PI * 2 });
    dummy.position.set(px, py, pz);
    dummy.scale.setScalar(sc);
    dummy.updateMatrix();
    pixelInst.setMatrixAt(i, dummy.matrix);
  }
  pixelInst.instanceMatrix.needsUpdate = true;
  stage.add(pixelInst);

  /* =========================================================================
     6. CINTA GALACTICA DE PARTICULAS ENVOLVENTE (360 PARTICULAS GLSL)
  ========================================================================= */
  const ribbonCount = 360;
  const rbPhase = new Float32Array(ribbonCount);
  const rbSpread = new Float32Array(ribbonCount * 3);
  const rbColorMix = new Float32Array(ribbonCount);
  const rbDummy = new Float32Array(ribbonCount * 3);
  for (let i = 0; i < ribbonCount; i++) {
    rbPhase[i] = (i / ribbonCount) * Math.PI * 2;
    rbSpread[i * 3] = (rand() - 0.5) * 0.085;
    rbSpread[i * 3 + 1] = (rand() - 0.5) * 0.085;
    rbSpread[i * 3 + 2] = (rand() - 0.5) * 0.085;
    rbColorMix[i] = rand();
  }
  const ribbonGeo = new THREE.BufferGeometry();
  ribbonGeo.setAttribute('position', new THREE.BufferAttribute(rbDummy, 3));
  ribbonGeo.setAttribute('aPhase', new THREE.BufferAttribute(rbPhase, 1));
  ribbonGeo.setAttribute('aSpread', new THREE.BufferAttribute(rbSpread, 3));
  ribbonGeo.setAttribute('aMix', new THREE.BufferAttribute(rbColorMix, 1));

  const ribbonMat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uReveal: { value: 0 }
    },
    vertexShader: /* glsl */ `
      uniform float uTime;
      attribute float aPhase;
      attribute vec3 aSpread;
      attribute float aMix;
      varying float vMix;
      varying float vAlpha;

      void main() {
        float t = aPhase + uTime * 0.42;
        // Cinta helicoidal inclinada rodeando el monolito (guiño a la estela de target-titulo.png)
        float rad = 0.31 + 0.11 * sin(t * 2.0);
        vec3 p = vec3(
          cos(t) * rad,
          sin(t * 2.0) * 0.22 + cos(t) * 0.12,
          sin(t) * rad
        ) + aSpread;

        vec4 mvPos = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mvPos;
        gl_PointSize = (9.0 + 7.0 * aMix) * (1.0 / max(-mvPos.z, 0.35));
        vMix = aMix;
        vAlpha = 0.45 + 0.55 * (0.5 + 0.5 * sin(t * 3.0 + aSpread.x * 40.0));
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uReveal;
      varying float vMix;
      varying float vAlpha;

      void main() {
        float d = length(gl_PointCoord - vec2(0.5));
        if (d > 0.5) discard;
        float glow = pow(1.0 - d * 2.0, 2.0);
        vec3 violet = vec3(0.62, 0.30, 1.0);
        vec3 white = vec3(0.95, 0.96, 1.0);
        vec3 mint = vec3(0.0, 1.0, 0.55);
        vec3 col = mix(violet, white, smoothstep(0.25, 0.8, vMix));
        col = mix(col, mint, smoothstep(0.88, 1.0, vMix));
        gl_FragColor = vec4(col, glow * vAlpha * uReveal * 0.92);
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const galacticRibbon = new THREE.Points(ribbonGeo, ribbonMat);
  stage.add(galacticRibbon);

  /* =========================================================================
     7. UPDATE & DISPOSE
  ========================================================================= */
  function setActive(active) {
    root.visible = active;
    for (const l of lights) l.visible = active;
  }

  function update(dt, elapsed, revealProgress) {
    const rev = easeOutCubic(revealProgress);
    stage.scale.setScalar((0.76 + 0.24 * rev) * 1.34);

    gridMat.uniforms.uTime.value = elapsed;
    gridMat.uniforms.uReveal.value = rev;
    beamColMat.uniforms.uTime.value = elapsed;
    beamColMat.uniforms.uReveal.value = rev;
    nebulaCrystalMat.uniforms.uTime.value = elapsed;
    nebulaCrystalMat.uniforms.uReveal.value = rev;
    orbitRingMat.uniforms.uTime.value = elapsed;
    orbitRingMat.uniforms.uReveal.value = rev;
    ribbonMat.uniforms.uTime.value = elapsed;
    ribbonMat.uniforms.uReveal.value = rev;

    networkMat.opacity = (0.3 + 0.25 * Math.sin(elapsed * 2.2)) * rev;

    // Coreografia en contrafase del hipercubo, astrolabio y nucleo estelar
    monolithGroup.position.y = 0.03 + Math.sin(elapsed * 1.15) * 0.015;
    mainPrism.rotation.y = 0.78 + elapsed * 0.24;
    mainPrism.rotation.x = 0.58 + Math.sin(elapsed * 0.5) * 0.08;
    innerPrism.rotation.y = 0.35 - elapsed * 0.38;
    innerPrism.rotation.z = 0.62 + elapsed * 0.22;
    upperBlock.rotation.y = 0.78 - elapsed * 0.18;
    lowerBlock.rotation.y = 0.78 + elapsed * 0.22;

    gyroA.rotation.set(elapsed * 0.75, elapsed * 0.4, 0.3);
    gyroB.rotation.set(-elapsed * 0.5, elapsed * 0.9, 1.1);
    gyroC.rotation.set(0.6, -elapsed * 0.65, elapsed * 0.45);

    starCore.rotation.y = elapsed * 0.9;
    starCore.rotation.x = elapsed * 0.6;
    const starPulse = 0.9 + 0.22 * Math.sin(elapsed * 3.0);
    starSprite.scale.setScalar(0.18 * starPulse * rev);
    coreHalo.scale.setScalar(0.22 * starPulse * rev);

    // Orbitas de satelites y anillos
    heroSphere.rotation.y = elapsed * 0.28;
    heroSphere.position.y = 0.175 + Math.sin(elapsed * 1.3 + 0.8) * 0.012;

    const a1 = elapsed * 0.65;
    satSphereA.position.set(Math.cos(a1) * 0.32, Math.sin(a1) * 0.11 + 0.02, Math.sin(a1) * 0.26);
    const a2 = -elapsed * 0.85 + 2.2;
    satSphereB.position.set(0.05 + Math.cos(a2) * 0.24, 0.14 + Math.sin(a2) * 0.09, Math.sin(a2) * 0.21);

    orbitRing1.rotation.z = 0.25 + elapsed * 0.16;
    orbitRing2.rotation.z = -0.32 - elapsed * 0.21;

    // Animacion suave de pixeles digitales flotantes
    for (let i = 0; i < pixelCount; i++) {
      const s = pixelSeeds[i];
      dummy.position.set(
        s.px,
        s.py + Math.sin(elapsed * 1.4 + s.phase) * 0.025,
        s.pz
      );
      dummy.rotation.set(elapsed * 0.4 + s.phase, elapsed * 0.6, 0);
      dummy.scale.setScalar(s.sc * rev);
      dummy.updateMatrix();
      pixelInst.setMatrixAt(i, dummy.matrix);
    }
    pixelInst.instanceMatrix.needsUpdate = true;

    // Intensidad de luces acoplada al reveal y pulso
    coreLight.intensity = coreLight.userData.baseIntensity * (0.85 + 0.25 * Math.sin(elapsed * 3.0)) * rev;
    emeraldAccentLight.intensity = emeraldAccentLight.userData.baseIntensity * rev;
    hemiLight.intensity = hemiLight.userData.baseIntensity * rev;
    keyLight.intensity = keyLight.userData.baseIntensity * rev;
    violetRim.intensity = violetRim.userData.baseIntensity * rev;
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
