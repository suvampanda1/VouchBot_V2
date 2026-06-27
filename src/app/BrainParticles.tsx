import { useEffect, useRef, useState } from "react";
import brainVideo from "../imports/brain_particles_clean.mp4";

interface Props {
  active: boolean;
  width?: number;
  height?: number;
  delayMs?: number;
}

export default function BrainParticles({
  active,
  width = 400,
  height = 320,
  delayMs = 1450,
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (!active) {
      setVisible(false);
      video.pause();
      video.currentTime = 0;
      return;
    }

    const timer = window.setTimeout(() => {
      video.currentTime = 0;
      setVisible(true);
      void video.play().catch(() => {});
    }, delayMs);

    return () => window.clearTimeout(timer);
  }, [active, delayMs]);

  return (
    <div
      aria-hidden="true"
      style={{
        width,
        height,
        overflow: "hidden",
        opacity: visible ? 1 : 0,
        transform: visible ? "scale(1)" : "scale(0.94)",
        transition: "opacity 500ms ease, transform 700ms cubic-bezier(0.22, 1, 0.36, 1)",
        pointerEvents: "none",
        WebkitMaskImage: "radial-gradient(ellipse 70% 68% at 50% 48%, #000 54%, transparent 100%)",
        maskImage: "radial-gradient(ellipse 70% 68% at 50% 48%, #000 54%, transparent 100%)",
      }}
    >
      <video
        ref={videoRef}
        src={brainVideo}
        muted
        loop
        playsInline
        preload="auto"
        style={{
          width: "100%",
          height: "100%",
          display: "block",
          objectFit: "cover",
          mixBlendMode: "screen",
          filter: "contrast(1.18) brightness(1.18)",
        }}
      />
    </div>
  );
}