import { useState, useEffect, useRef, useCallback, useMemo } from 'react';

const DEFAULT_SNAP_POINTS = [50, 90];

export default function BottomSheet({ isOpen, onClose, title, children, snapPoints }) {
  const snaps = useMemo(() => snapPoints || DEFAULT_SNAP_POINTS, [snapPoints]);
  const [height, setHeight] = useState(snaps[0]);
  const [dragging, setDragging] = useState(false);
  const startY = useRef(0);
  const startHeight = useRef(0);
  const sheetRef = useRef(null);

  const handleDragStart = useCallback((clientY) => {
    setDragging(true);
    startY.current = clientY;
    startHeight.current = height;
  }, [height]);

  const handleDragMove = useCallback((clientY) => {
    if (!dragging) return;
    const delta = startY.current - clientY;
    const viewportH = window.innerHeight;
    const newHeight = startHeight.current + (delta / viewportH) * 100;
    setHeight(Math.min(Math.max(newHeight, 10), 95));
  }, [dragging]);

  const handleDragEnd = useCallback(() => {
    setDragging(false);
    if (height < 20) {
      onClose();
      setHeight(snaps[0]);
      return;
    }
    const closestSnap = snaps.reduce((prev, curr) =>
      Math.abs(curr - height) < Math.abs(prev - height) ? curr : prev
    );
    setHeight(closestSnap);
  }, [height, snaps, onClose]);

  // Touch handlers
  const handleTouchStart = useCallback((e) => handleDragStart(e.touches[0].clientY), [handleDragStart]);
  const handleTouchMove = useCallback((e) => handleDragMove(e.touches[0].clientY), [handleDragMove]);

  // Mouse handlers for desktop
  const handleMouseDown = useCallback((e) => {
    handleDragStart(e.clientY);
    const onMouseMove = (ev) => handleDragMove(ev.clientY);
    const onMouseUp = () => {
      handleDragEnd();
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }, [handleDragStart, handleDragMove, handleDragEnd]);

  // Keyboard: Escape to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Reset height when opening
  useEffect(() => {
    if (isOpen) setHeight(snaps[0]);
  }, [isOpen, snaps]);

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        ref={sheetRef}
        className="fixed bottom-0 left-0 right-0 z-50 bg-[#1c1b1b] rounded-t-2xl shadow-2xl"
        style={{
          height: `${height}vh`,
          transition: dragging ? 'none' : 'height 0.3s ease-out',
        }}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div
          className="flex justify-center py-3 cursor-grab active:cursor-grabbing"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleDragEnd}
          onMouseDown={handleMouseDown}
        >
          <div className="w-10 h-1 bg-white/20 rounded-full" />
        </div>

        {title && (
          <div className="flex items-center justify-between px-5 pb-3">
            <h3 className="text-lg font-semibold text-[#e5e2e1]">{title}</h3>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-[#cbc3d7]"
              aria-label="Close"
            >
              <span className="material-symbols-outlined text-base">close</span>
            </button>
          </div>
        )}

        <div className="px-5 pb-6 overflow-y-auto" style={{ maxHeight: `calc(${height}vh - 80px)` }}>
          {children}
        </div>
      </div>
    </>
  );
}
