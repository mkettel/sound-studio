"use client";

import VideoScrubber from "@/components/VideoScrubber";
import VideoScrubberPro from "@/components/VideoScrubberPro";
import VideoScrubberOptimized from "@/components/VideoScrubberOptimized";
import { useState } from "react";

export default function Home() {
  const [mode, setMode] = useState<"scroll" | "mouse" | "both">("both");
  const [smoothing, setSmoothing] = useState(0.1);

  return (
    <main className="relative min-h-[300vh]">
      {/* Fullscreen video */}
      <div className="fixed inset-0 w-full h-full">
        <VideoScrubberOptimized
          videoSrc="/auw-test.mp4"
          mode={mode}
          smoothing={smoothing}
        />
      </div>

      {/* Floating controls */}
      <div className="fixed top-6 left-6 bg-white/10  backdrop-blur-md rounded-lg p-4 z-50 text-white max-w-md">
        <h1 className="text-xl font-bold mb-3">Video Scrubbing Demo</h1>

        <div className="flex gap-2 mb-3">
          <button
            onClick={() => setMode("scroll")}
            className={`px-3 py-1.5 rounded text-sm ${
              mode === "scroll"
                ? "bg-blue-500 text-white"
                : "bg-white/20 hover:bg-white/30"
            }`}
          >
            Scroll
          </button>
          <button
            onClick={() => setMode("mouse")}
            className={`px-3 py-1.5 rounded text-sm ${
              mode === "mouse"
                ? "bg-blue-500 text-white"
                : "bg-white/20 hover:bg-white/30"
            }`}
          >
            Mouse
          </button>
          <button
            onClick={() => setMode("both")}
            className={`px-3 py-1.5 rounded text-sm ${
              mode === "both"
                ? "bg-blue-500 text-white"
                : "bg-white/20 hover:bg-white/30"
            }`}
          >
            Both
          </button>
        </div>

        <div className="text-xs text-white/80 mb-3">
          {mode === "scroll" && "Scroll the page to control video"}
          {mode === "mouse" && "Move mouse horizontally over video"}
          {mode === "both" && "Scroll or move mouse to control"}
        </div>

        <div className="space-y-1">
          <label className="text-xs text-white/60">Smoothing</label>
          <input
            type="range"
            min="0.02"
            max="0.3"
            step="0.01"
            value={smoothing}
            onChange={(e) => setSmoothing(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer"
          />
          <div className="text-xs text-white/60 flex justify-between">
            <span>Smooth</span>
            <span>Responsive</span>
          </div>
        </div>
      </div>

      {/* Spacer for scroll */}
      <div className="relative z-10 pointer-events-none">
        <div className="h-screen" />
        <div className="h-screen" />
        <div className="h-screen" />
      </div>
    </main>
  );
}
