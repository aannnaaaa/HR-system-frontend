import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Vacancy, VacancyResponse } from "../types";
import { getVacancyResponses } from "../lib/api";
import { loadViewedResponseIds, saveViewedResponseIds } from "../lib/viewedResponses";

export interface ResponsesState {
  status: "loading" | "ready" | "error";
  items: VacancyResponse[];
  error?: string;
}

const REFRESH_INTERVAL_MS = 3 * 60 * 1000;

export function useVacancyResponses(vacancies: Vacancy[], enabled: boolean) {
  const [byVacancy, setByVacancy] = useState<Record<string, ResponsesState>>({});
  const [viewedIds, setViewedIds] = useState<Set<string>>(() => loadViewedResponseIds());
  const vacanciesRef = useRef(vacancies);
  vacanciesRef.current = vacancies;

  const linkedKey = vacancies
    .filter((v) => v.hhVacancyId)
    .map((v) => `${v.id}:${v.hhVacancyId}`)
    .join("|");

  const refresh = useCallback(async (vacancyId: string) => {
    setByVacancy((prev) => ({
      ...prev,
      [vacancyId]: { status: "loading", items: prev[vacancyId]?.items ?? [] },
    }));
    try {
      const items = await getVacancyResponses(vacancyId);
      setByVacancy((prev) => ({ ...prev, [vacancyId]: { status: "ready", items } }));
    } catch (err) {
      setByVacancy((prev) => ({
        ...prev,
        [vacancyId]: {
          status: "error",
          items: prev[vacancyId]?.items ?? [],
          error: err instanceof Error ? err.message : undefined,
        },
      }));
    }
  }, []);

  const refreshAll = useCallback(() => {
    vacanciesRef.current.filter((v) => v.hhVacancyId).forEach((v) => void refresh(v.id));
  }, [refresh]);

  useEffect(() => {
    if (!enabled || !linkedKey) return;
    refreshAll();
    const timer = setInterval(refreshAll, REFRESH_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [enabled, linkedKey, refreshAll]);

  const markViewed = useCallback((responseId: string) => {
    setViewedIds((prev) => {
      if (prev.has(responseId)) return prev;
      const next = new Set(prev);
      next.add(responseId);
      saveViewedResponseIds(next);
      return next;
    });
  }, []);

  const newCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const [vacancyId, state] of Object.entries(byVacancy)) {
      counts[vacancyId] = state.items.filter((r) => !viewedIds.has(r.id)).length;
    }
    return counts;
  }, [byVacancy, viewedIds]);

  const linkedIds = new Set(vacancies.filter((v) => v.hhVacancyId).map((v) => v.id));
  const totalNew = Object.entries(newCounts)
    .filter(([id]) => linkedIds.has(id))
    .reduce((sum, [, n]) => sum + n, 0);

  return { byVacancy, viewedIds, newCounts, totalNew, refresh, markViewed };
}
