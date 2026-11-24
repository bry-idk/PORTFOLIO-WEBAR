/**
 * Utilidades graficas compartidas para las experiencias WebAR (Three.js r158).
 * Incluye ruido GLSL reusable, PMREM studio environment procedural,
 * generacion de texturas PBR en canvas y limpieza de recursos GPU.
 */

export const GLSL_NOISE = /* glsl */ `
float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float hash31(vec3 p) {
  p = fract(p * 0.1031);
  p += dot(p, p.yzx + 33.33);
  return fract((p.x + p.y) * p.z);
}

float noise2D(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = hash21(i);
  float b = hash21(i + vec2(1.0, 0.0));
  float c = hash21(i + vec2(0.0, 1.0));
  float d = hash21(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float fbm2D(vec2 p) {
  float value = 0.0;
  float amp = 0.5;
  mat2 rot = mat2(0.80, 0.60, -0.60, 0.80);
  for (int i = 0; i < 4; i++) {
    value += amp * noise2D(p);
    p = rot * p * 2.02;
    amp *= 0.5;
  }
  return value;
}
`;

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function easeOutCubic(t) {
  const x = clamp(t, 0, 1);
  return 1 - Math.pow(1 - x, 3);
}

/**
 * Crea un CanvasTexture configurado para PBR (color sRGB o mapa lineal).
 */
export function createCanvasTexture(THREE, width, height, drawFn, options = {}) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  drawFn(ctx, width, height);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = options.srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  texture.wrapS = options.wrapS ?? THREE.RepeatWrapping;
  texture.wrapT = options.wrapT ?? THREE.RepeatWrapping;
  if (options.repeat) {
    texture.repeat.set(options.repeat[0], options.repeat[1]);
  }
  texture.anisotropy = options.anisotropy ?? 4;
  texture.needsUpdate = true;
  return texture;
}

/**
 * Textura radial suave reutilizable para particulas, halos y destellos.
 */
export function createSoftGlowTexture(THREE, size = 128) {
  return createCanvasTexture(
    THREE,
    size,
    size,
    (ctx, w, h) => {
      const cx = w * 0.5;
      const cy = h * 0.5;
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, cx);
      grad.addColorStop(0.0, 'rgba(255,255,255,1.0)');
      grad.addColorStop(0.22, 'rgba(255,255,255,0.78)');
      grad.addColorStop(0.55, 'rgba(255,255,255,0.22)');
      grad.addColorStop(1.0, 'rgba(255,255,255,0.0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
    },
    {
      srgb: true,
      wrapS: THREE.ClampToEdgeWrapping,
      wrapT: THREE.ClampToEdgeWrapping
    }
  );
}

/**
 * Textura procedural de destello estelar de 4 puntas con nucleo brillante.
 */
export function createStarFlareTexture(THREE, size = 128) {
  return createCanvasTexture(
    THREE,
    size,
    size,
    (ctx, w, h) => {
      const cx = w * 0.5;
      const cy = h * 0.5;

      const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, cx * 0.42);
      core.addColorStop(0.0, 'rgba(255,255,255,1.0)');
      core.addColorStop(0.25, 'rgba(255,255,255,0.75)');
      core.addColorStop(0.65, 'rgba(255,255,255,0.12)');
      core.addColorStop(1.0, 'rgba(255,255,255,0.0)');
      ctx.fillStyle = core;
      ctx.fillRect(0, 0, w, h);

      // Rayo horizontal
      const hGrad = ctx.createLinearGradient(0, cy, w, cy);
      hGrad.addColorStop(0.0, 'rgba(255,255,255,0.0)');
      hGrad.addColorStop(0.35, 'rgba(255,255,255,0.28)');
      hGrad.addColorStop(0.5, 'rgba(255,255,255,0.95)');
      hGrad.addColorStop(0.65, 'rgba(255,255,255,0.28)');
      hGrad.addColorStop(1.0, 'rgba(255,255,255,0.0)');
      ctx.fillStyle = hGrad;
      ctx.beginPath();
      ctx.ellipse(cx, cy, w * 0.48, h * 0.045, 0, 0, Math.PI * 2);
      ctx.fill();

      // Rayo vertical
      const vGrad = ctx.createLinearGradient(cx, 0, cx, h);
      vGrad.addColorStop(0.0, 'rgba(255,255,255,0.0)');
      vGrad.addColorStop(0.35, 'rgba(255,255,255,0.28)');
      vGrad.addColorStop(0.5, 'rgba(255,255,255,0.95)');
      vGrad.addColorStop(0.65, 'rgba(255,255,255,0.28)');
      vGrad.addColorStop(1.0, 'rgba(255,255,255,0.0)');
      ctx.fillStyle = vGrad;
      ctx.beginPath();
      ctx.ellipse(cx, cy, w * 0.045, h * 0.48, 0, 0, Math.PI * 2);
      ctx.fill();
    },
    {
      srgb: true,
      wrapS: THREE.ClampToEdgeWrapping,
      wrapT: THREE.ClampToEdgeWrapping
    }
  );
}

