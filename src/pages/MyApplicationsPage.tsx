import { useState } from "react";
import type { Application, ApplicationStatus, Region } from "../types";
import { applicationStatusLabels, regionLabels } from "../types";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { MessageSquarePlus, MapPin, Clock, Globe, Mail, Phone } from "lucide-react";

interface MyApplicationsPageProps {
  applications: Application[];
  onUpdateStatus: (id: string, status: ApplicationStatus) => void;
  onUpdateComment: (id: string, comment: string) => void;
}

const statusStyles: Record<ApplicationStatus, string> = {
  new: "bg-blue-100 text-blue-700 hover:bg-blue-100",
  review: "bg-green-50 text-green-700 hover:bg-green-50",
  interview: "bg-yellow-50 text-yellow-700 hover:bg-yellow-50",
  hired: "bg-green-100 text-green-800 hover:bg-green-100",
  rejected: "bg-red-100 text-red-700 hover:bg-red-100",
  ignored: "bg-gray-100 text-gray-500 hover:bg-gray-100",
};

export function MyApplicationsPage({
  applications,
  onUpdateStatus,
  onUpdateComment,
}: MyApplicationsPageProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftComment, setDraftComment] = useState("");

  function handleStartEdit(app: Application) {
    setEditingId(app.id);
    setDraftComment(app.comment ?? "");
  }

  function handleSave(id: string) {
    onUpdateComment(id, draftComment);
    setEditingId(null);
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold tracking-tight">Мои заявки</h1>
      <p className="mt-1 text-muted-foreground">
        Кандидаты, которых вы выбрали при поиске. После связи с кандидатом —
        обновляйте статус.
      </p>

      {applications.length === 0 && (
        <Card className="mt-6 items-center gap-1 border-dashed py-10 text-center">
          <div className="font-bold">Заявок пока нет</div>
          <div className="text-sm text-muted-foreground">
            Найдите кандидата в поиске и нажмите «Выбрать вакансию»
          </div>
        </Card>
      )}

      <div className="mt-6 flex flex-col gap-3">
        {applications.map((app) => (
          <Card key={app.id} className="flex-row items-center justify-between gap-4 p-5">
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="font-bold">{app.candidate.name}</span>
                <Badge className={`border-transparent font-normal ${statusStyles[app.status]}`}>
                  {applicationStatusLabels[app.status]}
                </Badge>
              </div>

              <div className="text-[13px] text-muted-foreground">
                {app.candidate.educationProfile} → {app.vacancyLabel}
              </div>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <MapPin className="size-3.5" />
                  {regionLabels[app.candidate.region as Region] ?? app.candidate.region}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="size-3.5" />
                  Стаж {app.candidate.experience}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Globe className="size-3.5" />
                  {app.candidate.platform}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Mail className="size-3.5" />
                  {app.candidate.email}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Phone className="size-3.5" />
                  {app.candidate.phone}
                </span>
              </div>

              {editingId === app.id ? (
                <div className="mt-2 flex flex-col gap-2">
                  <Textarea
                    placeholder="Ваш комментарий о кандидате..."
                    value={draftComment}
                    onChange={(e) => setDraftComment(e.target.value)}
                    autoFocus
                    rows={3}
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleSave(app.id)}>
                      Сохранить
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                      Отмена
                    </Button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => handleStartEdit(app)}
                  className="mt-1 flex w-fit items-center gap-1.5 text-left text-sm"
                >
                  {app.comment ? (
                    <span className="text-foreground/80">💬 {app.comment}</span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground">
                      <MessageSquarePlus className="size-3.5" />
                      добавить комментарий
                    </span>
                  )}
                </button>
              )}
            </div>

            <Select
              value={app.status}
              onValueChange={(value) => onUpdateStatus(app.id, value as ApplicationStatus)}
            >
              <SelectTrigger className="w-[150px] shrink-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(applicationStatusLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Card>
        ))}
      </div>
    </div>
  );
}