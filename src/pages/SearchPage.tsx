import { useState } from "react";
import { SearchForm } from "../components/SearchForm";
import { VacancyCard } from "../components/VacancyCard";
import { ResumeCard } from "../components/ResumeCard";
import { CandidateModal } from "../components/CandidateModal";
import { Card } from "../components/ui/card";
import { mockVacancies, mockCandidates } from "../data/mockData";
import type { SearchFilters, Candidate, Vacancy, Application } from "../types";

type SearchState = "idle" | "found" | "notfound";

interface SearchPageProps {
  applications: Application[];
  onAddApplication: (app: Application) => void;
}

export function SearchPage({ applications, onAddApplication }: SearchPageProps) {
  const [searchState, setSearchState] = useState<SearchState>("idle");
  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);

  function handleSearch(filters: SearchFilters) {
    if (!filters.profession.trim()) return;

    const matchedVacancies = mockVacancies.filter((v) =>
      v.label.toLowerCase().includes(filters.profession.toLowerCase())
    );
    const matchedCandidates = mockCandidates.filter((c) =>
      c.educationProfile?.toLowerCase().includes(filters.profession.toLowerCase()) ||
      filters.profession.toLowerCase().includes("геолог")
    );

    if (matchedVacancies.length === 0 && matchedCandidates.length === 0) {
      setSearchState("notfound");
    } else {
      setSearchState("found");
    }

    setVacancies(matchedVacancies);
    setCandidates(matchedCandidates);
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