/* ------------------------------------------------------------------
   Mascot artwork — pure SVG, amber line/silhouette to match the brand.
   Animated subparts carry classes (.eye .m-tail .m-ear .m-wing .m-ant);
   the motion (blink/tail/float/hop) is driven by CSS in globals.css.
   Cat + Ghost are used by the mascot layer; Bird + Robot are kept here
   ready to swap in.
   ------------------------------------------------------------------ */

const EYE = "#16110b"

/** Sitting "loaf" cat — no walking legs, so it reads cleanly at small size. */
export function CatMascot() {
  return (
    <svg viewBox="0 0 64 60" xmlns="http://www.w3.org/2000/svg">
      <g className="cat-body">
        <path
          className="m-tail"
          d="M50 47 Q63 47 61 34 Q60 27 54 30"
          fill="none"
          stroke="var(--cat)"
          strokeWidth={4.2}
          strokeLinecap="round"
        />
        <path d="M12 49 Q12 23 32 23 Q52 23 52 49 Z" fill="var(--cat)" />
        <polygon className="m-ear" points="21,27 24,14 30,26" fill="var(--cat)" />
        <polygon points="34,26 40,14 43,27" fill="var(--cat)" />
        <rect x={22} y={44} width={7} height={6} rx={3} fill="var(--cat-dim)" />
        <rect x={35} y={44} width={7} height={6} rx={3} fill="var(--cat-dim)" />
        <circle className="eye" cx={27} cy={35} r={2} fill={EYE} />
        <circle className="eye" cx={38} cy={35} r={2} fill={EYE} />
        <path className="eye-closed" d="M24.5 35 Q27 36.6 29.5 35" fill="none" stroke={EYE} strokeWidth={1} strokeLinecap="round" />
        <path className="eye-closed" d="M35.5 35 Q38 36.6 40.5 35" fill="none" stroke={EYE} strokeWidth={1} strokeLinecap="round" />
      </g>
      <text className="zzz" x={47} y={20} fontFamily="var(--font-mono)" fontSize={6} fill="var(--cat)">
        z
      </text>
      <text className="zzz z2" x={51} y={14} fontFamily="var(--font-mono)" fontSize={5} fill="var(--cat)">
        z
      </text>
    </svg>
  )
}

/** Floating ghost. */
export function GhostMascot() {
  return (
    <svg viewBox="0 0 64 60" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M13 47 V26 Q13 9 32 9 Q51 9 51 26 V47 L45 42 L39 47 L32 42 L25 47 L19 42 Z"
        fill="var(--cat)"
      />
      <circle className="eye" cx={26} cy={27} r={2.6} fill={EYE} />
      <circle className="eye" cx={38} cy={27} r={2.6} fill={EYE} />
    </svg>
  )
}

/** Hopping bird — kept for later. */
export function BirdMascot() {
  return (
    <svg viewBox="0 0 64 60" xmlns="http://www.w3.org/2000/svg">
      <line x1={27} y1={44} x2={27} y2={53} stroke="var(--cat-dim)" strokeWidth={2.4} strokeLinecap="round" />
      <line x1={37} y1={44} x2={37} y2={53} stroke="var(--cat-dim)" strokeWidth={2.4} strokeLinecap="round" />
      <ellipse cx={32} cy={31} rx={15} ry={14} fill="var(--cat)" />
      <ellipse className="m-wing" cx={25} cy={31} rx={6.5} ry={10} fill="var(--cat-dim)" />
      <polygon points="45,29 54,32 45,35" fill="var(--cat-dim)" />
      <circle className="eye" cx={39} cy={26} r={1.9} fill={EYE} />
    </svg>
  )
}

/** Hovering robot — kept for later. */
export function RobotMascot() {
  return (
    <svg viewBox="0 0 64 60" xmlns="http://www.w3.org/2000/svg">
      <line x1={32} y1={18} x2={32} y2={9} stroke="var(--cat)" strokeWidth={2.2} strokeLinecap="round" />
      <circle className="m-ant" cx={32} cy={7} r={2.8} fill="var(--cat)" />
      <rect x={15} y={17} width={34} height={27} rx={7} fill="var(--cat)" />
      <rect x={20} y={25} width={24} height={11} rx={5} fill={EYE} />
      <circle className="eye" cx={28} cy={30.5} r={2.1} fill="var(--cat)" />
      <circle className="eye" cx={36} cy={30.5} r={2.1} fill="var(--cat)" />
      <rect x={24} y={44} width={16} height={4} rx={2} fill="var(--cat-dim)" />
    </svg>
  )
}
