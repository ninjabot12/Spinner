/**
 * EffectsLayer Component
 * Visual effects like confetti on prize reveal.
 * CSS fallback used (Lottie can be added later).
 */

import React, { useEffect } from 'react';

interface EffectsLayerProps {
  /** Effect type: 'confetti' */
  effect: 'confetti';
  /** Trigger the effect */
  play: boolean;
}

/**
 * Renders particles/confetti on prize reveal.
 * Currently uses CSS animation; can be replaced with Lottie JSON later.
 */
export const EffectsLayer: React.FC<EffectsLayerProps> = ({ effect, play }) => {
  const containerRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!play || !containerRef.current) return;

    if (effect === 'confetti') {
      // Create confetti particles
      const fragment = document.createDocumentFragment();
      const particleCount = 30;

      for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.style.cssText = `
          position: fixed;
          left: 50%;
          top: 50%;
          width: 10px;
          height: 10px;
          background: ${['#FFD700', '#FF6347', '#00CED1', '#32CD32'][Math.floor(Math.random() * 4)]};
          border-radius: 50%;
          pointer-events: none;
          animation: confetti-fall ${2 + Math.random()}s ease-in forwards;
          transform: translate(${(Math.random() - 0.5) * 200}px, 0);
          opacity: ${0.5 + Math.random() * 0.5};
        `;

        fragment.appendChild(particle);
      }

      containerRef.current.appendChild(fragment);

      // Clean up after animation
      const timeout = setTimeout(() => {
        if (containerRef.current) {
          containerRef.current.innerHTML = '';
        }
      }, 3000);

      return () => clearTimeout(timeout);
    }
  }, [play, effect]);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'none',
        zIndex: 25,
      }}
    >
      <style>{`
        @keyframes confetti-fall {
          to {
            transform: translateY(500px) rotate(360deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};
