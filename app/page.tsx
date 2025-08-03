"use client";

import VideoScrubberSegments from "@/components/VideoScrubberSegments";
import { useState } from "react";

export default function Home() {
  const [smoothing, setSmoothing] = useState(0.08);
  const [baseDuration, setBaseDuration] = useState(800);
  const [maxDuration, setMaxDuration] = useState(2500);
  const [useStaging, setUseStaging] = useState(true);
  const [bufferZone, setBufferZone] = useState(0.05);

  return (
    <main className="relative min-h-screen">
      {/* Fullscreen video */}
      <div className="fixed inset-0 w-full h-full">
        <VideoScrubberSegments
          videoSrc="/Comp.mp4"
          smoothing={smoothing}
          baseDuration={baseDuration}
          maxDuration={maxDuration}
          useStaging={useStaging}
          bufferZone={bufferZone}
        />
      </div>

      {/* Optional controls for fine-tuning */}
      <div className="fixed top-6 right-6 bg-black/30 backdrop-blur-md rounded-lg p-4 z-50 text-white max-w-xs">
        <h2 className="text-sm font-bold mb-3">Fine-tune Settings</h2>

        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs text-white/60">Smoothing</label>
            <input
              type="range"
              min="0.02"
              max="0.2"
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

          <div className="space-y-1">
            <label className="text-xs text-white/60">Base Duration</label>
            <input
              type="range"
              min="300"
              max="1500"
              step="50"
              value={baseDuration}
              onChange={(e) => setBaseDuration(parseInt(e.target.value))}
              className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer"
            />
            <div className="text-xs text-white/60 flex justify-between">
              <span>Fast</span>
              <span>Slow</span>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-white/60">Max Duration</label>
            <input
              type="range"
              min="1000"
              max="4000"
              step="100"
              value={maxDuration}
              onChange={(e) => setMaxDuration(parseInt(e.target.value))}
              className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer"
            />
            <div className="text-xs text-white/60 flex justify-between">
              <span>Quick</span>
              <span>Cinematic</span>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-white/20">
            <div className="flex items-center justify-between">
              <label className="text-xs text-white/60">Staged Transitions</label>
              <button
                onClick={() => setUseStaging(!useStaging)}
                className={`w-10 h-5 rounded-full transition-colors duration-200 ${
                  useStaging ? 'bg-blue-500' : 'bg-white/20'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform duration-200 ${
                    useStaging ? 'translate-x-5' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
            
            {useStaging && (
              <div className="space-y-1">
                <label className="text-xs text-white/60">Buffer Zone</label>
                <input
                  type="range"
                  min="0.01"
                  max="0.15"
                  step="0.01"
                  value={bufferZone}
                  onChange={(e) => setBufferZone(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer"
                />
                <div className="text-xs text-white/60 flex justify-between">
                  <span>Tight</span>
                  <span>Smooth</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
