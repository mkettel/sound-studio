"use client";

interface CrossfaderProps {
  value: number;
  onValueChange: (value: number) => void;
  className?: string;
}

export default function Crossfader({ 
  value, 
  onValueChange, 
  className = "" 
}: CrossfaderProps) {
  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value);
    onValueChange(newValue);
  };

  // const getPositionText = () => {
  //   if (value < -0.1) return 'LEFT';
  //   if (value > 0.1) return 'RIGHT';
  //   return 'CENTER';
  // };

  return (
    <div className={`flex flex-col items-center  ${className}`}>

      
      <div className="text-white text-xs mb-1 font-mono uppercase tracking-wider">
        CROSSFADER
      </div>  
      <div className="flex items-center justify-center space-x-6">
        <div className="text-white text-sm font-mono">L</div>
        <div className="flex flex-col items-center">
          
          <input
            type="range"
            min="-1"
            max="1"
            step="0.01"
            value={value}
            onChange={handleValueChange}
            className="w-48 h-1 cursor-pointer slider"
          />
          
          {/* <div className="text-white text-xs font-mono mt-2">
            {getPositionText()}
          </div> */}
        </div>
        <div className="text-white text-sm font-mono">R</div>
      </div>
    </div>
  );
}