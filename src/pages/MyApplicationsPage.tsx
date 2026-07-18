import { useState } from "react";
import type { Application, ApplicationStatus, Region } from "../types";
import { applicationStatusLabels, regionLabels } from "../types";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";
import { CandidateModal } from "../components/CandidateModal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { MessageSquarePlus, MapPin, Clock, Globe, GraduationCap, Eye } from "lucide-react";

interface MyApplicationsPageProps {
  applications: Application[];
  isLoading?: boolean;
  onUpdateStatus: (id: string, status: ApplicationStatus) => void;
  onUpdateComment: (candidateId: string, description: string) => void;
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
  isLoading,
  onUpdateStatus,
  onUpdateComment,
}: MyApplicationsPageProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftComment, setDraftComment] = useState("");
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);

  function handleStartEdit(app: Application) {
    setEditingId(app.id);
    setDraftComment(app.candidate.description ?? "");
  }

  function handleSave(app: Application) {
    onUpdateComment(app.candidateId, draftComment);
    setEditingId(null);
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold tracking-tight">Мои заявки</h1>
      <p className="mt-1 text-muted-foreground">
        Кандидаты, которых вы выбрали при поиске. После связи с кандидатом —
        обновляйте статус.
      </p>

      {isLoading && (
        <p className="mt-6 text-sm text-muted-foreground">Загружаю сохранённых кандидатов...</p>
      )}

      {!isLoading && applications.length === 0 && (
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
                <span className="font-bold">
                  {app.candidate.name ?? app.candidate.educationProfile ?? "Кандидат"}
                </span>
                <Badge className={`border-transparent font-normal ${statusStyles[app.status]}`}>
                  {applicationStatusLabels[app.status]}
                </Badge>
              </div>

              <div className="text-[13px] text-muted-foreground">
                {app.candidate.educationProfile ?? "—"} → {app.vacancyLabel}
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
                {app.candidate.educationLevel && (
                  <span className="inline-flex items-center gap-1">
                    <GraduationCap className="size-3.5" />
                    {app.candidate.educationLevel}
                  </span>
                )}
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
                    <Button size="sm" onClick={() => handleSave(app)}>
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
                  {app.candidate.description ? (
                    <span className="text-foreground/80">💬 {app.candidate.description}</span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground">
                      <MessageSquarePlus className="size-3.5" />
                      добавить комментарий
                    </span>
                  )}
                </button>
              )}
            </div>

            <div className="flex shrink-0 flex-col items-end gap-2">
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5"
                onClick={() => setSelectedApp(app)}
              >
                <Eye className="size-3.5" />
                Открыть карточку
              </Button>

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
            </div>
          </Card>
        ))}
      </div>

      {selectedApp && (
        // onSelect не передаём — модалка открывается в режиме "только
        // просмотр", без кнопки "Выбрать вакансию" (заявка уже есть).
        <CandidateModal
          candidate={selectedApp.candidate}
          vacancyLabel={selectedApp.vacancyLabel}
          onClose={() => setSelectedApp(null)}
        />
      )}
    </div>
  );
}