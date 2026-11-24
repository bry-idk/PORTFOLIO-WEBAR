/**
 * Controlador de particulas 2D perimetrales en la UI y ornamentos SVG tematicos
 * por experiencia AR / Visor 3D. Todas las capas son pointer-events: none
 * y se concentran en los contornos para enmarcar los modelos 3D sin taparlos.
 */

export function getThemeOrnamentHTML(theme) {
  switch (theme) {
    case 'forest':
      return `
        <svg class="ui-ornament orn-tl orn-sway" viewBox="0 0 120 120" fill="none">
          <path d="M4 96 C12 52 34 26 92 8" stroke="currentColor" stroke-width="1.5" stroke-opacity="0.7"/>
          <path d="M22 46 C8 38 10 22 28 24 C26 36 24 42 22 46Z" fill="currentColor" fill-opacity="0.28" stroke="currentColor" stroke-width="1"/>
          <path d="M48 26 C40 12 52 4 64 14 C58 22 52 24 48 26Z" fill="currentColor" fill-opacity="0.22" stroke="currentColor" stroke-width="1"/>
          <circle cx="88" cy="14" r="2.2" fill="#4ade80" opacity="0.85"/>
        </svg>
        <svg class="ui-ornament orn-tr orn-sway-alt" viewBox="0 0 120 120" fill="none">
          <path d="M116 96 C108 52 86 26 28 8" stroke="currentColor" stroke-width="1.5" stroke-opacity="0.7"/>
          <path d="M98 46 C112 38 110 22 92 24 C94 36 96 42 98 46Z" fill="currentColor" fill-opacity="0.28" stroke="currentColor" stroke-width="1"/>
          <circle cx="32" cy="14" r="2.2" fill="#ffd166" opacity="0.85"/>
        </svg>
        <svg class="ui-ornament orn-bl" viewBox="0 0 100 100" fill="none">
          <path d="M6 18 L6 94 L82 94" stroke="currentColor" stroke-width="1" stroke-opacity="0.45"/>
          <path d="M16 84 C26 66 44 62 58 72" stroke="#4ade80" stroke-width="1.2" stroke-opacity="0.55"/>
        </svg>
        <svg class="ui-ornament orn-br" viewBox="0 0 100 100" fill="none">
          <path d="M94 18 L94 94 L18 94" stroke="currentColor" stroke-width="1" stroke-opacity="0.45"/>
          <path d="M84 84 C74 66 56 62 42 72" stroke="#4ade80" stroke-width="1.2" stroke-opacity="0.55"/>
        </svg>
        <div class="ui-side-tag side-left">PALENQUE // FLORA VIVA</div>
        <div class="ui-side-tag side-right">MEMORIA // BIOMA 3D</div>
      `;

    case 'japanese':
      return `
        <svg class="ui-ornament orn-tr orn-sway" viewBox="0 0 140 120" fill="none">
          <path d="M136 12 C96 20 70 36 32 54" stroke="#ffb3c9" stroke-width="1.4" stroke-opacity="0.7"/>
          <path d="M86 30 C76 16 64 14 52 18" stroke="#ffb3c9" stroke-width="1" stroke-opacity="0.55"/>
          <circle cx="52" cy="18" r="4" fill="#ff3b7f" fill-opacity="0.65"/>
          <circle cx="76" cy="40" r="3.2" fill="#ffd6e6" fill-opacity="0.8"/>
          <circle cx="32" cy="54" r="3.6" fill="#ff6b9e" fill-opacity="0.75"/>
          <circle cx="106" cy="24" r="2.8" fill="#ffd166" fill-opacity="0.8"/>
        </svg>
        <svg class="ui-ornament orn-tl" viewBox="0 0 100 100" fill="none">
          <circle cx="24" cy="24" r="14" stroke="#ffd166" stroke-width="1" stroke-opacity="0.5"/>
          <circle cx="24" cy="24" r="9" stroke="#ff3b7f" stroke-width="1" stroke-opacity="0.65"/>
        </svg>
        <svg class="ui-ornament orn-bl" viewBox="0 0 120 80" fill="none">
          <path d="M4 76 A26 26 0 0 1 56 76" stroke="#ffd166" stroke-width="1.1" stroke-opacity="0.45"/>
          <path d="M12 76 A18 18 0 0 1 48 76" stroke="#ff3b7f" stroke-width="1" stroke-opacity="0.55"/>
          <path d="M36 76 A26 26 0 0 1 88 76" stroke="#ffd166" stroke-width="1.1" stroke-opacity="0.45"/>
        </svg>
        <svg class="ui-ornament orn-br" viewBox="0 0 120 80" fill="none">
          <path d="M116 76 A26 26 0 0 0 64 76" stroke="#ffd166" stroke-width="1.1" stroke-opacity="0.45"/>
          <path d="M108 76 A18 18 0 0 0 72 76" stroke="#ff3b7f" stroke-width="1" stroke-opacity="0.55"/>
          <path d="M84 76 A26 26 0 0 0 32 76" stroke="#ffd166" stroke-width="1.1" stroke-opacity="0.45"/>
        </svg>
        <div class="ui-side-tag side-left ui-kanji-tag">鐘の響き // 2026</div>
        <div class="ui-side-tag side-right">VIDEOMAPPING // SAKURA</div>
      `;

    case 'vessel':
      return `
        <svg class="ui-ornament orn-tl" viewBox="0 0 100 100" fill="none">
          <path d="M6 68 L6 6 L68 6" stroke="#f5b841" stroke-width="1.5" stroke-opacity="0.75"/>
          <path d="M13 50 L13 13 L50 13" stroke="#c83252" stroke-width="1" stroke-opacity="0.7"/>
          <path d="M18 32 L18 18 L32 18 L32 26 L24 26" stroke="#f5b841" stroke-width="1.2" stroke-opacity="0.85"/>
        </svg>
        <svg class="ui-ornament orn-tr" viewBox="0 0 100 100" fill="none">
          <path d="M94 68 L94 6 L32 6" stroke="#f5b841" stroke-width="1.5" stroke-opacity="0.75"/>
          <path d="M87 50 L87 13 L50 13" stroke="#c83252" stroke-width="1" stroke-opacity="0.7"/>
          <path d="M82 32 L82 18 L68 18 L68 26 L76 26" stroke="#f5b841" stroke-width="1.2" stroke-opacity="0.85"/>
        </svg>
        <svg class="ui-ornament orn-bl" viewBox="0 0 100 100" fill="none">
          <path d="M6 32 L6 94 L68 94" stroke="#f5b841" stroke-width="1.5" stroke-opacity="0.75"/>
          <path d="M13 50 L13 87 L50 87" stroke="#c83252" stroke-width="1" stroke-opacity="0.7"/>
          <path d="M18 68 L18 82 L32 82 L32 74 L24 74" stroke="#f5b841" stroke-width="1.2" stroke-opacity="0.85"/>
        </svg>
        <svg class="ui-ornament orn-br" viewBox="0 0 100 100" fill="none">
          <path d="M94 32 L94 94 L32 94" stroke="#f5b841" stroke-width="1.5" stroke-opacity="0.75"/>
          <path d="M87 50 L87 87 L50 87" stroke="#c83252" stroke-width="1" stroke-opacity="0.7"/>
          <path d="M82 68 L82 82 L68 82 L68 74 L76 74" stroke="#f5b841" stroke-width="1.2" stroke-opacity="0.85"/>
        </svg>
        <div class="ui-side-tag side-left">ALFAR // EAFIT</div>
        <div class="ui-side-tag side-right">ARTEFACTO CEREMONIAL</div>
      `;

    case 'crt':
      return `
        <svg class="ui-ornament orn-tl" viewBox="0 0 90 90" fill="none">
          <path d="M6 42 L6 6 L42 6" stroke="#00e5ff" stroke-width="1.8"/>
          <path d="M14 22 L28 22 M21 15 L21 29" stroke="#ff2a9d" stroke-width="1.2"/>
        </svg>
        <svg class="ui-ornament orn-tr" viewBox="0 0 90 90" fill="none">
          <path d="M84 42 L84 6 L48 6" stroke="#ff2a9d" stroke-width="1.8"/>
          <rect x="64" y="15" width="8" height="8" stroke="#00e5ff" stroke-width="1.2"/>
        </svg>
        <svg class="ui-ornament orn-bl" viewBox="0 0 90 90" fill="none">
          <path d="M6 48 L6 84 L42 84" stroke="#ff2a9d" stroke-width="1.8"/>
          <path d="M16 74 L38 74" stroke="#28ff88" stroke-width="1.5" stroke-dasharray="4 3"/>
        </svg>
        <svg class="ui-ornament orn-br" viewBox="0 0 90 90" fill="none">
          <path d="M84 48 L84 84 L48 84" stroke="#00e5ff" stroke-width="1.8"/>
          <path d="M52 74 L74 74" stroke="#28ff88" stroke-width="1.5" stroke-dasharray="4 3"/>
        </svg>
        <div class="ui-crt-rec"><span class="rec-dot"></span>REC // CH-01..04</div>
        <div class="ui-side-tag side-right">SIGNAL LOCK // 60HZ</div>
      `;

    case 'spatial':
      return `
        <svg class="ui-ornament orn-tl orn-twinkle" viewBox="0 0 100 100" fill="none">
          <path d="M6 54 L6 6 L54 6" stroke="#a855f7" stroke-width="1.3" stroke-opacity="0.75"/>
          <path d="M24 12 L26 22 L36 24 L26 26 L24 36 L22 26 L12 24 L22 22 Z" fill="#f5f3ff" fill-opacity="0.85"/>
          <rect x="44" y="4" width="6" height="6" fill="#00ff88"/>
        </svg>
        <svg class="ui-ornament orn-tr orn-twinkle" viewBox="0 0 100 100" fill="none">
          <path d="M94 54 L94 6 L46 6" stroke="#a855f7" stroke-width="1.3" stroke-opacity="0.75"/>
          <path d="M76 12 L78 22 L88 24 L78 26 L76 36 L74 26 L64 24 L74 22 Z" fill="#c084fc" fill-opacity="0.9"/>
          <rect x="50" y="4" width="6" height="6" fill="#a855f7"/>
        </svg>
        <svg class="ui-ornament orn-bl" viewBox="0 0 100 100" fill="none">
          <path d="M6 46 L6 94 L54 94" stroke="#00ff88" stroke-width="1.2" stroke-opacity="0.65"/>
          <circle cx="16" cy="84" r="3" stroke="#a855f7" stroke-width="1.2"/>
        </svg>
        <svg class="ui-ornament orn-br" viewBox="0 0 100 100" fill="none">
          <path d="M94 46 L94 94 L46 94" stroke="#00ff88" stroke-width="1.2" stroke-opacity="0.65"/>
          <circle cx="84" cy="84" r="3" stroke="#00ff88" stroke-width="1.2"/>
        </svg>
        <div class="ui-side-tag side-left">SYS // X·Y·Z [01]</div>
        <div class="ui-side-tag side-right">SPATIAL COMPUTING</div>
      `;

    default:
      return '';
  }
}

