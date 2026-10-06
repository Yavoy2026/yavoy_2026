import { useCallback, useMemo, useState } from "react";
import createContextHook from "@nkzw/create-context-hook";
import { LOCALE_LABELS } from "@yavoy/i18n";
import { SupportMessage } from "@/types/tour";
import { useI18n } from "@/providers/I18nProvider";

/** Внутренний промпт модели (не UI); язык ответа подставляется из выбранной локали */
const SYSTEM_PROMPT = `Ты дружелюбный AI-консультант мобильного приложения YAVOY — агрегатора туристических экскурсий по России. Помогай подобрать тур, узнавай предпочтения (город, бюджет, интересы, длительность, сезон), рекомендуй экскурсии, объясняй условия бронирования. Отвечай кратко и на языке пользователя: {{language}}. Категории туров YAVOY: городские, познавательные, природные, паломничество, агротуры, фототуры, этнотуры, для родителей, глэмпинг, с животными, мистические, к диким животным, винные, гастро. Если пользователь просит говорить с менеджером, оператором или жалуется на ошибку/проблему, которую ты не можешь решить — ответь коротко: "ESCALATE: <причина>" в самом начале сообщения, затем извинись и сообщи, что переключаешь на менеджера.`;

interface AIChatRequestMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

async function callAI(messages: AIChatRequestMessage[]): Promise<string> {
  const url = "https://toolkit.rork.com/text/llm/";
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages }),
  });
  if (!res.ok) {
    throw new Error(`Support AI request failed: ${res.status}`);
  }
  const data = (await res.json()) as { completion?: string };
  return data.completion ?? "";
}

export const [SupportProvider, useSupport] = createContextHook(() => {
  const { t, locale } = useI18n();
  const [messages, setMessages] = useState<SupportMessage[]>([
    {
      id: "sup-welcome",
      role: "assistant",
      content: t("support.greeting"),
      createdAt: new Date().toISOString(),
    },
  ]);
  const [isThinking, setIsThinking] = useState<boolean>(false);
  const [escalated, setEscalated] = useState<boolean>(false);

  const sendMessage = useCallback(async (text: string) => {
    const userMsg: SupportMessage = {
      id: `m-${Date.now()}`,
      role: "user",
      content: text.trim(),
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);

    if (escalated) {
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            id: `agent-${Date.now()}`,
            role: "agent",
            content: t("support.managerWillReply"),
            createdAt: new Date().toISOString(),
          },
        ]);
      }, 600);
      return;
    }

    setIsThinking(true);
    try {
      const history: AIChatRequestMessage[] = [
        { role: "system", content: SYSTEM_PROMPT.replace("{{language}}", LOCALE_LABELS[locale]) },
        ...messages
          .filter((m) => m.role !== "agent")
          .map<AIChatRequestMessage>((m) => ({ role: m.role === "assistant" ? "assistant" : "user", content: m.content })),
        { role: "user", content: userMsg.content },
      ];
      const completion = await callAI(history);
      const trimmed = completion.trim();
      const shouldEscalate = trimmed.toUpperCase().startsWith("ESCALATE");
      const reply = shouldEscalate
        ? trimmed.replace(/^ESCALATE:?\s*/i, "").trim() ||
          t("support.cannotContinue")
        : trimmed;
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: "assistant",
          content: reply || t("support.clarify"),
          createdAt: new Date().toISOString(),
        },
      ]);
      if (shouldEscalate) {
        setEscalated(true);
        setMessages((prev) => [
          ...prev,
          {
            id: `sys-${Date.now()}`,
            role: "agent",
            content: t("support.escalatedNotice"),
            createdAt: new Date().toISOString(),
          },
        ]);
      }
    } catch (e) {
      console.log("[SupportProvider] AI error", e);
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: "assistant",
          content: t("support.aiUnavailable"),
          createdAt: new Date().toISOString(),
        },
      ]);
      setEscalated(true);
    } finally {
      setIsThinking(false);
    }
  }, [messages, escalated, t, locale]);

  const reset = useCallback(() => {
    setMessages([
      {
        id: "sup-welcome",
        role: "assistant",
        content: t("support.greeting"),
        createdAt: new Date().toISOString(),
      },
    ]);
    setEscalated(false);
  }, [t]);

  return useMemo(() => ({ messages, sendMessage, isThinking, escalated, reset }), [messages, sendMessage, isThinking, escalated, reset]);
});
