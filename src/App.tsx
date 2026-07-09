import { useState } from "react";
import { Header } from "./components/Header";
import { SearchPage } from "./pages/SearchPage";
import { MyApplicationsPage } from "./pages/MyApplicationsPage";
import type { Application, ApplicationStatus } from "./types";
import { mockApplications } from "./data/mockData";

function App() {
  const [activePage, setActivePage] = useState<"search" | "applications">("search");
  const [applications, setApplications] = useState<Application[]>(mockApplications);

  function handleAddApplication(app: Application) {
    setApplications((prev) => [...prev, app]);
  }

  function handleUpdateComment(id: string, comment: string) {
    setApplications((prev) =>
      prev.map((app) => (app.id === id ? { ...app, comment } : app))
    );
  }

  function handleUpdateStatus(id: string, status: ApplicationStatus) {
    setApplications((prev) =>
      prev.map((app) => (app.id === id ? { ...app, status } : app))
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
          onUpdateStatus={handleUpdateStatus}
          onUpdateComment={handleUpdateComment}
        />
      )}
    </div>
  );
}

export default App;