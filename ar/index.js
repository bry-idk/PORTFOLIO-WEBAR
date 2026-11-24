import { createStudioEnvMap, disposeObject3D } from './shared.js';
import { createSpatialSystemsExperience } from './experiences/spatialSystems.js';
import { createJapaneseCultureExperience } from './experiences/japaneseCulture.js';
import { createFantasyForestExperience } from './experiences/fantasyForest.js';
import { createCRTInstallationExperience } from './experiences/crtInstallation.js';
import { createCeremonialVesselExperience } from './experiences/ceremonialVessel.js';

/**
 * Manifiesto exacto de los 5 Image Targets compilados en ./targets.mind
 * (verificado contra las dimensiones binarias del archivo .mind):
 * 0 -> target-titulo.png (1086 x 1448) : SPATIAL SYSTEMS
 * 1 -> target2.png       (560 x 486)   : CULTURA JAPONESA (KANE NO HIBIKI)
 * 2 -> target1.png       (556 x 482)   : BOSQUE FANTASTICO (CRONICAS DE PALENQUE)
 * 3 -> target4.png       (808 x 697)   : CUATRO TELEVISORES CRT
 * 4 -> target3.png       (808 x 687)   : VASIJA CEREMONIAL
 */
export const TARGET_MANIFEST = [
  {
    index: 0,
    id: 'spatial-systems',
    hudTitle: 'ACTIVO // SPATIAL SYSTEMS (2026)',
    accent: '#a855f7',
    aspect: 1086 / 1448,
    create: createSpatialSystemsExperience
  },
  {
    index: 1,
    id: 'japanese-culture',
    hudTitle: 'ACTIVO // KANE NO HIBIKI (鐘の響き)',
    accent: '#ff3b7f',
    aspect: 560 / 486,
    create: createJapaneseCultureExperience
  },
  {
    index: 2,
    id: 'fantasy-forest',
    hudTitle: 'ACTIVO // BOSQUE FANTÁSTICO',
    accent: '#ffd166',
    aspect: 556 / 482,
    create: createFantasyForestExperience
  },
  {
    index: 3,
    id: 'crt-installation',
    hudTitle: 'ACTIVO // INSTALACIÓN CRT × 4',
    accent: '#00e5ff',
    aspect: 808 / 697,
    create: createCRTInstallationExperience
  },
  {
    index: 4,
    id: 'ceremonial-vessel',
    hudTitle: 'ACTIVO // VASIJA CEREMONIAL',
    accent: '#f5b841',
    aspect: 808 / 687,
    create: createCeremonialVesselExperience
  }
];

function configureRenderer(THREE, renderer) {
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
}

/**
 * Monta las 5 experiencias modulares sobre MindARThree, aislando luces y
 * actualizaciones por target activo con transicion suave de revelacion.
 */
export function mountARExperiences(mindarThree, THREE, callbacks = {}) {
  const { renderer, scene } = mindarThree;
  configureRenderer(THREE, renderer);

  const env = createStudioEnvMap(THREE, renderer);
  scene.environment = env.texture;

  const REVEAL_DURATION = 0.75;
  const instances = TARGET_MANIFEST.map((entry) => {
    const anchor = mindarThree.addAnchor(entry.index);
    const experience = entry.create(THREE);
    anchor.group.add(experience.root);

    const state = {
      entry,
      anchor,
      experience,
      active: false,
      reveal: 0
    };

    anchor.onTargetFound = () => {
      state.active = true;
      state.reveal = 0;
      experience.setActive(true);
      if (callbacks.onTargetFound) callbacks.onTargetFound(entry);
    };

    anchor.onTargetLost = () => {
      state.active = false;
      state.reveal = 0;
      experience.setActive(false);
      if (callbacks.onTargetLost) callbacks.onTargetLost(entry);
    };

    return state;
  });

  function update(dt, elapsed) {
    for (const st of instances) {
      if (!st.active) continue;
      if (st.reveal < 1) {
        st.reveal = Math.min(1, st.reveal + dt / REVEAL_DURATION);
      }
      st.experience.update(dt, elapsed, st.reveal);
    }
  }

  function dispose() {
    for (const st of instances) {
      st.experience.dispose();
    }
    scene.environment = null;
    env.dispose();
  }

  return {
    manifest: TARGET_MANIFEST,
    update,
    dispose
  };
}

/**
 * Visor de inspeccion 3D sin camara web (activado solo con ?preview=0..4).
 */
export async function mountPreviewExperience(container, THREE, targetIndex, callbacks = {}) {
  const entry = TARGET_MANIFEST.find((t) => t.index === targetIndex) || TARGET_MANIFEST[0];
  const { OrbitControls } = await import('three/addons/controls/OrbitControls.js');

  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(container.clientWidth || window.innerWidth, container.clientHeight || window.innerHeight);
  renderer.setClearColor(0x07080d, 1);
  configureRenderer(THREE, renderer);
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const env = createStudioEnvMap(THREE, renderer);
  scene.environment = env.texture;

  const width = container.clientWidth || window.innerWidth;
  const height = container.clientHeight || window.innerHeight;
  const camera = new THREE.PerspectiveCamera(42, width / height, 0.05, 30);
  camera.position.set(0.34, 0.27, 1.50);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.target.set(0, -0.02, 0.28);
  controls.update();

  // Marco sutil del Image Target en z = 0 para verificar alineacion y escala
  const targetH = 1.0 / entry.aspect;
  const frameGeo = new THREE.EdgesGeometry(new THREE.PlaneGeometry(1.0, targetH));
  const frameMat = new THREE.LineBasicMaterial({
    color: entry.accent,
    transparent: true,
    opacity: 0.28
  });
  const targetFrame = new THREE.LineSegments(frameGeo, frameMat);
  scene.add(targetFrame);

  const experience = entry.create(THREE);
  experience.setActive(true);
  scene.add(experience.root);

  if (callbacks.onTargetFound) callbacks.onTargetFound(entry);

  const clock = new THREE.Clock();
  let reveal = 0;

  const onResize = () => {
    const w = container.clientWidth || window.innerWidth;
    const h = container.clientHeight || window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  };
  window.addEventListener('resize', onResize);

  renderer.setAnimationLoop(() => {
    const dt = Math.min(clock.getDelta(), 0.05);
    const elapsed = clock.getElapsedTime();
    if (reveal < 1) reveal = Math.min(1, reveal + dt / 0.75);
    experience.update(dt, elapsed, reveal);
    controls.update();
    renderer.render(scene, camera);
  });

  return {
    entry,
    dispose() {
      renderer.setAnimationLoop(null);
      window.removeEventListener('resize', onResize);
      controls.dispose();
      experience.dispose();
      disposeObject3D(targetFrame);
      scene.environment = null;
      env.dispose();
      renderer.dispose();
    }
  };
}
