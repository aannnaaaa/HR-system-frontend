import { useMemo, useState } from "react";
import type { Application, Candidate, Region, Vacancy, VacancyResponse } from "../types";
import { regionLabels } from "../types";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { VacancyCard } from "../components/VacancyCard";
import { VacancyDialog } from "../components/VacancyDialog";
import { ResponsesPanel } from "../components/ResponsesPanel";
import { CandidateModal } from "../components/CandidateModal";
import { SaveCandidateDialog } from "../components/SaveCandidateDialog";
import {
  createVacancy,
  getHHResumeAsCandidate,
  saveCandidate,
  updateVacancy,
  type SaveCandidatePayload,
  type VacancyPayload,
} from "../lib/api";
import { pluralRu } from "../lib/format";
import type { useVacancyResponses } from "../hooks/useVacancyResponses";
import { AlertTriangle, Plus, Search, Upload } from "lucide-react";

type ResponsesApi = ReturnType<typeof useVacancyResponses>;

export const ALL_REGIONS = "all";

export interface VacancyFilters {
  query: string;
  region: string;
  onlyNew: boolean;
  onlyMissingId: boolean;
}

export const DEFAULT_VACANCY_FILTERS: VacancyFilters = {
  query: "",
  region: ALL_REGIONS,
  onlyNew: false,
  onlyMissingId: false,
};

interface VacanciesPageProps {
  vacancies: Vacancy[];
  isLoading: boolean;
  loadError: string | null;
  onReload: () => void;
  onVacancySaved: (vacancy: Vacancy) => void;
  onOpenImport: () => void;
  responses: ResponsesApi;
  applications: Application[];
  onAddApplication: (app: Application) => void;
  filters: VacancyFilters;
  onFiltersChange: (filters: VacancyFilters) => void;
}

type EditorState = { vacancy: Vacancy | null; focusHhId?: boolean } | null;

interface OpenedResponse {
  candidate: Candidate;
  response: VacancyResponse;
  vacancy: Vacancy;
}

