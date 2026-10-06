import { useState, useCallback, useMemo } from "react";
import createContextHook from "@nkzw/create-context-hook";

export const [ScrollToTopProvider, useScrollToTop] = createContextHook(() => {
  const [scrollToken, setScrollToken] = useState<number>(0);

  const trigger = useCallback(() => {
    setScrollToken((prev) => prev + 1);
    console.log("[ScrollToTop] Triggered scroll to top");
  }, []);

  return useMemo(
    () => ({
      scrollToken,
      trigger,
    }),
    [scrollToken, trigger]
  );
});
