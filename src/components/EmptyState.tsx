import Link from "next/link";
import { Inbox } from "lucide-react";
import type { ReactNode } from "react";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: { label: string; href: string };
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="empty-state">
      <span className="empty-state-icon">{icon ?? <Inbox size={48} />}</span>
      <strong>{title}</strong>
      {description && <p>{description}</p>}
      {action && (
        <Link className="primary-button" href={action.href}>
          {action.label}
        </Link>
      )}
    </div>
  );
}
