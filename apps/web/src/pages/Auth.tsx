import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Compass, Mail, User as UserIcon, ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useAuth } from "@/context/AuthContext";
import { ApiError } from "@/services/api";

type Step = "email" | "code" | "name";

const RESEND_COOLDOWN_SEC = 60;

export default function Auth() {
  const navigate = useNavigate();
  const { requestOtp, verifyOtp, updateMyProfile } = useAuth();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendIn, setResendIn] = useState(0);

  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = setInterval(() => setResendIn((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(timer);
  }, [resendIn]);

  const sendCode = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmed = email.trim();
    if (!trimmed || !trimmed.includes("@")) {
      toast.error("Введите корректный email");
      return;
    }
    setLoading(true);
    try {
      await requestOtp(trimmed);
      setStep("code");
      setCode("");
      setResendIn(RESEND_COOLDOWN_SEC);
      toast.success("Код отправлен на " + trimmed);
    } catch (err) {
      if (err instanceof ApiError && err.code === "otp_cooldown") {
        // код уже улетел раньше — просто переходим к вводу
        setStep("code");
        setResendIn(Number(err.details?.retry_after_sec ?? RESEND_COOLDOWN_SEC));
      } else {
        toast.error(err instanceof ApiError ? err.message : "Ошибка соединения с сервером");
      }
    } finally {
      setLoading(false);
    }
  };

  const submitCode = async (value?: string) => {
    const finalCode = value ?? code;
    if (finalCode.length !== 6) return;
    setLoading(true);
    try {
      const result = await verifyOtp(email.trim(), finalCode);
      if (result.is_new_user) {
        setStep("name");
      } else {
        toast.success("Вход выполнен");
        navigate("/profile");
      }
    } catch (err) {
      setCode("");
      if (err instanceof ApiError && err.code === "otp_wrong_code") {
        toast.error("Неверный код, попробуйте ещё раз");
      } else if (err instanceof ApiError && err.code === "otp_invalid_or_expired") {
        toast.error("Код истёк или использован. Запросите новый.");
        setStep("email");
      } else {
        toast.error(err instanceof ApiError ? err.message : "Ошибка соединения с сервером");
      }
    } finally {
      setLoading(false);
    }
  };

  const submitName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Как к вам обращаться?");
      return;
    }
    setLoading(true);
    try {
      await updateMyProfile({ first_name: name.trim() });
      toast.success("Добро пожаловать!");
      navigate("/profile");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Не удалось сохранить имя");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-navy px-4">
      <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-teal/30 blur-3xl" />
      <div className="absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-gold/20 blur-3xl" />

      <button
        onClick={() => (step === "code" ? setStep("email") : navigate("/"))}
        className="absolute left-4 top-4 flex items-center gap-1.5 text-sm font-semibold text-white/70 hover:text-white"
      >
        <ArrowLeft size={18} /> {step === "code" ? "Изменить email" : "На главную"}
      </button>

      <div className="relative w-full max-w-md rounded-3xl bg-card p-8 shadow-2xl">
        <div className="mb-6 flex flex-col items-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-teal to-teal-dark shadow-lg">
            <Compass size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-extrabold">Ya<span className="text-teal">Voy</span></h1>
          <p className="mt-1 text-center text-sm text-muted-foreground">
            {step === "email" && "Вход без пароля: пришлём код на email"}
            {step === "code" && (
              <>Введите 6 цифр из письма на <span className="font-semibold text-foreground">{email.trim()}</span></>
            )}
            {step === "name" && "Приятно познакомиться! Как вас зовут?"}
          </p>
        </div>

        {step === "email" && (
          <form onSubmit={sendCode} className="space-y-3">
            <Field icon={Mail} placeholder="Email" type="email" value={email} onChange={setEmail} />
            <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-teal py-3.5 font-bold text-white transition-transform enabled:hover:scale-[1.02] disabled:opacity-60">
              {loading ? <><Loader2 size={18} className="animate-spin" /> Отправляем…</> : "Получить код"}
            </button>
          </form>
        )}

        {step === "code" && (
          <div className="space-y-4">
            <div className="flex justify-center">
              <InputOTP
                maxLength={6}
                value={code}
                onChange={setCode}
                onComplete={(v: string) => void submitCode(v)}
                disabled={loading}
                autoFocus
              >
                <InputOTPGroup>
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <InputOTPSlot key={i} index={i} />
                  ))}
                </InputOTPGroup>
              </InputOTP>
            </div>
            <button
              onClick={() => void submitCode()}
              disabled={loading || code.length !== 6}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-teal py-3.5 font-bold text-white transition-transform enabled:hover:scale-[1.02] disabled:opacity-60"
            >
              {loading ? <><Loader2 size={18} className="animate-spin" /> Проверяем…</> : "Войти"}
            </button>
            <button
              onClick={() => void sendCode()}
              disabled={resendIn > 0 || loading}
              className="w-full text-center text-sm font-semibold text-muted-foreground enabled:text-teal enabled:hover:underline disabled:cursor-default"
            >
              {resendIn > 0 ? `Отправить код ещё раз через ${resendIn} с` : "Отправить код ещё раз"}
            </button>
          </div>
        )}

        {step === "name" && (
          <form onSubmit={submitName} className="space-y-3">
            <Field icon={UserIcon} placeholder="Имя" value={name} onChange={setName} />
            <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-teal py-3.5 font-bold text-white transition-transform enabled:hover:scale-[1.02] disabled:opacity-60">
              {loading ? <><Loader2 size={18} className="animate-spin" /> Сохраняем…</> : "Готово"}
            </button>
          </form>
        )}

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
