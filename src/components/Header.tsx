import { LogOut, Search, FileText, Briefcase } from "lucide-react";
import { Button } from "./ui/button";
import { NotificationsBell } from "./NotificationsBell"; 
import type { Application, Vacancy } from "../types";
import type { ResponsesState } from "../hooks/useVacancyResponses";

export type AppPage = "search" | "vacancies" | "applications" | "import";

interface HeaderProps {
  activePage: AppPage;
  onNavigate: (page: AppPage) => void;
  onLogout: () => void;
  vacancies: Vacancy[];
  byVacancy: Record<string, ResponsesState>;
  viewedIds: Set<string>;
  markViewed: (responseId: string) => void;
  totalNew: number;
  applications: Application[];
  onAddApplication: (app: Application) => void;
}

const activeClass = "bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700";

export function Header({
  activePage,
  onNavigate,
  onLogout,
  vacancies,
  byVacancy,
  viewedIds,
  markViewed,
  totalNew,
  applications,
  onAddApplication,
}: HeaderProps) {
  const isVacancies = activePage === "vacancies" || activePage === "import";

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between border-b bg-white/80 px-8 py-3 backdrop-blur">
      <div className="text-lg font-extrabold tracking-tight text-blue-600">
        ПЕРСОНА.ГАЗ
      </div>

      <nav className="flex flex-1 items-center gap-1 px-8">
        <Button
          variant={activePage === "search" ? "secondary" : "ghost"}
          className={activePage === "search" ? activeClass : "text-muted-foreground"}
          onClick={() => onNavigate("search")}
        >
          <Search className="size-4" />
          Поиск
        </Button>

        <Button
          variant={isVacancies ? "secondary" : "ghost"}
          className={isVacancies ? activeClass : "text-muted-foreground"}
          onClick={() => onNavigate("vacancies")}
        >
          <Briefcase className="size-4" />
          Вакансии
          {totalNew > 0 && (
            <span
              className="ml-1 rounded-full bg-blue-600 px-1.5 text-[11px] font-medium leading-[18px] text-white"
              aria-label={`Новых откликов: ${totalNew}`}
            >
              {totalNew > 99 ? "99+" : totalNew}
            </span>
          )}
        </Button>

        <Button
          variant={activePage === "applications" ? "secondary" : "ghost"}
          className={activePage === "applications" ? activeClass : "text-muted-foreground"}
          onClick={() => onNavigate("applications")}
        >
          <FileText className="size-4" />
          Мои заявки
        </Button>
      </nav>

      <NotificationsBell
        vacancies={vacancies}
        byVacancy={byVacancy}
        viewedIds={viewedIds}
        markViewed={markViewed}
        totalNew={totalNew}
        applications={applications}
        onAddApplication={onAddApplication}
      />

      <Button variant="ghost" className="text-muted-foreground" onClick={onLogout}>
        <LogOut className="size-4" />
        Выйти
      </Button>
    </header>
  );
}