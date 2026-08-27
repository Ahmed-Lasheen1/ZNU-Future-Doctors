'use client';

import React, { useRef } from 'react';
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  MotionStyle,
  SpringOptions,
  HTMLMotionProps,
} from 'framer-motion';

type TiltProps = {
  children: React.ReactNode;
  className?: string;
  style?: MotionStyle;
  rotationFactor?: number;
  isReverse?: boolean;
  /** @deprecated استخدم isReverse بدلاً منها */
  isRevese?: boolean;
  springOptions?: SpringOptions;
} & Omit<HTMLMotionProps<'div'>, 'style' | 'className' | 'children'>;

export function Tilt({
  children,
  className,
  style,
  rotationFactor = 15,
  isReverse = false,
  isRevese,
  springOptions = { stiffness: 150, damping: 15 },
  onMouseEnter,
  onMouseLeave,
  ...rest
}: TiltProps) {
  const ref = useRef<HTMLDivElement>(null);

  const reverse = isRevese ?? isReverse;

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const xSpring = useSpring(x, springOptions);
  const ySpring = useSpring(y, springOptions);

  const rotateX = useTransform(
    ySpring,
    [-0.5, 0.5],
    reverse
      ? [rotationFactor, -rotationFactor]
      : [-rotationFactor, rotationFactor]
  );

  const rotateY = useTransform(
    xSpring,
    [-0.5, 0.5],
    reverse
      ? [-rotationFactor, rotationFactor]
      : [rotationFactor, -rotationFactor]
  );

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;

    const rect = ref.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    
    if (width === 0 || height === 0) return;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const xPos = mouseX / width - 0.5;
    const yPos = mouseY / height - 0.5;

    x.set(xPos);
    y.set(yPos);
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    x.set(0);
    y.set(0);
    onMouseLeave?.(e);
  };

  return (
    <div style={{ perspective: 1000, width: '100%', height: '100%' }}>
      <motion.div
        ref={ref}
        className={className}
        style={{
          transformStyle: 'preserve-3d',
          transformOrigin: 'center center',
          rotateX,
          rotateY,
          ...style,
        }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onMouseEnter={onMouseEnter}
        {...rest}
      >
        {children}
      </motion.div>
    </div>
  );
}
