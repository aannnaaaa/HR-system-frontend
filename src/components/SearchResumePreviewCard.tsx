import type { HHResumeSearchResult } from "../lib/api";
import { Card, CardHeader } from "./ui/card";
import { Button } from "./ui/button";
import { MapPin, Clock, GraduationCap } from "lucide-react";

interface SearchResumePreviewCardProps {
  resume: HHResumeSearchResult;
  onOpen: () => void;
}

const DASH = "—";

/**
 * Лёгкая карточка предпросмотра результата живого поиска hh.ru.
 * По клику "Открыть" резюме превращается в Candidate-совместимый объект
 * (см. mapSearchResultToCandidate в api.ts) и открывается в CandidateModal —
 * там же доступно "Выбрать вакансию".
 */
export function SearchResumePreviewCard({ resume, onOpen }: SearchResumePreviewCardProps) {
  const experienceYears = resume.totalExperienceMonths
    ? Math.round(resume.totalExperienceMonths / 12)
    : null;

  return (
    <Card className="py-4">
      <CardHeader className="flex flex-row items-start justify-between gap-3 px-4">
        <div className="min-w-0">
          <div className="text-[15px] font-bold leading-snug">
            {resume.title ?? DASH}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-3.5" />
              {resume.area ?? DASH}
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock className="size-3.5" />
              {experienceYears !== null ? `Стаж ${experienceYears} лет` : DASH}
            </span>
            {resume.educationLevel && (
              <span className="inline-flex items-center gap-1">
                <GraduationCap className="size-3.5" />
                {resume.educationLevel}
              </span>
            )}
          </div>
        </div>

        <Button size="sm" className="shrink-0" onClick={onOpen}>
          Открыть
        </Button>
      </CardHeader>
    </Card>
  );
}