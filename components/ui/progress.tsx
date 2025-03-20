import * as React from "react";
import styles from './progress.module.css';

interface ProgressProps {
  value: number;
  max?: number;
  className?: string;
  barClassName?: string;
  showLabel?: boolean;
  labelClassName?: string;
  formatLabel?: (value: number, max: number) => string;
}

function toWidthClass(percent: number) {
  const clamped = Math.max(0, Math.min(100, Math.round(percent / 10) * 10));
  return `width-${clamped}`;
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  (
    {
      value,
      max = 100,
      className,
      barClassName,
      showLabel = false,
      labelClassName,
      formatLabel = (value, max) => `${Math.round((value / max) * 100)}%`,
      ...props
    },
    ref
  ) => {
    const percentage = (value / max) * 100;

    return (
      <div className={`w-full overflow-hidden ${className || ''}`} ref={ref} {...props}>
        <div className="w-full bg-gray-800 rounded-full h-2">
          <div id="progressbar-label" className="sr-only">
            {formatLabel(value, max)}
          </div>
          <div
            className={`h-full transition-all duration-300 ease-out ${barClassName || 'bg-blue-500'} ${styles[toWidthClass(percentage)]}`}
            role="progressbar"
            aria-valuetext={`${Math.round(percentage)}%`}
            aria-labelledby="progressbar-label"
            title={formatLabel(value, max)}
          />
        </div>
        {showLabel && (
          <p className={`text-xs text-gray-400 mt-1 text-right ${labelClassName || ''}`}>
            {formatLabel(value, max)}
          </p>
        )}
      </div>
    );
  }
);

Progress.displayName = "Progress";

export { Progress };