"use client";

interface MasterVolumeProps {
  volume: number;
  onVolumeChange: (volume: number) => void;
  className?: string;
}

export default function MasterVolume({ 
  volume, 
  onVolumeChange, 
  className = "" 
}: MasterVolumeProps) {
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    onVolumeChange(newVolume);
  };

  const volumePercentage = Math.round(volume * 100);

  return (
    <div className={`flex items-center space-x-4 ${className} min-w-[350px]`}>
      <div className="text-white text-sm font-mono uppercase tracking-wider min-w-fit">
        MASTER
      </div>
      
      <div className="flex items-center space-x-3">
        <div className="text-white/60 text-xs font-mono">
          {volumePercentage}%
        </div>
        
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={volume}
          onChange={handleVolumeChange}
          className="w-32 h-2 rounded-lg cursor-pointer"
        />
        
        <div className="flex items-center space-x-1">
          {/* Volume indicator bars */}
          <div className={`w-1 h-3 rounded-sm ${volume > 0.1 ? 'bg-white' : 'bg-white/20'}`} />
          <div className={`w-1 h-4 rounded-sm ${volume > 0.3 ? 'bg-white' : 'bg-white/20'}`} />
          <div className={`w-1 h-5 rounded-sm ${volume > 0.6 ? 'bg-white' : 'bg-white/20'}`} />
          <div className={`w-1 h-6 rounded-sm ${volume > 0.8 ? 'bg-white' : 'bg-white/20'}`} />
        </div>
      </div>
    </div>
  );
}