/**
 * Feature Flags
 *
 * Central place to toggle features that depend on external partners (garages, etc.).
 * When garages join the platform, flip GARAGES_ENABLED to true — all "בקרוב" banners
 * and disabled states will automatically disappear.
 */

export const GARAGES_ENABLED = false;

// SOS / roadside emergency — kept live independently of garage onboarding.
// Flip to false only if you want SOS to show the בקרוב (coming soon) state too.
export const SOS_ENABLED = true;
