import { useState, useRef, useCallback } from 'react';

/**
 * PullToRefresh wrapper — pull down to trigger a refresh callback.
 * Props:
 *   onRefresh (async fn), children
 */
export default function PullToRefresh({ onRefresh, children }) {
  const [pulling, setPulling] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const startY = useRef(0);
  const containerRef = useRef(null);

  const THRESHOLD = 80;

  const handleTouchStart = useCallback((e) => {
    // Only activate when scrolled to top
    const el = containerRef.current;
    if (el && el.scrollTop === 0) {
      startY.current = e.touches[0].clientY;
      setPulling(true);
    }
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (!pulling || refreshing) return;
    const delta = e.touches[0].clientY - startY.current;
    if (delta > 0) {
      // Dampen the pull
      setPullDistance(Math.min(delta * 0.4, 120));
    }
  }, [pulling, refreshing]);

  const handleTouchEnd = useCallback(async () => {
    if (!pulling) return;
    setPulling(false);

    if (pullDistance >= THRESHOLD && onRefresh) {
      setRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  }, [pulling, pullDistance, onRefresh]);

  return (
    <div
      ref={containerRef}
      className="relative overflow-y-auto"
      style={{ height: '100%' }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull indicator */}
      <div
        className="flex items-center justify-center overflow-hidden transition-all duration-200"
        style={{ height: refreshing ? 48 : pullDistance > 10 ? pullDistance : 0 }}
      >
        <div
          className={`w-6 h-6 border-2 border-action/40 border-t-action rounded-full ${refreshing ? 'animate-spin' : ''}`}
          style={{
            opacity: Math.min(pullDistance / THRESHOLD, 1),
            transform: `rotate(${pullDistance * 3}deg)`,
          }}
        />
      </div>

      {children}
    </div>
  );
}
