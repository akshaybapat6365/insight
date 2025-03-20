import React from 'react';

const progressClasses: Record<number, string> = {
  0: 'progress-0',
  10: 'progress-10',
  20: 'progress-20',
  30: 'progress-30',
  40: 'progress-40',
  50: 'progress-50',
  60: 'progress-60',
  70: 'progress-70',
  80: 'progress-80',
  90: 'progress-90',
  100: 'progress-100'
};

interface ProgressBarProps {
  progress: number;
  className?: string;
  showLabel?: boolean;
  labelFormat?: (progress: number) => string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ 
  progress, 
  className,
  showLabel = true,
  labelFormat = (progress) => 
    progress < 100 
      ? `Uploading & Processing: ${progress}%` 
      : 'Analysis Complete'
}) => {
  // Ensure progress is between 0-100
  const safeProgress = Math.max(0, Math.min(100, progress));
  const roundedProgress = Math.round(safeProgress / 10) * 10;
  
  return (
    <div className={`w-full ${className || ''}`}>
      <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
        <div
          className={`progress-bar bg-blue-500 h-full transition-all duration-300 ease-out ${progressClasses[roundedProgress]}`}
        ></div>
      </div>
      {showLabel && (
        <p className="text-xs text-gray-400 mt-1 text-right">
          {labelFormat(safeProgress)}
        </p>
      )}
    </div>
  );
};