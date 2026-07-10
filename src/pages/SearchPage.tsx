import { useState } from "react";
import { SearchForm } from "../components/SearchForm";
import { VacancyCard } from "../components/VacancyCard";
import { ResumeCard } from "../components/ResumeCard";
import { CandidateModal } from "../components/CandidateModal";
import { Card } from "../components/ui/card";
import { mockCandidates } from "../data/mockData";
import { searchVacancies } from "../lib/api";
import type { SearchFilters, Candidate, Vacancy, Application } from "../types";

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

    try {
      const matchedVacancies = await searchVacancies(filters);
      const matchedCandidates = mockCandidates.filter((c) =>
        c.educationProfile?.toLowerCase().includes(filters.profession.toLowerCase()) ||
        filters.profession.toLowerCase().includes("геолог")
      );

      setVacancies(matchedVacancies);
      setCandidates(matchedCandidates);
      setSearchState(
        matchedVacancies.length === 0 && matchedCandidates.length === 0 ? "notfound" : "found"
      );
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Не получилось выполнить поиск");
      setSearchState("error");
    }
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
    alert(`Кандидат ${candidate.name} добавлен в заявки!`);
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