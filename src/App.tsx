import { useEffect, useState } from "react";
import { Header } from "./components/Header";
import { LoginForm } from "./components/LoginForm";
import { SearchPage } from "./pages/SearchPage";
import { MyApplicationsPage } from "./pages/MyApplicationsPage";
import { VacancyImportPage } from "./pages/VacancyImportPage";
import type { Application, ApplicationStatus } from "./types";
import { getSavedCandidates, updateCandidateComment, updateCandidateStatus } from "./lib/api";

const AUTH_STORAGE_KEY = "persona-gaz-mock-auth";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => localStorage.getItem(AUTH_STORAGE_KEY) === "true"
  );
  const [activePage, setActivePage] = useState<"search" | "applications" | "vacancies">("search");
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoadingSaved, setIsLoadingSaved] = useState(true);


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
          vacancyId: "unknown",
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

  function handleLogin() {
    localStorage.setItem(AUTH_STORAGE_KEY, "true");
    setIsAuthenticated(true);
    setActivePage("search"); 
  }

  function handleLogout() {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    setIsAuthenticated(false);
  }

  function handleAddApplication(app: Application) {
    setApplications((prev) => [...prev, app]);
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
      <Header activePage={activePage} onNavigate={setActivePage} onLogout={handleLogout} />

      {activePage === "search" && (
        <SearchPage
          applications={applications}
          onAddApplication={handleAddApplication}
        />
      )}

      {activePage === "applications" && (
        <MyApplicationsPage
          applications={applications}
          isLoading={isLoadingSaved}
          onUpdateStatus={handleUpdateStatus}
          onUpdateComment={handleUpdateComment}
          onCandidateUpdated={handleCandidateUpdated}
        />
      )}

      {activePage === "vacancies" && <VacancyImportPage />}
    </div>
  );
}

export default App;