import { useCallback, useMemo, useState } from "react";
import createContextHook from "@nkzw/create-context-hook";
import { SupportMessage } from "@/types/tour";

const SYSTEM_PROMPT = `Ты дружелюбный AI-консультант мобильного приложения YAVOY — агрегатора туристических экскурсий по России. Помогай подобрать тур, узнавай предпочтения (город, бюджет, интересы, длительность, сезон), рекомендуй экскурсии, объясняй условия бронирования. Отвечай кратко и по-русски. Категории туров YAVOY: городские, познавательные, природные, паломничество, агротуры, фототуры, этнотуры, для родителей, глэмпинг, с животными, мистические, к диким животным, винные, гастро. Если пользователь просит говорить с менеджером, оператором или жалуется на ошибку/проблему, которую ты не можешь решить — ответь коротко: "ESCALATE: <причина>" в самом начале сообщения, затем извинись и сообщи, что переключаешь на менеджера.`;

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
  const [messages, setMessages] = useState<SupportMessage[]>([
    {
      id: "sup-welcome",
      role: "assistant",
      content: "Здравствуйте! Я AI-консультант YAVOY. Помогу подобрать экскурсию — расскажите, куда хотите поехать и какие интересы у вас?",
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
            content: "Менеджер YAVOY ответит вам в ближайшее время. Спасибо за ожидание!",
            createdAt: new Date().toISOString(),
          },
        ]);
      }, 600);
      return;
    }

    setIsThinking(true);
    try {
      const history: AIChatRequestMessage[] = [
        { role: "system", content: SYSTEM_PROMPT },
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
          "Я не могу продолжить диалог, переключаю вас на менеджера."
        : trimmed;
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: "assistant",
          content: reply || "Уточните, пожалуйста, ваш запрос.",
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
            content: "Чат переведён на администратора/менеджера YAVOY. Мы свяжемся с вами в течение нескольких минут.",
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
          content: "Извините, не удалось получить ответ. Переключаю вас на менеджера.",
          createdAt: new Date().toISOString(),
        },
      ]);
      setEscalated(true);
    } finally {
      setIsThinking(false);
    }
  }, [messages, escalated]);

  const reset = useCallback(() => {
    setMessages([
      {
        id: "sup-welcome",
        role: "assistant",
        content: "Здравствуйте! Я AI-консультант YAVOY. Помогу подобрать экскурсию — расскажите, куда хотите поехать и какие интересы у вас?",
        createdAt: new Date().toISOString(),
      },
    ]);
    setEscalated(false);
  }, []);

  return useMemo(() => ({ messages, sendMessage, isThinking, escalated, reset }), [messages, sendMessage, isThinking, escalated, reset]);
});
