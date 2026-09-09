import { findPlaceholders, LEGAL_DOCS, type LegalDocId } from "@yavoy/legal";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Layout } from "@/components/Layout";
import { useI18n } from "@/i18n/I18nProvider";

/**
 * Публичная оферта и политика конфиденциальности (YAV-21, требование банка п.8).
 * Текст — из общего пакета @yavoy/legal, чтобы не разъезжался с приложением.
 */
export default function Legal({ doc: docId }: { doc: LegalDocId }) {
  const navigate = useNavigate();
  const { t, formatDate } = useI18n();
  const doc = LEGAL_DOCS[docId];
  const placeholders = findPlaceholders(doc);
  // Дата может быть плейсхолдером — тогда показываем её как есть
  const revision = doc.updatedAt.startsWith("‹") ? doc.updatedAt : formatDate(doc.updatedAt);

  return (
    <Layout>
      <button
        onClick={() => navigate(-1)}
        className="mb-4 flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft size={18} /> {t("common.back")}
      </button>

      <article className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-extrabold">{doc.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("legal.updatedAt", { date: revision })}</p>

        {placeholders.length > 0 && (
          <div className="mt-4 flex gap-2 rounded-2xl bg-gold/10 p-4 text-sm text-gold ring-1 ring-gold/30">
            <AlertTriangle size={18} className="mt-0.5 shrink-0" />
            <span>{t("legal.draftNotice")}</span>
          </div>
        )}

        {doc.intro.map((p, i) => (
          <p key={i} className="mt-4 leading-relaxed text-muted-foreground">
            {p}
          </p>
        ))}

        {doc.sections.map((section) => (
          <section key={section.no} className="mt-8">
            <h2 className="mb-2 text-lg font-bold">
              {section.no}. {section.title}
            </h2>
            <div className="space-y-2">
              {section.body.map((line, i) => (
                <p key={i} className="leading-relaxed text-muted-foreground">
                  {line}
                </p>
              ))}
            </div>
          </section>
        ))}
      </article>
    </Layout>
  );
}
