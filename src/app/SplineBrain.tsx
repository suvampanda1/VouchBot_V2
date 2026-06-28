import { useState } from "react";

const PARTICLE_BRAIN_URL =
  "https://my.spline.design/particleaibraincopy-j9WSQVzuCOK1qfCqNioaa70Q/";

interface Props {
  active: boolean;
}

export default function SplineBrain({ active }: Props) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div
      aria-hidden="true"
      style={{
        width: "min(560px, 88vw)",
        aspectRatio: "1.38 / 1",
        opacity: active && loaded ? 1 : 0,
        transform: active && loaded ? "scale(1)" : "scale(0.94)",
        transition: "opacity 450ms ease, transform 650ms cubic-bezier(0.22, 1, 0.36, 1)",
        overflow: "hidden",
        pointerEvents: "none",
        WebkitMaskImage: "radial-gradient(ellipse 72% 70% at 50% 50%, #000 58%, transparent 100%)",
        maskImage: "radial-gradient(ellipse 72% 70% at 50% 50%, #000 58%, transparent 100%)",
      }}
    >
      <iframe
        src={PARTICLE_BRAIN_URL}
        title="Particle AI Brain"
        loading="eager"
        onLoad={() => setLoaded(true)}
        tabIndex={-1}
        style={{
          width: "100%",
          height: "100%",
          border: 0,
          display: "block",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}
