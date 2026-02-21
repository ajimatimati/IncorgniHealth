import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * BottomSheet — mobile-first draggable sheet with snap points.
 * Props:
 *   isOpen, onClose, title, children, snapPoints (array of %, default [50, 90])
 */
export default function BottomSheet({ isOpen, onClose, title, children, snapPoints = [50, 90] }) {
  const [height, setHeight] = useState(snapPoints[0]);
  const [dragging, setDragging] = useState(false);
  const startY = useRef(0);
  const startHeight = useRef(0);
  const sheetRef = useRef(null);

  const handleTouchStart = useCallback((e) => {
    setDragging(true);
    startY.current = e.touches[0].clientY;
    startHeight.current = height;
  }, [height]);

  const handleTouchMove = useCallback((e) => {
    if (!dragging) return;
    const delta = startY.current - e.touches[0].clientY;
    const viewportH = window.innerHeight;
    const newHeight = startHeight.current + (delta / viewportH) * 100;
    setHeight(Math.min(Math.max(newHeight, 10), 95));
  }, [dragging]);

  const handleTouchEnd = useCallback(() => {
    setDragging(false);
    // Snap to closest point or close
    if (height < 20) {
      onClose();
      setHeight(snapPoints[0]);
      return;
    }

    const closestSnap = snapPoints.reduce((prev, curr) =>
      Math.abs(curr - height) < Math.abs(prev - height) ? curr : prev
    );
    setHeight(closestSnap);
  }, [height, snapPoints, onClose]);

  useEffect(() => {
    if (isOpen) setHeight(snapPoints[0]);
  }, [isOpen, snapPoints]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        className="fixed bottom-0 left-0 right-0 z-50 bg-surface rounded-t-2xl shadow-2xl"
        style={{
          height: `${height}vh`,
          transition: dragging ? 'none' : 'height 0.3s ease-out',
        }}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        {/* Drag handle */}
        <div
          className="flex justify-center py-3 cursor-grab active:cursor-grabbing"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="w-10 h-1 bg-text-muted/30 rounded-full" />
        </div>

        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-5 pb-3">
            <h3 className="text-lg font-semibold text-text-primary">{title}</h3>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-text-muted"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        )}

        {/* Content */}
        <div className="px-5 pb-6 overflow-y-auto" style={{ maxHeight: `calc(${height}vh - 80px)` }}>
          {children}
        </div>
      </div>
    </>
  );
}
