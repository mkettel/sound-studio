"use client";

import VideoScrubberFrames from "@/components/VideoScrubberFrames";
import { useState } from "react";

export default function Home() {
  return (
    <main className="relative min-h-screen">
      {/* Fullscreen video */}
      <div className="fixed inset-0 w-full h-full">
        <VideoScrubberFrames />
      </div>
    </main>
  );
}
