/* Theme constants shared by the pre-paint inline script (layout.tsx) and the
   runtime controls (theme-controls.tsx). Keep them in one place so the two
   never drift. */

export const STORAGE_KEY = "wr-bento-theme2"
export const BASE_HUE = 30

/**
 * Hue engine toggle. When true, the Settings cell shows Shuffle/Reset and the
 * saved palette is restored on load (pre-paint script in layout.tsx). When
 * false, the board is locked to BASE_HUE and any saved hue is ignored.
 */
export const SHUFFLE_ENABLED = true
