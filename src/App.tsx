import { useCallback, useEffect, useMemo, useState } from "react";
import { Header, type AppPage } from "./components/Header";
import { LoginForm } from "./components/LoginForm";
import { SearchPage } from "./pages/SearchPage";
import { MyApplicationsPage } from "./pages/MyApplicationsPage";
import { VacancyImportPage } from "./pages/VacancyImportPage";
import { VacanciesPage } from "./pages/VacanciesPage";
import type { Application, ApplicationStatus, Vacancy } from "./types";
import {
  getSavedCandidates,
  getVacancies,
  updateCandidateComment,
  updateCandidateStatus,
} from "./lib/api";
import { useVacancyResponses } from "./hooks/useVacancyResponses";
import { usePersistentState } from "./hooks/usePersistentState";
import { DEFAULT_VACANCY_FILTERS, type VacancyFilters } from "./pages/VacanciesPage";

const AUTH_STORAGE_KEY = "persona-gaz-mock-auth";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => localStorage.getItem(AUTH_STORAGE_KEY) === "true"
  );
  const [activePage, setActivePage] = useState<AppPage>("search");
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoadingSaved, setIsLoadingSaved] = useState(true);

  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [isLoadingVacancies, setIsLoadingVacancies] = useState(true);
  const [vacanciesError, setVacanciesError] = useState<string | null>(null);
  const [vacancyFilters, setVacancyFilters] = usePersistentState<VacancyFilters>(
    "persona-gaz-vacancy-filters",
    DEFAULT_VACANCY_FILTERS
  );

  const responses = useVacancyResponses(vacancies, isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;

    async function loadSavedCandidates() {
      try {
        const savedCandidates = await getSavedCandidates();
        if (cancelled) return;

        const reconstructed: Application[] = savedCandidates.map((candidate) => ({
          id: `candidate-${candidate.id}`,
          candidateId: candidate.id,
          vacancyId: candidate.vacancyId ?? "unknown",
          vacancyLabel: candidate.profession ?? candidate.educationProfile ?? "—",
          status: candidate.status ?? "new",
          candidate,
          createdAt: candidate.createdAt,
          updatedAt: candidate.updatedAt,
        }));

        setApplications(reconstructed);
      } catch (err) {
        console.error("Не удалось загрузить сохранённых кандидатов:", err);
      } finally {
        if (!cancelled) setIsLoadingSaved(false);
      }
    }

    loadSavedCandidates();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  const loadVacancies = useCallback(async () => {
    setIsLoadingVacancies(true);
    setVacanciesError(null);
    try {
      setVacancies(await getVacancies());
    } catch (err) {
      console.error("Не удалось загрузить вакансии:", err);
      setVacanciesError(err instanceof Error ? err.message : "Неизвестная ошибка");
    } finally {
      setIsLoadingVacancies(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) void loadVacancies();
  }, [isAuthenticated, loadVacancies]);

  const applicationsWithVacancy = useMemo(() => {
    const byId = new Map(vacancies.map((v) => [v.id, v]));
    return applications.map((app) => {
      const vacancy = byId.get(app.candidate.vacancyId ?? app.vacancyId);
      return vacancy ? { ...app, vacancyId: vacancy.id, vacancyLabel: vacancy.label, vacancy } : app;
    });
  }, [applications, vacancies]);

  function handleLogin() {
    localStorage.setItem(AUTH_STORAGE_KEY, "true");
    setIsAuthenticated(true);
    setActivePage("search");
  }

  function handleLogout() {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    setIsAuthenticated(false);
  }

  function handleNavigate(page: AppPage) {
    setActivePage(page);
  }

  function handleAddApplication(app: Application) {
    setApplications((prev) => [...prev, app]);
  }

  function handleVacancySaved(saved: Vacancy) {
    setVacancies((prev) =>
      prev.some((v) => v.id === saved.id)
        ? prev.map((v) => (v.id === saved.id ? saved : v))
        : [saved, ...prev]
    );
  }

  async function handleUpdateComment(candidateId: string, description: string) {
    try {
      const updated = await updateCandidateComment(candidateId, description);
      setApplications((prev) =>
        prev.map((app) =>
          app.candidateId === candidateId ? { ...app, candidate: updated } : app
        )
      );
    } catch (err) {
      console.error("Не удалось сохранить комментарий:", err);
      alert("Не получилось сохранить комментарий");
    }
  }

  async function handleUpdateStatus(candidateId: string, status: ApplicationStatus) {
    try {
      const updated = await updateCandidateStatus(candidateId, status);
      setApplications((prev) =>
        prev.map((app) =>
          app.candidateId === candidateId ? { ...app, status, candidate: updated } : app
        )
      );
    } catch (err) {
      console.error("Не удалось сохранить статус:", err);
      alert("Не получилось сохранить статус");
    }
  }

  function handleCandidateUpdated(updated: Application["candidate"]) {
    setApplications((prev) =>
      prev.map((app) => (app.candidateId === updated.id ? { ...app, candidate: updated } : app))
    );
  }

  if (!isAuthenticated) {
    return <LoginForm onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header
        activePage={activePage}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
        vacancies={vacancies}
        byVacancy={responses.byVacancy}
        viewedIds={responses.viewedIds}
        markViewed={responses.markViewed}
        totalNew={responses.totalNew}
        applications={applicationsWithVacancy}
        onAddApplication={handleAddApplication}
      />

      {activePage === "search" && (
        <SearchPage
          applications={applicationsWithVacancy}
          onAddApplication={handleAddApplication}
        />
      )}

      {activePage === "vacancies" && (
        <VacanciesPage
          vacancies={vacancies}
          isLoading={isLoadingVacancies}
          loadError={vacanciesError}
          onReload={loadVacancies}
          onVacancySaved={handleVacancySaved}
          onOpenImport={() => setActivePage("import")}
          responses={responses}
          applications={applicationsWithVacancy}
          onAddApplication={handleAddApplication}
          filters={vacancyFilters}
          onFiltersChange={setVacancyFilters}
        />
      )}

      {activePage === "applications" && (
        <MyApplicationsPage
          applications={applicationsWithVacancy}
          isLoading={isLoadingSaved}
          onUpdateStatus={handleUpdateStatus}
          onUpdateComment={handleUpdateComment}
          onCandidateUpdated={handleCandidateUpdated}
        />
      )}

      {activePage === "import" && (
        <VacancyImportPage
          onBack={() => handleNavigate("vacancies")}
          onImported={loadVacancies}
          onGoToMissingIds={() => {
            setVacancyFilters((f) => ({ ...f, onlyMissingId: true }));
            setActivePage("vacancies");
          }}
        />
      )}
    </div>
  );
}

export default App;