export function VacanciesPage({
  vacancies,
  isLoading,
  loadError,
  onReload,
  onVacancySaved,
  onOpenImport,
  responses,
  applications,
  onAddApplication,
  filters,
  onFiltersChange,
}: VacanciesPageProps) {
  const { query, region, onlyNew, onlyMissingId } = filters;

  function setQuery(next: string) {
    onFiltersChange({ ...filters, query: next });
  }
  function setRegion(next: string) {
    onFiltersChange({ ...filters, region: next });
  }
  function setOnlyNew(next: boolean) {
    onFiltersChange({ ...filters, onlyNew: next });
  }
  function setOnlyMissingId(next: boolean) {
    onFiltersChange({ ...filters, onlyMissingId: next });
  }

  const [editor, setEditor] = useState<EditorState>(null);
  const [panelVacancyId, setPanelVacancyId] = useState<string | null>(null);
  const [openingResponseId, setOpeningResponseId] = useState<string | null>(null);
  const [opened, setOpened] = useState<OpenedResponse | null>(null);
  const [toSave, setToSave] = useState<OpenedResponse | null>(null);

  const missingIdCount = vacancies.filter((v) => !v.hhVacancyId).length;
  const panelVacancy = vacancies.find((v) => v.id === panelVacancyId) ?? null;

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return vacancies
      .filter((v) => !q || v.label.toLowerCase().includes(q))
      .filter((v) => region === ALL_REGIONS || v.region === region)
      .filter((v) => !onlyNew || (responses.newCounts[v.id] ?? 0) > 0)
      .filter((v) => !onlyMissingId || !v.hhVacancyId)
      .sort((a, b) => {
        const byNew = (responses.newCounts[b.id] ?? 0) - (responses.newCounts[a.id] ?? 0);
        return byNew !== 0 ? byNew : b.createdAt.localeCompare(a.createdAt);
      });
  }, [vacancies, query, region, onlyNew, onlyMissingId, responses.newCounts]);

  const hasFilters = query.trim() !== "" || region !== ALL_REGIONS || onlyNew || onlyMissingId;

  function resetFilters() {
    onFiltersChange(DEFAULT_VACANCY_FILTERS);
  }

  async function handleSubmitVacancy(payload: VacancyPayload) {
    const saved = editor?.vacancy
      ? await updateVacancy(editor.vacancy.id, payload)
      : await createVacancy(payload);
    onVacancySaved(saved);
    setEditor(null);
  }

  function handleOpenResponses(vacancy: Vacancy) {
    setPanelVacancyId(vacancy.id);
    void responses.refresh(vacancy.id);
  }

  async function handleOpenResponse(response: VacancyResponse) {
    if (!panelVacancy || !response.resumeId) return;
    responses.markViewed(response.id);
    setOpeningResponseId(response.id);
    try {
      const candidate = await getHHResumeAsCandidate(response.resumeId);
      setOpened({ candidate, response, vacancy: panelVacancy });
    } catch (err) {
      console.error("Не удалось открыть резюме:", err);
      alert(err instanceof Error ? err.message : "Не получилось открыть резюме");
    } finally {
      setOpeningResponseId(null);
    }
  }

  function findSavedApplication(resumeId: string | null): Application | undefined {
    if (!resumeId) return undefined;
    return applications.find((app) => app.candidate.platformLink?.includes(resumeId));
  }

  async function handleSaveCandidate(payload: SaveCandidatePayload) {
    if (!toSave) return;
    const saved = await saveCandidate({
      ...payload,
      source: "response",
      vacancyId: toSave.vacancy.id,
      respondedAt: toSave.response.createdAt,
    });
    const now = new Date().toISOString();
    onAddApplication({
      id: `candidate-${saved.id}`,
      candidateId: saved.id,
      vacancyId: toSave.vacancy.id,
      vacancyLabel: toSave.vacancy.label,
      status: saved.status ?? "new",
      candidate: {
        ...saved,
        source: saved.source ?? "response",
        vacancyId: saved.vacancyId ?? toSave.vacancy.id,
        respondedAt: saved.respondedAt ?? toSave.response.createdAt,
      },
      createdAt: now,
      updatedAt: now,
    });
    setToSave(null);
    alert("Кандидат сохранён и добавлен в заявки!");
  }

  const savedForOpened = opened ? findSavedApplication(opened.response.resumeId) : undefined;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Вакансии</h1>
          <p className="mt-1 text-muted-foreground">
            Вакансии компании. Укажите ID вакансии на hh.ru – и отклики появятся здесь.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onOpenImport}>
            <Upload className="size-4" />
            Импорт из Excel
          </Button>
          <Button onClick={() => setEditor({ vacancy: null })}>
            <Plus className="size-4" />
            Добавить вакансию
          </Button>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute top-2 left-2.5 size-4 text-muted-foreground" />
          <Input
            className="pl-8"
            placeholder="Найти по названию"
            aria-label="Найти по названию"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <Select value={region} onValueChange={setRegion}>
          <SelectTrigger className="w-[190px]" aria-label="Регион">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_REGIONS}>Любой регион</SelectItem>
            {(Object.entries(regionLabels) as [Region, string][]).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <label className="flex items-center gap-2 pl-1 text-sm whitespace-nowrap">
          <input type="checkbox" checked={onlyNew} onChange={(e) => setOnlyNew(e.target.checked)} />
          Только с новыми откликами
        </label>
      </div>

      {missingIdCount > 0 && !onlyMissingId && (
        <div className="mt-3 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
          <AlertTriangle className="size-3.5 shrink-0" />
          <span className="flex-1">
            У {missingIdCount} {pluralRu(missingIdCount, "вакансии", "вакансий", "вакансий")} не указан ID
            hh.ru. Отклики по ним не приходят.
          </span>
          <Button size="sm" variant="outline" onClick={() => setOnlyMissingId(true)}>
            Показать
          </Button>
        </div>
      )}

      {onlyMissingId && (
        <div className="mt-3 flex items-center gap-2 rounded-md bg-blue-50 p-2.5 text-xs text-blue-800">
          <span className="flex-1">Показаны вакансии без ID hh.ru. Нажмите «Не связана с hh.ru», чтобы указать ID.</span>
          <Button size="sm" variant="ghost" onClick={() => setOnlyMissingId(false)}>
            Показать все
          </Button>
        </div>
      )}

      {isLoading && <p className="mt-6 text-sm text-muted-foreground">Загружаю вакансии...</p>}

      {loadError && (
        <Card className="mt-6 items-center gap-2 border-dashed py-10 text-center">
          <div className="font-bold text-red-600">Не удалось загрузить вакансии</div>
          <div className="text-sm text-muted-foreground">{loadError}</div>
          <Button size="sm" variant="outline" onClick={onReload}>
            Повторить
          </Button>
        </Card>
      )}

      {!isLoading && !loadError && vacancies.length === 0 && (
        <Card className="mt-6 items-center gap-1 border-dashed py-10 text-center">
          <div className="font-bold">Вакансий пока нет</div>
          <div className="text-sm text-muted-foreground">Добавьте вакансию вручную или загрузите из Excel</div>
        </Card>
      )}

      {!isLoading && !loadError && vacancies.length > 0 && visible.length === 0 && (
        <Card className="mt-6 items-center gap-2 border-dashed py-10 text-center">
          <div className="font-bold">По фильтрам ничего нет</div>
          {hasFilters && (
            <Button size="sm" variant="ghost" onClick={resetFilters}>
              Сбросить фильтры
            </Button>
          )}
        </Card>
      )}

      {visible.length > 0 && (
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {visible.map((v) => (
            <VacancyCard
              key={v.id}
              vacancy={v}
              mode="manage"
              newResponsesCount={responses.newCounts[v.id] ?? 0}
              onOpenResponses={handleOpenResponses}
              onEdit={(vacancy, options) => setEditor({ vacancy, focusHhId: options?.focusHhId })}
            />
          ))}
        </div>
      )}

      {editor && (
        <VacancyDialog
          vacancy={editor.vacancy}
          vacancies={vacancies}
          focusHhId={editor.focusHhId}
          onClose={() => setEditor(null)}
          onSubmit={handleSubmitVacancy}
        />
      )}

      {panelVacancy && (
        <ResponsesPanel
          vacancy={panelVacancy}
          state={responses.byVacancy[panelVacancy.id]}
          viewedIds={responses.viewedIds}
          openingResponseId={openingResponseId}
          onOpenResponse={handleOpenResponse}
          onRefresh={() => void responses.refresh(panelVacancy.id)}
          onClose={() => setPanelVacancyId(null)}
        />
      )}

      {opened && (
        <CandidateModal
          candidate={opened.candidate}
          vacancyLabel={`${opened.vacancy.label} • ${opened.vacancy.city}`}
          fieldLabel="Вакансия"
          source="response"
          respondedAt={opened.response.createdAt}
          selectLabel="Взять в работу"
          savedStatus={savedForOpened?.status}
          onClose={() => setOpened(null)}
          onSelect={() => {
            setToSave(opened);
            setOpened(null);
          }}
        />
      )}

      {toSave && (
        <SaveCandidateDialog
          previewCandidate={toSave.candidate}
          vacancyLabel={toSave.vacancy.label}
          onClose={() => setToSave(null)}
          onSubmit={handleSaveCandidate}
        />
      )}
    </div>
  );
}