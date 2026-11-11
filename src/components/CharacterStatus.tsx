import { Check, Clock3, Archive, X } from "lucide-react";
import { statusLabel, type CharacterStatus } from "@/lib/types";

const names: Record<CharacterStatus, string> = {
  approved: "status-chip-approved",
  pending: "status-chip-pending",
  rejected: "status-chip-rejected",
  archived: "status-chip-archived",
};
const icons = { approved: Check, pending: Clock3, rejected: X, archived: Archive };

export default function CharacterStatus({ status }: { status: CharacterStatus }) {
  const Icon = icons[status];
  return <span className={`status-chip ${names[status]}`}><Icon aria-hidden="true" size={13}/>{statusLabel(status)}</span>;
}
