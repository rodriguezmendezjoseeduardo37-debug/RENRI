/**
 * Motion Design System — RENRI
 *
 * Based on design-motion-principles (SKILL.md):
 *   Primary: Emil Kowalski (restraint, speed — SaaS)
 *   Secondary: Jakub Krehel (production polish)
 *   Selective: Jhey Tompkins (hero/onboarding only)
 *
 * Frequency Gate applied:
 *   - Rare interactions (monthly): expressive motion OK
 *   - Occasional (daily): subtle, fast
 *   - Frequent (100s/day): no animation
 *   - Keyboard-initiated: never animate
 */

import type { Variants, Transition } from "framer-motion";

/* ═══════════════════════════════════════════════════════
   TRANSITIONS — Spring & Ease presets
   ═══════════════════════════════════════════════════════ */

/** Snappy spring — Emil: ideal for SaaS interactions (<300ms feel) */
export const springSnappy: Transition = {
  type: "spring",
  stiffness: 500,
  damping: 30,
  mass: 0.8,
};

/** Gentle spring — Jakub: polished reveal animations */
export const springGentle: Transition = {
  type: "spring",
  stiffness: 300,
  damping: 25,
  mass: 1,
};

/** Bouncy spring — Jhey: playful, hero/onboarding only */
export const springBouncy: Transition = {
  type: "spring",
  stiffness: 400,
  damping: 15,
  mass: 0.8,
};

/** Expo ease-out — fast start, smooth land */
export const easeOutExpo: Transition = {
  duration: 0.5,
  ease: [0.16, 1, 0.3, 1],
};

/** Quick ease — for hover/micro-interactions */
export const easeQuick: Transition = {
  duration: 0.2,
  ease: [0.25, 0.46, 0.45, 0.94],
};

/* ═══════════════════════════════════════════════════════
   VARIANTS — Reusable animation presets
   ═══════════════════════════════════════════════════════ */

/** Fade in from transparent */
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

/** Slide up + fade — the workhorse entrance animation */
export const slideUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: springGentle,
  },
};

/** Slide up small — for cards/elements that need subtle motion */
export const slideUpSubtle: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { ...springSnappy },
  },
};

/** Scale in — for modals, popovers, important reveals */
export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: springSnappy,
  },
};

/** Stagger container — wraps children for sequential reveals */
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

/** Stagger container (slower) — for hero sections */
export const staggerContainerHero: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.15,
    },
  },
};

/** Stagger item — used inside stagger containers */
export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: springSnappy,
  },
};

/* ═══════════════════════════════════════════════════════
   HOVER / INTERACTION VARIANTS
   ═══════════════════════════════════════════════════════ */

/** Card hover — subtle lift + border glow */
export const cardHover = {
  rest: {
    scale: 1,
    y: 0,
    transition: easeQuick,
  },
  hover: {
    scale: 1.02,
    y: -2,
    transition: easeQuick,
  },
};

/** Button press — satisfying tactile response */
export const buttonPress = {
  tap: { scale: 0.97 },
  hover: { scale: 1.02 },
};

/* ═══════════════════════════════════════════════════════
   SCROLL-TRIGGERED DEFAULTS
   ═══════════════════════════════════════════════════════ */

/** Default viewport settings for whileInView */
export const viewportOnce = {
  once: true,
  amount: 0.3 as const,
};

/** Viewport for sections (triggers earlier) */
export const viewportSection = {
  once: true,
  margin: "-80px" as const,
};

/* ═══════════════════════════════════════════════════════
   REDUCED MOTION — Accessibility (non-negotiable per SKILL.md)
   ═══════════════════════════════════════════════════════ */

/** No-motion variants — instant transitions for prefers-reduced-motion */
export const noMotion: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0 } },
};

/**
 * Returns either the full variants or instant-reveal variants
 * based on the user's motion preference.
 *
 * Usage:
 *   const variants = useAccessibleVariants(slideUp);
 *   <motion.div variants={variants} initial="hidden" animate="visible" />
 */
export function getAccessibleVariants(
  prefersReducedMotion: boolean,
  variants: Variants
): Variants {
  return prefersReducedMotion ? noMotion : variants;
}
