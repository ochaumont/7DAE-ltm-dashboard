import AccessControlIcon from "./icons/AccessControlIcon";

type Props = {
  enabled: boolean | null;
};

export default function ChipAccessControl({ enabled }: Readonly<Props>) {
  if (enabled == null) return null;
  const label = enabled ? "Access is secured" : "No access control";
  return (
    <span
      title={label}
      aria-label={label}
      className="inline-flex items-center"
    >
      <AccessControlIcon enabled={enabled} size={24} />
    </span>
  );
}
