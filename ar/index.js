import { createStudioEnvMap, disposeObject3D } from './shared.js';
import { createSpatialSystemsExperience } from './experiences/spatialSystems.js';
import { createJapaneseCultureExperience } from './experiences/japaneseCulture.js';
import { createFantasyForestExperience } from './experiences/fantasyForest.js';
import { createCRTInstallationExperience } from './experiences/crtInstallation.js';
import { createCeremonialVesselExperience } from './experiences/ceremonialVessel.js';

/**
 * Manifiesto oficial de los 5 Image Targets compilados en ./targets.mind
 * (indices binarios verificados contra las dimensiones exactas de cada PNG):
 * 0 -> target-titulo.png (1086 x 1448) : SPATIAL SYSTEMS
 * 1 -> target2.png       (560 x 486)   : KANE NO HIBIKI (鐘の響き)
 * 2 -> target1.png       (556 x 482)   : CRONICAS DE PALENQUE
 * 3 -> target4.png       (808 x 697)   : REMINISCENCIA
 * 4 -> target3.png       (808 x 687)   : VESTIGIO
 */
export const TARGET_MANIFEST = [
  {
    index: 0,
    id: 'spatial-systems',
    code: '00',
    title: 'SPATIAL SYSTEMS',
    shortTitle: 'Spatial Systems',
    subtitle: 'PORTFOLIO 2026 // DIGITAL INTERACTION',
    hudTitle: 'SPATIAL SYSTEMS',
    teaser: 'Manifiesto espacial sobre interacción digital, gráficos generativos y presencia física.',
    description:
      'Manifiesto visual e interactivo que sintetiza mi visión como Creative Technologist en el diseño de sistemas espaciales, computación interactiva y experiencias inmersivas. Explora la convergencia entre arquitectura digital, shaders en tiempo real y presencia física para construir entornos donde la tecnología amplifica la narrativa humana y el arte contemporáneo.',
    venue: 'PORTFOLIO 2026 // MEDELLÍN',
    tags: ['Spatial Systems', 'WebGL & GLSL', 'WebAR', 'Creative Tech', 'Interacción Espacial'],
    theme: 'spatial',
    accent: '#a855f7',
    secondary: '#00ff88',
    previewBg: 0x07060f,
    aspect: 1086 / 1448,
    create: createSpatialSystemsExperience
  },
  {
    index: 1,
    id: 'kane-no-hibiki',
    code: '01',
    title: 'KANE NO HIBIKI (鐘の響き)',
    shortTitle: 'Kane no Hibiki',
    subtitle: 'VIDEOMAPPING DE GRAN FORMATO',
    hudTitle: 'KANE NO HIBIKI (鐘の響き)',
    teaser: 'Videomapping arquitectónico monumental con motion graphics y elementos interactivos.',
    description:
      'Proyección de videomapping arquitectónico de gran formato sobre fachada monumental, integrando motion graphics animados y elementos interactivos inspirados en la estética tradicional japonesa. La luz transforma el edificio en un lienzo vivo donde el sonido visual de la campana, las grullas, el sakura y las olas tradicionales dialogan con la arquitectura nocturna.',
    venue: 'PROYECCIÓN ARQUITECTÓNICA // GRAN FORMATO',
    tags: ['Videomapping', 'Motion Graphics', 'Estética Japonesa', 'Interactividad', 'Proyección Monumental'],
    theme: 'japanese',
    accent: '#ff3b7f',
    secondary: '#ffd166',
    previewBg: 0x0b050b,
    aspect: 560 / 486,
    create: createJapaneseCultureExperience
  },
  {
    index: 2,
    id: 'cronicas-de-palenque',
    code: '02',
    title: 'CRÓNICAS DE PALENQUE',
    shortTitle: 'Palenque',
    subtitle: 'VIDEOJUEGO PC / MOBILE / VR',
    hudTitle: 'CRÓNICAS DE PALENQUE',
    teaser: 'Videojuego multiplataforma para PC, móvil y VR dedicado a la memoria histórica.',
    description:
      'Experiencia de videojuego multiplataforma diseñada para PC, dispositivos móviles y realidad virtual (VR) enfocada en preservar el patrimonio cultural y la memoria histórica de Palenque. Combina entornos 3D estilizados de atmósfera cinematográfica, iluminación volumétrica y narrativa interactiva para acercar la historia viva a nuevas audiencias.',
    venue: 'VIDEOJUEGO MULTIPLATAFORMA // PC · MOBILE · VR',
    tags: ['PC / Mobile / VR', 'Patrimonio Cultural', 'Memoria Histórica', 'Entornos 3D', 'Narrativa Interactiva'],
    theme: 'forest',
    accent: '#ffd166',
    secondary: '#4ade80',
    previewBg: 0x060a08,
    aspect: 556 / 482,
    create: createFantasyForestExperience
  },
  {
    index: 3,
    id: 'reminiscencia',
    code: '03',
    title: 'REMINISCENCIA',
    shortTitle: 'Reminiscencia',
    subtitle: 'INSTALACIÓN GAMIFICADA',
    hudTitle: 'REMINISCENCIA',
    teaser: 'Instalación gamificada multisistema en la Biblioteca EPM con Unity 6 y computación espacial.',
    description:
      'Instalación interactiva y gamificada multisistema exhibida en la Biblioteca EPM que fusiona Unity 6, iluminación inteligente, módulos mecánicos físicos y gráficos interactivos en tiempo real con computación espacial. Cada estímulo y recorrido del participante modifica señales audiovisuales, luces y mecanismos en un espacio liminal entre el recuerdo y la tecnología.',
    venue: 'BIBLIOTECA EPM // INSTALACIÓN MULTISISTEMA',
    tags: ['Unity 6', 'Spatial Computing', 'Iluminación Inteligente', 'Módulos Mecánicos', 'Real-Time VFX'],
    theme: 'crt',
    accent: '#00e5ff',
    secondary: '#ff2a9d',
    previewBg: 0x05080f,
    aspect: 808 / 697,
    create: createCRTInstallationExperience
  },
  {
    index: 4,
    id: 'vestigio',
    code: '04',
    title: 'VESTIGIO',
    shortTitle: 'Vestigio',
    subtitle: 'INSTALACIÓN INTERACTIVA DE MUSEO',
    hudTitle: 'VESTIGIO',
    teaser: 'Instalación museográfica interactiva en el Centro de Artes EAFIT (Proyecto ALFAR).',
    description:
      'Instalación museográfica interactiva presentada en el Centro de Artes de la Universidad EAFIT como parte del Proyecto ALFAR y su muestra cultural. Mediante presencia corporal, luz dinámica y sistemas de partículas en tiempo real, reinterpreta el patrimonio cerámico ancestral en un artefacto vivo que conecta arqueología, memoria y arte digital contemporáneo.',
    venue: 'CENTRO DE ARTES EAFIT // PROYECTO ALFAR',
    tags: ['Proyecto ALFAR', 'Centro de Artes EAFIT', 'Museografía Interactiva', 'Patrimonio Ancestral', 'VFX en Tiempo Real'],
    theme: 'vessel',
    accent: '#f5b841',
    secondary: '#c83252',
    previewBg: 0x0c0608,
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
 * Visor de inspeccion 3D sin camara web (modo Showcase sin AR o ?preview=0..4).
 */
export async function mountPreviewExperience(container, THREE, targetIndex, callbacks = {}) {
  const { OrbitControls } = await import('three/addons/controls/OrbitControls.js');

  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(container.clientWidth || window.innerWidth, container.clientHeight || window.innerHeight);
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
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.55;
  controls.target.set(0, -0.02, 0.28);
  controls.update();

  // Detener auto-rotacion cuando el usuario toma control manual
  const onControlsStart = () => {
    controls.autoRotate = false;
  };
  controls.addEventListener('start', onControlsStart);

  let currentEntry = null;
  let currentExperience = null;
  let targetFrame = null;
  let reveal = 0;

  function loadScene(idx) {
    const entry = TARGET_MANIFEST.find((t) => t.index === idx) || TARGET_MANIFEST[0];

    if (currentExperience) {
      scene.remove(currentExperience.root);
      currentExperience.dispose();
      currentExperience = null;
    }
    if (targetFrame) {
      scene.remove(targetFrame);
      disposeObject3D(targetFrame);
      targetFrame = null;
    }

    currentEntry = entry;
    renderer.setClearColor(entry.previewBg, 1);

    // Marco sutil de referencia del Image Target en z = 0
    const targetH = 1.0 / entry.aspect;
    const frameGeo = new THREE.EdgesGeometry(new THREE.PlaneGeometry(1.0, targetH));
    const frameMat = new THREE.LineBasicMaterial({
      color: entry.accent,
      transparent: true,
      opacity: 0.24
    });
    targetFrame = new THREE.LineSegments(frameGeo, frameMat);
    scene.add(targetFrame);

    currentExperience = entry.create(THREE);
    currentExperience.setActive(true);
    scene.add(currentExperience.root);

    reveal = 0;
    controls.autoRotate = true;
    camera.position.set(0.34, 0.27, 1.50);
    controls.target.set(0, -0.02, 0.28);
    controls.update();

    if (callbacks.onTargetFound) callbacks.onTargetFound(entry);
  }

  loadScene(targetIndex);

  const clock = new THREE.Clock();

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
    if (currentExperience) currentExperience.update(dt, elapsed, reveal);
    controls.update();
    renderer.render(scene, camera);
  });

  return {
    get entry() {
      return currentEntry;
    },
    switchTo(newIdx) {
      loadScene(newIdx);
    },
    dispose() {
      renderer.setAnimationLoop(null);
      window.removeEventListener('resize', onResize);
      controls.removeEventListener('start', onControlsStart);
      controls.dispose();
      if (currentExperience) currentExperience.dispose();
      if (targetFrame) disposeObject3D(targetFrame);
      scene.environment = null;
      env.dispose();
      renderer.dispose();
    }
  };
}
