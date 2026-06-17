"use client";

/**
 * Motion Wrapper Components — RENRI
 *
 * Declarative wrappers for common animation patterns.
 * All components automatically respect `prefers-reduced-motion`.
 *
 * Usage:
 *   <FadeIn>content</FadeIn>
 *   <SlideUp>content</SlideUp>
 *   <StaggerGroup><StaggerItem>...</StaggerItem></StaggerGroup>
 */

import { type ReactNode } from "react";
import {
  motion,
  useReducedMotion,
  type HTMLMotionProps,
} from "framer-motion";
import {
  fadeIn,
  slideUp,
  slideUpSubtle,
  scaleIn,
  staggerContainer,
  staggerContainerHero,
  staggerItem,
  noMotion,
  viewportOnce,
  viewportSection,
} from "@/lib/motion";

/* ═══════════════════════════════════════════════════════
   SHARED TYPES
   ═══════════════════════════════════════════════════════ */

interface MotionWrapperProps extends Omit<HTMLMotionProps<"div">, "children" | "onScroll"> {
  children: ReactNode;
  /** Additional CSS class */
  className?: string;
  /** If true, animation triggers on scroll into view instead of on mount */
  onScroll?: boolean;
  /** Delay before animation starts (seconds) */
  delay?: number;
}

/* ═══════════════════════════════════════════════════════
   FADE IN — Simple opacity reveal
   ═══════════════════════════════════════════════════════ */

export function FadeIn({
  children,
  className,
  onScroll = false,
  delay = 0,
  ...props
}: MotionWrapperProps) {
  const prefersReduced = useReducedMotion();
  const variants = prefersReduced ? noMotion : fadeIn;

  const animationProps = onScroll
    ? {
        initial: "hidden" as const,
        whileInView: "visible" as const,
        viewport: viewportOnce,
      }
    : {
        initial: "hidden" as const,
        animate: "visible" as const,
      };

  return (
    <motion.div
      variants={variants}
      {...animationProps}
      transition={delay ? { delay } : undefined}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════
   SLIDE UP — Vertical reveal (the default for most content)
   ═══════════════════════════════════════════════════════ */

export function SlideUp({
  children,
  className,
  onScroll = false,
  delay = 0,
  subtle = false,
  ...props
}: MotionWrapperProps & { subtle?: boolean }) {
  const prefersReduced = useReducedMotion();
  const variants = prefersReduced
    ? noMotion
    : subtle
      ? slideUpSubtle
      : slideUp;

  const animationProps = onScroll
    ? {
        initial: "hidden" as const,
        whileInView: "visible" as const,
        viewport: viewportOnce,
      }
    : {
        initial: "hidden" as const,
        animate: "visible" as const,
      };

  return (
    <motion.div
      variants={variants}
      {...animationProps}
      transition={delay ? { delay } : undefined}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════
   SCALE IN — For modals, popovers, important reveals
   ═══════════════════════════════════════════════════════ */

export function ScaleIn({
  children,
  className,
  onScroll = false,
  delay = 0,
  ...props
}: MotionWrapperProps) {
  const prefersReduced = useReducedMotion();
  const variants = prefersReduced ? noMotion : scaleIn;

  const animationProps = onScroll
    ? {
        initial: "hidden" as const,
        whileInView: "visible" as const,
        viewport: viewportOnce,
      }
    : {
        initial: "hidden" as const,
        animate: "visible" as const,
      };

  return (
    <motion.div
      variants={variants}
      {...animationProps}
      transition={delay ? { delay } : undefined}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════
   STAGGER GROUP — Container that staggers children reveals
   ═══════════════════════════════════════════════════════ */

interface StaggerGroupProps extends Omit<HTMLMotionProps<"div">, "children" | "onScroll"> {
  children: ReactNode;
  className?: string;
  /** Use slower stagger timing (for hero sections) */
  hero?: boolean;
  /** Trigger on scroll */
  onScroll?: boolean;
}

export function StaggerGroup({
  children,
  className,
  hero = false,
  onScroll = false,
  ...props
}: StaggerGroupProps) {
  const prefersReduced = useReducedMotion();
  const variants = prefersReduced
    ? noMotion
    : hero
      ? staggerContainerHero
      : staggerContainer;

  const animationProps = onScroll
    ? {
        initial: "hidden" as const,
        whileInView: "visible" as const,
        viewport: viewportSection,
      }
    : {
        initial: "hidden" as const,
        animate: "visible" as const,
      };

  return (
    <motion.div variants={variants} {...animationProps} className={className} {...props}>
      {children}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════
   STAGGER ITEM — Must be a direct child of StaggerGroup
   ═══════════════════════════════════════════════════════ */

interface StaggerItemProps extends Omit<HTMLMotionProps<"div">, "children"> {
  children: ReactNode;
  className?: string;
}

export function StaggerItem({ children, className, ...props }: StaggerItemProps) {
  const prefersReduced = useReducedMotion();
  const variants = prefersReduced ? noMotion : staggerItem;

  return (
    <motion.div variants={variants} className={className} {...props}>
      {children}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════
   SECTION REVEAL — Full-section scroll-triggered wrapper
   ═══════════════════════════════════════════════════════ */

interface SectionRevealProps extends Omit<HTMLMotionProps<"div">, "children"> {
  children: ReactNode;
  className?: string;
}

export function SectionReveal({ children, className, ...props }: SectionRevealProps) {
  const prefersReduced = useReducedMotion();
  const variants = prefersReduced ? noMotion : slideUp;

  return (
    <motion.div
      variants={variants}
      initial="hidden"
      whileInView="visible"
      viewport={viewportSection}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}
