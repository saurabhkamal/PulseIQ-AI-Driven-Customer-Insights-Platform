import { Button } from "./Button";

interface EmptyStateProps {
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <svg
        className="h-12 w-12 text-[#D9D8D3] mb-4"
        fill="none"
        viewBox="0 0 48 48"
        aria-hidden="true"
      >
        <rect
          x="8"
          y="8"
          width="32"
          height="32"
          rx="4"
          stroke="currentColor"
          strokeWidth="2"
        />
        <path
          d="M16 24h16M24 16v16"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
      <h3 className="text-[15px] font-semibold text-[#1A1A1A] mb-1">{title}</h3>
      <p className="text-[13px] text-[#8A8A8A] max-w-xs mb-4">{description}</p>
      {action && (
        <Button variant="primary" size="sm" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}
