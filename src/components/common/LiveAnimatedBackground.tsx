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

    // Check prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.scale(dpr, dpr);
    };

    resize();
    window.addEventListener('resize', resize);

    // Visibility change handler to save battery when tab is backgrounded
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

    // 5 Organic Floating Orbs
    const orbs: Orb[] = [
      {
        x: w * 0.2,
        y: h * 0.25,
        radius: Math.max(w, h) * 0.35,
        dx: 0.18,
        dy: 0.12,
        colorDark: 'rgba(16, 185, 129, 0.08)', // Aurora Emerald
        colorLight: 'rgba(52, 211, 153, 0.18)', // Pastel Mint
      },
      {
        x: w * 0.8,
        y: h * 0.3,
        radius: Math.max(w, h) * 0.38,
        dx: -0.15,
        dy: 0.14,
        colorDark: 'rgba(14, 165, 233, 0.07)', // Cosmic Cyan / Teal
        colorLight: 'rgba(186, 230, 253, 0.25)', // Pastel Sky
      },
      {
        x: w * 0.5,
        y: h * 0.8,
        radius: Math.max(w, h) * 0.42,
        dx: 0.12,
        dy: -0.16,
        colorDark: 'rgba(20, 184, 166, 0.06)', // Deep Aurora Teal
        colorLight: 'rgba(153, 246, 228, 0.22)', // Soft Aquamarine
      },
      {
        x: w * 0.15,
        y: h * 0.75,
        radius: Math.max(w, h) * 0.3,
        dx: -0.14,
        dy: -0.1,
        colorDark: 'rgba(245, 158, 11, 0.04)', // Warm Calorie Amber
        colorLight: 'rgba(254, 243, 199, 0.2)', // Soft Honey Pastel
      },
      {
        x: w * 0.85,
        y: h * 0.7,
        radius: Math.max(w, h) * 0.32,
        dx: 0.1,
        dy: -0.12,
        colorDark: 'rgba(99, 102, 241, 0.05)', // Celestial Indigo
        colorLight: 'rgba(224, 231, 255, 0.25)', // Soft Lilac
      },
    ];

    let lastTime = performance.now();

    const render = (time: number) => {
      if (!isVisible) return;

      const dt = Math.min((time - lastTime) / 16.667, 2);
      lastTime = time;

      const currentW = window.innerWidth;
      const currentH = window.innerHeight;

      ctx.clearRect(0, 0, currentW, currentH);

      const isDark = resolvedTheme === 'dark';

      // Draw subtle background wash
      ctx.fillStyle = isDark ? '#020617' : '#f8fafc';
      ctx.fillRect(0, 0, currentW, currentH);

      // Render floating orbs
      for (const orb of orbs) {
        if (!prefersReducedMotion) {
          orb.x += orb.dx * dt;
          orb.y += orb.dy * dt;

          if (orb.x < -orb.radius * 0.3) orb.dx = Math.abs(orb.dx);
          if (orb.x > currentW + orb.radius * 0.3) orb.dx = -Math.abs(orb.dx);
          if (orb.y < -orb.radius * 0.3) orb.dy = Math.abs(orb.dy);
          if (orb.y > currentH + orb.radius * 0.3) orb.dy = -Math.abs(orb.dy);
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
        gradient.addColorStop(0.6, color.replace(/[\d.]+\)$/, '0.02)'));
        gradient.addColorStop(1, 'transparent');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(orb.x, orb.y, orb.radius, 0, Math.PI * 2);
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

