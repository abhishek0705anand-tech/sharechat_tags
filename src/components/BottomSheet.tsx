import { ReactNode, useRef, useCallback } from 'react';
import { motion, PanInfo, useMotionValue, useTransform, animate } from 'framer-motion';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
}

export default function BottomSheet({ isOpen, onClose, children }: BottomSheetProps) {
  const y = useMotionValue(0);
  const opacity = useTransform(y, [0, 300], [1, 0]);
  const backdropOpacity = useTransform(y, [0, 300], [0.5, 0]);
  const constraintsRef = useRef(null);

  const handleDragEnd = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      if (info.offset.y > 120 || info.velocity.y > 500) {
        onClose();
      } else {
        animate(y, 0, { type: 'spring', stiffness: 400, damping: 30 });
      }
    },
    [onClose, y]
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <motion.div
        className="absolute inset-0 bg-black"
        style={{ opacity: backdropOpacity }}
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        exit={{ opacity: 0 }}
      />
      <motion.div
        ref={constraintsRef}
        style={{ y, opacity }}
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.15}
        onDragEnd={handleDragEnd}
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        className="relative w-full max-w-[420px] bg-white rounded-t-3xl shadow-2xl max-h-[85vh] overflow-hidden"
      >
        {/* Drag Handle */}
        <div className="flex justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing">
          <div className="w-12 h-1.5 rounded-full bg-gray-300" />
        </div>
        <div className="overflow-y-auto max-h-[calc(85vh-40px)] pb-8">
          {children}
        </div>
      </motion.div>
    </div>
  );
}
