import React, { useState, useEffect } from 'react';
import { Progress } from "@ark-ui/react/progress";
import { BrainCircuit, Loader2 } from "lucide-react";

export default function AIAnalysisProgress({
  value = 0,
  label = 'AI đang phân tích',
  description = '',
  onComplete
}) {
  const [displayProgress, setDisplayProgress] = useState(0);
  const onCompleteCalledRef = React.useRef(false);

  useEffect(() => {
    if (value < 100) {
      onCompleteCalledRef.current = false;
    }
  }, [value]);

  useEffect(() => {
    let frame;
    let lastTime = performance.now();

    const animate = (time) => {
      setDisplayProgress((prev) => {
        if (prev >= value) {
          if (value === 100 && prev === 100 && onComplete && !onCompleteCalledRef.current) {
            onCompleteCalledRef.current = true;
            onComplete();
          }
          return value;
        }

        // Calculate step based on distance and elapsed time (simulate roughly 300-500ms per interval)
        const difference = value - prev;
        const delta = time - lastTime;
        
        if (delta > 30) {
          lastTime = time;
          const step = difference > 30 ? 2 : difference > 10 ? 1 : 1;
          return Math.min(prev + step, value);
        }
        
        return prev;
      });

      frame = requestAnimationFrame(animate);
    };

    frame = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(frame);
  }, [value, onComplete]);
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg p-6 w-full max-w-md mx-4 md:mx-auto">
      <div className="flex items-center gap-3 mb-4">
        <div className="bg-blue-50 p-2 rounded-lg">
          <BrainCircuit className="w-6 h-6 text-blue-600 animate-pulse" />
        </div>
        <h3 className="text-lg font-bold text-slate-900">{label}</h3>
        <Loader2 className="w-5 h-5 text-slate-400 animate-spin ml-auto" />
      </div>

      <div className="space-y-3">
        <Progress.Root
          value={displayProgress}
          min={0}
          max={100}
          className="w-full space-y-2"
        >
          <div className="flex items-center justify-between gap-4">
            <Progress.Label className="text-sm font-medium text-slate-700 truncate">
              {description || 'Vui lòng chờ trong giây lát...'}
            </Progress.Label>

            <Progress.ValueText className="text-sm font-semibold text-blue-600 shrink-0">
              {displayProgress}%
            </Progress.ValueText>
          </div>

          <Progress.Track className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
            <Progress.Range className="h-full rounded-full bg-blue-600 transition-all duration-150 ease-out" />
          </Progress.Track>
        </Progress.Root>
      </div>
    </div>
  );
}
