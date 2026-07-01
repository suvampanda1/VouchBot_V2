import { memo, useEffect, useRef } from "react";

interface Props {
  active: boolean;
  thinking: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  radius: number;
  speed: number;
  phase: number;
  wobble: number;
  size: number;
  depth: number;
  color: number;
  alpha: number;
}

const COLORS = [
  [139, 92, 246],
  [168, 85, 247],
  [217, 70, 239],
  [255, 0, 153],
] as const;

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const InteractiveParticleBackground = memo(function InteractiveParticleBackground({ active, thinking }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ active, thinking });
  stateRef.current = { active, thinking };

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d", { alpha: true });
    if (!canvas || !context) return;

    let width = 1;
    let height = 1;
    let animationFrame = 0;
    let lastTime = performance.now();
    let elapsed = 0;
    let wasActive = false;
    let fieldGlow: CanvasGradient | null = null;
    let bounds = canvas.getBoundingClientRect();
    let particles: Particle[] = [];

    const sprites = COLORS.map(([red, green, blue]) => {
      const sprite = document.createElement("canvas");
      sprite.width = 64;
      sprite.height = 64;
      const spriteContext = sprite.getContext("2d");
      if (!spriteContext) return sprite;

      const glow = spriteContext.createRadialGradient(32, 32, 0, 32, 32, 32);
      glow.addColorStop(0, `rgba(${red}, ${green}, ${blue}, 1)`);
      glow.addColorStop(0.1, `rgba(${red}, ${green}, ${blue}, 0.96)`);
      glow.addColorStop(0.3, `rgba(${red}, ${green}, ${blue}, 0.44)`);
      glow.addColorStop(0.62, `rgba(${red}, ${green}, ${blue}, 0.12)`);
      glow.addColorStop(1, `rgba(${red}, ${green}, ${blue}, 0)`);
      spriteContext.fillStyle = glow;
      spriteContext.fillRect(0, 0, 64, 64);
      return sprite;
    });

    const pointer = {
      x: 0,
      y: 0,
      active: false,
      strength: 0,
      burst: 0,
    };

    const createParticles = () => {
      const maxCount = width < 720 ? 300 : 420;
      const count = Math.round(clamp((width * height) / 2500, 190, maxCount));
      const maxRadius = Math.max(120, Math.min(width * 0.54, height * 0.74));
      const centerX = width * 0.5;
      const centerY = height * 0.5;

      particles = Array.from({ length: count }, (_, index) => {
        const depth = 0.22 + Math.random() * 0.78;
        const angle = Math.random() * Math.PI * 2;
        const radius = 24 + Math.pow(Math.random(), 1.15) * maxRadius;

        return {
          x: centerX + Math.cos(angle) * radius,
          y: centerY + Math.sin(angle) * radius * 0.58,
          vx: 0,
          vy: 0,
          angle,
          radius,
          speed: (0.00032 + Math.random() * 0.00072) * (index % 2 ? 1 : -1),
          phase: Math.random() * Math.PI * 2,
          wobble: 0.65 + Math.random() * 1.7,
          size: 0.45 + Math.random() * 1.65,
          depth,
          color: Math.floor(Math.random() * COLORS.length),
          alpha: 0.34 + Math.random() * 0.58,
        };
      });
    };

    const resize = () => {
      bounds = canvas.getBoundingClientRect();
      width = Math.max(1, bounds.width);
      height = Math.max(1, bounds.height);
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(width * pixelRatio);
      canvas.height = Math.round(height * pixelRatio);
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      context.imageSmoothingEnabled = true;

      fieldGlow = context.createRadialGradient(
        width * 0.5,
        height * 0.5,
        0,
        width * 0.5,
        height * 0.5,
        Math.min(width, height) * 0.58,
      );
      fieldGlow.addColorStop(0, "rgba(255, 0, 153, 0.055)");
      fieldGlow.addColorStop(0.38, "rgba(168, 85, 247, 0.035)");
      fieldGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
      createParticles();
    };

    const updatePointer = (clientX: number, clientY: number, pressed: boolean) => {
      const x = clientX - bounds.left;
      const y = clientY - bounds.top;
      const inside = x >= 0 && x <= bounds.width && y >= 0 && y <= bounds.height;

      pointer.active = inside;
      if (!inside) return;
      pointer.x = x;
      pointer.y = y;
      pointer.strength = pressed ? 1.45 : Math.max(pointer.strength, 0.72);
      if (pressed) pointer.burst = 1.8;
    };

    const handlePointerMove = (event: PointerEvent) => {
      updatePointer(event.clientX, event.clientY, event.pressure > 0);
    };
    const handlePointerDown = (event: PointerEvent) => {
      updatePointer(event.clientX, event.clientY, true);
    };
    const handlePointerUp = () => {
      pointer.strength = Math.min(pointer.strength, 0.55);
    };
    const handlePointerOut = (event: PointerEvent) => {
      if (!event.relatedTarget) pointer.active = false;
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("pointerdown", handlePointerDown, { passive: true });
    window.addEventListener("pointerup", handlePointerUp, { passive: true });
    window.addEventListener("pointerout", handlePointerOut, { passive: true });

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);
    resize();

    const draw = (now: number) => {
      animationFrame = requestAnimationFrame(draw);

      if (!stateRef.current.active || document.hidden) {
        if (wasActive) context.clearRect(0, 0, width, height);
        wasActive = false;
        lastTime = now;
        return;
      }

      wasActive = true;
      const frameScale = clamp((now - lastTime) / 16.67, 0.35, 2);
      lastTime = now;
      elapsed += frameScale * 16.67;
      context.clearRect(0, 0, width, height);

      const centerX = width * 0.5;
      const centerY = height * 0.5;
      const thinkingBoost = stateRef.current.thinking ? 1.85 : 1;
      const interactionRadius = Math.min(220, Math.max(130, width * 0.24));
      const interactionRadiusSquared = interactionRadius * interactionRadius;

      if (fieldGlow) {
        context.fillStyle = fieldGlow;
        context.fillRect(0, 0, width, height);
      }
      context.globalCompositeOperation = "lighter";

      for (const particle of particles) {
        particle.angle += particle.speed * frameScale * thinkingBoost * 16.67;

        const wave = Math.sin(elapsed * 0.00075 * particle.wobble + particle.phase);
        const orbitRadius = particle.radius * (1 + wave * 0.055);
        const targetX =
          centerX +
          Math.cos(particle.angle) * orbitRadius +
          Math.sin(particle.angle * 2.4 + particle.phase) * 16 * particle.depth;
        const targetY =
          centerY +
          Math.sin(particle.angle) * orbitRadius * 0.58 +
          Math.cos(particle.angle * 2.1 + particle.phase) * 13 * particle.depth;

        let forceX = (targetX - particle.x) * 0.018;
        let forceY = (targetY - particle.y) * 0.018;

        if (pointer.active && pointer.strength > 0.02) {
          const dx = particle.x - pointer.x;
          const dy = particle.y - pointer.y;
          const distanceSquared = dx * dx + dy * dy;

          if (distanceSquared < interactionRadiusSquared) {
            const distance = Math.sqrt(Math.max(1, distanceSquared));
            const proximity = 1 - distance / interactionRadius;
            const force = proximity * proximity * (0.5 + pointer.strength * 1.3 + pointer.burst * 2.4);
            forceX += (dx / distance) * force - (dy / distance) * force * 0.36;
            forceY += (dy / distance) * force + (dx / distance) * force * 0.36;
          }
        }

        particle.vx = (particle.vx + forceX * frameScale) * 0.91;
        particle.vy = (particle.vy + forceY * frameScale) * 0.91;
        particle.x += particle.vx * frameScale;
        particle.y += particle.vy * frameScale;

        const glow = stateRef.current.thinking ? 1.24 : 1;
        const radius = particle.size * (0.72 + particle.depth * 0.55) * glow;
        const visualSize = 9 + radius * 7;
        context.globalAlpha = particle.alpha * (0.58 + particle.depth * 0.42);
        context.drawImage(
          sprites[particle.color],
          particle.x - visualSize * 0.5,
          particle.y - visualSize * 0.5,
          visualSize,
          visualSize,
        );
      }

      context.globalAlpha = 1;
      context.globalCompositeOperation = "source-over";
      pointer.strength *= 0.982;
      pointer.burst *= 0.92;
    };

    animationFrame = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointerout", handlePointerOut);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      data-testid="interactive-particle-background"
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        display: "block",
        opacity: active ? (thinking ? 1 : 0.88) : 0,
        transition: "opacity 500ms ease",
        pointerEvents: "none",
      }}
    />
  );
});

export default InteractiveParticleBackground;