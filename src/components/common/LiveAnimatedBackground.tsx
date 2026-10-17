import React, { useEffect, useRef } from 'react';
import { useTheme } from '../../context/ThemeContext';

interface Orb {
  x: number;
  y: number;
  radius: number;
  dx: number;
  dy: number;
  colorDark: string;
  colorLight: string;
}

interface Star {
  x: number;
  y: number;
  radius: number;
  alpha: number;
  dAlpha: number;
  speedY: number;
}

export const LiveAnimatedBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animationFrameId: number;
    let isVisible = true;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.scale(dpr, dpr);
    };

    resize();
    window.addEventListener('resize', resize);

    const handleVisibilityChange = () => {
      isVisible = !document.hidden;
      if (isVisible) {
        lastTime = performance.now();
        render(performance.now());
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    const w = window.innerWidth;
    const h = window.innerHeight;

    // 6 Rich SaaS Atmospheric Nebula Orbs
    const orbs: Orb[] = [
      {
        x: w * 0.18,
        y: h * 0.22,
        radius: Math.max(w, h) * 0.38,
        dx: 0.16,
        dy: 0.1,
        colorDark: 'rgba(16, 185, 129, 0.12)', // Aurora Emerald
        colorLight: 'rgba(52, 211, 153, 0.22)',
      },
      {
        x: w * 0.82,
        y: h * 0.28,
        radius: Math.max(w, h) * 0.42,
        dx: -0.14,
        dy: 0.12,
        colorDark: 'rgba(6, 182, 212, 0.11)', // Electric Cyan
        colorLight: 'rgba(56, 189, 248, 0.24)',
      },
      {
        x: w * 0.5,
        y: h * 0.78,
        radius: Math.max(w, h) * 0.45,
        dx: 0.12,
        dy: -0.15,
        colorDark: 'rgba(139, 92, 246, 0.10)', // Hyper Violet
        colorLight: 'rgba(196, 181, 253, 0.22)',
      },
      {
        x: w * 0.12,
        y: h * 0.72,
        radius: Math.max(w, h) * 0.35,
        dx: -0.12,
        dy: -0.09,
        colorDark: 'rgba(245, 158, 11, 0.08)', // Solar Amber
        colorLight: 'rgba(253, 230, 138, 0.24)',
      },
      {
        x: w * 0.88,
        y: h * 0.68,
        radius: Math.max(w, h) * 0.36,
        dx: 0.09,
        dy: -0.11,
        colorDark: 'rgba(99, 102, 241, 0.10)', // Deep Indigo
        colorLight: 'rgba(199, 210, 254, 0.22)',
      },
      {
        x: w * 0.45,
        y: h * 0.35,
        radius: Math.max(w, h) * 0.32,
        dx: -0.08,
        dy: 0.14,
        colorDark: 'rgba(244, 63, 94, 0.07)', // Rose Pulse
        colorLight: 'rgba(254, 205, 211, 0.20)',
      },
    ];

    // Cosmic Micro-Starfield (35 subtle floating dust particles)
    const stars: Star[] = Array.from({ length: 35 }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      radius: Math.random() * 1.5 + 0.6,
      alpha: Math.random() * 0.6 + 0.2,
      dAlpha: (Math.random() - 0.5) * 0.015,
      speedY: -(Math.random() * 0.15 + 0.05),
    }));

    let lastTime = performance.now();

    const render = (time: number) => {
      if (!isVisible) return;

      const dt = Math.min((time - lastTime) / 16.667, 2);
      lastTime = time;

      const currentW = window.innerWidth;
      const currentH = window.innerHeight;

      ctx.clearRect(0, 0, currentW, currentH);

      const isDark = resolvedTheme === 'dark';

      // Base canvas background
      ctx.fillStyle = isDark ? '#020617' : '#f8fafc';
      ctx.fillRect(0, 0, currentW, currentH);

      // Render floating nebula orbs
      for (const orb of orbs) {
        if (!prefersReducedMotion) {
          orb.x += orb.dx * dt;
          orb.y += orb.dy * dt;

          if (orb.x < -orb.radius * 0.25) orb.dx = Math.abs(orb.dx);
          if (orb.x > currentW + orb.radius * 0.25) orb.dx = -Math.abs(orb.dx);
          if (orb.y < -orb.radius * 0.25) orb.dy = Math.abs(orb.dy);
          if (orb.y > currentH + orb.radius * 0.25) orb.dy = -Math.abs(orb.dy);
        }

        const gradient = ctx.createRadialGradient(
          orb.x,
          orb.y,
          0,
          orb.x,
          orb.y,
          orb.radius
        );

        const color = isDark ? orb.colorDark : orb.colorLight;
        gradient.addColorStop(0, color);
        gradient.addColorStop(0.5, color.replace(/[\d.]+\)$/, isDark ? '0.04)' : '0.08)'));
        gradient.addColorStop(1, 'transparent');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(orb.x, orb.y, orb.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw subtle cyberpunk grid lines (very low opacity for high-tech aesthetic)
      if (isDark) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.015)';
        ctx.lineWidth = 1;
        const gridSize = 64;
        ctx.beginPath();
        for (let x = 0; x < currentW; x += gridSize) {
          ctx.moveTo(x, 0);
          ctx.lineTo(x, currentH);
        }
        for (let y = 0; y < currentH; y += gridSize) {
          ctx.moveTo(0, y);
          ctx.lineTo(currentW, y);
        }
        ctx.stroke();
      }

      // Render cosmic micro-star particles
      for (const star of stars) {
        if (!prefersReducedMotion) {
          star.y += star.speedY * dt;
          if (star.y < 0) {
            star.y = currentH;
            star.x = Math.random() * currentW;
          }

          star.alpha += star.dAlpha * dt;
          if (star.alpha > 0.8) {
            star.alpha = 0.8;
            star.dAlpha = -Math.abs(star.dAlpha);
          } else if (star.alpha < 0.15) {
            star.alpha = 0.15;
            star.dAlpha = Math.abs(star.dAlpha);
          }
        }

        ctx.fillStyle = isDark
          ? `rgba(255, 255, 255, ${star.alpha * 0.5})`
          : `rgba(16, 185, 129, ${star.alpha * 0.35})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      if (!prefersReducedMotion) {
        animationFrameId = requestAnimationFrame(render);
      }
    };

    render(performance.now());

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [resolvedTheme]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none -z-10 transition-opacity duration-700 select-none"
      aria-hidden="true"
    />
  );
};

export default LiveAnimatedBackground;
