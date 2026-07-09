import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { parseVacancyFileBuffer, type VacancyImportRow, type SkippedRow } from "../lib/parseVacancies";
import { regionLabels, employmentTypeLabels } from "../types";

// Базовый адрес бэкенда. В деве, если настроен прокси в vite.config.ts (см. инструкцию),
// можно оставить пустую строку "" и обращаться по относительному пути "/api/...".
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";

type ImportState =
  | { step: "idle" }
  | { step: "parsed"; vacancies: VacancyImportRow[]; skipped: SkippedRow[] }
  | { step: "saving" }
  | { step: "done"; imported: number; rejected: number }
  | { step: "error"; message: string };

export function VacancyImportPage() {
  const [state, setState] = useState<ImportState>({ step: "idle" });

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const buffer = await file.arrayBuffer();
      const { vacancies, skipped } = parseVacancyFileBuffer(buffer);
      setState({ step: "parsed", vacancies, skipped });
    } catch (err) {
      setState({ step: "error", message: "Не получилось прочитать файл. Проверьте, что это .xlsx" });
    }
  }

  async function handleSave() {
    if (state.step !== "parsed") return;
    setState({ step: "saving" });

    try {
      const res = await fetch(`${API_BASE}/api/vacancies/import`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // важно: передаёт куки авторизации Clerk на бэкенд
        body: JSON.stringify({ vacancies: state.vacancies }),
      });

      if (!res.ok) {
        const text = await res.text();
        setState({ step: "error", message: `Бэкенд отказал (${res.status}): ${text}` });
        return;
      }

      const data = await res.json();
      setState({ step: "done", imported: data.imported, rejected: data.rejected });
    } catch (err) {
      setState({ step: "error", message: "Не получилось достучаться до сервера. Бэкенд запущен?" });
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-bold tracking-tight">Импорт вакансий из Excel</h1>
      <p className="mt-1 text-muted-foreground">
        Загрузите выгрузку вакансий — регион, город, профессия и тип занятости
        подтянутся автоматически.
      </p>

      <Card className="mt-5">
        <CardContent className="space-y-4">
          <input
            type="file"
            accept=".xlsx"
            onChange={handleFileChange}
            disabled={state.step === "saving"}
          />

          {state.step === "error" && (
            <p className="text-sm text-red-600">{state.message}</p>
          )}

          {state.step === "parsed" && (
            <div className="space-y-3">
              <p className="text-sm">
                Распознано вакансий:{" "}
                <span className="font-bold">{state.vacancies.length}</span>
                {state.skipped.length > 0 && (
                  <>
                    {" "}
                    · пропущено:{" "}
                    <span className="font-bold text-amber-600">{state.skipped.length}</span>
                  </>
                )}
              </p>

              <div className="max-h-64 space-y-2 overflow-y-auto rounded-md border p-3">
                {state.vacancies.slice(0, 10).map((v, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <span>
                      {v.label} — {regionLabels[v.region]}, {v.city}
                    </span>
                    <span className="flex gap-1">
                      {v.employmentTypes.map((t) => (
                        <Badge key={t} variant="secondary" className="font-normal">
                          {employmentTypeLabels[t]}
                        </Badge>
                      ))}
                    </span>
                  </div>
                ))}
                {state.vacancies.length > 10 && (
                  <p className="text-xs text-muted-foreground">
                    ...и ещё {state.vacancies.length - 10}
                  </p>
                )}
              </div>

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

          {state.step === "saving" && <p className="text-sm">Сохраняю...</p>}

          {state.step === "done" && (
            <p className="text-sm">
              Готово. Сохранено: <span className="font-bold">{state.imported}</span>
              {state.rejected > 0 && (
                <>
                  , отклонено бэкендом:{" "}
                  <span className="font-bold text-amber-600">{state.rejected}</span>
                </>
              )}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}