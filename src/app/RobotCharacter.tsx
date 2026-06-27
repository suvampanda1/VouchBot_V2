import { useEffect, useRef } from "react";
import robotVideo from "../imports/robo_vochbot_alpha.webm";
import robotPoster from "../imports/robo_vochbot_front.png";

export type RobotState = "idle" | "side" | "thinking";

interface Props {
  state: RobotState;
  size?: number;
}

const FRONT_HOLD = 2.05;
const SIDE_HOLD = 4.55;

export default function RobotCharacter({ state, size = 180 }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const frameRef = useRef<number | null>(null);
  const playedIntroRef = useRef(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const stopMonitor = () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
    };

    const holdAt = (time: number) => {
      stopMonitor();
      video.pause();
      video.currentTime = time;
    };

    const playUntil = (time: number) => {
      stopMonitor();
      void video.play().catch(() => {
        holdAt(time);
      });

      const monitor = () => {
        if (video.currentTime >= time || video.ended) {
          holdAt(time);
          return;
        }
        frameRef.current = requestAnimationFrame(monitor);
      };
      frameRef.current = requestAnimationFrame(monitor);
    };

    const applyState = () => {
      if (state === "thinking") {
        if (video.currentTime < FRONT_HOLD - 0.15 || video.currentTime > SIDE_HOLD + 0.3) {
          video.currentTime = FRONT_HOLD;
        }
        playUntil(SIDE_HOLD);
        return;
      }

      if (state === "side") {
        holdAt(SIDE_HOLD);
        return;
      }

      if (!playedIntroRef.current) {
        playedIntroRef.current = true;
        video.currentTime = 0;
        playUntil(FRONT_HOLD);
      } else {
        holdAt(FRONT_HOLD);
      }
    };

    if (video.readyState >= 1) {
      applyState();
    } else {
      video.addEventListener("loadedmetadata", applyState, { once: true });
    }

    return () => {
      stopMonitor();
      video.removeEventListener("loadedmetadata", applyState);
    };
  }, [state]);

  return (
    <div
      aria-hidden="true"
      style={{
        width: size,
        height: size,
        display: "grid",
        placeItems: "center",
        filter: "drop-shadow(0 0 18px rgba(255, 0, 153, 0.25))",
      }}
    >
      <video
        ref={videoRef}
        src={robotVideo}
        poster={robotPoster}
        muted
        playsInline
        preload="auto"
        style={{
          width: "100%",
          height: "100%",
          display: "block",
          objectFit: "contain",
        }}
      />
    </div>
  );
}