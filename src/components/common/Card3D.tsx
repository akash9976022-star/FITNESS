import React, { useState, useRef, useCallback } from 'react';

interface Card3DProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  intensity?: number; // Max tilt angle in degrees (default: 8)
  glare?: boolean; // Enable dynamic specular light glare (default: true)
  glowColor?: 'emerald' | 'cyan' | 'violet' | 'amber' | 'rose' | 'slate';
  disabled?: boolean;
}

export const Card3D: React.FC<Card3DProps> = ({
  children,
  className = '',
  intensity = 7,
  glare = true,
  glowColor = 'slate',
  disabled = false,
  ...props
}) => {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [transform, setTransform] = useState({
    rotateX: 0,
    rotateY: 0,
    glareX: 50,
    glareY: 50,
    glareOpacity: 0,
    isHovered: false,
  });

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (disabled) return;
      const card = cardRef.current;
      if (!card) return;

      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      // Calculate tilt angles inversely
      const rotateX = -((y - centerY) / centerY) * intensity;
      const rotateY = ((x - centerX) / centerX) * intensity;

      // Glare reflection coordinates (percentages)
      const glareX = (x / rect.width) * 100;
      const glareY = (y / rect.height) * 100;

      setTransform({
        rotateX,
        rotateY,
        glareX,
        glareY,
        glareOpacity: 0.18,
        isHovered: true,
      });
    },
    [intensity, disabled]
  );

  const handleMouseLeave = useCallback(() => {
    setTransform({
      rotateX: 0,
      rotateY: 0,
      glareX: 50,
      glareY: 50,
      glareOpacity: 0,
      isHovered: false,
    });
  }, []);

  const glowShadows = {
    emerald: 'hover:shadow-[0_20px_50px_-10px_rgba(16,185,129,0.22)] hover:border-emerald-500/40',
    cyan: 'hover:shadow-[0_20px_50px_-10px_rgba(6,182,212,0.22)] hover:border-cyan-500/40',
    violet: 'hover:shadow-[0_20px_50px_-10px_rgba(139,92,246,0.22)] hover:border-violet-500/40',
    amber: 'hover:shadow-[0_20px_50px_-10px_rgba(245,158,11,0.22)] hover:border-amber-500/40',
    rose: 'hover:shadow-[0_20px_50px_-10px_rgba(244,63,94,0.22)] hover:border-rose-500/40',
    slate: 'hover:shadow-[0_20px_45px_-10px_rgba(0,0,0,0.35)] hover:border-slate-400/40 dark:hover:border-slate-700/80',
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: transform.isHovered
          ? `perspective(1000px) rotateX(${transform.rotateX.toFixed(2)}deg) rotateY(${transform.rotateY.toFixed(2)}deg) scale3d(1.012, 1.012, 1.012)`
          : 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
        transformStyle: 'preserve-3d',
        transition: transform.isHovered
          ? 'transform 0.08s ease-out, box-shadow 0.25s ease, border-color 0.25s ease'
          : 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.5s ease, border-color 0.5s ease',
      }}
      className={`relative rounded-3xl overflow-hidden transition-all ${glowShadows[glowColor]} ${className}`}
      {...props}
    >
      {/* Dynamic Specular Glare Layer */}
      {glare && (
        <div
          className="absolute inset-0 pointer-events-none z-30 transition-opacity duration-300 rounded-3xl"
          style={{
            opacity: transform.glareOpacity,
            background: `radial-gradient(circle 320px at ${transform.glareX}% ${transform.glareY}%, rgba(255, 255, 255, 0.7) 0%, rgba(255, 255, 255, 0.1) 40%, transparent 80%)`,
          }}
        />
      )}

      {/* Surface Content */}
      <div className="relative z-10 w-full h-full">{children}</div>
    </div>
  );
};

export default Card3D;

