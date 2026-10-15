import React, { useEffect, useRef } from 'react';
import { useTheme } from '../../context/ThemeContext';

interface Particle {
  x: number;
  y: number;
  radius: number;
  vx: number;
  vy: number;
  alpha: number;
  baseAlpha: number;
  color: string;
  pulseSpeed: number;
}

interface AuroraOrb {
  x: number;
  y: number;
  radius: number;
  vx: number;
  vy: number;
  color: string;
}

export const LiveAnimatedBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      initElements();
    };

    window.addEventListener('resize', handleResize);

    // Color definitions for Dark & Light modes
    const darkOrbColors = [
      'rgba(13, 148, 136, 0.14)',  // Teal
      'rgba(16, 185, 129, 0.12)',  // Emerald
      'rgba(99, 102, 241, 0.10)',  // Indigo
      'rgba(6, 182, 212, 0.12)',   // Cyan
      'rgba(217, 119, 6, 0.08)',   // Amber gold
    ];

    const lightOrbColors = [
      'rgba(45, 212, 191, 0.15)',  // Mint
      'rgba(56, 189, 248, 0.12)',  // Sky
      'rgba(251, 191, 36, 0.10)',  // Soft amber
      'rgba(167, 139, 250, 0.08)', // Soft violet
      'rgba(52, 211, 153, 0.12)',  // Pastel green
    ];

    const darkParticleColors = [
      'rgba(20, 184, 166, 0.7)',
      'rgba(52, 211, 153, 0.7)',
      'rgba(129, 140, 248, 0.6)',
      'rgba(251, 191, 36, 0.8)',
    ];

    const lightParticleColors = [
      'rgba(13, 148, 136, 0.45)',
      'rgba(16, 185, 129, 0.4)',
      'rgba(14, 165, 233, 0.4)',
      'rgba(245, 158, 11, 0.45)',
    ];

    let orbs: AuroraOrb[] = [];
    let particles: Particle[] = [];

    const initElements = () => {
      orbs = [];
      particles = [];

      const orbColors = isDark ? darkOrbColors : lightOrbColors;
      const orbCount = 5;

      for (let i = 0; i < orbCount; i++) {
        const radius = Math.min(width, height) * (0.35 + Math.random() * 0.25);
        orbs.push({
          x: Math.random() * width,
          y: Math.random() * height,
          radius,
          vx: (Math.random() - 0.5) * 0.4,
          vy: (Math.random() - 0.5) * 0.4,
          color: orbColors[i % orbColors.length],
        });
      }

      const particleColors = isDark ? darkParticleColors : lightParticleColors;
      const particleCount = Math.floor(Math.min(width, height) / 25);

      for (let i = 0; i < particleCount; i++) {
        const baseAlpha = 0.2 + Math.random() * 0.6;
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          radius: 1 + Math.random() * 2.2,
          vx: (Math.random() - 0.5) * 0.35,
          vy: -0.2 - Math.random() * 0.4, // gently drift upwards
          alpha: baseAlpha,
          baseAlpha,
          color: particleColors[Math.floor(Math.random() * particleColors.length)],
          pulseSpeed: 0.015 + Math.random() * 0.02,
        });
      }
    };

    initElements();

    let isVisible = !document.hidden;
    const handleVisibilityChange = () => {
      isVisible = !document.hidden;
      if (isVisible) {
        lastTime = performance.now();
        render(lastTime);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    let lastTime = performance.now();

    const render = (currentTime: number) => {
      if (!isVisible) return;

      const delta = Math.min((currentTime - lastTime) / 1000, 0.1);
      lastTime = currentTime;

      ctx.clearRect(0, 0, width, height);

      // Draw background wash
      ctx.fillStyle = isDark ? '#020617' : '#f8fafc';
      ctx.fillRect(0, 0, width, height);

      // 1. Draw glowing aurora mesh orbs
      ctx.save();
      for (const orb of orbs) {
        orb.x += orb.vx * 60 * delta;
        orb.y += orb.vy * 60 * delta;

        // Bounce gently inside canvas bounds
        if (orb.x < -orb.radius * 0.2) orb.vx = Math.abs(orb.vx);
        if (orb.x > width + orb.radius * 0.2) orb.vx = -Math.abs(orb.vx);
        if (orb.y < -orb.radius * 0.2) orb.vy = Math.abs(orb.vy);
        if (orb.y > height + orb.radius * 0.2) orb.vy = -Math.abs(orb.vy);

        const gradient = ctx.createRadialGradient(
          orb.x,
          orb.y,
          0,
          orb.x,
          orb.y,
          orb.radius
        );
        gradient.addColorStop(0, orb.color);
        gradient.addColorStop(1, 'transparent');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(orb.x, orb.y, orb.radius, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // 2. Draw drifting stardust particles
      ctx.save();
      for (const p of particles) {
        p.x += p.vx * 60 * delta;
        p.y += p.vy * 60 * delta;

        // Wrap around vertically
        if (p.y < -10) {
          p.y = height + 10;
          p.x = Math.random() * width;
        }
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;

        // Pulse alpha
        p.alpha = p.baseAlpha + Math.sin(currentTime * 0.002 * (1 + p.pulseSpeed * 10)) * 0.25;
        p.alpha = Math.max(0.08, Math.min(1, p.alpha));

        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = isDark ? 8 : 4;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      ctx.restore();

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isDark]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-0 transition-opacity duration-700"
      style={{ opacity: 0.95 }}
    />
  );
};
