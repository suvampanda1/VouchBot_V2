import { useState } from "react";

const SPLINE_SCENE_URL =
  "https://my.spline.design/particles-dLRyElGgwVEUQawPnEsoQHn1/";

interface Props {
  active: boolean;
  thinking: boolean;
}

export default function SplineSceneBackground({ active, thinking }: Props) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div
      aria-hidden="true"
      data-spline-scene={loaded ? "ready" : "loading"}
      style={{
        position: "absolute",
        inset: 0,
        opacity: active && loaded ? (thinking ? 1 : 0.82) : 0,
        transform: thinking ? "scale(1.025)" : "scale(1)",
        transition:
          "opacity 600ms ease, transform 900ms cubic-bezier(0.22, 1, 0.36, 1)",
        overflow: "hidden",
        pointerEvents: "none",
      }}
    >
      <iframe
        src={SPLINE_SCENE_URL}
        title="Spline particles background"
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