/**
 * Genera un Environment Map procedural usando PMREMGenerator para reflejos PBR reales
 * (oro, ceramica, vidrio CRT, obsidiana) con 6 paneles luminosos equilibrados.
 */
export function createStudioEnvMap(THREE, renderer) {
  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();

  const envScene = new THREE.Scene();
  const roomGeo = new THREE.BoxGeometry(20, 20, 20);
  const roomMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color(0.04, 0.045, 0.06),
    side: THREE.BackSide
  });
  const room = new THREE.Mesh(roomGeo, roomMat);
  envScene.add(room);

  const panels = [
    // 1. Key calido oro arriba-izquierda
    { pos: [-6, 5.5, 4.5], rot: [0.45, 0.65, 0], scale: [6.5, 4.2, 0.2], color: [3.4, 2.65, 1.55] },
    // 2. Rim frio cian derecha
    { pos: [6.8, 2.2, 2.8], rot: [0.15, -1.1, 0], scale: [5.0, 6.0, 0.2], color: [1.15, 2.55, 3.2] },
    // 3. Contraluz amatista trasero-superior
    { pos: [0.5, 6.0, -6.5], rot: [0.7, 0, 0], scale: [8.0, 3.5, 0.2], color: [2.05, 1.05, 3.25] },
    // 4. Acento carmesi suave lateral-trasero izquierdo
    { pos: [-6.5, 1.4, -4.2], rot: [0.2, 1.05, 0], scale: [4.8, 4.4, 0.2], color: [2.4, 0.58, 0.95] },
    // 5. Techo frio difuso
    { pos: [0, 8.2, 0.8], rot: [1.57, 0, 0], scale: [7.5, 6.5, 0.2], color: [1.0, 1.25, 1.65] },
    // 6. Rebote calido inferior
    { pos: [0, -6.5, 2.0], rot: [-1.2, 0, 0], scale: [9.0, 9.0, 0.2], color: [1.05, 0.68, 0.36] }
  ];

  const panelGeo = new THREE.BoxGeometry(1, 1, 1);
  const createdMats = [roomMat];
  for (const p of panels) {
    const mat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(p.color[0], p.color[1], p.color[2])
    });
    createdMats.push(mat);
    const mesh = new THREE.Mesh(panelGeo, mat);
    mesh.position.set(p.pos[0], p.pos[1], p.pos[2]);
    mesh.rotation.set(p.rot[0], p.rot[1], p.rot[2]);
    mesh.scale.set(p.scale[0], p.scale[1], p.scale[2]);
    envScene.add(mesh);
  }

  const envRT = pmrem.fromScene(envScene, 0.04);

  roomGeo.dispose();
  panelGeo.dispose();
  for (const mat of createdMats) mat.dispose();
  pmrem.dispose();

  return {
    texture: envRT.texture,
    dispose() {
      envRT.dispose();
    }
  };
}

/**
 * Libera recursivamente geometrias, materiales y texturas de un Object3D.
 */
export function disposeObject3D(root) {
  if (!root) return;
  const geometries = new Set();
  const materials = new Set();
  const textures = new Set();

  root.traverse((obj) => {
    if (obj.geometry) geometries.add(obj.geometry);
    if (obj.material) {
      const list = Array.isArray(obj.material) ? obj.material : [obj.material];
      for (const mat of list) {
        if (!mat) continue;
        materials.add(mat);
        for (const key of Object.keys(mat)) {
          const val = mat[key];
          if (val && val.isTexture) textures.add(val);
        }
        if (mat.uniforms) {
          for (const key of Object.keys(mat.uniforms)) {
            const u = mat.uniforms[key];
            if (u && u.value && u.value.isTexture) textures.add(u.value);
          }
        }
      }
    }
  });

  for (const tex of textures) tex.dispose();
  for (const mat of materials) mat.dispose();
  for (const geo of geometries) geo.dispose();
}
