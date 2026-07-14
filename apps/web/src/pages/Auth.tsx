import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Compass, Mail, Lock, User as UserIcon, ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { ApiError } from "@/services/api";

export default function Auth() {
  const navigate = useNavigate();
  const { login, register } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim() || (mode === "signup" && !name.trim())) {
      toast.error("Заполните все поля");
      return;
    }
    setLoading(true);
    try {
      if (mode === "signin") {
        await login(email.trim(), password);
        toast.success("Вход выполнен");
      } else {
        await register(email.trim(), password, name.trim());
        toast.success("Аккаунт создан");
      }
      navigate("/profile");
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Ошибка соединения с сервером";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-navy px-4">
      <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-teal/30 blur-3xl" />
      <div className="absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-gold/20 blur-3xl" />

      <button onClick={() => navigate("/")} className="absolute left-4 top-4 flex items-center gap-1.5 text-sm font-semibold text-white/70 hover:text-white">
        <ArrowLeft size={18} /> На главную
      </button>

      <div className="relative w-full max-w-md rounded-3xl bg-card p-8 shadow-2xl">
        <div className="mb-6 flex flex-col items-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-teal to-teal-dark shadow-lg">
            <Compass size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-extrabold">Ya<span className="text-teal">Voy</span></h1>
          <p className="mt-1 text-sm text-muted-foreground">{mode === "signin" ? "Войдите в аккаунт" : "Создайте аккаунт"}</p>
        </div>

        <div className="mb-6 flex rounded-2xl bg-secondary p-1">
          <button onClick={() => setMode("signin")} className={`flex-1 rounded-xl py-2 text-sm font-semibold transition-colors ${mode === "signin" ? "bg-card text-foreground shadow" : "text-muted-foreground"}`}>Вход</button>
          <button onClick={() => setMode("signup")} className={`flex-1 rounded-xl py-2 text-sm font-semibold transition-colors ${mode === "signup" ? "bg-card text-foreground shadow" : "text-muted-foreground"}`}>Регистрация</button>
        </div>

        <form onSubmit={submit} className="space-y-3">
          {mode === "signup" && (
            <Field icon={UserIcon} placeholder="Имя" value={name} onChange={setName} />
          )}
          <Field icon={Mail} placeholder="Email" type="email" value={email} onChange={setEmail} />
          <Field icon={Lock} placeholder="Пароль" type="password" value={password} onChange={setPassword} />
          <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-teal py-3.5 font-bold text-white transition-transform enabled:hover:scale-[1.02] disabled:opacity-60">
            {loading ? <><Loader2 size={18} className="animate-spin" /> Загрузка…</> : (mode === "signin" ? "Войти" : "Зарегистрироваться")}
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          Продолжая, вы соглашаетесь с условиями использования и политикой конфиденциальности
        </p>
      </div>
    </div>
  );
}

function Field({
  icon: Icon, placeholder, value, onChange, type = "text",
}: {
  icon: React.ComponentType<{ size: number; className?: string }>;
  placeholder: string; value: string; onChange: (v: string) => void; type?: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-2xl border border-border bg-background px-4 focus-within:border-teal">
      <Icon size={18} className="text-muted-foreground" />
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
      />
    </div>
  );
}
