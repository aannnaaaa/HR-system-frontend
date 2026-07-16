import { useState } from "react";
import { SearchForm } from "../components/SearchForm";
import { VacancyCard } from "../components/VacancyCard";
import { ResumeCard } from "../components/ResumeCard";
import { CandidateModal } from "../components/CandidateModal";
import { Card } from "../components/ui/card";
import { searchVacancies, searchCandidates } from "../lib/api";
import { filterMockCandidates } from "../data/mockData";
import type { SearchFilters, Candidate, Vacancy, Application } from "../types";

// Пока бэкенд не реализовал /api/candidates/search (сейчас отдаёт 404),
// используем мок-данные, чтобы проверять вёрстку и логику поиска.
// Как только эндпоинт заработает — этот флаг и фолбэк можно убрать.
const USE_MOCK_CANDIDATES_FALLBACK = true;

type SearchState = "idle" | "loading" | "found" | "notfound" | "error";

interface SearchPageProps {
  applications: Application[];
  onAddApplication: (app: Application) => void;
}

export function SearchPage({ applications, onAddApplication }: SearchPageProps) {
  const [searchState, setSearchState] = useState<SearchState>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);

  async function handleSearch(filters: SearchFilters) {
    if (!filters.profession.trim()) return;

    setSearchState("loading");

    // Promise.allSettled вместо Promise.all: один упавший запрос (например,
    // /api/candidates/search ещё не реализован на бэке и отдаёт 404) не должен
    // прятать успешный результат другого (vacancies).
    const [vacanciesResult, candidatesResult] = await Promise.allSettled([
      searchVacancies(filters),
      searchCandidates(filters),
    ]);

    const matchedVacancies = vacanciesResult.status === "fulfilled" ? vacanciesResult.value : [];

    let matchedCandidates: Candidate[] =
      candidatesResult.status === "fulfilled" ? candidatesResult.value : [];

    if (candidatesResult.status === "rejected") {
      console.error("Поиск кандидатов не удался:", candidatesResult.reason);
      if (USE_MOCK_CANDIDATES_FALLBACK) {
        matchedCandidates = filterMockCandidates(filters);
      }
    }
    if (vacanciesResult.status === "rejected") {
      console.error("Поиск вакансий не удался:", vacanciesResult.reason);
    }

    // Общая ошибка показывается, только если вакансии упали и по кандидатам
    // нет даже мок-фолбэка — если хоть что-то есть, показываем то, что есть.
    const candidatesTrulyFailed =
      candidatesResult.status === "rejected" && !USE_MOCK_CANDIDATES_FALLBACK;

    if (vacanciesResult.status === "rejected" && candidatesTrulyFailed) {
      const err = vacanciesResult.reason;
      setErrorMessage(err instanceof Error ? err.message : "Не получилось выполнить поиск");
      setSearchState("error");
      return;
    }

    setVacancies(matchedVacancies);
    setCandidates(matchedCandidates);
    setSearchState(
      matchedVacancies.length === 0 && matchedCandidates.length === 0 ? "notfound" : "found"
    );
  }

  function handleSelectCandidate(candidate: Candidate) {
    const newApplication: Application = {
      id: Date.now().toString(),
      candidateId: candidate.id,
      vacancyId: "v1",
      vacancyLabel: "Инженер-геолог",
      status: "new",
      candidate,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    onAddApplication(newApplication);
    setSelectedCandidate(null);
    alert(`Кандидат добавлен в заявки!`);
  }

  return (
    <div>
      <SearchForm onSearch={handleSearch} />

      {searchState === "loading" && (
        <p className="mx-auto max-w-3xl px-4 py-6 text-sm text-muted-foreground">Ищу...</p>
      )}

      {searchState === "error" && (
        <Card className="mx-auto mb-4 max-w-3xl border-dashed py-10 text-center">
          <div className="font-bold text-red-600">Ошибка поиска</div>
          <div className="text-sm text-muted-foreground">{errorMessage}</div>
        </Card>
      )}

      {searchState === "notfound" && (
        <Card className="mx-auto mb-4 max-w-3xl items-center gap-1 border-dashed py-10 text-center">
          <div className="font-bold">Ничего не найдено</div>
          <div className="text-sm text-muted-foreground">
            По заданным фильтрам нет ни открытых вакансий, ни резюме на платформах.
          </div>
        </Card>
      )}

      {searchState === "found" && (
        <div className="mx-auto max-w-3xl px-4 pb-10">
          <section>
            <h2 className="mb-3 mt-6 text-base font-bold">
              Открытые вакансии ({vacancies.length})
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {vacancies.map((v) => (
                <VacancyCard key={v.id} vacancy={v} />
              ))}
            </div>
          </section>

          <section>
            <h2 className="mb-3 mt-6 text-base font-bold">
              Подходящие резюме ({candidates.length})
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {candidates.map((c) => (
                <ResumeCard
                  key={c.id}
                  candidate={c}
                  onOpen={(candidate) => setSelectedCandidate(candidate)}
                />
              ))}
            </div>
          </section>
        </div>
      )}

      {selectedCandidate && (
        <CandidateModal
          candidate={selectedCandidate}
          vacancyLabel="Инженер-геолог"
          onClose={() => setSelectedCandidate(null)}
          onSelect={handleSelectCandidate}
        />
      )}
    </div>
  );
}