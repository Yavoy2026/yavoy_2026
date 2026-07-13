import { useState, useEffect, useCallback, useMemo } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import createContextHook from "@nkzw/create-context-hook";
import { GiftCertificate } from "@/types/tour";

const CERTIFICATES_KEY = "yavoy_certificates";

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "YV-";
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
    if (i === 3) code += "-";
  }
  return code;
}

export const [CertificatesProvider, useCertificates] = createContextHook(() => {
  const [certificates, setCertificates] = useState<GiftCertificate[]>([]);
  const queryClient = useQueryClient();

  const certQuery = useQuery({
    queryKey: ["certificates"],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(CERTIFICATES_KEY);
      console.log("[CertificatesProvider] Loaded certificates:", stored ? JSON.parse(stored).length : 0);
      return stored ? (JSON.parse(stored) as GiftCertificate[]) : [];
    },
  });

  useEffect(() => {
    if (certQuery.data) {
      setCertificates(certQuery.data);
    }
  }, [certQuery.data]);

  const syncMutation = useMutation({
    mutationFn: async (items: GiftCertificate[]) => {
      await AsyncStorage.setItem(CERTIFICATES_KEY, JSON.stringify(items));
      return items;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["certificates"] });
    },
  });

  const purchaseCertificate = useCallback(
    (nominal: number, fromName: string, toName: string) => {
      const cert: GiftCertificate = {
        id: `cert-${Date.now()}`,
        nominal,
        currency: "₽",
        fromName,
        toName,
        purchasedAt: new Date().toISOString().split("T")[0],
        code: generateCode(),
        isUsed: false,
      };
      const updated = [cert, ...certificates];
      setCertificates(updated);
      syncMutation.mutate(updated);
      console.log("[CertificatesProvider] Purchased certificate:", cert.id);
      return cert;
    },
    [certificates, syncMutation]
  );

  return useMemo(
    () => ({
      certificates,
      purchaseCertificate,
      isLoading: certQuery.isLoading,
    }),
    [certificates, purchaseCertificate, certQuery.isLoading]
  );
});
