import { LogOut, Search, FileText, Upload } from "lucide-react"; // Добавили Upload
import { Button } from "./ui/button";

interface HeaderProps {
  // Добавляем "vacancies" в союзный тип
  activePage: "search" | "applications" | "vacancies"; 
  onNavigate: (page: "search" | "applications" | "vacancies") => void;
}

export function Header({ activePage, onNavigate }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 flex items-center justify-between border-b bg-white/80 px-8 py-3 backdrop-blur">
      <div className="text-lg font-extrabold tracking-tight text-blue-600">
        ПЕРСОНА.ГАЗ
      </div>

      <nav className="flex flex-1 items-center gap-1 px-8">
        <Button
          variant={activePage === "search" ? "secondary" : "ghost"}
          className={
            activePage === "search"
              ? "bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700"
              : "text-muted-foreground"
          }
          onClick={() => onNavigate("search")}
        >
          <Search className="size-4" />
          Поиск
        </Button>
        <Button
          variant={activePage === "applications" ? "secondary" : "ghost"}
          className={
            activePage === "applications"
              ? "bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700"
              : "text-muted-foreground"
          }
          onClick={() => onNavigate("applications")}
        >
          <FileText className="size-4" />
          Мои заявки
        </Button>

        {/* НОВАЯ КНОПКА ДЛЯ ВАКАНСИЙ */}
        <Button
          variant={activePage === "vacancies" ? "secondary" : "ghost"}
          className={
            activePage === "vacancies"
              ? "bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700"
              : "text-muted-foreground"
          }
          onClick={() => onNavigate("vacancies")}
        >
          <Upload className="size-4" />
          Импорт вакансий
        </Button>
      </nav>

      <Button variant="ghost" className="text-muted-foreground">
        <LogOut className="size-4" />
        Выйти
      </Button>
    </header>
  );
}