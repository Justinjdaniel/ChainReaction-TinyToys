import React from 'react';

interface ExplodingHeaderProps {
  text: string;
  className?: string;
}

const pseudoRandom = (seed: number) => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

export const ExplodingHeader: React.FC<ExplodingHeaderProps> = ({ text, className }) => {
  return (
    <span className={`inline-flex flex-wrap justify-center group cursor-pointer select-none ${className || ''}`}>
      {text.split('').map((char, index) => {
        const seed = index + 1;

        // Deterministic explosion offsets
        const angle = pseudoRandom(seed) * 2 * Math.PI;
        const distance = 40 + pseudoRandom(seed + 12) * 60; // 40px to 100px explosion distance
        const x = Math.cos(angle) * distance;
        const y = Math.sin(angle) * distance;
        const rot = -180 + pseudoRandom(seed + 34) * 360; // -180deg to 180deg
        const scale = 1.3 + pseudoRandom(seed + 56) * 0.7; // 1.3x to 2.0x scale

        const style = {
          '--explode-x': `${x.toFixed(1)}px`,
          '--explode-y': `${y.toFixed(1)}px`,
          '--explode-rot': `${rot.toFixed(1)}deg`,
          '--explode-scale': scale.toFixed(2),
          transitionTimingFunction: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        } as React.CSSProperties;

        return (
          <span
            key={index}
            style={style}
            className="inline-block transition-all duration-750 transform origin-center group-hover:translate-x-[var(--explode-x)] group-hover:translate-y-[var(--explode-y)] group-hover:rotate-[var(--explode-rot)] group-hover:scale-[var(--explode-scale)] group-hover:opacity-40 group-hover:text-neonRed motion-reduce:transition-none motion-reduce:transform-none motion-reduce:group-hover:translate-x-0 motion-reduce:group-hover:translate-y-0 motion-reduce:group-hover:rotate-0 motion-reduce:group-hover:scale-100 motion-reduce:group-hover:opacity-100"
          >
            {char === ' ' ? '\u00A0' : char}
          </span>
        );
      })}
    </span>
  );
};
