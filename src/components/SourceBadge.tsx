import { Inbox, Search } from "lucide-react";
import type { CandidateSource } from "../types";
import { Badge } from "./ui/badge";
import { formatShortDate } from "../lib/format";

interface SourceBadgeProps {
  source: CandidateSource;
  respondedAt?: string | null;
  compact?: boolean;
}

export function SourceBadge({ source, respondedAt, compact }: SourceBadgeProps) {
  if (source === "response") {
    return (
      <Badge className="border-transparent bg-green-50 font-normal text-green-700 hover:bg-green-50">
        <Inbox />
        {compact ? "Отклик" : `Откликнулся${respondedAt ? ` • ${formatShortDate(respondedAt)}` : ""}`}
      </Badge>
    );
  }
  return (
    <Badge className="border-transparent bg-gray-100 font-normal text-gray-600 hover:bg-gray-100">
      <Search />
      {compact ? "Поиск" : "Найден в поиске"}
    </Badge>
  );
}
