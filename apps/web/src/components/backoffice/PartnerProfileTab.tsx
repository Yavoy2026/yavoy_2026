import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BadgeCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { fetchMyPartnerProfile, updateMyPartnerProfile } from "@/services/admin";

/** Вкладка «Профиль организации» для роли partner */
export function PartnerProfileTab() {
  const queryClient = useQueryClient();
  const profile = useQuery({ queryKey: ["my-partner-profile"], queryFn: fetchMyPartnerProfile });
  const [form, setForm] = useState({ org_name: "", description: "", phone: "", inn: "" });

  useEffect(() => {
    if (profile.data) {
      setForm({
        org_name: profile.data.org_name,
        description: profile.data.description,
        phone: profile.data.phone,
        inn: profile.data.inn,
      });
    }
  }, [profile.data]);

  const save = useMutation({
    mutationFn: () => updateMyPartnerProfile(form),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["my-partner-profile"] });
      void queryClient.invalidateQueries({ queryKey: ["catalog"] });
      toast.success("Профиль сохранён (название попадёт в карточки ваших туров)");
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Ошибка сохранения"),
  });

  if (profile.isLoading) return <div className="flex justify-center py-10"><Loader2 size={24} className="animate-spin text-teal" /></div>;
  if (profile.isError) return <div className="rounded-2xl bg-card p-5 text-sm text-muted-foreground ring-1 ring-border/60">Профиль организации не найден — обратитесь к администратору.</div>;

  return (
    <div className="rounded-2xl bg-card p-5 ring-1 ring-border/60">
      <div className="mb-4 flex items-center gap-2">
        <h3 className="font-bold">Профиль организации</h3>
        {profile.data?.verified ? (
          <span className="flex items-center gap-1 rounded-full bg-mint/15 px-2 py-0.5 text-[11px] font-bold text-mint"><BadgeCheck size={12} /> Проверен</span>
        ) : (
          <span className="rounded-full bg-gold/15 px-2 py-0.5 text-[11px] font-bold text-gold">На проверке</span>
        )}
      </div>
      <div className="space-y-3">
        <label className="block text-xs font-semibold text-muted-foreground">Название организации
          <input value={form.org_name} onChange={(e) => setForm((f) => ({ ...f, org_name: e.target.value }))} className="input-base mt-1" />
        </label>
        <label className="block text-xs font-semibold text-muted-foreground">Описание
          <textarea value={form.description} rows={3} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className="input-base mt-1 resize-y" />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-xs font-semibold text-muted-foreground">Телефон
            <input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} className="input-base mt-1" />
          </label>
          <label className="block text-xs font-semibold text-muted-foreground">ИНН
            <input value={form.inn} onChange={(e) => setForm((f) => ({ ...f, inn: e.target.value }))} className="input-base mt-1" />
          </label>
        </div>
        <button
          onClick={() => save.mutate()}
          disabled={save.isPending || !form.org_name.trim()}
          className="flex items-center justify-center gap-2 rounded-2xl bg-teal px-6 py-2.5 font-bold text-white disabled:opacity-60"
        >
          {save.isPending && <Loader2 size={16} className="animate-spin" />} Сохранить
        </button>
      </div>
    </div>
  );
}