export function createUIEffectsController(canvas) {
  const ctx = canvas.getContext('2d');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let theme = 'idle';
  let rafId = null;
  let running = false;
  let width = 1;
  let height = 1;
  let dpr = 1;
  let particles = [];
  let lastTime = 0;

  function randomEdgePosition() {
    const band = Math.random();
    if (band < 0.34) {
      // Borde izquierdo (0..22%)
      return { x: Math.random() * width * 0.22, y: Math.random() * height };
    }
    if (band < 0.68) {
      // Borde derecho (78..100%)
      return { x: width * (0.78 + Math.random() * 0.22), y: Math.random() * height };
    }
    if (band < 0.84) {
      // Margen superior (0..20%)
      return { x: Math.random() * width, y: Math.random() * height * 0.20 };
    }
    // Margen inferior (78..100%)
    return { x: Math.random() * width, y: height * (0.78 + Math.random() * 0.22) };
  }

  function buildParticles(targetTheme) {
    particles = [];
    if (targetTheme === 'idle') return;

    const counts = {
      forest: 34,
      japanese: 32,
      vessel: 38,
      crt: 36,
      spatial: 30
    };
    const count = counts[targetTheme] || 28;

    for (let i = 0; i < count; i++) {
      const pt = randomEdgePosition();
      particles.push({
        x: pt.x,
        y: pt.y,
        vx: (Math.random() - 0.5) * 18,
        vy:
          targetTheme === 'japanese'
            ? 14 + Math.random() * 22
            : targetTheme === 'vessel'
              ? -(10 + Math.random() * 18)
              : (Math.random() - 0.5) * 14,
        size: 2.2 + Math.random() * 4.5,
        phase: Math.random() * Math.PI * 2,
        rot: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 2.2,
        huePick: Math.random(),
        life: Math.random()
      });
    }
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    width = Math.max(1, window.innerWidth);
    height = Math.max(1, window.innerHeight);
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (theme !== 'idle' && particles.length === 0) {
      buildParticles(theme);
    }
  }

  function wrapPerimeter(p) {
    if (p.x < -20 || p.x > width + 20 || p.y < -20 || p.y > height + 20) {
      const pt = randomEdgePosition();
      p.x = pt.x;
      p.y = pt.y;
    }
  }

  function drawFrame(now) {
    if (!running || theme === 'idle') return;
    if (!lastTime) lastTime = now;
    const dt = Math.min((now - lastTime) / 1000, 0.05);
    const t = now * 0.001;
    lastTime = now;

    ctx.clearRect(0, 0, width, height);

    // Conexion nodal en contornos para Spatial Systems
    if (theme === 'spatial') {
      ctx.lineWidth = 0.8;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.hypot(dx, dy);
          if (dist < 110) {
            const alpha = (1 - dist / 110) * 0.24;
            ctx.strokeStyle = `rgba(168, 85, 247, ${alpha})`;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }
    }

    for (const p of particles) {
      if (!reducedMotion) {
        if (theme === 'japanese') {
          p.x += (Math.sin(t * 1.4 + p.phase) * 16 + 10) * dt;
          p.y += p.vy * dt;
          p.rot += p.rotSpeed * dt;
          if (p.y > height + 16) {
            p.y = -12;
            p.x = Math.random() < 0.5 ? Math.random() * width * 0.28 : width * (0.72 + Math.random() * 0.28);
          }
          if (p.x > width + 16) p.x = -12;
        } else if (theme === 'vessel') {
          p.x += Math.sin(t * 1.1 + p.phase) * 10 * dt;
          p.y += p.vy * dt;
          if (p.y < -16) {
            p.y = height + 12;
            const pt = randomEdgePosition();
            p.x = pt.x;
          }
        } else {
          p.x += (p.vx + Math.sin(t * 1.2 + p.phase) * 8) * dt;
          p.y += (p.vy + Math.cos(t * 0.9 + p.phase) * 8) * dt;
          p.rot += p.rotSpeed * dt;
          wrapPerimeter(p);
        }
      }

      const pulse = 0.45 + 0.55 * (0.5 + 0.5 * Math.sin(t * 2.6 + p.phase * 2.0));

      if (theme === 'forest') {
        const col = p.huePick > 0.4 ? '255, 214, 102' : '110, 255, 168';
        const r = p.size * (2.4 + pulse * 1.5);
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r);
        grad.addColorStop(0, `rgba(255, 252, 224, ${0.85 * pulse})`);
        grad.addColorStop(0.35, `rgba(${col}, ${0.55 * pulse})`);
        grad.addColorStop(1, `rgba(${col}, 0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fill();
      } else if (theme === 'japanese') {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.scale(1, 0.65 + 0.35 * Math.sin(t * 2.2 + p.phase));
        const s = p.size * 1.65;
        ctx.fillStyle = p.huePick > 0.3 ? 'rgba(255, 152, 192, 0.78)' : 'rgba(255, 224, 236, 0.82)';
        ctx.beginPath();
        ctx.moveTo(0, -s);
        ctx.bezierCurveTo(s * 0.95, -s * 0.9, s * 0.9, s * 0.55, 0, s * 0.95);
        ctx.bezierCurveTo(-s * 0.9, s * 0.55, -s * 0.95, -s * 0.9, 0, -s);
        ctx.fill();
        ctx.restore();
      } else if (theme === 'vessel') {
        const col = p.huePick > 0.25 ? '245, 184, 65' : '215, 62, 92';
        const r = p.size * (2.2 + pulse);
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r);
        grad.addColorStop(0, `rgba(255, 240, 192, ${0.75 * pulse})`);
        grad.addColorStop(0.45, `rgba(${col}, ${0.42 * pulse})`);
        grad.addColorStop(1, `rgba(${col}, 0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fill();
      } else if (theme === 'crt') {
        const blink = Math.sin(t * 7.0 + p.phase * 5.0) > -0.2 ? 1 : 0.2;
        const col =
          p.huePick < 0.36 ? '0, 229, 255' : p.huePick < 0.72 ? '255, 42, 157' : '40, 255, 136';
        ctx.fillStyle = `rgba(${col}, ${0.72 * blink})`;
        const w = p.huePick > 0.82 ? p.size * 4.5 : p.size * 1.15;
        const h = p.huePick > 0.82 ? 2 : p.size * 1.15;
        ctx.fillRect(p.x, p.y, w, h);
      } else if (theme === 'spatial') {
        const col = p.huePick > 0.28 ? '192, 132, 252' : '0, 255, 136';
        ctx.fillStyle = `rgba(${col}, ${0.55 + 0.4 * pulse})`;
        if (p.huePick > 0.75) {
          const s = p.size * 1.1;
          ctx.fillRect(p.x - s * 0.5, p.y - s * 0.5, s, s);
        } else {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 0.65, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    if (!reducedMotion) {
      rafId = requestAnimationFrame(drawFrame);
    }
  }

  function start() {
    if (running || theme === 'idle') return;
    running = true;
    lastTime = 0;
    rafId = requestAnimationFrame(drawFrame);
  }

  function stop() {
    running = false;
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
    ctx.clearRect(0, 0, width, height);
  }

  function setTheme(nextTheme) {
    theme = nextTheme || 'idle';
    if (theme === 'idle') {
      particles = [];
      stop();
      return;
    }
    resize();
    buildParticles(theme);
    if (!running) start();
    else if (reducedMotion) drawFrame(performance.now());
  }

  window.addEventListener('resize', resize, { passive: true });
  resize();

  return {
    setTheme,
    start,
    stop,
    resize
  };
}
