import { useState } from "react";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";

interface LoginFormProps {
  onLogin: () => void;
}

/**
 * ВРЕМЕННО: реальной проверки логина/пароля пока нет — принимается что
 * угодно (в т.ч. пустые поля). Когда появится настоящая авторизация
 * (например, через Clerk, который уже используется на бэке) — здесь нужно
 * заменить handleSubmit на реальный запрос и обрабатывать ошибки входа.
 */
export function LoginForm({ onLogin }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onLogin();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-2">
          <CardTitle className="text-center text-3xl text-blue-600">
            ПЕРСОНА.ГАЗ
          </CardTitle>
          <CardDescription className="text-center">
            Система подбора персонала
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Электронная почта</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-2 size-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="test@mail.ru"
                  className="pl-10"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Пароль</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-2 size-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="123456"
                  className="pl-10 pr-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-muted-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full">
              Войти в систему
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}