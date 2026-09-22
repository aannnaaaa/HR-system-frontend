import { useRef, useState } from "react";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { parseVacancyFileBuffer, type VacancyImportRow, type SkippedRow } from "../lib/parseVacancies";
import { regionLabels, employmentTypeLabels } from "../types";
import { pluralRu } from "../lib/format";
import { AlertTriangle, ArrowLeft, CheckCircle2, FileSpreadsheet, Hash, Upload } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";

type ImportState =
  | { step: "idle" }
  | { step: "parsed"; fileName: string; vacancies: VacancyImportRow[]; skipped: SkippedRow[] }
  | { step: "saving"; fileName: string }
  | { step: "done"; imported: number; rejected: number; missingIdCount: number }
  | { step: "error"; message: string };

interface VacancyImportPageProps {
  onBack: () => void;
  onImported?: () => void;
  onGoToMissingIds?: () => void;
}

export function VacancyImportPage({ onBack, onImported, onGoToMissingIds }: VacancyImportPageProps) {
  const [state, setState] = useState<ImportState>({ step: "idle" });
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    try {
      const buffer = await file.arrayBuffer();
      const { vacancies, skipped } = parseVacancyFileBuffer(buffer);
      setState({ step: "parsed", fileName: file.name, vacancies, skipped });
    } catch {
      setState({ step: "error", message: "Не получилось прочитать файл. Проверьте, что это .xlsx" });
    }
  }

  async function handleSave() {
    if (state.step !== "parsed") return;
    const missingIdCount = state.vacancies.filter((v) => !v.hhVacancyId).length;
    setState({ step: "saving", fileName: state.fileName });

    try {
      const res = await fetch(`${API_BASE}/api/vacancies/import`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ vacancies: state.vacancies }),
      });

      if (!res.ok) {
        const text = await res.text();
        setState({ step: "error", message: `Бэкенд отказал (${res.status}): ${text}` });
        return;
      }

      const data = await res.json();
      setState({ step: "done", imported: data.imported, rejected: data.rejected, missingIdCount });
      onImported?.();
    } catch {
      setState({ step: "error", message: "Не получилось достучаться до сервера. Бэкенд запущен?" });
    }
  }

  const pickFile = () => fileInputRef.current?.click();
  const missingInParsed =
    state.step === "parsed" ? state.vacancies.filter((v) => !v.hhVacancyId).length : 0;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Button variant="ghost" size="sm" className="-ml-2.5 gap-1.5 text-muted-foreground" onClick={onBack}>
        <ArrowLeft className="size-3.5" />
        К вакансиям
      </Button>
      <h1 className="mt-3 text-2xl font-bold tracking-tight">Импорт вакансий из Excel</h1>
      <p className="mt-1 text-muted-foreground">
        Загрузите выгрузку вакансий – регион, город, профессия, тип занятости и ID hh.ru (если есть колонка)
        подтянутся автоматически.
      </p>

      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx"
        className="hidden"
        onChange={handleFileChange}
        disabled={state.step === "saving"}
      />

      <Card className="mt-5">
        <CardContent className="space-y-4">
          {(state.step === "idle" || state.step === "error") && (
            <button
              type="button"
              onClick={pickFile}
              className="flex w-full flex-col items-center gap-2 rounded-lg border border-dashed py-8 text-center hover:bg-muted/50"
            >
              <Upload className="size-5 text-muted-foreground" />
              <span className="font-bold">Выберите .xlsx файл</span>
              <span className="text-sm text-muted-foreground">
                Нужны колонки «Местность», «Должность (профессия), разряд», «Вахта», «Вид трудового договора»
              </span>
            </button>
          )}

          {state.step === "error" && <p className="text-sm text-red-600">{state.message}</p>}

          {(state.step === "parsed" || state.step === "saving") && (
            <div className="flex items-center gap-3 rounded-lg border border-dashed px-4 py-3">
              <span className="flex size-9 items-center justify-center rounded-md bg-blue-50 text-blue-600">
                <FileSpreadsheet className="size-4.5" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{state.fileName}</div>
                <div className="text-xs text-muted-foreground">
                  {state.step === "saving" ? "Сохраняю..." : "Файл прочитан"}
                </div>
              </div>
              <Button size="sm" variant="outline" className="gap-1.5" onClick={pickFile} disabled={state.step === "saving"}>
                <Upload className="size-3.5" />
                Заменить файл
              </Button>
            </div>
          )}

          {state.step === "parsed" && (
            <div className="space-y-3">
              <p className="text-sm">
                Распознано вакансий: <span className="font-bold">{state.vacancies.length}</span>
                {state.skipped.length > 0 && (
                  <>
                    {" "}
                    · пропущено: <span className="font-bold text-amber-600">{state.skipped.length}</span>
                  </>
                )}
                {missingInParsed > 0 && (
                  <>
                    {" "}
                    · без ID hh.ru: <span className="font-bold text-amber-600">{missingInParsed}</span>
                  </>
                )}
              </p>

              <div className="max-h-64 space-y-2 overflow-y-auto rounded-md border p-3">
                {state.vacancies.slice(0, 10).map((v, i) => (
                  <div key={i} className="flex items-center justify-between gap-3 text-xs">
                    <span className="min-w-0 flex-1">
                      {v.label} — {regionLabels[v.region]}, {v.city}
                    </span>
                    {v.hhVacancyId ? (
                      <span className="inline-flex shrink-0 items-center gap-1 text-muted-foreground">
                        <Hash className="size-3" />
                        {v.hhVacancyId}
                      </span>
                    ) : (
                      <Badge className="shrink-0 border-transparent bg-amber-100 font-normal text-amber-800 hover:bg-amber-100">
                        без ID hh.ru
                      </Badge>
                    )}
                    <span className="flex shrink-0 gap-1">
                      {v.employmentTypes.map((t) => (
                        <Badge key={t} variant="secondary" className="font-normal">
                          {employmentTypeLabels[t]}
                        </Badge>
                      ))}
                    </span>
                  </div>
                ))}
                {state.vacancies.length > 10 && (
                  <p className="text-xs text-muted-foreground">...и ещё {state.vacancies.length - 10}</p>
                )}
              </div>

              {missingInParsed > 0 && (
                <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                  <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
                  <span>
                    У {missingInParsed} {pluralRu(missingInParsed, "вакансии", "вакансий", "вакансий")} нет ID
                    hh.ru – отклики по ним не придут. ID можно указать после импорта на странице «Вакансии».
                  </span>
                </div>
              )}

              {state.skipped.length > 0 && (
                <details className="text-xs text-muted-foreground">
                  <summary className="cursor-pointer">Показать пропущенные строки</summary>
                  <ul className="mt-2 space-y-1">
                    {state.skipped.map((s, i) => (
                      <li key={i}>
                        Строка №{s.rowNumber}: {s.reason} ({s.raw["Местность"]})
                      </li>
                    ))}
                  </ul>
                </details>
              )}

              <Button onClick={handleSave}>Сохранить в базу</Button>
            </div>
          )}

          {state.step === "done" && (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="size-4 text-green-600" />
                Готово. Сохранено: <span className="font-bold">{state.imported}</span>
                {state.rejected > 0 && (
                  <>
                    , отклонено бэкендом: <span className="font-bold text-amber-600">{state.rejected}</span>
                  </>
                )}
              </p>
              {state.missingIdCount > 0 && onGoToMissingIds && (
                <Button size="sm" variant="outline" className="gap-1.5" onClick={onGoToMissingIds}>
                  <Hash className="size-3.5" />
                  Указать ID для {state.missingIdCount}{" "}
                  {pluralRu(state.missingIdCount, "вакансии", "вакансий", "вакансий")}
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
