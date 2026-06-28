import { useEffect, useRef, useState } from "react";

const LOCAL_BRAIN_SCENE = "/spline/particle-ai-brain-neon-pink.splinecode";
const BRAIN_PREVIEW = "/spline/brain-preview.png";

interface Props {
  active: boolean;
  thinking: boolean;
}

export default function SplineBrain({ active, thinking }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !active) return;

    setLoaded(false);
    setFailed(false);

    const controller = new AbortController();
    let app: import("@splinetool/runtime").Application | null = null;
    let resizeObserver: ResizeObserver | null = null;
    let disposed = false;

    const loadScene = async () => {
      try {
        const [{ Application }, response] = await Promise.all([
          import("@splinetool/runtime"),
          fetch(LOCAL_BRAIN_SCENE, { signal: controller.signal }),
        ]);
        if (!response.ok) throw new Error(`Spline scene failed with ${response.status}`);

        const scene = await response.arrayBuffer();
        if (disposed) return;

        app = new Application(canvas, { renderMode: "continuous" });
        app.start(scene, { interactive: false });

        const resize = () => {
          if (!app) return;
          const { width, height } = canvas.getBoundingClientRect();
          app.setSize(Math.max(1, width), Math.max(1, height));
        };

        resizeObserver = new ResizeObserver(resize);
        resizeObserver.observe(canvas);
        resize();
        setLoaded(true);
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error("Unable to load the local Spline brain scene.", error);
          setFailed(true);
        }
      }
    };

    void loadScene();

    return () => {
      disposed = true;
      controller.abort();
      resizeObserver?.disconnect();
      app?.dispose();
    };
  }, [active]);

  return (
    <div
      aria-hidden="true"
      data-spline-brain={loaded ? "ready" : failed ? "fallback" : "loading"}
      style={{
        position: "absolute",
        inset: 0,
        opacity: active && (loaded || failed) ? (thinking ? 0.96 : 0.72) : 0,
        transform: thinking ? "scale(1.03)" : "scale(1)",
        transition: "opacity 600ms ease, transform 900ms cubic-bezier(0.22, 1, 0.36, 1)",
        overflow: "hidden",
        pointerEvents: "none",
        WebkitMaskImage:
          "radial-gradient(ellipse 70% 72% at 50% 50%, #000 42%, rgba(0,0,0,0.82) 68%, transparent 100%)",
        maskImage:
          "radial-gradient(ellipse 70% 72% at 50% 50%, #000 42%, rgba(0,0,0,0.82) 68%, transparent 100%)",
      }}
    >
      <canvas
        ref={canvasRef}
        data-testid="local-spline-brain-canvas"
        style={{
          display: failed ? "none" : "block",
          width: "100%",
          height: "100%",
        }}
      />
      {failed && (
        <img
          src={BRAIN_PREVIEW}
          alt=""
          style={{
            width: "100%",
            height: "100%",
            display: "block",
            objectFit: "cover",
            objectPosition: "center",
          }}
        />
      )}
    </div>
  );
}
