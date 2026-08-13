import { useState, useEffect, useRef } from 'react';

/**
 * Hook to manage loading state visibility with thresholds to prevent UI flashing.
 * - Skips showing loading state if data loads under `delayMs` (default 120ms).
 * - Forces loading state to remain visible for at least `minDurationMs` (default 250ms) once shown.
 * 
 * @param {boolean} isLoading - The raw loading state from API request.
 * @param {number} delayMs - Milliseconds to wait before showing skeleton.
 * @param {number} minDurationMs - Minimum milliseconds to show skeleton once triggered.
 * @returns {boolean} - The computed loading state for UI rendering.
 */
export default function useDelayedLoading(isLoading, delayMs = 120, minDurationMs = 250) {
  const [showLoading, setShowLoading] = useState(isLoading);
  const startTimeRef = useRef(null);
  const delayTimerRef = useRef(null);
  const minDurationTimerRef = useRef(null);

  useEffect(() => {
    // Clear any existing timers
    if (delayTimerRef.current) clearTimeout(delayTimerRef.current);
    if (minDurationTimerRef.current) clearTimeout(minDurationTimerRef.current);

    if (isLoading) {
      if (!showLoading) {
        // Start delay timer
        delayTimerRef.current = setTimeout(() => {
          setShowLoading(true);
          startTimeRef.current = Date.now();
        }, delayMs);
      }
    } else {
      if (showLoading && startTimeRef.current) {
        // Enforce minimum duration
        const elapsedTime = Date.now() - startTimeRef.current;
        const remainingTime = minDurationMs - elapsedTime;
        
        if (remainingTime > 0) {
          minDurationTimerRef.current = setTimeout(() => {
            setShowLoading(false);
            startTimeRef.current = null;
          }, remainingTime);
        } else {
          setShowLoading(false);
          startTimeRef.current = null;
        }
      } else {
        // Cancel if data loaded before delay
        setShowLoading(false);
      }
    }

    return () => {
      if (delayTimerRef.current) clearTimeout(delayTimerRef.current);
      if (minDurationTimerRef.current) clearTimeout(minDurationTimerRef.current);
    };
  }, [isLoading, delayMs, minDurationMs, showLoading]);

  // Handle immediate initial state
  useEffect(() => {
    if (isLoading && !startTimeRef.current && showLoading) {
      startTimeRef.current = Date.now();
    }
  }, []);

  return showLoading;
}
