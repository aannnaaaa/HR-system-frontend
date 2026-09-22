import { useState } from "react";
import { SearchForm } from "../components/SearchForm";
import { VacancyCard } from "../components/VacancyCard";
import { SearchResumePreviewCard } from "../components/SearchResumePreviewCard";
import { CandidateModal } from "../components/CandidateModal";
import { SaveCandidateDialog } from "../components/SaveCandidateDialog";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../components/ui/dialog";
import { ExternalLink } from "lucide-react";
import {
  searchVacancies,
  searchCandidates,
  saveCandidate,
  mapSearchResultToCandidate,
  revealResumeContact,
  type ApiError,
  type HHResumeSearchResult,
  type SaveCandidatePayload,
} from "../lib/api";
import { usePersistentState } from "../hooks/usePersistentState";
import type { SearchFilters, Candidate, Vacancy, Application } from "../types";

type SearchStatus = "idle" | "loading" | "found" | "notfound" | "error";

interface SearchResultsState {
  status: SearchStatus;
  errorMessage: string;
  vacancies: Vacancy[];
  candidates: HHResumeSearchResult[];
}

const INITIAL_RESULTS: SearchResultsState = {
  status: "idle",
  errorMessage: "",
  vacancies: [],
  candidates: [],
};

interface SearchPageProps {
  applications: Application[];
  onAddApplication: (app: Application) => void;
}

export function SearchPage({ applications, onAddApplication }: SearchPageProps) {
  const [results, setResults] = usePersistentState<SearchResultsState>(
    "persona-gaz-search-results",
    INITIAL_RESULTS
  );
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [candidateToSave, setCandidateToSave] = useState<Candidate | null>(null);
  const [authUrl, setAuthUrl] = useState<string | null>(null);
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set());

  const { status: searchState, errorMessage, vacancies, candidates } = results;

  async function handleSearch(filters: SearchFilters) {
    if (!filters.profession.trim()) return;

    setResults((prev) => ({ ...prev, status: "loading" }));

    const [vacanciesResult, candidatesResult] = await Promise.allSettled([
      searchVacancies(filters),
      searchCandidates(filters),
    ]);

    const matchedVacancies = vacanciesResult.status === "fulfilled" ? vacanciesResult.value : [];
    const matchedCandidates = candidatesResult.status === "fulfilled" ? candidatesResult.value : [];

    if (candidatesResult.status === "rejected") {
      console.error("Поиск резюме не удался:", candidatesResult.reason);
    }
    if (vacanciesResult.status === "rejected") {
      console.error("Поиск вакансий не удался:", vacanciesResult.reason);
    }

    if (vacanciesResult.status === "rejected" && candidatesResult.status === "rejected") {
      const err = vacanciesResult.reason;
      setResults({
        status: "error",
        errorMessage: err instanceof Error ? err.message : "Не получилось выполнить поиск",
        vacancies: [],
        candidates: [],
      });
      return;
    }

    setResults({
      status: matchedVacancies.length === 0 && matchedCandidates.length === 0 ? "notfound" : "found",
      errorMessage: "",
      vacancies: matchedVacancies,
      candidates: matchedCandidates,
    });
  }

  function handleOpenResume(resume: HHResumeSearchResult) {
    setSelectedCandidate(mapSearchResultToCandidate(resume));
  }

  function handleWantToSelect(candidate: Candidate) {
    setSelectedCandidate(null);
    setCandidateToSave(candidate);
  }

  async function handleRevealContact(candidate: Candidate) {
    try {
      const revealed = await revealResumeContact(candidate.id);
      setRevealedIds((prev) => new Set(prev).add(candidate.id));
      setSelectedCandidate((prev) =>
        prev && prev.id === candidate.id
          ? { ...prev, name: revealed.name, email: revealed.email, phone: revealed.phone }
          : prev
      );
    } catch (err) {
      console.error("Не удалось раскрыть контакт:", err);
      const apiErr = err as ApiError;
      if (apiErr.authUrl) {
        setAuthUrl(apiErr.authUrl);
      } else {
        alert(apiErr.message ?? "Не получилось раскрыть контакт");
      }
    }
  }

  async function handleSaveCandidate(payload: SaveCandidatePayload) {
    const saved = await saveCandidate(payload);

    const newApplication: Application = {
      id: Date.now().toString(),
      candidateId: saved.id,
      vacancyId: "unknown",
      vacancyLabel: saved.profession ?? saved.educationProfile ?? "—",
      status: "new",
      candidate: saved,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    onAddApplication(newApplication);
    setCandidateToSave(null);
    alert("Кандидат сохранён и добавлен в заявки!");
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
              {candidates.map((resume) => (
                <SearchResumePreviewCard
                  key={resume.id}
                  resume={resume}
                  onOpen={() => handleOpenResume(resume)}
                />
              ))}
            </div>
          </section>
        </div>
      )}

      {selectedCandidate && (
        <CandidateModal
          candidate={selectedCandidate}
          vacancyLabel={selectedCandidate.profession ?? selectedCandidate.educationProfile ?? "—"}
          onClose={() => setSelectedCandidate(null)}
          onSelect={handleWantToSelect}
          onRevealContact={revealedIds.has(selectedCandidate.id) ? undefined : handleRevealContact}
        />
      )}

      {candidateToSave && (
        <SaveCandidateDialog
          previewCandidate={candidateToSave}
          onClose={() => setCandidateToSave(null)}
          onSubmit={handleSaveCandidate}
        />
      )}

      <Dialog open={!!authUrl} onOpenChange={(next) => !next && setAuthUrl(null)}>
        <DialogContent className="sm:max-w-[360px]">
          <DialogHeader>
            <DialogTitle>Нужна авторизация в HH</DialogTitle>
            <DialogDescription>
              Токен работодателя истёк или отсутствует. Авторизуйтесь заново,
              чтобы посмотреть контакт.
            </DialogDescription>
          </DialogHeader>
          <Button asChild>
            <a href={authUrl ?? "#"} target="_blank" rel="noopener noreferrer">
              Авторизоваться в HH
              <ExternalLink className="size-3.5" />
            </a>
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}