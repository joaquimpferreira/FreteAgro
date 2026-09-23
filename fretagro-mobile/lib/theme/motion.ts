// lib/theme/motion.ts
// The app's named curves, springs and entrances. Every animation in the app is
// built from one of these; a component that reaches for a raw duration or a
// hand-tuned spring is off-system the same way a literal hex would be.
//
// Two rules hold everything here together.
//
// Motion states a change. A card that slides in is saying "this is new since
// you last looked"; a pill that travels between tabs is saying "you moved from
// there to here". Nothing moves that is not reporting something.
//
// Motion runs on the UI thread and nowhere else. Every preset below is a
// Reanimated worklet-driven value, so a slow Supabase call on a rural
// connection cannot drop a frame of it — which matters precisely because this
// app spends so much of its life waiting on that connection.

import {
  Easing,
  FadeIn,
  FadeInDown,
  FadeOut,
  LinearTransition,
  type WithSpringConfig,
  type WithTimingConfig,
} from 'react-native-reanimated'
import { duration } from './index'

/**
 * M3's emphasized-decelerate curve: leaves fast, lands slow. The default for
 * anything arriving on screen — it reads as an object coming to rest rather
 * than as a value being interpolated.
 */
export const easeOut: WithTimingConfig = {
  duration: duration.medium,
  easing: Easing.bezier(0.05, 0.7, 0.1, 1),
}

/** Standard curve, for a change that is neither arriving nor leaving. */
export const easeStandard: WithTimingConfig = {
  duration: duration.short,
  easing: Easing.bezier(0.2, 0, 0, 1),
}

/**
 * The spring the navigation pill and press feedback ride on. Critically damped
 * on purpose: the pill must arrive under the icon and stop. A visible bounce
 * on a control the driver taps forty times a day becomes noise by the tenth.
 */
export const settle: WithSpringConfig = {
  damping: 22,
  stiffness: 240,
  mass: 0.9,
}

/** How far a card travels on its way in. Small — the fade carries most of it. */
const REVEAL_DISTANCE = 14

/** Stagger between consecutive cards on the same screen. */
const REVEAL_STAGGER = 60

/**
 * A card arriving with the screen. `index` staggers siblings top to bottom, so
 * the eye is walked down the screen in reading order instead of being handed
 * the whole layout at once.
 *
 * Capped at four steps: past ~240ms of stagger the last card reads as late
 * rather than as sequenced, and the driver is waiting on the app.
 */
export function reveal(index = 0) {
  return FadeInDown.duration(duration.long)
    .delay(Math.min(index, 4) * REVEAL_STAGGER)
    .easing(Easing.bezier(0.05, 0.7, 0.1, 1).factory())
    .withInitialValues({ transform: [{ translateY: REVEAL_DISTANCE }] })
}

/**
 * A message appearing in place — a validation error, the offline row. It fades
 * without travelling, because it belongs to the thing above it and should not
 * look like it arrived from somewhere else.
 */
export const appear = FadeIn.duration(duration.medium)
export const disappear = FadeOut.duration(duration.short)

/**
 * Applied to a container whose children appear and disappear, so the siblings
 * slide into the gap instead of snapping. This is what keeps a form from
 * jumping under the driver's thumb when an error message shows up.
 */
export const settleLayout = LinearTransition.duration(duration.medium)

/** Scale a control takes while held. Deep enough to feel, small enough that it
 *  does not look like the button shrank. */
export const PRESS_SCALE = 0.97
