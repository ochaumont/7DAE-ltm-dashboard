type Props = { size?: number; className?: string };

function svgProps({ size = 24, className }: Props) {
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none" as const,
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true as const,
    className,
  };
}

export function AircraftSimulationIcon(props: Props) {
  return (
    <svg {...svgProps(props)}>
      <rect x="2" y="4" width="20" height="13" rx="1.5" />
      <path d="M8 21h8" />
      <path d="M12 17v4" />
      <path d="M12 7.5v6" />
      <path d="M7.5 10.5h9" />
      <path d="M10.5 13h3" />
    </svg>
  );
}

export function AutomaticTestingIcon(props: Props) {
  return (
    <svg {...svgProps(props)}>
      <rect x="5" y="4" width="14" height="17" rx="1.5" />
      <path d="M9 3h6v3H9z" />
      <path d="m8.5 11 1.5 1.5L13 9.5" />
      <path d="m8.5 16.5 1.5 1.5L13 15" />
      <path d="M15.5 11.5h2" />
      <path d="M15.5 17h2" />
    </svg>
  );
}

export function RemoteAccessIcon(props: Props) {
  return (
    <svg {...svgProps(props)}>
      <path d="M5 12.55a11 11 0 0 1 14 0" />
      <path d="M8.5 16.05a6 6 0 0 1 7 0" />
      <circle cx="12" cy="20" r="0.8" fill="currentColor" />
    </svg>
  );
}

export function NoRemoteAccessIcon(props: Props) {
  return (
    <svg {...svgProps(props)}>
      <path d="M5 12.55a11 11 0 0 1 14 0" />
      <path d="M8.5 16.05a6 6 0 0 1 7 0" />
      <circle cx="12" cy="20" r="0.8" fill="currentColor" />
      <path d="M4 4l16 16" />
    </svg>
  );
}
