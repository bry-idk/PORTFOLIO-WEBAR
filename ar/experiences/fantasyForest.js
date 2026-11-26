import {
  GLSL_NOISE,
  createCanvasTexture,
  createSoftGlowTexture,
  createStarFlareTexture,
  disposeObject3D,
  easeOutCubic
} from '../shared.js';

/**
 * Experiencia AR — Target 1 (Indice 2 en targets.mind)
 * BOSQUE FANTASTICO // CRONICAS DE PALENQUE
 *
 * Diorama estilizado con relieve organico, arboles con copas SSS + viento,
 * vegetacion instanciada, hongos bioluminiscentes, god rays volumetricos GLSL,
 * niebla local con fBm y luciernagas con PointLights dinamicas.
 */
export function createFantasyForestExperience(THREE) {
  const root = new THREE.Group();
  root.name = 'FantasyForestExperience';

  const stage = new THREE.Group();
  stage.position.set(0, -0.34, 0.34);
  root.add(stage);

  // Semilla deterministica para composicion reproducible y equilibrada
  let seed = 1337;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };

  // Altura del relieve en cualquier (x, z) local del diorama
  const terrainRadius = 0.43;
  function getTerrainHeight(x, z) {
    const r = Math.hypot(x, z);
    const edgeFalloff = Math.max(0, 1 - Math.pow(r / terrainRadius, 2.2));
    const clearingFlat = Math.min(1, Math.pow(r / 0.17, 1.8));
    const hills =
      Math.sin(x * 7.6 + 0.6) * Math.cos(z * 6.8 - 0.3) * 0.042 +
      Math.sin(x * 13.0 - z * 11.0) * 0.014;
    const ridgeBack = Math.max(0, -z) * 0.10;
    return (hills * clearingFlat + ridgeBack) * edgeFalloff;
  }

  /* =========================================================================
     1. ILUMINACION CINEMATOGRAFICA LOCAL (AISLADA POR TARGET)
  ========================================================================= */
  const lights = [];

  const hemiLight = new THREE.HemisphereLight(0xffe7b3, 0x1b382a, 1.32);
  hemiLight.userData.baseIntensity = 1.32;
  stage.add(hemiLight);
  lights.push(hemiLight);

  const sunLight = new THREE.DirectionalLight(0xffcf78, 2.25);
  sunLight.userData.baseIntensity = 2.25;
  sunLight.position.set(-0.62, 1.05, 0.55);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.set(512, 512);
  sunLight.shadow.radius = 3.0;
  sunLight.shadow.camera.near = 0.2;
  sunLight.shadow.camera.far = 2.6;
  sunLight.shadow.camera.left = -0.58;
  sunLight.shadow.camera.right = 0.58;
  sunLight.shadow.camera.top = 0.58;
  sunLight.shadow.camera.bottom = -0.58;
  sunLight.shadow.bias = -0.0025;
  sunLight.target.position.set(0.04, 0.02, 0.0);
  stage.add(sunLight, sunLight.target);
  lights.push(sunLight);

  const twilightRim = new THREE.DirectionalLight(0x5288ff, 0.72);
  twilightRim.userData.baseIntensity = 0.72;
  twilightRim.position.set(0.65, 0.55, -0.75);
  twilightRim.target.position.set(0, 0.1, 0);
  stage.add(twilightRim, twilightRim.target);
  lights.push(twilightRim);

  // Dos PointLights dinamicas acopladas a luciernagas hero
  const fireflyLightA = new THREE.PointLight(0xffc94d, 0.75, 0.62, 2.0);
  fireflyLightA.userData.baseIntensity = 0.75;
  const fireflyLightB = new THREE.PointLight(0x66ffaa, 0.55, 0.52, 2.0);
  fireflyLightB.userData.baseIntensity = 0.55;
  stage.add(fireflyLightA, fireflyLightB);
  lights.push(fireflyLightA, fireflyLightB);

  const glowTex = createSoftGlowTexture(THREE, 128);
  const heroSpriteMatA = new THREE.SpriteMaterial({
    map: glowTex,
    color: 0xffdf80,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const heroSpriteA = new THREE.Sprite(heroSpriteMatA);
  heroSpriteA.scale.setScalar(0.055);
  fireflyLightA.add(heroSpriteA);

  const heroSpriteMatB = new THREE.SpriteMaterial({
    map: glowTex,
    color: 0x7effbf,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const heroSpriteB = new THREE.Sprite(heroSpriteMatB);
  heroSpriteB.scale.setScalar(0.048);
  fireflyLightB.add(heroSpriteB);

  /* =========================================================================
     2. TERRENO DIORAMA PBR + BASE DE ROCA/TIERRA OSCURA
  ========================================================================= */
  const terrainAlbedo = createCanvasTexture(
    THREE,
    512,
    512,
    (ctx, w, h) => {
      const cx = w * 0.5;
      const cy = h * 0.5;
      const bg = ctx.createRadialGradient(cx, cy, 18, cx, cy, w * 0.52);
      bg.addColorStop(0.0, '#6a7c38');
      bg.addColorStop(0.28, '#3f632b');
      bg.addColorStop(0.62, '#214222');
      bg.addColorStop(1.0, '#122618');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      // Sendero calido iluminado en el claro
      const pathGrad = ctx.createLinearGradient(w * 0.28, h * 0.18, w * 0.66, h * 0.88);
      pathGrad.addColorStop(0, 'rgba(182, 148, 72, 0.45)');
      pathGrad.addColorStop(0.5, 'rgba(145, 122, 58, 0.35)');
      pathGrad.addColorStop(1, 'rgba(85, 78, 42, 0.15)');
      ctx.fillStyle = pathGrad;
      ctx.beginPath();
      ctx.ellipse(w * 0.5, h * 0.52, w * 0.14, h * 0.36, -0.25, 0, Math.PI * 2);
      ctx.fill();

      // Motas de musgo, hojas caidas y microtextura
      for (let i = 0; i < 2600; i++) {
        const px = Math.random() * w;
        const py = Math.random() * h;
        const r = 1 + Math.random() * 4.5;
        const warm = Math.random() > 0.72;
        ctx.fillStyle = warm
          ? `rgba(195, 168, 74, ${0.05 + Math.random() * 0.11})`
          : `rgba(26, 68, 34, ${0.08 + Math.random() * 0.16})`;
        ctx.beginPath();
        ctx.arc(px, py, r, 0, Math.PI * 2);
        ctx.fill();
      }
    },
    { srgb: true, wrapS: THREE.ClampToEdgeWrapping, wrapT: THREE.ClampToEdgeWrapping }
  );

  const terrainBump = createCanvasTexture(
    THREE,
    512,
    512,
    (ctx, w, h) => {
      ctx.fillStyle = '#808080';
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 2200; i++) {
        const v = 95 + Math.floor(Math.random() * 75);
        ctx.fillStyle = `rgba(${v},${v},${v},0.28)`;
        ctx.beginPath();
        ctx.arc(Math.random() * w, Math.random() * h, 1 + Math.random() * 4, 0, Math.PI * 2);
        ctx.fill();
      }
    },
    { srgb: false, wrapS: THREE.ClampToEdgeWrapping, wrapT: THREE.ClampToEdgeWrapping }
  );

  const terrainGeo = new THREE.CircleGeometry(terrainRadius, 64, 0, Math.PI * 2);
  // Convertir a disco subdividido con anillos concentricos para relieve real
  terrainGeo.dispose();
  const radialSegs = 48;
  const ringSegs = 18;
  const discGeo = new THREE.RingGeometry(0.001, terrainRadius, radialSegs, ringSegs);
  discGeo.rotateX(-Math.PI / 2);
  const posAttr = discGeo.attributes.position;
  const uvAttr = discGeo.attributes.uv;
  for (let i = 0; i < posAttr.count; i++) {
    const vx = posAttr.getX(i);
    const vz = posAttr.getZ(i);
    posAttr.setY(i, getTerrainHeight(vx, vz));
    uvAttr.setXY(i, vx / (terrainRadius * 2) + 0.5, vz / (terrainRadius * 2) + 0.5);
  }
  discGeo.computeVertexNormals();

  const terrainMat = new THREE.MeshStandardMaterial({
    map: terrainAlbedo,
    bumpMap: terrainBump,
    bumpScale: 0.015,
    roughness: 0.88,
    metalness: 0.04
  });
  const terrainMesh = new THREE.Mesh(discGeo, terrainMat);
  terrainMesh.receiveShadow = true;
  stage.add(terrainMesh);

  // Falda / basamento organico inferior del diorama
  const plinthGeo = new THREE.CylinderGeometry(terrainRadius * 0.995, terrainRadius * 0.72, 0.065, 48, 1);
  const plinthMat = new THREE.MeshStandardMaterial({
    color: 0x161210,
    roughness: 0.92,
    metalness: 0.08
  });
  const plinthMesh = new THREE.Mesh(plinthGeo, plinthMat);
  plinthMesh.position.y = -0.033;
  plinthMesh.receiveShadow = true;
  stage.add(plinthMesh);

  /* =========================================================================
     3. ARBOLES ESTILIZADOS REALISTAS (CORTEZA PBR + COPAS SSS CON VIENTO)
  ========================================================================= */
  const barkAlbedo = createCanvasTexture(
    THREE,
    256,
    256,
    (ctx, w, h) => {
      ctx.fillStyle = '#3c2a1e';
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 160; i++) {
        const x = Math.random() * w;
        const bw = 2 + Math.random() * 5;
        ctx.fillStyle = i % 3 === 0 ? 'rgba(84, 62, 42, 0.45)' : 'rgba(22, 14, 10, 0.55)';
        ctx.fillRect(x, 0, bw, h);
      }
      // Liquen/musgo sutil en grietas
      for (let i = 0; i < 90; i++) {
        ctx.fillStyle = 'rgba(62, 92, 46, 0.24)';
        ctx.beginPath();
        ctx.arc(Math.random() * w, Math.random() * h, 2 + Math.random() * 6, 0, Math.PI * 2);
        ctx.fill();
      }
    },
    { srgb: true, repeat: [2, 3] }
  );

  const barkBump = createCanvasTexture(
    THREE,
    256,
    256,
    (ctx, w, h) => {
      ctx.fillStyle = '#808080';
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 140; i++) {
        const shade = i % 2 === 0 ? 190 : 50;
        ctx.fillStyle = `rgba(${shade},${shade},${shade},0.42)`;
        ctx.fillRect(Math.random() * w, 0, 2 + Math.random() * 4, h);
      }
    },
    { srgb: false, repeat: [2, 3] }
  );

  const barkMat = new THREE.MeshStandardMaterial({
    map: barkAlbedo,
    bumpMap: barkBump,
    bumpScale: 0.014,
    roughness: 0.9,
    metalness: 0.03
  });

  // Uniform compartido para viento en follaje y pasto
  const windUniform = { value: 0 };

  const foliageDetailMap = createCanvasTexture(
    THREE,
    256,
    256,
    (ctx, w, h) => {
      ctx.fillStyle = '#c8c8c8';
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 650; i++) {
        const shade = 140 + Math.floor(Math.random() * 115);
        ctx.fillStyle = `rgba(${shade}, ${Math.min(255, shade + 15)}, ${Math.max(80, shade - 30)}, 0.42)`;
        ctx.beginPath();
        ctx.ellipse(
          Math.random() * w,
          Math.random() * h,
          3 + Math.random() * 8,
          2 + Math.random() * 5,
          Math.random() * Math.PI,
          0,
          Math.PI * 2
        );
        ctx.fill();
      }
    },
    { srgb: true, repeat: [2, 2] }
  );

  function createFoliageMaterial(baseColorHex, rimColorHex, phase) {
    const mat = new THREE.MeshStandardMaterial({
      color: baseColorHex,
      map: foliageDetailMap,
      bumpMap: foliageDetailMap,
      bumpScale: 0.012,
      roughness: 0.68,
      metalness: 0.02,
      emissive: 0x1a260a,
      emissiveIntensity: 0.24
    });
    const rimColor = new THREE.Color(rimColorHex);
    mat.onBeforeCompile = (shader) => {
      shader.uniforms.uWindTime = windUniform;
      shader.uniforms.uPhase = { value: phase };
      shader.uniforms.uRimColor = { value: rimColor };

      shader.vertexShader = shader.vertexShader
        .replace(
          '#include <common>',
          /* glsl */ `
          #include <common>
          uniform float uWindTime;
          uniform float uPhase;
          varying vec3 vLocalDir;
          `
        )
        .replace(
          '#include <begin_vertex>',
          /* glsl */ `
          #include <begin_vertex>
          vLocalDir = normalize(position + vec3(0.0001));
          float sway = sin(uWindTime * 1.45 + uPhase + position.y * 4.5 + position.x * 3.0) * 0.014;
          transformed.x += sway * (0.4 + max(0.0, position.y + 0.5));
          transformed.z += cos(uWindTime * 1.15 + uPhase * 1.3 + position.z * 3.5) * 0.010;
          `
        );

      shader.fragmentShader = shader.fragmentShader
        .replace(
          '#include <common>',
          /* glsl */ `
          #include <common>
          uniform vec3 uRimColor;
          varying vec3 vLocalDir;
          `
        )
        .replace(
          '#include <emissivemap_fragment>',
          /* glsl */ `
          #include <emissivemap_fragment>
          vec3 nView = normalize(vNormal);
          float fresnel = pow(1.0 - abs(dot(nView, normalize(vViewPosition))), 2.1);
          float topSun = smoothstep(-0.2, 0.85, vLocalDir.y * 0.65 - vLocalDir.x * 0.35);
          totalEmissiveRadiance += uRimColor * (fresnel * 0.65 + topSun * 0.22);
          `
        );
    };
    return mat;
  }

  // Geometria organica suave de copa (subdivision 3 con deformacion multi-frecuencia)
  const canopyBaseGeo = new THREE.IcosahedronGeometry(1, 3);
  const cPos = canopyBaseGeo.attributes.position;
  for (let i = 0; i < cPos.count; i++) {
    const x = cPos.getX(i);
    const y = cPos.getY(i);
    const z = cPos.getZ(i);
    const n =
      1 +
      0.11 * Math.sin(x * 3.6 + y * 2.9) * Math.cos(z * 4.1) +
      0.05 * Math.sin(z * 7.2 - x * 6.0);
    cPos.setXYZ(i, x * n, y * n * 0.84, z * n);
  }
  canopyBaseGeo.computeVertexNormals();

  const foliagePalette = [
    [0x678f28, 0xffd260],
    [0x3e7828, 0xbbe85c],
    [0x869a24, 0xffe074],
    [0x265c2e, 0x7be895]
  ];

  const foliageMats = foliagePalette.map(([base, rim], idx) =>
    createFoliageMaterial(base, rim, idx * 1.7)
  );

  // 8 arboles rodeando el claro en arco atmosferico
  const treeSpecs = [
    { x: -0.28, z: 0.07, h: 0.33, r: 0.023, leanX: 0.045, leanZ: -0.02, matIdx: 0 },
    { x: 0.27, z: 0.08, h: 0.35, r: 0.024, leanX: -0.04, leanZ: -0.02, matIdx: 2 },
    { x: -0.22, z: -0.15, h: 0.40, r: 0.026, leanX: 0.03, leanZ: 0.03, matIdx: 1 },
    { x: 0.22, z: -0.17, h: 0.38, r: 0.025, leanX: -0.03, leanZ: 0.02, matIdx: 0 },
    { x: -0.07, z: -0.27, h: 0.36, r: 0.022, leanX: 0.01, leanZ: 0.03, matIdx: 3 },
    { x: 0.10, z: -0.28, h: 0.34, r: 0.021, leanX: -0.02, leanZ: 0.03, matIdx: 1 },
    { x: -0.32, z: -0.05, h: 0.27, r: 0.019, leanX: 0.035, leanZ: 0.01, matIdx: 2 },
    { x: 0.33, z: -0.06, h: 0.28, r: 0.019, leanX: -0.035, leanZ: 0.01, matIdx: 3 }
  ];

  treeSpecs.forEach((spec, idx) => {
    const tree = new THREE.Group();
    const baseY = getTerrainHeight(spec.x, spec.z);
    tree.position.set(spec.x, baseY - 0.01, spec.z);

    // Tronco curvado con raiz acampanada
    const trunkGeo = new THREE.CylinderGeometry(spec.r * 0.42, spec.r * 1.38, spec.h, 10, 8);
    const tp = trunkGeo.attributes.position;
    for (let i = 0; i < tp.count; i++) {
      const py = tp.getY(i);
      const t = Math.max(0, Math.min(1, (py + spec.h * 0.5) / spec.h)); // clamp evita NaN en Math.pow
      const curve = Math.pow(t, 1.5);
      const flare = t < 0.18 ? 1 + (0.18 - t) * 2.8 : 1.0;
      const vx = tp.getX(i) * flare + spec.leanX * curve;
      const vz = tp.getZ(i) * flare + spec.leanZ * curve;
      tp.setXYZ(i, vx, py + spec.h * 0.5, vz);
    }
    trunkGeo.computeVertexNormals();
    const trunk = new THREE.Mesh(trunkGeo, barkMat);
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    tree.add(trunk);

    // 2 ramas secundarias
    for (let b = 0; b < 2; b++) {
      const brLen = spec.h * 0.34;
      const brGeo = new THREE.CylinderGeometry(spec.r * 0.18, spec.r * 0.36, brLen, 7, 1);
      brGeo.translate(0, brLen * 0.5, 0);
      const branch = new THREE.Mesh(brGeo, barkMat);
      branch.position.set(spec.leanX * 0.6, spec.h * (0.58 + b * 0.12), spec.leanZ * 0.6);
      branch.rotation.z = (b === 0 ? 1 : -1) * (0.55 + rand() * 0.2);
      branch.rotation.y = idx * 1.1 + b * 2.4;
      branch.castShadow = true;
      tree.add(branch);
    }

    // Copas multicapa orgánicas
    const lobeCount = 4;
    for (let l = 0; l < lobeCount; l++) {
      const mat = foliageMats[(spec.matIdx + l) % foliageMats.length];
      const lobe = new THREE.Mesh(canopyBaseGeo, mat);
      const scale = spec.h * (l === 0 ? 0.34 : 0.22 + rand() * 0.08);
      const angle = (l / (lobeCount - 1)) * Math.PI * 2 + idx;
      const offR = l === 0 ? 0 : spec.h * 0.14;
      lobe.position.set(
        spec.leanX + Math.cos(angle) * offR,
        spec.h * (l === 0 ? 0.98 : 0.82 + rand() * 0.12),
        spec.leanZ + Math.sin(angle) * offR
      );
      lobe.scale.set(scale * 1.12, scale * 0.92, scale * 1.08);
      lobe.rotation.set(rand() * 0.4, rand() * Math.PI, rand() * 0.4);
      lobe.castShadow = true;
      lobe.receiveShadow = true;
      tree.add(lobe);
    }

    // Lianas colgantes sutiles en los arboles principales
    if (idx < 4) {
      for (let v = 0; v < 2; v++) {
        const vineLen = 0.07 + rand() * 0.05;
        const vine = new THREE.Mesh(
          new THREE.CylinderGeometry(0.0014, 0.0008, vineLen, 5),
          foliageMats[(spec.matIdx + v) % foliageMats.length]
        );
        vine.position.set(
          spec.leanX + (v === 0 ? -0.05 : 0.05),
          spec.h * 0.72 - vineLen * 0.5,
          spec.leanZ + (v === 0 ? 0.04 : -0.04)
        );
        tree.add(vine);
      }
    }

    stage.add(tree);
  });

  /* =========================================================================
     3B. SANTUARIO CENTRAL (PILARES CON LLAMA ETEREA) & ARROYO REFLECTIVO GLSL
  ========================================================================= */
  const sanctuaryGroup = new THREE.Group();
  stage.add(sanctuaryGroup);

  const carvedStoneMat = new THREE.MeshStandardMaterial({
    color: 0x454d59,
    roughness: 0.78,
    metalness: 0.18
  });

  const flameMat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uReveal: { value: 0 }
    },
    vertexShader: /* glsl */ `
      uniform float uTime;
      varying vec2 vUv;
      void main() {
        vUv = uv;
        vec3 p = position;
        float sway = sin(uTime * 5.0 + position.y * 28.0) * 0.004 * uv.y;
        p.x += sway;
        p.z += cos(uTime * 4.2 + position.y * 24.0) * 0.003 * uv.y;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      uniform float uReveal;
      varying vec2 vUv;
      ${GLSL_NOISE}

      void main() {
        float n = fbm2D(vec2(vUv.x * 5.0, vUv.y * 4.0 - uTime * 2.2));
        float shape = smoothstep(0.0, 0.25, vUv.y) * smoothstep(1.0, 0.15, vUv.y);
        vec3 blue = vec3(0.32, 0.65, 1.0);
        vec3 violet = vec3(0.68, 0.42, 1.0);
        vec3 core = vec3(0.92, 0.98, 1.0);
        vec3 col = mix(violet, blue, vUv.y);
        col = mix(col, core, smoothstep(0.55, 0.85, n) * (1.0 - vUv.y));
        gl_FragColor = vec4(col * 1.4, shape * (0.55 + 0.45 * n) * uReveal);
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide
  });

  // Dos pilares ceremoniales inspirados en target1.png
  const pillarPositions = [
    [-0.036, -0.02, 0.092],
    [0.036, -0.06, 0.112]
  ];
  pillarPositions.forEach(([px, pz, ph]) => {
    const py = getTerrainHeight(px, pz);
    const pBase = new THREE.Mesh(new THREE.BoxGeometry(0.032, 0.014, 0.032), carvedStoneMat);
    pBase.position.set(px, py + 0.006, pz);
    pBase.castShadow = true;
    pBase.receiveShadow = true;

    const pCol = new THREE.Mesh(new THREE.CylinderGeometry(0.010, 0.012, ph, 10), carvedStoneMat);
    pCol.position.set(px, py + ph * 0.5 + 0.01, pz);
    pCol.castShadow = true;

    const pCap = new THREE.Mesh(new THREE.BoxGeometry(0.026, 0.010, 0.026), carvedStoneMat);
    pCap.position.set(px, py + ph + 0.014, pz);

    const flame = new THREE.Mesh(new THREE.ConeGeometry(0.016, 0.042, 12, 6, true), flameMat);
    flame.position.set(px, py + ph + 0.04, pz);

    sanctuaryGroup.add(pBase, pCol, pCap, flame);
  });

  const pillarLight = new THREE.PointLight(0x7c8cff, 0.65, 0.45, 2.0);
  pillarLight.userData.baseIntensity = 0.65;
  pillarLight.position.set(0, 0.14, -0.04);
  stage.add(pillarLight);
  lights.push(pillarLight);

  // Pequeño arroyo/espejo de agua en el claro central
  const streamGeo = new THREE.PlaneGeometry(0.18, 0.34);
  streamGeo.rotateX(-Math.PI / 2);
  const streamMat = new THREE.ShaderMaterial({
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
        float n = fbm2D(vec2(vUv.x * 6.0, vUv.y * 8.0 - uTime * 0.45));
        float shape = smoothstep(0.46, 0.18, length(vec2(p.x * 1.4 + sin(vUv.y * 5.0) * 0.08, p.y)));
        vec3 col = mix(vec3(0.08, 0.16, 0.22), vec3(0.45, 0.72, 0.95), smoothstep(0.48, 0.78, n));
        col += vec3(1.0, 0.86, 0.48) * pow(n, 3.0) * 0.65;
        gl_FragColor = vec4(col, shape * 0.68 * uReveal);
      }
    `,
    transparent: true,
    depthWrite: false
  });
  const stream = new THREE.Mesh(streamGeo, streamMat);
  stream.position.set(0.02, 0.005, 0.11);
  stream.rotation.y = -0.25;
  stage.add(stream);

  /* =========================================================================
     4. VEGETACION INSTANCIADA (PASTO CON VIENTO), ROCAS Y HONGOS BIOLUMINISCENTES
  ========================================================================= */
  const bladeCount = 220;
  const bladeGeo = new THREE.ConeGeometry(0.0085, 0.068, 4, 3);
  bladeGeo.translate(0, 0.034, 0);
  // Curvar ligeramente la punta de la brizna
  const bPos = bladeGeo.attributes.position;
  for (let i = 0; i < bPos.count; i++) {
    const y = bPos.getY(i);
    bPos.setZ(i, bPos.getZ(i) + Math.pow(y / 0.068, 2.0) * 0.015);
  }
  bladeGeo.computeVertexNormals();

  const grassMat = new THREE.MeshStandardMaterial({
    color: 0x5c8c2c,
    roughness: 0.78,
    metalness: 0.02,
    emissive: 0x182606,
    emissiveIntensity: 0.25
  });
  grassMat.onBeforeCompile = (shader) => {
    shader.uniforms.uWindTime = windUniform;
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nuniform float uWindTime;')
      .replace(
        '#include <begin_vertex>',
        /* glsl */ `
        #include <begin_vertex>
        float tip = clamp(position.y / 0.068, 0.0, 1.0);
        #ifdef USE_INSTANCING
          float instSeed = instanceMatrix[3][0] * 19.0 + instanceMatrix[3][2] * 27.0;
        #else
          float instSeed = position.x * 19.0 + position.z * 27.0;
        #endif
        float gust = sin(uWindTime * 2.1 + instSeed) * 0.014;
        transformed.x += gust * tip * tip;
        transformed.z += cos(uWindTime * 1.7 + instSeed * 0.8) * 0.008 * tip * tip;
        `
      );
  };

  const grassInst = new THREE.InstancedMesh(bladeGeo, grassMat, bladeCount);
  grassInst.receiveShadow = true;
  const dummy = new THREE.Object3D();
  const grassTint = new THREE.Color();
  for (let i = 0; i < bladeCount; i++) {
    const a = rand() * Math.PI * 2;
    const rad = 0.06 + Math.sqrt(rand()) * (terrainRadius - 0.11);
    const gx = Math.cos(a) * rad;
    const gz = Math.sin(a) * rad;
    const gy = getTerrainHeight(gx, gz);
    dummy.position.set(gx, gy - 0.004, gz);
    dummy.rotation.set((rand() - 0.5) * 0.25, rand() * Math.PI * 2, (rand() - 0.5) * 0.25);
    const sc = 0.65 + rand() * 0.95;
    dummy.scale.set(sc, sc * (0.8 + rand() * 0.6), sc);
    dummy.updateMatrix();
    grassInst.setMatrixAt(i, dummy.matrix);

    grassTint.setHSL(0.22 + rand() * 0.09, 0.55 + rand() * 0.2, 0.34 + rand() * 0.18);
    grassInst.setColorAt(i, grassTint);
  }
  grassInst.instanceMatrix.needsUpdate = true;
  if (grassInst.instanceColor) grassInst.instanceColor.needsUpdate = true;
  stage.add(grassInst);

  // Rocas musgosas
  const rockGeo = new THREE.DodecahedronGeometry(0.04, 1);
  const rPos = rockGeo.attributes.position;
  for (let i = 0; i < rPos.count; i++) {
    const rx = rPos.getX(i);
    const ry = rPos.getY(i);
    const rz = rPos.getZ(i);
    const warp = 0.85 + 0.25 * Math.sin(rx * 50 + rz * 40);
    rPos.setXYZ(i, rx * warp, ry * 0.72 * warp, rz * warp);
  }
  rockGeo.computeVertexNormals();
  const rockMat = new THREE.MeshStandardMaterial({
    color: 0x3b443c,
    roughness: 0.92,
    metalness: 0.06
  });

  const rockCoords = [
    [-0.14, 0.14, 1.1],
    [0.16, 0.12, 0.9],
    [-0.21, -0.05, 1.3],
    [0.20, -0.10, 0.85],
    [0.02, -0.17, 1.25],
    [-0.06, 0.21, 0.75]
  ];
  for (const [rx, rz, sc] of rockCoords) {
    const rock = new THREE.Mesh(rockGeo, rockMat);
    rock.position.set(rx, getTerrainHeight(rx, rz) + 0.008, rz);
    rock.scale.setScalar(sc);
    rock.rotation.set(rand() * 0.5, rand() * Math.PI, rand() * 0.5);
    rock.castShadow = true;
    rock.receiveShadow = true;
    stage.add(rock);
  }

  // Hongos bioluminiscentes
  const stemGeo = new THREE.CylinderGeometry(0.0035, 0.0055, 0.026, 7);
  stemGeo.translate(0, 0.013, 0);
  const capGeo = new THREE.SphereGeometry(0.016, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.55);
  const stemMat = new THREE.MeshStandardMaterial({ color: 0xe6dec8, roughness: 0.7 });
  const mushroomMats = [
    new THREE.MeshStandardMaterial({
      color: 0xffb347,
      emissive: 0xff9a1f,
      emissiveIntensity: 1.8,
      roughness: 0.35
    }),
    new THREE.MeshStandardMaterial({
      color: 0x4bffc3,
      emissive: 0x1ee6a8,
      emissiveIntensity: 1.7,
      roughness: 0.35
    })
  ];

  const mushroomSpots = [
    [-0.12, 0.13, 0, 1.0],
    [-0.10, 0.15, 0, 0.7],
    [0.15, 0.09, 1, 1.05],
    [0.17, 0.11, 1, 0.65],
    [-0.24, -0.13, 1, 1.1],
    [-0.22, -0.11, 0, 0.75],
    [0.22, -0.14, 0, 1.0],
    [0.05, -0.19, 1, 0.9],
    [-0.05, 0.20, 0, 0.8]
  ];
  mushroomSpots.forEach(([mx, mz, colorIdx, sc], i) => {
    const mGroup = new THREE.Group();
    mGroup.position.set(mx, getTerrainHeight(mx, mz) - 0.002, mz);
    mGroup.scale.setScalar(sc);
    mGroup.rotation.z = (i % 2 === 0 ? 1 : -1) * 0.12;
    const stem = new THREE.Mesh(stemGeo, stemMat);
    const cap = new THREE.Mesh(capGeo, mushroomMats[colorIdx]);
    cap.position.y = 0.023;
    mGroup.add(stem, cap);
    stage.add(mGroup);
  });

  /* =========================================================================
     5. GOD RAYS VOLUMETRICOS (GLSL ADITIVO ANIMADO)
  ========================================================================= */
  const godRayGeo = new THREE.PlaneGeometry(0.42, 1.02, 1, 1);
  const godRayMat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uReveal: { value: 0 },
      uColor: { value: new THREE.Color(0xffd888) }
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      varying vec3 vNormalView;
      varying vec3 vViewPos;
      void main() {
        vUv = uv;
        vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
        vViewPos = -mvPos.xyz;
        vNormalView = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * mvPos;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      uniform float uReveal;
      uniform vec3 uColor;
      varying vec2 vUv;
      varying vec3 vNormalView;
      varying vec3 vViewPos;
      ${GLSL_NOISE}

      void main() {
        // Filamentos longitudinales suaves moviendose a traves del rayo
        float streak1 = fbm2D(vec2(vUv.x * 6.5 - uTime * 0.09, vUv.y * 1.4 + uTime * 0.05));
        float streak2 = noise2D(vec2(vUv.x * 13.0 + uTime * 0.06, vUv.y * 2.0));
        float beam = smoothstep(0.28, 0.85, streak1 * 0.72 + streak2 * 0.35);

        // Caida suave lateral (sin bordes duros) y vertical (mas intenso arriba)
        float edgeX = sin(vUv.x * 3.14159265);
        edgeX = pow(max(edgeX, 0.0), 1.9);
        float fadeTop = smoothstep(1.0, 0.65, vUv.y);
        float fadeBot = smoothstep(0.0, 0.45, vUv.y);

        // Atenuar cuando el plano queda casi de canto respecto a la camara
        float viewFade = pow(abs(dot(normalize(vNormalView), normalize(vViewPos))), 0.65);

        float alpha = beam * edgeX * fadeTop * fadeBot * viewFade * 0.31 * uReveal;
        gl_FragColor = vec4(uColor * (0.95 + beam * 0.55), alpha);
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide
  });

  const rayConfigs = [
    { pos: [-0.08, 0.24, 0.08], rotZ: -0.44, rotY: 0.25, scaleX: 1.05 },
    { pos: [0.06, 0.25, 0.02], rotZ: -0.42, rotY: -0.35, scaleX: 0.9 },
    { pos: [-0.02, 0.23, -0.06], rotZ: -0.45, rotY: 0.85, scaleX: 1.15 },
    { pos: [0.14, 0.22, 0.11], rotZ: -0.40, rotY: -0.8, scaleX: 0.82 },
    { pos: [-0.17, 0.24, -0.02], rotZ: -0.46, rotY: 1.35, scaleX: 0.85 }
  ];
  for (const rc of rayConfigs) {
    const ray = new THREE.Mesh(godRayGeo, godRayMat);
    ray.position.set(rc.pos[0], rc.pos[1], rc.pos[2]);
    ray.rotation.set(0.08, rc.rotY, rc.rotZ);
    ray.scale.x = rc.scaleX;
    stage.add(ray);
  }

  // Destello solar anamorfico suave entre las copas superiores (guiño a target1.png)
  const flareTex = createStarFlareTexture(THREE, 128);
  const sunFlare = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: flareTex,
      color: 0xffd578,
      transparent: true,
      opacity: 0.78,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    })
  );
  sunFlare.position.set(-0.18, 0.37, 0.06);
  sunFlare.scale.set(0.32, 0.095, 1);
  stage.add(sunFlare);

  /* =========================================================================
     6. NIEBLA AMBIENTAL LOCAL (SHADERS CON VIGNETTE RADIAL)
  ========================================================================= */
  const mistGeo = new THREE.PlaneGeometry(1.42, 1.42);
  mistGeo.rotateX(-Math.PI / 2);
  const mistMat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uReveal: { value: 0 },
      uColorA: { value: new THREE.Color(0x52c78c) },
      uColorB: { value: new THREE.Color(0xf6cf7a) }
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
      ${GLSL_NOISE}

      void main() {
        vec2 p = vUv * 3.2;
        float n1 = fbm2D(p + vec2(uTime * 0.045, -uTime * 0.025));
        float n2 = fbm2D(p * 1.6 + vec2(-uTime * 0.03, uTime * 0.035));
        float mist = smoothstep(0.35, 0.85, n1 * 0.6 + n2 * 0.45);

        float dist = length(vUv - 0.5) * 2.0;
        float radial = smoothstep(0.98, 0.22, dist);

        vec3 col = mix(uColorA, uColorB, smoothstep(0.25, 0.78, n2));
        gl_FragColor = vec4(col, mist * radial * 0.16 * uReveal);
      }
    `,
    transparent: true,
    depthWrite: false
  });

  [0.03, 0.075, 0.13].forEach((mh, idx) => {
    const mist = new THREE.Mesh(mistGeo, mistMat);
    mist.position.y = mh;
    mist.rotation.y = idx * 1.1;
    stage.add(mist);
  });

  /* =========================================================================
     7. LUCIERNAGAS Y ESPORAS / POLEN FLOTANTE (GLSL POINTS)
  ========================================================================= */
  const fireflyCount = 96;
  const ffPos = new Float32Array(fireflyCount * 3);
  const ffPhase = new Float32Array(fireflyCount);
  const ffSize = new Float32Array(fireflyCount);
  const ffHue = new Float32Array(fireflyCount);
  for (let i = 0; i < fireflyCount; i++) {
    const a = rand() * Math.PI * 2;
    const rad = 0.05 + Math.sqrt(rand()) * 0.72;
    ffPos[i * 3] = Math.cos(a) * rad;
    ffPos[i * 3 + 1] = 0.03 + rand() * 0.56;
    ffPos[i * 3 + 2] = Math.sin(a) * rad;
    ffPhase[i] = rand() * Math.PI * 2;
    ffSize[i] = 0.75 + rand() * 1.45;
    ffHue[i] = rand();
  }
  const ffGeo = new THREE.BufferGeometry();
  ffGeo.setAttribute('position', new THREE.BufferAttribute(ffPos, 3));
  ffGeo.setAttribute('aPhase', new THREE.BufferAttribute(ffPhase, 1));
  ffGeo.setAttribute('aSize', new THREE.BufferAttribute(ffSize, 1));
  ffGeo.setAttribute('aHue', new THREE.BufferAttribute(ffHue, 1));

  const ffMat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uReveal: { value: 0 }
    },
    vertexShader: /* glsl */ `
      uniform float uTime;
      attribute float aPhase;
      attribute float aSize;
      attribute float aHue;
      varying float vBlink;
      varying float vHue;

      void main() {
        vec3 p = position;
        p.x += sin(uTime * 0.85 + aPhase) * 0.045;
        p.y += sin(uTime * 1.15 + aPhase * 1.7) * 0.032;
        p.z += cos(uTime * 0.78 + aPhase * 1.3) * 0.045;

        vec4 mvPos = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mvPos;
        float blink = 0.35 + 0.65 * pow(0.5 + 0.5 * sin(uTime * 2.6 + aPhase * 3.0), 2.0);
        vBlink = blink;
        vHue = aHue;
        gl_PointSize = aSize * (22.0 + 12.0 * blink) * (1.0 / max(-mvPos.z, 0.35));
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uReveal;
      varying float vBlink;
      varying float vHue;

      void main() {
        float d = length(gl_PointCoord - vec2(0.5));
        if (d > 0.5) discard;
        float core = exp(-d * 9.5);
        float halo = pow(max(0.0, 1.0 - d * 2.0), 2.4);
        vec3 gold = vec3(1.0, 0.85, 0.32);
        vec3 mint = vec3(0.45, 1.0, 0.72);
        vec3 col = mix(gold, mint, smoothstep(0.65, 1.0, vHue));
        col = mix(col, vec3(1.0, 0.98, 0.9), core);
        gl_FragColor = vec4(col, (halo * 0.85 + core * 0.6) * vBlink * uReveal);
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const fireflies = new THREE.Points(ffGeo, ffMat);
  stage.add(fireflies);

  // Esporas / polen flotando en los haces de luz
  const pollenCount = 220;
  const polPos = new Float32Array(pollenCount * 3);
  const polPhase = new Float32Array(pollenCount);
  for (let i = 0; i < pollenCount; i++) {
    polPos[i * 3] = (rand() - 0.5) * 1.35;
    polPos[i * 3 + 1] = 0.02 + rand() * 0.66;
    polPos[i * 3 + 2] = (rand() - 0.5) * 1.10;
    polPhase[i] = rand() * Math.PI * 2;
  }
  const polGeo = new THREE.BufferGeometry();
  polGeo.setAttribute('position', new THREE.BufferAttribute(polPos, 3));
  polGeo.setAttribute('aPhase', new THREE.BufferAttribute(polPhase, 1));

  const polMat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uReveal: { value: 0 }
    },
    vertexShader: /* glsl */ `
      uniform float uTime;
      attribute float aPhase;
      varying float vAlpha;

      void main() {
        vec3 p = position;
        p.y = mod(p.y + uTime * 0.032 + aPhase * 0.06, 0.68) + 0.02;
        p.x += sin(uTime * 0.5 + aPhase) * 0.025;
        p.z += cos(uTime * 0.42 + aPhase * 1.2) * 0.025;

        vec4 mvPos = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mvPos;
        gl_PointSize = (9.0 + 4.0 * sin(aPhase + uTime)) * (1.0 / max(-mvPos.z, 0.35));
        vAlpha = 0.35 + 0.45 * sin(uTime * 1.4 + aPhase * 2.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uReveal;
      varying float vAlpha;
      void main() {
        float d = length(gl_PointCoord - vec2(0.5));
        if (d > 0.5) discard;
        float glow = pow(1.0 - d * 2.0, 2.0);
        gl_FragColor = vec4(1.0, 0.90, 0.58, glow * vAlpha * uReveal * 0.72);
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const pollen = new THREE.Points(polGeo, polMat);
  stage.add(pollen);

  /* =========================================================================
     8. ACTUALIZACION Y LIMPIEZA
  ========================================================================= */
  function setActive(active) {
    root.visible = active;
    for (const l of lights) l.visible = active;
  }

  function update(dt, elapsed, revealProgress) {
    const rev = easeOutCubic(revealProgress);
    stage.scale.setScalar((0.76 + 0.24 * rev) * 1.36);
    stage.position.y = -0.34 - (1 - rev) * 0.06;

    windUniform.value = elapsed;
    godRayMat.uniforms.uTime.value = elapsed;
    godRayMat.uniforms.uReveal.value = rev;
    flameMat.uniforms.uTime.value = elapsed;
    flameMat.uniforms.uReveal.value = rev;
    streamMat.uniforms.uTime.value = elapsed;
    streamMat.uniforms.uReveal.value = rev;
    mistMat.uniforms.uTime.value = elapsed;
    mistMat.uniforms.uReveal.value = rev;
    ffMat.uniforms.uTime.value = elapsed;
    ffMat.uniforms.uReveal.value = rev;
    polMat.uniforms.uTime.value = elapsed;
    polMat.uniforms.uReveal.value = rev;

    const flarePulse = 0.92 + 0.1 * Math.sin(elapsed * 1.4);
    sunFlare.scale.set(0.32 * flarePulse * rev, 0.095 * flarePulse * rev, 1);
    pillarLight.intensity = pillarLight.userData.baseIntensity * (0.85 + 0.2 * Math.sin(elapsed * 4.2)) * rev;

    // Movimiento 3D de las luciernagas hero con luz dinamica
    fireflyLightA.position.set(
      Math.sin(elapsed * 0.72) * 0.18,
      0.13 + Math.sin(elapsed * 1.35) * 0.045,
      Math.cos(elapsed * 0.56) * 0.16
    );
    const pulseA = 0.75 + 0.35 * Math.sin(elapsed * 3.1);
    fireflyLightA.intensity = fireflyLightA.userData.baseIntensity * pulseA * rev;
    heroSpriteA.scale.setScalar(0.045 + 0.015 * pulseA);

    fireflyLightB.position.set(
      Math.cos(elapsed * 0.62 + 1.4) * 0.21,
      0.17 + Math.cos(elapsed * 1.15) * 0.05,
      Math.sin(elapsed * 0.85 + 0.7) * 0.15
    );
    const pulseB = 0.75 + 0.35 * Math.sin(elapsed * 2.6 + 1.8);
    fireflyLightB.intensity = fireflyLightB.userData.baseIntensity * pulseB * rev;
    heroSpriteB.scale.setScalar(0.040 + 0.014 * pulseB);

    // Pulso suave de hongos bioluminiscentes
    mushroomMats[0].emissiveIntensity = (1.25 + 0.45 * Math.sin(elapsed * 1.8)) * rev;
    mushroomMats[1].emissiveIntensity = (1.2 + 0.45 * Math.cos(elapsed * 1.6)) * rev;

    hemiLight.intensity = hemiLight.userData.baseIntensity * rev;
    sunLight.intensity = sunLight.userData.baseIntensity * rev;
    twilightRim.intensity = twilightRim.userData.baseIntensity * rev;
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
