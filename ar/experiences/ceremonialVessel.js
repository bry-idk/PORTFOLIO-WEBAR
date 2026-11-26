import {
  GLSL_NOISE,
  createCanvasTexture,
  disposeObject3D,
  easeOutCubic
} from '../shared.js';

/**
 * Experiencia AR — Target 3 (Indice 2 en targets.mind)
 * VASIJA CEREMONIAL // ARTEFACTO AUREO
 *
 * Vasija ceremonial tridimensional (LatheGeometry de alta resolucion con grosor real),
 * texturas PBR procedurales 1024x1024 (oro martillado + grecas precolombinas + bump + emissive),
 * aura Fresnel GLSL, energia interior, pedestal ritual con sombra real, anillos orbitales
 * y vortice espiral de 280 particulas doradas.
 */
export function createCeremonialVesselExperience(THREE) {
  const root = new THREE.Group();
  root.name = 'CeremonialVesselExperience';

  const stage = new THREE.Group();
  stage.position.set(0, -0.34, 0.34);
  root.add(stage);

  let seed = 8089;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };

  /* =========================================================================
     1. ILUMINACION DINAMICA Y SOMBRAS
  ========================================================================= */
  const lights = [];

  const hemiLight = new THREE.HemisphereLight(0xffe0a3, 0x3b0f1b, 0.95);
  hemiLight.userData.baseIntensity = 0.95;
  stage.add(hemiLight);
  lights.push(hemiLight);

  const keyLight = new THREE.DirectionalLight(0xffe3a8, 2.2);
  keyLight.userData.baseIntensity = 2.2;
  keyLight.position.set(-0.45, 1.05, 0.55);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(512, 512);
  keyLight.shadow.camera.near = 0.2;
  keyLight.shadow.camera.far = 2.4;
  keyLight.shadow.camera.left = -0.5;
  keyLight.shadow.camera.right = 0.5;
  keyLight.shadow.camera.top = 0.5;
  keyLight.shadow.camera.bottom = -0.5;
  keyLight.shadow.bias = -0.002;
  keyLight.target.position.set(0, 0.14, 0);
  stage.add(keyLight, keyLight.target);
  lights.push(keyLight);

  // Luces dinamicas orbitando alrededor de la vasija (oro calido + contraluz borgona)
  const orbitLightGold = new THREE.PointLight(0xffcf56, 1.35, 1.1, 1.8);
  orbitLightGold.userData.baseIntensity = 1.35;
  const orbitLightCrimson = new THREE.PointLight(0xc2254c, 1.05, 1.0, 1.8);
  orbitLightCrimson.userData.baseIntensity = 1.05;
  const coreLight = new THREE.PointLight(0xffaa33, 0.8, 0.55, 2.0);
  coreLight.userData.baseIntensity = 0.8;
  coreLight.position.set(0, 0.34, 0);
  stage.add(orbitLightGold, orbitLightCrimson, coreLight);
  lights.push(orbitLightGold, orbitLightCrimson, coreLight);

  /* =========================================================================
     2. TEXTURAS PBR PROCEDURALES 1024x1024 (ALBEDO + BUMP + EMISSIVE)
  ========================================================================= */
  const vesselAlbedo = createCanvasTexture(
    THREE,
    1024,
    1024,
    (ctx, w, h) => {
      // Base de oro ceremonial bruñido con gradiente calido vertical
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0.0, '#ffe28a');
      grad.addColorStop(0.28, '#e3ad44');
      grad.addColorStop(0.55, '#c98827');
      grad.addColorStop(0.82, '#8c5519');
      grad.addColorStop(1.0, '#4f2c12');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Estrias de torno artesanal horizontales
      for (let y = 0; y < h; y += 3) {
        const alpha = 0.04 + Math.random() * 0.07;
        ctx.fillStyle = y % 6 === 0 ? `rgba(255, 240, 185, ${alpha})` : `rgba(55, 28, 8, ${alpha})`;
        ctx.fillRect(0, y, w, 1 + Math.random() * 2);
      }

      // Textura martillada sutil
      for (let i = 0; i < 3500; i++) {
        const px = Math.random() * w;
        const py = Math.random() * h;
        const r = 2 + Math.random() * 7;
        ctx.fillStyle =
          i % 2 === 0 ? 'rgba(255, 232, 160, 0.055)' : 'rgba(65, 32, 10, 0.065)';
        ctx.beginPath();
        ctx.ellipse(px, py, r * 1.4, r * 0.8, Math.random() * Math.PI, 0, Math.PI * 2);
        ctx.fill();
      }

      // Bandas ceremoniales precolombinas (zigzag + grecas escalonadas)
      const bandY1 = h * 0.36;
      const bandY2 = h * 0.56;
      ctx.strokeStyle = 'rgba(64, 30, 8, 0.68)';
      ctx.lineWidth = 7;

      // Filetes horizontales
      [bandY1 - 28, bandY1 + 28, bandY2 - 34, bandY2 + 34].forEach((by) => {
        ctx.beginPath();
        ctx.moveTo(0, by);
        ctx.lineTo(w, by);
        ctx.stroke();
      });

      // Zig-zag geometrico en banda superior
      ctx.beginPath();
      const step1 = w / 24;
      for (let x = 0; x <= w; x += step1) {
        const yOff = (Math.round(x / step1) % 2 === 0 ? -18 : 18);
        if (x === 0) ctx.moveTo(x, bandY1 + yOff);
        else ctx.lineTo(x, bandY1 + yOff);
      }
      ctx.stroke();

      // Grecas cuadradas en banda del vientre
      const step2 = w / 16;
      ctx.beginPath();
      for (let i = 0; i < 16; i++) {
        const x0 = i * step2;
        ctx.moveTo(x0 + 8, bandY2 + 20);
        ctx.lineTo(x0 + 8, bandY2 - 20);
        ctx.lineTo(x0 + step2 * 0.65, bandY2 - 20);
        ctx.lineTo(x0 + step2 * 0.65, bandY2 + 6);
        ctx.lineTo(x0 + step2 * 0.38, bandY2 + 6);
      }
      ctx.stroke();
    },
    { srgb: true }
  );

  const vesselBump = createCanvasTexture(
    THREE,
    1024,
    1024,
    (ctx, w, h) => {
      ctx.fillStyle = '#868686';
      ctx.fillRect(0, 0, w, h);

      for (let y = 0; y < h; y += 3) {
        const shade = y % 6 === 0 ? 158 : 106;
        ctx.fillStyle = `rgba(${shade},${shade},${shade},0.35)`;
        ctx.fillRect(0, y, w, 2);
      }

      for (let i = 0; i < 3200; i++) {
        const shade = i % 2 === 0 ? 168 : 96;
        ctx.fillStyle = `rgba(${shade},${shade},${shade},0.16)`;
        ctx.beginPath();
        ctx.arc(Math.random() * w, Math.random() * h, 2 + Math.random() * 5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Surcos tallados profundos (oscuros en bump)
      ctx.strokeStyle = '#202020';
      ctx.lineWidth = 8;
      const bandY1 = h * 0.36;
      const bandY2 = h * 0.56;
      [bandY1 - 28, bandY1 + 28, bandY2 - 34, bandY2 + 34].forEach((by) => {
        ctx.beginPath();
        ctx.moveTo(0, by);
        ctx.lineTo(w, by);
        ctx.stroke();
      });

      const step1 = w / 24;
      ctx.beginPath();
      for (let x = 0; x <= w; x += step1) {
        const yOff = (Math.round(x / step1) % 2 === 0 ? -18 : 18);
        if (x === 0) ctx.moveTo(x, bandY1 + yOff);
        else ctx.lineTo(x, bandY1 + yOff);
      }
      ctx.stroke();

      const step2 = w / 16;
      ctx.beginPath();
      for (let i = 0; i < 16; i++) {
        const x0 = i * step2;
        ctx.moveTo(x0 + 8, bandY2 + 20);
        ctx.lineTo(x0 + 8, bandY2 - 20);
        ctx.lineTo(x0 + step2 * 0.65, bandY2 - 20);
        ctx.lineTo(x0 + step2 * 0.65, bandY2 + 6);
        ctx.lineTo(x0 + step2 * 0.38, bandY2 + 6);
      }
      ctx.stroke();
    },
    { srgb: false }
  );

  const vesselEmissive = createCanvasTexture(
    THREE,
    1024,
    1024,
    (ctx, w, h) => {
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, w, h);

      ctx.strokeStyle = '#ffbe42';
      ctx.lineWidth = 5;
      ctx.shadowColor = '#ffaa22';
      ctx.shadowBlur = 12;

      const bandY1 = h * 0.36;
      const bandY2 = h * 0.56;

      const step1 = w / 24;
      ctx.beginPath();
      for (let x = 0; x <= w; x += step1) {
        const yOff = (Math.round(x / step1) % 2 === 0 ? -18 : 18);
        if (x === 0) ctx.moveTo(x, bandY1 + yOff);
        else ctx.lineTo(x, bandY1 + yOff);
      }
      ctx.stroke();

      const step2 = w / 16;
      ctx.beginPath();
      for (let i = 0; i < 16; i++) {
        const x0 = i * step2;
        ctx.moveTo(x0 + 8, bandY2 + 20);
        ctx.lineTo(x0 + 8, bandY2 - 20);
        ctx.lineTo(x0 + step2 * 0.65, bandY2 - 20);
        ctx.lineTo(x0 + step2 * 0.65, bandY2 + 6);
        ctx.lineTo(x0 + step2 * 0.38, bandY2 + 6);
      }
      ctx.stroke();
    },
    { srgb: true }
  );

  const vesselRoughness = createCanvasTexture(
    THREE,
    1024,
    1024,
    (ctx, w, h) => {
      // Base metalica satinada (~0.28)
      ctx.fillStyle = '#4a4a4a';
      ctx.fillRect(0, 0, w, h);

      // Bandas ligeramente mas pulidas en relieve
      for (let y = 0; y < h; y += 3) {
        const v = y % 6 === 0 ? 38 : 74;
        ctx.fillStyle = `rgba(${v},${v},${v},0.35)`;
        ctx.fillRect(0, y, w, 2);
      }

      // Surcos tallados mate (~0.78) para contraste real entre metal bruñido y ceramica grabada
      ctx.strokeStyle = '#c8c8c8';
      ctx.lineWidth = 9;
      const bandY1 = h * 0.36;
      const bandY2 = h * 0.56;
      [bandY1 - 28, bandY1 + 28, bandY2 - 34, bandY2 + 34].forEach((by) => {
        ctx.beginPath();
        ctx.moveTo(0, by);
        ctx.lineTo(w, by);
        ctx.stroke();
      });
    },
    { srgb: false }
  );

  /* =========================================================================
     3. VASIJA HERO (LATHEGEOMETRY CON GROSOR REAL) + AURA FRESNEL GLSL
  ========================================================================= */
  // Perfil fiel a target3.png: base conica, vientre amplio, cuello cenido, boca acampanada
  const profilePoints = [
    new THREE.Vector2(0.001, 0.00),
    new THREE.Vector2(0.036, 0.002),
    new THREE.Vector2(0.044, 0.025),
    new THREE.Vector2(0.072, 0.085),
    new THREE.Vector2(0.118, 0.155),
    new THREE.Vector2(0.146, 0.215),
    new THREE.Vector2(0.140, 0.265),
    new THREE.Vector2(0.108, 0.315),
    new THREE.Vector2(0.098, 0.345),
    new THREE.Vector2(0.114, 0.378),
    new THREE.Vector2(0.132, 0.402),
    new THREE.Vector2(0.130, 0.412),
    // Borde superior redondeado hacia el interior
    new THREE.Vector2(0.118, 0.410),
    new THREE.Vector2(0.104, 0.382),
    new THREE.Vector2(0.086, 0.342),
    new THREE.Vector2(0.098, 0.285),
    new THREE.Vector2(0.001, 0.230)
  ];

  const vesselGroup = new THREE.Group();
  vesselGroup.position.set(0, 0.065, 0);
  stage.add(vesselGroup);

  const vesselGeo = new THREE.LatheGeometry(profilePoints, 64);
  // Invertir V para que la parte superior del canvas quede arriba
  const vUv = vesselGeo.attributes.uv;
  for (let i = 0; i < vUv.count; i++) {
    vUv.setY(i, 1.0 - vUv.getY(i));
  }
  vesselGeo.computeVertexNormals();

  const vesselMat = new THREE.MeshPhysicalMaterial({
    map: vesselAlbedo,
    bumpMap: vesselBump,
    bumpScale: 0.009,
    roughnessMap: vesselRoughness,
    emissiveMap: vesselEmissive,
    emissive: new THREE.Color(0xffb433),
    emissiveIntensity: 0.95,
    metalness: 0.88,
    roughness: 1.0,
    clearcoat: 0.4,
    clearcoatRoughness: 0.2,
    envMapIntensity: 1.45
  });
  const vesselMesh = new THREE.Mesh(vesselGeo, vesselMat);
  vesselMesh.castShadow = true;
  vesselMesh.receiveShadow = true;
  vesselGroup.add(vesselMesh);

  // Aura Fresnel dorada perimetral (recrea el glow exacto de target3.png)
  const outerProfile = profilePoints.slice(0, 12);
  const auraGeo = new THREE.LatheGeometry(outerProfile, 48);
  const auraMat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uReveal: { value: 0 },
      uColor: { value: new THREE.Color(0xffcf54) }
    },
    vertexShader: /* glsl */ `
      varying vec3 vNormalView;
      varying vec3 vViewDir;
      varying vec2 vUv;
      void main() {
        vUv = uv;
        vec3 displaced = position + normal * 0.007;
        vec4 mvPos = modelViewMatrix * vec4(displaced, 1.0);
        vNormalView = normalize(normalMatrix * normal);
        vViewDir = normalize(-mvPos.xyz);
        gl_Position = projectionMatrix * mvPos;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      uniform float uReveal;
      uniform vec3 uColor;
      varying vec3 vNormalView;
      varying vec3 vViewDir;
      varying vec2 vUv;
      ${GLSL_NOISE}

      void main() {
        float ndotv = abs(dot(normalize(vNormalView), normalize(vViewDir)));
        float fresnel = pow(1.0 - ndotv, 2.5);
        float shimmer = 0.82 + 0.32 * fbm2D(vec2(vUv.x * 6.0 + uTime * 0.18, vUv.y * 5.0 - uTime * 0.28));
        // Onda de escaneo ceremonial ascendente (interaccion museografica Proyecto ALFAR)
        float scanPos = fract(uTime * 0.26);
        float scanBand = exp(-abs(fract(vUv.y) - scanPos) * 24.0) * 0.65;
        float pulse = 0.88 + 0.12 * sin(uTime * 2.2);
        float alpha = (fresnel * shimmer * pulse + scanBand * (0.35 + fresnel)) * 0.92 * uReveal;
        vec3 col = mix(uColor * (1.1 + fresnel * 0.5), vec3(1.0, 0.96, 0.78), scanBand);
        gl_FragColor = vec4(col, alpha);
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const auraMesh = new THREE.Mesh(auraGeo, auraMat);
  vesselGroup.add(auraMesh);

  // Energia luminosa interna emanando desde la boca de la vasija
  const innerGlowGeo = new THREE.CylinderGeometry(0.155, 0.082, 0.20, 32, 1, true);
  innerGlowGeo.translate(0, 0.10, 0);
  const innerGlowMat = new THREE.ShaderMaterial({
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
        float n = fbm2D(vec2(vUv.x * 5.0 - uTime * 0.25, vUv.y * 3.0 - uTime * 0.4));
        float fadeY = smoothstep(1.0, 0.15, vUv.y) * smoothstep(0.0, 0.25, vUv.y);
        float alpha = fadeY * (0.25 + 0.45 * n) * 0.45 * uReveal;
        gl_FragColor = vec4(1.0, 0.82, 0.36, alpha);
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide
  });
  const innerGlow = new THREE.Mesh(innerGlowGeo, innerGlowMat);
  innerGlow.position.y = 0.31;
  vesselGroup.add(innerGlow);

  /* =========================================================================
     4. PEDESTAL RITUAL (CON SOMBRA) & ANILLOS DE ENERGIA ORBITALES
  ========================================================================= */
  const plinthTex = createCanvasTexture(
    THREE,
    512,
    512,
    (ctx, w, h) => {
      const cx = w * 0.5;
      const cy = h * 0.5;
      const bg = ctx.createRadialGradient(cx, cy, 12, cx, cy, w * 0.5);
      bg.addColorStop(0.0, '#30201a');
      bg.addColorStop(0.55, '#1d1414');
      bg.addColorStop(1.0, '#0e0a0c');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      ctx.strokeStyle = 'rgba(245, 184, 65, 0.45)';
      ctx.lineWidth = 3;
      [0.2, 0.33, 0.43].forEach((frac) => {
        ctx.beginPath();
        ctx.arc(cx, cy, w * frac, 0, Math.PI * 2);
        ctx.stroke();
      });

      // Marcas radiales sagradas
      for (let i = 0; i < 24; i++) {
        const a = (i / 24) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a) * w * 0.35, cy + Math.sin(a) * w * 0.35);
        ctx.lineTo(cx + Math.cos(a) * w * 0.41, cy + Math.sin(a) * w * 0.41);
        ctx.stroke();
      }
    },
    { srgb: true }
  );

  const plinthGeo = new THREE.CylinderGeometry(0.28, 0.31, 0.036, 48);
  const plinthMat = new THREE.MeshStandardMaterial({
    map: plinthTex,
    roughness: 0.72,
    metalness: 0.25
  });
  const plinthSideMat = new THREE.MeshStandardMaterial({
    color: 0x150d10,
    roughness: 0.68,
    metalness: 0.32
  });
  const plinthMesh = new THREE.Mesh(plinthGeo, [plinthSideMat, plinthMat, plinthSideMat]);
  plinthMesh.position.y = -0.018;
  plinthMesh.receiveShadow = true;
  stage.add(plinthMesh);

  // Bisel metalico dorado alrededor del borde del pedestal
  const plinthRim = new THREE.Mesh(
    new THREE.TorusGeometry(0.28, 0.0045, 8, 48),
    new THREE.MeshStandardMaterial({
      color: 0xe6b44c,
      emissive: 0x3b2204,
      emissiveIntensity: 0.35,
      metalness: 0.9,
      roughness: 0.22
    })
  );
  plinthRim.rotation.x = Math.PI / 2;
  plinthRim.position.y = 0.0;
  stage.add(plinthRim);

  // Halo de contraluz volumetrico borgona-dorado detras de la pieza
  const backHaloGeo = new THREE.PlaneGeometry(0.86, 0.86);
  const backHaloMat = new THREE.ShaderMaterial({
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
        float n = fbm2D(vUv * 4.0 + vec2(uTime * 0.08, -uTime * 0.06));
        float glow = exp(-r * 2.6) * (0.75 + 0.35 * n);
        vec3 col = mix(vec3(0.68, 0.14, 0.28), vec3(1.0, 0.72, 0.24), exp(-r * 3.8));
        float edge = smoothstep(1.0, 0.45, r);
        gl_FragColor = vec4(col, glow * edge * 0.55 * uReveal);
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide
  });
  const backHalo = new THREE.Mesh(backHaloGeo, backHaloMat);
  backHalo.position.set(0, 0.27, -0.14);
  stage.add(backHalo);

  // 14 fragmentos / esquirlas ceremoniales doradas orbitando lentamente
  const shardGeo = new THREE.OctahedronGeometry(0.011, 0);
  const shardMat = new THREE.MeshStandardMaterial({
    color: 0xffd369,
    emissive: 0x804406,
    emissiveIntensity: 0.45,
    metalness: 0.9,
    roughness: 0.2
  });
  const shards = [];
  for (let i = 0; i < 14; i++) {
    const s = new THREE.Mesh(shardGeo, shardMat);
    s.userData = {
      ang: (i / 14) * Math.PI * 2,
      rad: 0.21 + rand() * 0.17,
      yBase: 0.10 + rand() * 0.42,
      speed: (i % 2 === 0 ? 1 : -1) * (0.25 + rand() * 0.25),
      scale: 0.72 + rand() * 0.82
    };
    s.scale.set(s.userData.scale, s.userData.scale * 1.45, s.userData.scale * 0.7);
    stage.add(s);
    shards.push(s);
  }

  // Dos anillos de filamentos energeticos orbitando la vasija
  const energyRingMat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uReveal: { value: 0 },
      uColor: { value: new THREE.Color(0xffc94d) }
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
        float flow = 0.5 + 0.5 * sin(vUv.x * 25.1327 - uTime * 3.4);
        float dash = smoothstep(0.15, 0.95, flow);
        float core = 1.0 - abs(vUv.y - 0.5) * 2.0;
        float alpha = pow(max(core, 0.0), 1.6) * (0.25 + 0.75 * dash) * uReveal;
        gl_FragColor = vec4(uColor * 1.25, alpha);
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide
  });

  const ring1 = new THREE.Mesh(new THREE.TorusGeometry(0.21, 0.0032, 8, 96), energyRingMat);
  ring1.position.y = 0.27;
  ring1.rotation.set(1.22, 0.35, 0);
  const ring2 = new THREE.Mesh(new THREE.TorusGeometry(0.25, 0.0026, 8, 96), energyRingMat);
  ring2.position.y = 0.29;
  ring2.rotation.set(-1.18, -0.45, 0.2);
  stage.add(ring1, ring2);

  /* =========================================================================
     5. VORTICE DE PARTICULAS INTERACTIVO CON LA SILUETA DE LA VASIJA (GLSL)
  ========================================================================= */
  const vortexCount = 330;
  const vxPhase = new Float32Array(vortexCount);
  const vxSeed = new Float32Array(vortexCount * 3);
  const vxDummyPos = new Float32Array(vortexCount * 3);
  for (let i = 0; i < vortexCount; i++) {
    vxPhase[i] = rand();
    vxSeed[i * 3] = rand() * Math.PI * 2;
    vxSeed[i * 3 + 1] = 0.65 + rand() * 0.9;
    vxSeed[i * 3 + 2] = 0.018 + rand() * 0.055; // offset radial del contorno
    vxDummyPos[i * 3] = 0;
    vxDummyPos[i * 3 + 1] = 0;
    vxDummyPos[i * 3 + 2] = 0;
  }
  const vortexGeo = new THREE.BufferGeometry();
  vortexGeo.setAttribute('position', new THREE.BufferAttribute(vxDummyPos, 3));
  vortexGeo.setAttribute('aPhase', new THREE.BufferAttribute(vxPhase, 1));
  vortexGeo.setAttribute('aSeed', new THREE.BufferAttribute(vxSeed, 3));

  const vortexMat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uReveal: { value: 0 }
    },
    vertexShader: /* glsl */ `
      uniform float uTime;
      attribute float aPhase;
      attribute vec3 aSeed;
      varying float vAlpha;
      varying float vHeat;

      void main() {
        float hNorm = fract(aPhase + uTime * 0.14 * aSeed.y);
        // Contorno aproximado del perfil de la vasija (base -> vientre -> cuello -> boca)
        float belly = sin(clamp(hNorm * 1.15, 0.0, 1.0) * 3.14159265);
        float neck = smoothstep(0.55, 0.78, hNorm) * (1.0 - smoothstep(0.78, 1.0, hNorm));
        float r = 0.075 + belly * 0.095 - neck * 0.04 + aSeed.z;
        // Acelerar giro al ceñirse en el cuello
        float angle = aSeed.x + uTime * (1.1 + neck * 0.8) + hNorm * 6.2831;

        vec3 pos = vec3(
          cos(angle) * r,
          0.03 + hNorm * 0.48,
          sin(angle) * r
        );

        vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
        gl_Position = projectionMatrix * mvPos;
        gl_PointSize = (10.0 + 9.0 * aSeed.y) * (1.0 / max(-mvPos.z, 0.35));
        vAlpha = smoothstep(0.0, 0.15, hNorm) * smoothstep(1.0, 0.78, hNorm);
        vHeat = neck;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uReveal;
      varying float vAlpha;
      varying float vHeat;

      void main() {
        float d = length(gl_PointCoord - vec2(0.5));
        if (d > 0.5) discard;
        float glow = pow(1.0 - d * 2.0, 2.2);
        vec3 col = mix(vec3(1.0, 0.74, 0.24), vec3(1.0, 0.96, 0.72), glow * 0.6 + vHeat * 0.4);
        gl_FragColor = vec4(col, glow * vAlpha * uReveal * 0.92);
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const vortexParticles = new THREE.Points(vortexGeo, vortexMat);
  stage.add(vortexParticles);

  // Motas ambientales tipo bokeh dorado (referencia a target3.png)
  const dustCount = 165;
  const dPos = new Float32Array(dustCount * 3);
  const dPhase = new Float32Array(dustCount);
  for (let i = 0; i < dustCount; i++) {
    const a = rand() * Math.PI * 2;
    const rad = 0.18 + rand() * 0.50;
    dPos[i * 3] = Math.cos(a) * rad;
    dPos[i * 3 + 1] = 0.04 + rand() * 0.68;
    dPos[i * 3 + 2] = Math.sin(a) * rad;
    dPhase[i] = rand() * Math.PI * 2;
  }
  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dPos, 3));
  dustGeo.setAttribute('aPhase', new THREE.BufferAttribute(dPhase, 1));

  const dustMat = new THREE.ShaderMaterial({
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
        p.y += sin(uTime * 0.6 + aPhase) * 0.025;
        p.x += cos(uTime * 0.45 + aPhase * 1.4) * 0.018;
        vec4 mvPos = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mvPos;
        gl_PointSize = (18.0 + 10.0 * sin(aPhase * 2.0)) * (1.0 / max(-mvPos.z, 0.35));
        vAlpha = 0.22 + 0.25 * sin(uTime * 1.3 + aPhase);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uReveal;
      varying float vAlpha;
      void main() {
        float d = length(gl_PointCoord - vec2(0.5));
        if (d > 0.5) discard;
        // Bokeh suave
        float bokeh = smoothstep(0.5, 0.22, d);
        gl_FragColor = vec4(1.0, 0.82, 0.40, bokeh * vAlpha * uReveal);
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const dustBokeh = new THREE.Points(dustGeo, dustMat);
  stage.add(dustBokeh);

  /* =========================================================================
     6. UPDATE & DISPOSE
  ========================================================================= */
  function setActive(active) {
    root.visible = active;
    for (const l of lights) l.visible = active;
  }

  function update(dt, elapsed, revealProgress) {
    const rev = easeOutCubic(revealProgress);
    stage.scale.setScalar((0.76 + 0.24 * rev) * 1.36);
    stage.position.y = -0.34 - (1 - rev) * 0.06;

    // Levitacion y rotacion majestuosa de la vasija
    vesselGroup.position.y = 0.068 + Math.sin(elapsed * 1.45) * 0.016;
    vesselGroup.rotation.y += dt * 0.35;
    vesselGroup.rotation.z = Math.sin(elapsed * 0.85) * 0.028;

    // Pulso de las grecas emisivas
    vesselMat.emissiveIntensity = (0.7 + 0.45 * Math.sin(elapsed * 2.1)) * rev;

    // Rotacion de anillos energeticos
    ring1.rotation.z = elapsed * 0.48;
    ring2.rotation.z = -elapsed * 0.38;

    auraMat.uniforms.uTime.value = elapsed;
    auraMat.uniforms.uReveal.value = rev;
    backHaloMat.uniforms.uTime.value = elapsed;
    backHaloMat.uniforms.uReveal.value = rev;
    innerGlowMat.uniforms.uTime.value = elapsed;
    innerGlowMat.uniforms.uReveal.value = rev;
    energyRingMat.uniforms.uTime.value = elapsed;
    energyRingMat.uniforms.uReveal.value = rev;
    vortexMat.uniforms.uTime.value = elapsed;
    vortexMat.uniforms.uReveal.value = rev;
    dustMat.uniforms.uTime.value = elapsed;
    dustMat.uniforms.uReveal.value = rev;

    for (const s of shards) {
      const { ang, rad, yBase, speed } = s.userData;
      const a = ang + elapsed * speed;
      s.position.set(
        Math.cos(a) * rad,
        yBase + Math.sin(elapsed * 1.6 + ang) * 0.016,
        Math.sin(a) * rad
      );
      s.rotation.x = elapsed * 0.9 + ang;
      s.rotation.y = elapsed * 1.2;
    }

    // Orbitas de las luces dinamicas para reflejos vivos sobre el oro
    orbitLightGold.position.set(
      Math.cos(elapsed * 0.9) * 0.36,
      0.30 + Math.sin(elapsed * 1.2) * 0.08,
      Math.sin(elapsed * 0.9) * 0.36
    );
    orbitLightCrimson.position.set(
      Math.cos(elapsed * 0.9 + Math.PI) * 0.38,
      0.22 + Math.cos(elapsed * 1.0) * 0.06,
      Math.sin(elapsed * 0.9 + Math.PI) * 0.38
    );

    orbitLightGold.intensity = orbitLightGold.userData.baseIntensity * rev;
    orbitLightCrimson.intensity = orbitLightCrimson.userData.baseIntensity * rev;
    coreLight.intensity = coreLight.userData.baseIntensity * (0.85 + 0.25 * Math.sin(elapsed * 2.4)) * rev;
    hemiLight.intensity = hemiLight.userData.baseIntensity * rev;
    keyLight.intensity = keyLight.userData.baseIntensity * rev;
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
