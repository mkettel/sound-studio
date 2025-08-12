"use client";

import VideoScrubberFrames from "@/components/VideoScrubberFrames";
import DJBoard from "@/components/DJBoard";

export default function Home() {
  return (
    <main className="relative min-h-screen">
      {/* Fullscreen video background */}
      <div className="fixed inset-0 w-full h-full">
        <VideoScrubberFrames />
      </div>

      {/* DJ Interface - Always Present, Collapsible */}
      <DJBoard />
    </main>
  );
}
