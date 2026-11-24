import {
  GLSL_NOISE,
  createCanvasTexture,
  disposeObject3D,
  easeOutCubic
} from '../shared.js';

/**
 * Experiencia AR — Target 2 (Indice 1 en targets.mind)
 * CULTURA JAPONESA // KANE NO HIBIKI (鐘の響き)
 *
 * Composicion inspirada en arquitectura japonesa tradicional:
 * estanque reflectivo GLSL, Torii bermellon con caligrafia, pagoda de 3 niveles
 * con shoji luminosos, disco lunar/solar carmesi con ondas seigaiha, arbol de sakura,
 * bambu dorado, faroles chochin y toro, grullas doradas y lluvia de petalos.
 */
export function createJapaneseCultureExperience(THREE) {
  const root = new THREE.Group();
  root.name = 'JapaneseCultureExperience';

  const stage = new THREE.Group();
  stage.position.set(0, -0.27, 0.30);
  root.add(stage);

  let seed = 4207;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };

  /* =========================================================================
     1. ILUMINACION CINEMATOGRAFICA
  ========================================================================= */
  const lights = [];

  const hemiLight = new THREE.HemisphereLight(0xffb6c8, 0x16122a, 1.05);
  hemiLight.userData.baseIntensity = 1.05;
  stage.add(hemiLight);
  lights.push(hemiLight);

  const keyLight = new THREE.DirectionalLight(0xffcf9a, 2.0);
  keyLight.userData.baseIntensity = 2.0;
  keyLight.position.set(-0.55, 0.95, 0.65);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(512, 512);
  keyLight.shadow.camera.near = 0.2;
  keyLight.shadow.camera.far = 2.5;
  keyLight.shadow.camera.left = -0.6;
  keyLight.shadow.camera.right = 0.6;
  keyLight.shadow.camera.top = 0.6;
  keyLight.shadow.camera.bottom = -0.6;
  keyLight.shadow.bias = -0.002;
  keyLight.target.position.set(0, 0.08, 0);
  stage.add(keyLight, keyLight.target);
  lights.push(keyLight);

  const crimsonRim = new THREE.DirectionalLight(0xff2e6b, 1.15);
  crimsonRim.userData.baseIntensity = 1.15;
  crimsonRim.position.set(0.2, 0.45, -0.75);
  crimsonRim.target.position.set(0, 0.12, 0);
  stage.add(crimsonRim, crimsonRim.target);
  lights.push(crimsonRim);

  const lanternLightA = new THREE.PointLight(0xff8e3c, 0.85, 0.55, 2.0);
  lanternLightA.userData.baseIntensity = 0.85;
  stage.add(lanternLightA);
  lights.push(lanternLightA);

  const lanternLightB = new THREE.PointLight(0xff5277, 0.65, 0.5, 2.0);
  lanternLightB.userData.baseIntensity = 0.65;
  stage.add(lanternLightB);
  lights.push(lanternLightB);

  /* =========================================================================
     2. BASE DE PIEDRA ZEN & ESTANQUE REFLECTIVO (GLSL)
  ========================================================================= */
  const stoneTex = createCanvasTexture(
    THREE,
    512,
    512,
    (ctx, w, h) => {
      ctx.fillStyle = '#1d1c24';
      ctx.fillRect(0, 0, w, h);
      // Patrones zen circulares sutiles y textura basalto
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.lineWidth = 2;
      for (let r = 36; r < w * 0.48; r += 16) {
        ctx.beginPath();
        ctx.arc(w * 0.5, h * 0.5, r, 0, Math.PI * 2);
        ctx.stroke();
      }
      for (let i = 0; i < 2400; i++) {
        const g = 18 + Math.floor(Math.random() * 28);
        ctx.fillStyle = `rgba(${g},${g},${g + 8},0.26)`;
        ctx.fillRect(Math.random() * w, Math.random() * h, 2, 2);
      }
    },
    { srgb: true }
  );

  const baseGeo = new THREE.CylinderGeometry(0.42, 0.39, 0.044, 48);
  const baseMat = new THREE.MeshStandardMaterial({
    map: stoneTex,
    roughness: 0.82,
    metalness: 0.14
  });
  const baseSideMat = new THREE.MeshStandardMaterial({
    color: 0x16151c,
    roughness: 0.85,
    metalness: 0.18
  });
  const baseMesh = new THREE.Mesh(baseGeo, [baseSideMat, baseMat, baseSideMat]);
  baseMesh.position.y = -0.022;
  baseMesh.receiveShadow = true;
  stage.add(baseMesh);

  // Aro dorado sutil en el borde del zocalo
  const trimRingGeo = new THREE.TorusGeometry(0.416, 0.0042, 8, 64);
  trimRingGeo.rotateX(Math.PI / 2);
  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xe6b85c,
    roughness: 0.25,
    metalness: 0.9,
    emissive: 0x3b2406,
    emissiveIntensity: 0.3
  });
  const trimRing = new THREE.Mesh(trimRingGeo, goldMat);
  trimRing.position.y = 0.0;
  stage.add(trimRing);

  // Estanque reflectivo nocturno (GLSL)
  const pondGeo = new THREE.CircleGeometry(0.295, 48);
  pondGeo.rotateX(-Math.PI / 2);
  const pondMat = new THREE.ShaderMaterial({
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
      ${GLSL_NOISE}

      void main() {
        vec2 p = vUv - 0.5;
        float dist = length(p);

        // Ondas concentricas suaves + perturbacion organica
        float n = fbm2D(vUv * 7.5 + vec2(uTime * 0.14, -uTime * 0.1));
        float ripple1 = sin(dist * 58.0 - uTime * 2.6 + n * 4.0);
        float ripple2 = sin(length(p - vec2(-0.14, 0.08)) * 46.0 - uTime * 2.1);
        float wave = (ripple1 * 0.55 + ripple2 * 0.45) * 0.5 + 0.5;

        // Reflejo lunar carmesi-dorado y resplandor de faroles en el agua
        vec3 deepWater = vec3(0.03, 0.04, 0.09);
        vec3 moonReflect = vec3(0.95, 0.22, 0.36);
        vec3 goldReflect = vec3(1.0, 0.78, 0.34);

        float moonZone = exp(-length((p - vec2(0.04, -0.14)) * vec2(1.4, 0.85)) * 5.2);
        float lanternZone = exp(-length(p - vec2(-0.18, 0.08)) * 8.0);

        vec3 col = deepWater;
        col += moonReflect * moonZone * (0.45 + 0.55 * wave);
        col += goldReflect * (lanternZone * 0.55 + pow(wave, 5.0) * 0.22);
        col += vec3(0.45, 0.22, 0.55) * n * 0.18;

        float edgeFade = smoothstep(0.5, 0.38, dist);
        gl_FragColor = vec4(col, edgeFade * 0.92 * uReveal);
      }
    `,
    transparent: true,
    depthWrite: false
  });
  const pondMesh = new THREE.Mesh(pondGeo, pondMat);
  pondMesh.position.set(0.0, 0.002, 0.06);
  stage.add(pondMesh);

  // Piedras de paso zen sobre el estanque
  const stepStoneMat = new THREE.MeshStandardMaterial({
    color: 0x2f313a,
    roughness: 0.76,
    metalness: 0.12
  });
  const stepPositions = [
    [-0.14, 0.14, 0.036],
    [-0.04, 0.19, 0.030],
    [0.07, 0.16, 0.034],
    [0.16, 0.11, 0.028]
  ];
  for (const [sx, sz, sr] of stepPositions) {
    const sGeo = new THREE.CylinderGeometry(sr, sr * 1.1, 0.014, 12);
    const stone = new THREE.Mesh(sGeo, stepStoneMat);
    stone.position.set(sx, 0.006, sz);
    stone.castShadow = true;
    stone.receiveShadow = true;
    stage.add(stone);
  }

  // Peces Koi luminosos nadando en el estanque
  const koiList = [];
  function createKoi(bodyHex, accentHex, radius, speed, phase) {
    const koi = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.ConeGeometry(0.009, 0.036, 8),
      new THREE.MeshStandardMaterial({
        color: bodyHex,
        emissive: accentHex,
        emissiveIntensity: 0.45,
        roughness: 0.25,
        metalness: 0.2
      })
    );
    body.rotation.x = Math.PI / 2;
    body.scale.set(1.0, 1.0, 0.65);

    const tail = new THREE.Mesh(
      new THREE.ConeGeometry(0.008, 0.018, 4),
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        emissive: accentHex,
        emissiveIntensity: 0.35,
        roughness: 0.3
      })
    );
    tail.rotation.x = -Math.PI / 2;
    tail.scale.set(0.35, 1.0, 1.1);
    tail.position.z = -0.022;

    koi.add(body, tail);
    koi.userData = { tail, radius, speed, phase };
    stage.add(koi);
    koiList.push(koi);
  }
  createKoi(0xff7722, 0xff4400, 0.145, 0.55, 0.0);
  createKoi(0xfff1e0, 0xff2244, 0.105, -0.68, 2.2);

  // Puente arqueado tradicional (Taiko-bashi) cruzando el estanque
  const bridgeGroup = new THREE.Group();
  bridgeGroup.position.set(0.11, 0.004, 0.11);
  bridgeGroup.rotation.y = -0.52;
  const bridgeWoodMat = new THREE.MeshStandardMaterial({
    color: 0xb82222,
    roughness: 0.42,
    metalness: 0.12
  });
  for (let b = -4; b <= 4; b++) {
    const t = b / 4;
    const archY = Math.cos(t * Math.PI * 0.5) * 0.026;
    const plank = new THREE.Mesh(new THREE.BoxGeometry(0.016, 0.006, 0.052), bridgeWoodMat);
    plank.position.set(t * 0.075, archY, 0);
    plank.rotation.z = -Math.sin(t * Math.PI * 0.5) * 0.28;
    plank.castShadow = true;
    bridgeGroup.add(plank);
  }
  [-0.024, 0.024].forEach((rz) => {
    const railCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.08, 0.018, rz),
      new THREE.Vector3(0.0, 0.046, rz),
      new THREE.Vector3(0.08, 0.018, rz)
    ]);
    const rail = new THREE.Mesh(new THREE.TubeGeometry(railCurve, 12, 0.003, 6, false), goldMat);
    bridgeGroup.add(rail);
  });
  stage.add(bridgeGroup);

  /* =========================================================================
     3. DISCO LUNAR/SOLAR CARMESI CON ONDAS SEIGAIHA (GLSL)
  ========================================================================= */
  const moonGeo = new THREE.CircleGeometry(0.24, 48);
  const moonMat = new THREE.ShaderMaterial({
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
      ${GLSL_NOISE}

      void main() {
        vec2 p = (vUv - 0.5) * 2.0;
        float r = length(p);

        // Disco principal nitido + halo atmosferico externo
        float disk = smoothstep(0.68, 0.65, r);
        float halo = exp(-max(0.0, r - 0.58) * 5.8) * 0.72;

        // Gradiente carmesi a oro imperial
        vec3 crimson = vec3(0.92, 0.08, 0.24);
        vec3 gold = vec3(1.0, 0.76, 0.26);
        vec3 baseCol = mix(crimson, gold, smoothstep(-0.6, 0.65, p.y));

        // Patron sutil Seigaiha (ondas concentricas tradicionales) en la parte baja
        vec2 grid = vec2(vUv.x * 9.0, vUv.y * 9.0);
        vec2 cell = fract(grid) - vec2(0.5, 0.0);
        float ringPattern = 0.5 + 0.5 * sin(length(cell) * 24.0 - uTime * 0.6);
        float lowerMask = smoothstep(0.15, -0.55, p.y);
        baseCol = mix(baseCol, gold * 1.15, ringPattern * lowerMask * 0.22);

        // Nubes estilizadas suavemente desplazandose
        float cloud = fbm2D(vec2(vUv.x * 3.5 - uTime * 0.035, vUv.y * 5.0));
        float cloudBand = smoothstep(0.54, 0.75, cloud) * smoothstep(0.2, -0.3, abs(p.y + 0.08));
        baseCol = mix(baseCol, vec3(1.0, 0.92, 0.78), cloudBand * 0.35);

        vec3 haloCol = mix(vec3(0.85, 0.14, 0.32), vec3(1.0, 0.65, 0.25), 0.35);
        vec3 finalCol = mix(haloCol, baseCol, disk);
        float alpha = clamp(disk + halo * (1.0 - disk), 0.0, 1.0) * uReveal;

        gl_FragColor = vec4(finalCol, alpha);
      }
    `,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide
  });
  const moonMesh = new THREE.Mesh(moonGeo, moonMat);
  moonMesh.position.set(0.03, 0.26, -0.25);
  stage.add(moonMesh);

  /* =========================================================================
     4. TORII MONUMENTAL BERMELLON + PLACA CALIGRAFICA
  ========================================================================= */
  const toriiGroup = new THREE.Group();
  toriiGroup.position.set(-0.045, 0.0, 0.04);
  toriiGroup.rotation.y = 0.20;
  stage.add(toriiGroup);

  const vermilionMat = new THREE.MeshStandardMaterial({
    color: 0xd92525,
    roughness: 0.38,
    metalness: 0.12,
    emissive: 0x3b0408,
    emissiveIntensity: 0.35
  });
  const lacquerBlackMat = new THREE.MeshStandardMaterial({
    color: 0x141318,
    roughness: 0.28,
    metalness: 0.45
  });

  // Pilares del Torii ligeramente inclinados hacia adentro
  [-0.095, 0.095].forEach((px, sideIdx) => {
    const tilt = sideIdx === 0 ? -0.045 : 0.045;
    const ped = new THREE.Mesh(new THREE.CylinderGeometry(0.017, 0.021, 0.035, 14), lacquerBlackMat);
    ped.position.set(px, 0.017, 0);
    ped.castShadow = true;
    toriiGroup.add(ped);

    const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.0115, 0.014, 0.27, 14), vermilionMat);
    pillar.position.set(px + (sideIdx === 0 ? 0.005 : -0.005), 0.15, 0);
    pillar.rotation.z = tilt;
    pillar.castShadow = true;
    pillar.receiveShadow = true;
    toriiGroup.add(pillar);
  });

  // Travesano Nuki
  const nuki = new THREE.Mesh(new THREE.BoxGeometry(0.245, 0.016, 0.016), vermilionMat);
  nuki.position.set(0, 0.23, 0);
  nuki.castShadow = true;
  toriiGroup.add(nuki);

  // Dintel Shimaki bermellon + Kasagi negro curvo superior
  const shimaki = new THREE.Mesh(new THREE.BoxGeometry(0.27, 0.018, 0.024), vermilionMat);
  shimaki.position.set(0, 0.278, 0);
  shimaki.castShadow = true;
  toriiGroup.add(shimaki);

  const kasagiGeo = new THREE.BoxGeometry(0.31, 0.017, 0.032, 16, 1, 1);
  const kPos = kasagiGeo.attributes.position;
  for (let i = 0; i < kPos.count; i++) {
    const x = kPos.getX(i);
    // Curvatura tradicional japonesa en los extremos
    kPos.setY(i, kPos.getY(i) + Math.pow(Math.abs(x) / 0.155, 2.2) * 0.016);
  }
  kasagiGeo.computeVertexNormals();
  const kasagi = new THREE.Mesh(kasagiGeo, lacquerBlackMat);
  kasagi.position.set(0, 0.295, 0);
  kasagi.castShadow = true;
  toriiGroup.add(kasagi);

  // Placa central Gakuzuka con caligrafia dorada "鐘の響き"
  const kanjiTex = createCanvasTexture(
    THREE,
    128,
    192,
    (ctx, w, h) => {
      ctx.fillStyle = '#120f15';
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = '#e8b954';
      ctx.lineWidth = 6;
      ctx.strokeRect(8, 8, w - 16, h - 16);
      ctx.fillStyle = '#ffd97a';
      ctx.font = 'bold 42px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('鐘', w / 2, h * 0.28);
      ctx.fillText('の', w / 2, h * 0.52);
      ctx.fillText('響', w / 2, h * 0.76);
    },
    { srgb: true }
  );
  const plaque = new THREE.Mesh(
    new THREE.BoxGeometry(0.034, 0.044, 0.02),
    [
      lacquerBlackMat,
      lacquerBlackMat,
      lacquerBlackMat,
      lacquerBlackMat,
      new THREE.MeshStandardMaterial({
        map: kanjiTex,
        emissiveMap: kanjiTex,
        emissive: 0xffc65c,
        emissiveIntensity: 0.75,
        roughness: 0.35
      }),
      lacquerBlackMat
    ]
  );
  plaque.position.set(0, 0.256, 0);
  toriiGroup.add(plaque);

  /* =========================================================================
     5. PAGODA DE 3 NIVELES CON VENTANAS SHOJI LUMINOSAS
  ========================================================================= */
  const pagodaGroup = new THREE.Group();
  pagodaGroup.position.set(0.14, 0.0, -0.13);
  pagodaGroup.rotation.y = -0.35;
  stage.add(pagodaGroup);

  const shojiTex = createCanvasTexture(
    THREE,
    128,
    128,
    (ctx, w, h) => {
      ctx.fillStyle = '#ffbe55';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#241410';
      for (let i = 0; i <= 4; i++) {
        ctx.fillRect((i * w) / 4 - 3, 0, 6, h);
        ctx.fillRect(0, (i * h) / 4 - 3, w, 6);
      }
    },
    { srgb: true }
  );
  const shojiMat = new THREE.MeshStandardMaterial({
    map: shojiTex,
    emissiveMap: shojiTex,
    emissive: 0xffa438,
    emissiveIntensity: 1.35,
    roughness: 0.5
  });

  // Base de piedra de la pagoda
  const pagBase = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.026, 0.17), stepStoneMat);
  pagBase.position.y = 0.013;
  pagBase.castShadow = true;
  pagBase.receiveShadow = true;
  pagodaGroup.add(pagBase);

  function createPagodaRoofGeo(size) {
    const geo = new THREE.ConeGeometry(size, size * 0.36, 4, 4);
    geo.rotateY(Math.PI / 4);
    const p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i);
      const y = p.getY(i);
      const z = p.getZ(i);
      const r = Math.hypot(x, z);
      // Aleros alzados elegantes
      p.setY(i, y + Math.pow(r / size, 2.2) * size * 0.24);
    }
    geo.computeVertexNormals();
    return geo;
  }

  let curY = 0.026;
  const tierSizes = [0.11, 0.088, 0.068];
  tierSizes.forEach((sz, idx) => {
    const h = 0.066 - idx * 0.008;
    const body = new THREE.Mesh(new THREE.BoxGeometry(sz, h, sz), vermilionMat);
    body.position.y = curY + h * 0.5;
    body.castShadow = true;
    body.receiveShadow = true;
    pagodaGroup.add(body);

    const win = new THREE.Mesh(new THREE.BoxGeometry(sz * 1.02, h * 0.52, sz * 0.55), shojiMat);
    win.position.y = curY + h * 0.52;
    const win2 = new THREE.Mesh(new THREE.BoxGeometry(sz * 0.55, h * 0.52, sz * 1.02), shojiMat);
    win2.position.y = curY + h * 0.52;
    pagodaGroup.add(win, win2);

    const roofSize = sz * 1.18;
    const roof = new THREE.Mesh(createPagodaRoofGeo(roofSize), lacquerBlackMat);
    roof.position.y = curY + h + roofSize * 0.12;
    roof.castShadow = true;
    pagodaGroup.add(roof);

    // Borde dorado sutil bajo el techo
    const trim = new THREE.Mesh(new THREE.BoxGeometry(sz * 1.08, 0.005, sz * 1.08), goldMat);
    trim.position.y = curY + h;
    pagodaGroup.add(trim);

    curY += h + roofSize * 0.19;
  });

  // Aguja Sorin dorada
  const sorin = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.008, 0.085, 10), goldMat);
  sorin.position.y = curY + 0.04;
  pagodaGroup.add(sorin);
  for (let r = 0; r < 3; r++) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.011 - r * 0.002, 0.002, 6, 16), goldMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = curY + 0.025 + r * 0.014;
    pagodaGroup.add(ring);
  }

  /* =========================================================================
     6. ARBOL DE SAKURA, BAMBU DORADO Y FAROLES (CHOCHIN & TORO)
  ========================================================================= */
  const sakuraGroup = new THREE.Group();
  sakuraGroup.position.set(-0.295, 0.0, -0.05);
  stage.add(sakuraGroup);

  const sakuraWoodMat = new THREE.MeshStandardMaterial({
    color: 0x2c1b20,
    roughness: 0.88,
    metalness: 0.05
  });

  // Tronco retorcido con CurvePath / TubeGeometry
  const trunkCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0.015, 0.11, 0.01),
    new THREE.Vector3(0.05, 0.21, 0.015),
    new THREE.Vector3(0.11, 0.29, 0.025)
  ]);
  const sakuraTrunk = new THREE.Mesh(new THREE.TubeGeometry(trunkCurve, 14, 0.017, 8, false), sakuraWoodMat);
  sakuraTrunk.castShadow = true;
  sakuraGroup.add(sakuraTrunk);

  const branchCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.03, 0.16, 0.01),
    new THREE.Vector3(-0.02, 0.24, 0.04),
    new THREE.Vector3(-0.07, 0.29, 0.03)
  ]);
  const sakuraBranch = new THREE.Mesh(new THREE.TubeGeometry(branchCurve, 10, 0.009, 7, false), sakuraWoodMat);
  sakuraBranch.castShadow = true;
  sakuraGroup.add(sakuraBranch);

  // Cumulos de flores sakura con textura organica y glow suave
  const sakuraTex = createCanvasTexture(
    THREE,
    128,
    128,
    (ctx, w, h) => {
      ctx.fillStyle = '#ffd0e2';
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 220; i++) {
        ctx.fillStyle =
          i % 3 === 0
            ? 'rgba(255, 255, 255, 0.45)'
            : i % 2 === 0
              ? 'rgba(255, 118, 165, 0.35)'
              : 'rgba(255, 182, 208, 0.4)';
        ctx.beginPath();
        ctx.arc(Math.random() * w, Math.random() * h, 2 + Math.random() * 5, 0, Math.PI * 2);
        ctx.fill();
      }
    },
    { srgb: true }
  );

  const blossomMatA = new THREE.MeshStandardMaterial({
    color: 0xff9ec2,
    map: sakuraTex,
    emissive: 0xff3b7d,
    emissiveIntensity: 0.45,
    roughness: 0.52
  });
  const blossomMatB = new THREE.MeshStandardMaterial({
    color: 0xffdbe8,
    map: sakuraTex,
    emissive: 0xff6b9e,
    emissiveIntensity: 0.38,
    roughness: 0.48
  });
  const blossomGeo = new THREE.IcosahedronGeometry(1, 2);
  const blossomSpots = [
    [0.095, 0.31, 0.02, 0.062, 0],
    [0.055, 0.28, 0.05, 0.048, 1],
    [0.135, 0.30, -0.01, 0.042, 1],
    [0.02, 0.25, -0.02, 0.054, 0],
    [-0.065, 0.29, 0.03, 0.058, 0],
    [-0.02, 0.25, 0.06, 0.044, 1],
    [0.055, 0.34, 0.01, 0.046, 1]
  ];
  blossomSpots.forEach(([bx, by, bz, sc, mIdx]) => {
    const cluster = new THREE.Mesh(blossomGeo, mIdx === 0 ? blossomMatA : blossomMatB);
    cluster.position.set(bx, by, bz);
    cluster.scale.set(sc * 1.25, sc * 0.78, sc * 1.1);
    cluster.castShadow = true;
    sakuraGroup.add(cluster);
  });

  // Tallos de bambu dorado-jade a la derecha (referencia directa a target2.png)
  const bambooGroup = new THREE.Group();
  bambooGroup.position.set(0.30, 0.0, 0.04);
  stage.add(bambooGroup);

  const bambooMat = new THREE.MeshStandardMaterial({
    color: 0xc29e3a,
    emissive: 0x3b2c06,
    emissiveIntensity: 0.28,
    roughness: 0.38,
    metalness: 0.45
  });
  const bambooSpecs = [
    { x: 0.0, z: 0.0, h: 0.36, tilt: 0.04 },
    { x: 0.038, z: -0.03, h: 0.31, tilt: -0.06 },
    { x: -0.035, z: 0.03, h: 0.27, tilt: 0.07 },
    { x: 0.02, z: 0.05, h: 0.24, tilt: 0.02 },
    { x: -0.02, z: -0.05, h: 0.33, tilt: -0.04 }
  ];
  const leafGeo = new THREE.ConeGeometry(0.008, 0.042, 4);
  leafGeo.scale(1.0, 1.0, 0.2);
  leafGeo.translate(0, 0.021, 0);

  bambooSpecs.forEach((bs, idx) => {
    const stalk = new THREE.Group();
    stalk.position.set(bs.x, 0, bs.z);
    stalk.rotation.z = bs.tilt;

    const segs = 4;
    const segH = bs.h / segs;
    for (let s = 0; s < segs; s++) {
      const seg = new THREE.Mesh(new THREE.CylinderGeometry(0.0065, 0.0072, segH * 0.94, 8), bambooMat);
      seg.position.y = s * segH + segH * 0.5;
      seg.castShadow = true;
      stalk.add(seg);

      const node = new THREE.Mesh(new THREE.TorusGeometry(0.0075, 0.0018, 6, 10), goldMat);
      node.rotation.x = Math.PI / 2;
      node.position.y = (s + 1) * segH;
      stalk.add(node);

      if (s >= 2) {
        for (let l = 0; l < 3; l++) {
          const leaf = new THREE.Mesh(leafGeo, bambooMat);
          leaf.position.y = (s + 0.85) * segH;
          leaf.rotation.y = idx * 1.4 + l * 2.1;
          leaf.rotation.z = 1.05;
          stalk.add(leaf);
        }
      }
    }
    bambooGroup.add(stalk);
  });

  // Faroles colgantes Chochin en el Torii (con pendulo)
  const chochinTex = createCanvasTexture(
    THREE,
    128,
    128,
    (ctx, w, h) => {
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, '#ff4d36');
      grad.addColorStop(0.5, '#ffbb55');
      grad.addColorStop(1, '#ff3344');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = 'rgba(40, 8, 8, 0.55)';
      ctx.lineWidth = 3;
      for (let y = 12; y < h; y += 16) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }
    },
    { srgb: true }
  );
  const chochinMat = new THREE.MeshStandardMaterial({
    map: chochinTex,
    emissiveMap: chochinTex,
    emissive: 0xff7733,
    emissiveIntensity: 1.45,
    roughness: 0.45
  });

  const lanterns = [];
  [-0.056, 0.056].forEach((lx) => {
    const pivot = new THREE.Group();
    pivot.position.set(lx, 0.222, 0);

    const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.0014, 0.0014, 0.025, 6), lacquerBlackMat);
    cord.position.y = -0.012;
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.015, 12, 10), chochinMat);
    body.scale.set(0.85, 1.32, 0.85);
    body.position.y = -0.04;
    const capTop = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.005, 10), lacquerBlackMat);
    capTop.position.y = -0.022;
    const capBot = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.005, 10), lacquerBlackMat);
    capBot.position.y = -0.058;

    pivot.add(cord, body, capTop, capBot);
    toriiGroup.add(pivot);
    lanterns.push(pivot);
  });

  // Farol de piedra Toro junto al estanque
  const toroGroup = new THREE.Group();
  toroGroup.position.set(0.21, 0.0, 0.16);
  const toroPost = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.018, 0.055, 6), stepStoneMat);
  toroPost.position.y = 0.027;
  const toroBox = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.028, 0.028), shojiMat);
  toroBox.position.y = 0.068;
  const toroRoof = new THREE.Mesh(createPagodaRoofGeo(0.048), stepStoneMat);
  toroRoof.position.y = 0.092;
  toroGroup.add(toroPost, toroBox, toroRoof);
  stage.add(toroGroup);

  // Campana ceremonial Bonsho ("Kane no Hibiki" = eco de la campana) + ondas sonoras GLSL
  const bellStand = new THREE.Group();
  bellStand.position.set(-0.22, 0.0, 0.16);
  bellStand.rotation.y = 0.45;
  [-0.036, 0.036].forEach((px) => {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.006, 0.11, 8), sakuraWoodMat);
    post.position.set(px, 0.055, 0);
    post.castShadow = true;
    bellStand.add(post);
  });
  const bellBeam = new THREE.Mesh(new THREE.BoxGeometry(0.095, 0.010, 0.014), lacquerBlackMat);
  bellBeam.position.y = 0.11;
  bellStand.add(bellBeam);

  const bellPivot = new THREE.Group();
  bellPivot.position.set(0, 0.105, 0);
  const bellBody = new THREE.Mesh(
    new THREE.CylinderGeometry(0.014, 0.022, 0.044, 18),
    new THREE.MeshStandardMaterial({
      color: 0xd9a848,
      emissive: 0x452804,
      emissiveIntensity: 0.4,
      metalness: 0.88,
      roughness: 0.24
    })
  );
  bellBody.position.y = -0.028;
  bellBody.castShadow = true;
  bellPivot.add(bellBody);
  bellStand.add(bellPivot);

  const soundWaveGeo = new THREE.PlaneGeometry(0.24, 0.24);
  soundWaveGeo.rotateX(-Math.PI / 2);
  const soundWaveMat = new THREE.ShaderMaterial({
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
        float r = length(vUv - 0.5) * 2.0;
        float w1 = fract(uTime * 0.42);
        float w2 = fract(uTime * 0.42 + 0.5);
        float ring1 = smoothstep(0.045, 0.0, abs(r - w1)) * (1.0 - w1);
        float ring2 = smoothstep(0.045, 0.0, abs(r - w2)) * (1.0 - w2);
        float fade = smoothstep(1.0, 0.35, r);
        float a = (ring1 + ring2) * fade * 0.72 * uReveal;
        gl_FragColor = vec4(1.0, 0.82, 0.36, a);
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide
  });
  const soundWave = new THREE.Mesh(soundWaveGeo, soundWaveMat);
  soundWave.position.set(0, 0.06, 0);
  bellStand.add(soundWave);
  stage.add(bellStand);

  lanternLightA.position.set(-0.05, 0.16, 0.04);
  lanternLightB.position.set(0.21, 0.09, 0.16);

  /* =========================================================================
     7. GRULLAS DORADAS ESTILIZADAS EN VUELO
  ========================================================================= */
  const cranes = [];
  function createCrane(scale = 1) {
    const crane = new THREE.Group();
    const body = new THREE.Mesh(new THREE.ConeGeometry(0.008, 0.042, 4), goldMat);
    body.rotation.x = Math.PI / 2;
    const neck = new THREE.Mesh(new THREE.ConeGeometry(0.003, 0.028, 4), goldMat);
    neck.rotation.x = Math.PI * 0.35;
    neck.position.set(0, 0.01, 0.024);

    const wingGeo = new THREE.BufferGeometry();
    const verts = new Float32Array([
      0, 0, 0.012,
      0.042, 0.004, 0.0,
      0.015, 0, -0.016,
      0, 0, -0.012
    ]);
    const indices = [0, 1, 2, 0, 2, 3];
    wingGeo.setAttribute('position', new THREE.BufferAttribute(verts, 3));
    wingGeo.setIndex(indices);
    wingGeo.computeVertexNormals();

    const wingMat = new THREE.MeshStandardMaterial({
      color: 0xffe49e,
      emissive: 0x6b470c,
      emissiveIntensity: 0.45,
      metalness: 0.85,
      roughness: 0.25,
      side: THREE.DoubleSide
    });

    const leftWing = new THREE.Mesh(wingGeo, wingMat);
    const rightWing = new THREE.Mesh(wingGeo, wingMat);
    rightWing.scale.x = -1;

    crane.add(body, neck, leftWing, rightWing);
    crane.scale.setScalar(scale);
    crane.userData = { leftWing, rightWing };
    return crane;
  }

  const craneConfigs = [
    { radius: 0.22, height: 0.35, speed: 0.48, phase: 0.0, scale: 1.05 },
    { radius: 0.18, height: 0.39, speed: 0.54, phase: 2.1, scale: 0.88 },
    { radius: 0.25, height: 0.32, speed: 0.42, phase: 4.3, scale: 0.82 }
  ];
  for (const cc of craneConfigs) {
    const c = createCrane(cc.scale);
    c.userData.cfg = cc;
    stage.add(c);
    cranes.push(c);
  }

  /* =========================================================================
     8. PETALOS DE SAKURA FLOTANTES & CHISPAS ESPIRITUALES (GLSL)
  ========================================================================= */
  const petalCount = 170;
  const pPos = new Float32Array(petalCount * 3);
  const pPhase = new Float32Array(petalCount);
  const pSpeed = new Float32Array(petalCount);
  for (let i = 0; i < petalCount; i++) {
    pPos[i * 3] = (rand() - 0.5) * 0.82;
    pPos[i * 3 + 1] = rand() * 0.46;
    pPos[i * 3 + 2] = (rand() - 0.5) * 0.72;
    pPhase[i] = rand() * Math.PI * 2;
    pSpeed[i] = 0.6 + rand() * 0.8;
  }
  const petalGeo = new THREE.BufferGeometry();
  petalGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
  petalGeo.setAttribute('aPhase', new THREE.BufferAttribute(pPhase, 1));
  petalGeo.setAttribute('aSpeed', new THREE.BufferAttribute(pSpeed, 1));

  const petalMat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uReveal: { value: 0 }
    },
    vertexShader: /* glsl */ `
      uniform float uTime;
      attribute float aPhase;
      attribute float aSpeed;
      varying float vSpin;
      varying float vAlpha;

      void main() {
        vec3 p = position;
        float t = uTime * 0.11 * aSpeed;
        p.y = 0.46 - mod(0.46 - p.y + t, 0.45);
        p.x += sin(uTime * 0.9 * aSpeed + aPhase) * 0.06 + t * 0.25;
        p.x = mod(p.x + 0.42, 0.84) - 0.42;
        p.z += cos(uTime * 0.7 * aSpeed + aPhase) * 0.04;

        vec4 mvPos = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mvPos;
        gl_PointSize = (13.0 + 5.0 * sin(aPhase)) * (1.0 / max(-mvPos.z, 0.35));
        vSpin = uTime * 2.2 * aSpeed + aPhase;
        vAlpha = smoothstep(0.01, 0.08, p.y) * smoothstep(0.47, 0.38, p.y);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uReveal;
      varying float vSpin;
      varying float vAlpha;

      void main() {
        vec2 uv = gl_PointCoord - 0.5;
        float c = cos(vSpin);
        float s = sin(vSpin);
        vec2 p = mat2(c, -s, s, c) * uv;
        // Forma de petalo con muesca superior
        p.y *= 1.15;
        p.x *= 1.35 + p.y * 0.6;
        float d = length(p) + smoothstep(0.0, 0.25, p.y) * (0.14 - abs(p.x)) * 0.9;
        if (d > 0.36) discard;

        float soft = smoothstep(0.36, 0.22, d);
        vec3 pink = vec3(1.0, 0.62, 0.78);
        vec3 pale = vec3(1.0, 0.92, 0.96);
        vec3 col = mix(pink, pale, smoothstep(-0.2, 0.25, p.y));
        gl_FragColor = vec4(col, soft * vAlpha * uReveal * 0.9);
      }
    `,
    transparent: true,
    depthWrite: false
  });
  const petals = new THREE.Points(petalGeo, petalMat);
  stage.add(petals);

  // Chispas doradas ascendentes
  const emberCount = 65;
  const ePos = new Float32Array(emberCount * 3);
  const ePhase = new Float32Array(emberCount);
  for (let i = 0; i < emberCount; i++) {
    ePos[i * 3] = (rand() - 0.5) * 0.6;
    ePos[i * 3 + 1] = rand() * 0.36;
    ePos[i * 3 + 2] = (rand() - 0.5) * 0.55;
    ePhase[i] = rand() * Math.PI * 2;
  }
  const emberGeo = new THREE.BufferGeometry();
  emberGeo.setAttribute('position', new THREE.BufferAttribute(ePos, 3));
  emberGeo.setAttribute('aPhase', new THREE.BufferAttribute(ePhase, 1));

  const emberMat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uReveal: { value: 0 }
    },
    vertexShader: /* glsl */ `
      uniform float uTime;
      attribute float aPhase;
      varying float vFade;
      void main() {
        vec3 p = position;
        p.y = mod(p.y + uTime * 0.045 + aPhase * 0.1, 0.42);
        p.x += sin(uTime * 1.1 + aPhase) * 0.018;
        vec4 mvPos = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mvPos;
        gl_PointSize = 10.0 * (1.0 / max(-mvPos.z, 0.35));
        vFade = sin(p.y / 0.42 * 3.14159265);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uReveal;
      varying float vFade;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        if (d > 0.5) discard;
        float g = pow(1.0 - d * 2.0, 2.2);
        gl_FragColor = vec4(1.0, 0.78, 0.32, g * vFade * uReveal * 0.85);
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const embers = new THREE.Points(emberGeo, emberMat);
  stage.add(embers);

  /* =========================================================================
     9. UPDATE & DISPOSE
  ========================================================================= */
  function setActive(active) {
    root.visible = active;
    for (const l of lights) l.visible = active;
  }

  function update(dt, elapsed, revealProgress) {
    const rev = easeOutCubic(revealProgress);
    stage.scale.setScalar(0.76 + 0.24 * rev);
    stage.position.y = -0.27 - (1 - rev) * 0.05;

    pondMat.uniforms.uTime.value = elapsed;
    pondMat.uniforms.uReveal.value = rev;
    moonMat.uniforms.uTime.value = elapsed;
    moonMat.uniforms.uReveal.value = rev;
    soundWaveMat.uniforms.uTime.value = elapsed;
    soundWaveMat.uniforms.uReveal.value = rev;
    petalMat.uniforms.uTime.value = elapsed;
    petalMat.uniforms.uReveal.value = rev;
    emberMat.uniforms.uTime.value = elapsed;
    emberMat.uniforms.uReveal.value = rev;

    bellPivot.rotation.z = Math.sin(elapsed * 1.9) * 0.06;

    for (const koi of koiList) {
      const { tail, radius, speed, phase } = koi.userData;
      const ang = elapsed * speed + phase;
      koi.position.set(
        Math.cos(ang) * radius,
        0.005,
        0.06 + Math.sin(ang) * (radius * 0.78)
      );
      koi.rotation.y = speed > 0 ? -ang : -ang + Math.PI;
      tail.rotation.y = Math.sin(elapsed * 8.0 + phase) * 0.35;
    }

    // Balanceo suave de sakura, bambu y faroles
    sakuraGroup.rotation.z = Math.sin(elapsed * 0.9) * 0.018;
    bambooGroup.rotation.z = Math.cos(elapsed * 1.1) * 0.022;
    lanterns.forEach((l, i) => {
      l.rotation.z = Math.sin(elapsed * 1.6 + i * 1.2) * 0.07;
      l.rotation.x = Math.cos(elapsed * 1.3 + i) * 0.04;
    });

    // Vuelo en circulo y aleteo de las grullas doradas
    for (const c of cranes) {
      const { radius, height, speed, phase } = c.userData.cfg;
      const ang = elapsed * speed + phase;
      const nx = Math.cos(ang) * radius;
      const nz = Math.sin(ang) * radius - 0.05;
      const ny = height + Math.sin(elapsed * 1.5 + phase) * 0.018;
      c.position.set(nx, ny, nz);
      // Orientar hacia la tangente de vuelo
      c.rotation.y = -ang;
      const flap = Math.sin(elapsed * 5.2 + phase * 2.0) * 0.45;
      c.userData.leftWing.rotation.z = flap;
      c.userData.rightWing.rotation.z = -flap;
    }

    // Parpadeo sutil de faroles
    const flickerA = 0.9 + 0.1 * Math.sin(elapsed * 4.5);
    const flickerB = 0.9 + 0.1 * Math.cos(elapsed * 3.8);
    lanternLightA.intensity = lanternLightA.userData.baseIntensity * flickerA * rev;
    lanternLightB.intensity = lanternLightB.userData.baseIntensity * flickerB * rev;
    hemiLight.intensity = hemiLight.userData.baseIntensity * rev;
    keyLight.intensity = keyLight.userData.baseIntensity * rev;
    crimsonRim.intensity = crimsonRim.userData.baseIntensity * rev;
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
