import { useEffect, useState } from "react";
import { Header } from "./components/Header";
import { SearchPage } from "./pages/SearchPage";
import { MyApplicationsPage } from "./pages/MyApplicationsPage";
import { VacancyImportPage } from "./pages/VacancyImportPage";
import type { Application, ApplicationStatus } from "./types";
import { getSavedCandidates, updateCandidateComment, updateCandidateStatus } from "./lib/api";

function App() {
  const [activePage, setActivePage] = useState<"search" | "applications" | "vacancies">("search");
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoadingSaved, setIsLoadingSaved] = useState(true);

  // При каждом запуске подтягиваем реально сохранённых кандидатов из БД
  // (GET /api/candidates). status и description теперь реальные поля
  // Candidate, поэтому подтягиваются как есть — статус больше не
  // сбрасывается на "new" при перезагрузке.
  useEffect(() => {
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
  }, []);

  function handleAddApplication(app: Application) {
    setApplications((prev) => [...prev, app]);
  }

  // Комментарий реально сохраняется в БД — это поле description у Candidate,
  // а не у "заявки" (Application-таблицы не существует). Принимаем
  // candidateId, а не id заявки.
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

  // Статус теперь реально сохраняется — PATCH /api/candidates/{id}.
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

  return (
    <div className="min-h-screen bg-slate-50">
      <Header activePage={activePage} onNavigate={setActivePage} />

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