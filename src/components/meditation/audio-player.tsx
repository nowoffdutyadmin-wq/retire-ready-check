import { Pause, Play } from "lucide-react";
import { useRef, useState } from "react";

import { formatDuration } from "@/lib/meditation/time";

type AudioPlayerProps = {
  src: string;
  durationSeconds: number;
  completed: boolean;
  onComplete: () => Promise<void> | void;
};

export function AudioPlayer({ src, durationSeconds, completed, onComplete }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const completionFired = useRef(completed);
  const [playing, setPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  async function togglePlayback() {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      await audio.play();
      setPlaying(true);
    } else {
      audio.pause();
      setPlaying(false);
    }
  }

  async function handleTimeUpdate() {
    const audio = audioRef.current;
    if (!audio) return;

    const current = Math.floor(audio.currentTime);
    const total = Math.max(audio.duration || durationSeconds, 1);
    setElapsed(current);

    if (!completionFired.current && current / total >= 0.9) {
      completionFired.current = true;
      await onComplete();
    }
  }

  const progress = Math.min(100, Math.round((elapsed / Math.max(durationSeconds, 1)) * 100));

  return (
    <div className="grid gap-5">
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        onTimeUpdate={handleTimeUpdate}
        onEnded={() => setPlaying(false)}
      />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={togglePlayback}
          className="inline-flex min-h-[56px] min-w-[56px] items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm transition hover:bg-primary/90"
          aria-label={playing ? "Pause session" : "Play session"}
        >
          {playing ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" />}
        </button>
        <div className="w-full">
          <div className="h-3 overflow-hidden rounded-full bg-secondary" aria-hidden="true">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="mt-2 flex justify-between text-[16px] text-muted-foreground">
            <span>{formatDuration(elapsed)}</span>
            <span>{formatDuration(durationSeconds)}</span>
          </div>
        </div>
      </div>
      {completed && (
        <p className="text-[16px] font-medium text-primary">Your practice is complete for today.</p>
      )}
    </div>
  );
}
