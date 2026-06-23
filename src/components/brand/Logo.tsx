import Link from "next/link";

type LogoProps = {
  className?: string;
  /** "light" for dark backgrounds, "dark" for light backgrounds */
  variant?: "light" | "dark";
  showText?: boolean;
};

/**
 * Big Rig Components wordmark + emblem.
 * Emblem: a hex lug-nut framing stylized "BRC" with a forward speed slash.
 */
export function Logo({ className, variant = "light", showText = true }: LogoProps) {
  const textColor = variant === "light" ? "text-white" : "text-steel-900";
  const subColor = variant === "light" ? "text-steel-300" : "text-steel-500";

  return (
    <Link href="/" className={`group inline-flex items-center gap-3 ${className ?? ""}`}>
      <svg
        viewBox="0 0 48 48"
        width="40"
        height="40"
        className="shrink-0"
        aria-hidden="true"
      >
        {/* Hex lug-nut */}
        <polygon
          points="24,2 44,13 44,35 24,46 4,35 4,13"
          fill="var(--color-steel-900)"
          stroke="var(--color-brand)"
          strokeWidth="3"
        />
        {/* Inner ring */}
        <polygon
          points="24,9 38,17 38,31 24,39 10,31 10,17"
          fill="none"
          stroke="var(--color-steel-600)"
          strokeWidth="1.5"
        />
        {/* Speed slash */}
        <path d="M14 30 L30 16" stroke="var(--color-brand)" strokeWidth="4" strokeLinecap="round" />
        {/* BRC mark */}
        <text
          x="24"
          y="30"
          textAnchor="middle"
          fontFamily="var(--font-display)"
          fontWeight="700"
          fontSize="15"
          fill="#ffffff"
        >
          BRC
        </text>
      </svg>
      {showText && (
        <span className="flex flex-col leading-none">
          <span className={`font-display text-xl font-bold tracking-wide ${textColor}`}>
            BIG RIG <span className="text-brand">COMPONENTS</span>
          </span>
          <span className={`text-[10px] font-medium uppercase tracking-[0.2em] ${subColor}`}>
            Heavy-Duty Truck &amp; Trailer Parts
          </span>
        </span>
      )}
    </Link>
  );
}
