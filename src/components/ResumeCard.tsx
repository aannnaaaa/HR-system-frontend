import type { Candidate, Region } from "../types";
import { regionLabels } from "../types";
import { Card, CardHeader } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { MapPin, Clock, Globe, GraduationCap } from "lucide-react";

interface ResumeCardProps {
  candidate: Candidate;
  onOpen: (candidate: Candidate) => void;
}

const DASH = "—";

export function ResumeCard({ candidate, onOpen }: ResumeCardProps) {
  return (
    <Card className="py-4">
      <CardHeader className="flex flex-row items-start justify-between gap-3 px-4">
        <div className="min-w-0">
          {/* Имени у нас нет — показываем профиль образования как заголовок,
              а под ним короткий ID резюме как опознавательный признак */}
          <div className="text-[15px] font-bold leading-snug">
            {candidate.educationProfile ?? DASH}
          </div>
          <div className="mt-0.5 text-[13px] text-muted-foreground">
            Кандидат #{candidate.id.slice(0, 8)}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-3.5" />
              {regionLabels[candidate.region as Region] ?? candidate.region}
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock className="size-3.5" />
              Стаж {candidate.experience} лет
            </span>
            <span className="inline-flex items-center gap-1">
              <Globe className="size-3.5" />
              {candidate.platform}
            </span>
            {candidate.educationLevel && (
              <span className="inline-flex items-center gap-1">
                <GraduationCap className="size-3.5" />
                {candidate.educationLevel}
              </span>
            )}
            {candidate.relocationReady && (
              <Badge className="border-transparent bg-blue-100 font-normal text-blue-700 hover:bg-blue-100">
                Готов к переезду
              </Badge>
            )}
          </div>
        </div>
        <Button size="sm" onClick={() => onOpen(candidate)} className="shrink-0">
          Открыть
        </Button>
      </CardHeader>
    </Card>
  );
}