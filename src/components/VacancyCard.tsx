import type { Vacancy, Region } from "../types";
import { employmentTypeLabels, regionLabels } from "../types";
import { Card, CardContent, CardHeader } from "./ui/card";
import { Badge } from "./ui/badge";
import { MapPin, Landmark } from "lucide-react";

interface VacancyCardProps {
  vacancy: Vacancy;
}

export function VacancyCard({ vacancy }: VacancyCardProps) {
  return (
    <Card className="gap-3 py-4">
      <CardHeader className="flex flex-row items-start justify-between gap-2 px-4">
        <div>
          <div className="text-[15px] font-bold leading-snug">
            {vacancy.label}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-3.5" />
              {vacancy.city}
            </span>
            <span className="inline-flex items-center gap-1">
              <Landmark className="size-3.5" />
              {regionLabels[vacancy.region as Region] ?? vacancy.region}
            </span>
          </div>
        </div>
        <Badge className="border-transparent bg-blue-100 text-blue-700 hover:bg-blue-100">
          Открыта
        </Badge>
      </CardHeader>
      <CardContent className="px-4">
        {vacancy.description && (
          <p className="text-[13px] text-muted-foreground">
            {vacancy.description}
          </p>
        )}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {vacancy.employmentTypes.map((type) => (
            <Badge key={type} variant="secondary" className="font-normal">
              {employmentTypeLabels[type]}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}