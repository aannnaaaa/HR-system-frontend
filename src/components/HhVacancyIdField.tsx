import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, ExternalLink, Loader2 } from "lucide-react";
import { Label } from "./ui/label";
import { lookupHHVacancy, type HHVacancyPreview } from "../lib/api";
import { isValidHHVacancyId, normalizeHHVacancyIdInput } from "../lib/hhVacancyId";

interface HhVacancyIdFieldProps {
  value: string;
  onChange: (value: string) => void;
  currentLabel: string;
  duplicateOf?: string | null;
  showRequiredError?: boolean;
  autoFocus?: boolean;
}

type LookupState =
  | { step: "idle" }
  | { step: "checking" }
  | { step: "found"; vacancy: HHVacancyPreview }
  | { step: "failed" };

const LOOKUP_DELAY_MS = 500;

function normalizeTitle(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

export function HhVacancyIdField({
  value,
  onChange,
  currentLabel,
  duplicateOf,
  showRequiredError,
  autoFocus,
}: HhVacancyIdFieldProps) {
  const [lookup, setLookup] = useState<LookupState>({ step: "idle" });

  const isEmpty = value.trim() === "";
  const isValid = isValidHHVacancyId(value);

  useEffect(() => {
    if (!isValid) {
      setLookup({ step: "idle" });
      return;
    }
    const controller = new AbortController();
    setLookup({ step: "checking" });
    const timer = setTimeout(async () => {
      try {
        const vacancy = await lookupHHVacancy(value, controller.signal);
        setLookup({ step: "found", vacancy });
      } catch {
        if (!controller.signal.aborted) setLookup({ step: "failed" });
      }
    }, LOOKUP_DELAY_MS);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [value, isValid]);

  const invalidFormat = !isEmpty && !isValid;
  const hasError = invalidFormat || (isEmpty && showRequiredError);
  const nameDiffers =
    lookup.step === "found" &&
    currentLabel.trim() !== "" &&
    normalizeTitle(lookup.vacancy.name) !== normalizeTitle(currentLabel);

  return (
    <div className="space-y-1.5">
      <Label htmlFor="hh-vacancy-id">ID вакансии на hh.ru *</Label>
      <div
        className={`flex h-8 items-center overflow-hidden rounded-lg border bg-transparent ${
          hasError ? "border-destructive" : "border-input"
        } focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50`}
      >
        <span className="flex h-full items-center border-r bg-muted/50 px-2.5 text-sm text-muted-foreground">
          hh.ru/vacancy/
        </span>
        <input
          id="hh-vacancy-id"
          inputMode="numeric"
          autoComplete="off"
          autoFocus={autoFocus}
          placeholder="123456789"
          aria-invalid={hasError || undefined}
          className="h-full min-w-0 flex-1 bg-transparent px-2.5 text-base outline-none placeholder:text-muted-foreground md:text-sm"
          value={value}
          onChange={(e) => onChange(normalizeHHVacancyIdInput(e.target.value))}
        />
      </div>

      {invalidFormat && <p className="text-xs text-red-600">ID состоит только из цифр</p>}
      {isEmpty && showRequiredError && (
        <p className="text-xs text-red-600">Укажите ID вакансии на hh.ru</p>
      )}

      {isEmpty && !showRequiredError && (
        <p className="text-xs text-muted-foreground">
          Скопируйте число из ссылки hh.ru/vacancy/123456789. Можно вставить ссылку целиком.
        </p>
      )}

      {lookup.step === "checking" && (
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Loader2 className="size-3.5 animate-spin" />
          Ищем вакансию на hh.ru...
        </p>
      )}

      {lookup.step === "found" && (
        <div className="flex flex-col gap-1 rounded-md bg-blue-50 p-2.5 text-xs text-blue-800">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 size-3.5 shrink-0" />
            <span className="flex-1">
              Нашли вакансию: «{lookup.vacancy.name}»
              {lookup.vacancy.area ? `, ${lookup.vacancy.area}` : ""}
            </span>
            <a
              href={lookup.vacancy.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex shrink-0 items-center gap-1 font-medium text-blue-600 hover:text-blue-700 hover:underline"
            >
              Открыть на hh.ru
              <ExternalLink className="size-3" />
            </a>
          </div>
          {nameDiffers && (
            <span className="pl-5.5 text-muted-foreground">
              Название в системе отличается – проверьте, та ли вакансия.
            </span>
          )}
        </div>
      )}

      {lookup.step === "failed" && (
        <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-800">
          <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
          <span>Не получилось проверить вакансию на hh.ru. Сохранить можно – проверьте ID вручную.</span>
        </div>
      )}

      {duplicateOf && isValid && (
        <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-800">
          <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
          <span>Этот ID уже привязан к вакансии «{duplicateOf}».</span>
        </div>
      )}
    </div>
  );
}
