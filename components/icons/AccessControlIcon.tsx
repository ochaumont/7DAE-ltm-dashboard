type Props = {
  enabled: boolean;
  size?: number;
  className?: string;
};

export default function AccessControlIcon({
  enabled,
  size = 20,
  className,
}: Readonly<Props>) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <circle cx="6" cy="12" r="3" />
      <line x1="9" y1="12" x2="20" y2="12" />
      <line x1="17" y1="12" x2="17" y2="14.5" />
      <line x1="20" y1="12" x2="20" y2="15" />
      {!enabled && (
        <>
          <line
            x1="3"
            y1="3"
            x2="21"
            y2="21"
            stroke="var(--color-danger)"
            strokeWidth={2.5}
          />
          <line
            x1="21"
            y1="3"
            x2="3"
            y2="21"
            stroke="var(--color-danger)"
            strokeWidth={2.5}
          />
        </>
      )}
    </svg>
  );
}
