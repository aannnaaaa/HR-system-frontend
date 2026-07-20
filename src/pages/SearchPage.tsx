import { useState } from "react";
import { SearchForm } from "../components/SearchForm";
import { VacancyCard } from "../components/VacancyCard";
import { SearchResumePreviewCard } from "../components/SearchResumePreviewCard";
import { CandidateModal } from "../components/CandidateModal";
import { SaveCandidateDialog } from "../components/SaveCandidateDialog";
import { Card } from "../components/ui/card";
import {
  searchVacancies,
  searchCandidates,
  saveCandidate,
  mapSearchResultToCandidate,
  revealResumeContact,
  type HHResumeSearchResult,
  type SaveCandidatePayload,
} from "../lib/api";
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
  // Живые результаты поиска hh.ru — НЕ Candidate из БД.
  const [candidates, setCandidates] = useState<HHResumeSearchResult[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  // Кандидат, которого HR нажал "Выбрать вакансию" — ждёт дозаполнения
  // обязательных полей перед реальным сохранением в БД.
  const [candidateToSave, setCandidateToSave] = useState<Candidate | null>(null);

  async function handleSearch(filters: SearchFilters) {
    if (!filters.profession.trim()) return;

    setSearchState("loading");

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

  function handleOpenResume(resume: HHResumeSearchResult) {
    setSelectedCandidate(mapSearchResultToCandidate(resume));
  }

  // "Выбрать вакансию" в модалке предпросмотра -> открываем форму
  // дозаполнения обязательных полей, а не сохраняем сразу.
  function handleWantToSelect(candidate: Candidate) {
    setSelectedCandidate(null);
    setCandidateToSave(candidate);
  }

  // "Посмотреть контакт" — платное действие на стороне hh.ru. Дергается
  // только по явному клику в модалке, обновляет открытую карточку
  // реальными name/email/phone.
  async function handleRevealContact(candidate: Candidate) {
    try {
      const revealed = await revealResumeContact(candidate.id);
      setSelectedCandidate((prev) =>
        prev && prev.id === candidate.id
          ? { ...prev, name: revealed.name, email: revealed.email, phone: revealed.phone }
          : prev
      );
    } catch (err) {
      console.error("Не удалось раскрыть контакт:", err);
      alert(err instanceof Error ? err.message : "Не получилось раскрыть контакт");
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
          onRevealContact={handleRevealContact}
        />
      )}

      {candidateToSave && (
        <SaveCandidateDialog
          previewCandidate={candidateToSave}
          onClose={() => setCandidateToSave(null)}
          onSubmit={handleSaveCandidate}
        />
      )}
    </div>
  );
}