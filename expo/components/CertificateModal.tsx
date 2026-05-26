import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
} from "react-native";
import { Gift, X, User, CreditCard } from "lucide-react-native";
import { useTheme } from "@/providers/ThemeProvider";
import { useCertificates } from "@/providers/CertificatesProvider";
import { useLoyalty } from "@/providers/LoyaltyProvider";
import { GiftCertificate } from "@/types/tour";

interface CertificateModalProps {
  visible: boolean;
  onClose: () => void;
}

const nominals = [1000, 2000, 3000, 5000, 10000, 15000];

export default function CertificateModal({ visible, onClose }: CertificateModalProps) {
  const { colors } = useTheme();
  const { purchaseCertificate } = useCertificates();
  const { addPointsFromPurchase } = useLoyalty();
  const [nominal, setNominal] = useState<number>(3000);
  const [toName, setToName] = useState<string>("");
  const [fromName, setFromName] = useState<string>("Иван Петров");
  const [purchasedCert, setPurchasedCert] = useState<GiftCertificate | null>(null);

  const handlePurchase = useCallback(() => {
    if (!toName.trim()) {
      Alert.alert("Ошибка", "Укажите имя получателя");
      return;
    }
    const cert = purchaseCertificate(nominal, fromName.trim() || "Аноним", toName.trim());
    addPointsFromPurchase(nominal);
    setPurchasedCert(cert);
    console.log("[CertificateModal] Purchased:", cert.code);
  }, [nominal, toName, fromName, purchaseCertificate, addPointsFromPurchase]);

  const handleClose = useCallback(() => {
    setPurchasedCert(null);
    setToName("");
    onClose();
  }, [onClose]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.overlay}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={handleClose}>
          <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
            <View style={[styles.content, { backgroundColor: colors.surface }]}>
              <View style={styles.handle}>
                <View style={[styles.handleBar, { backgroundColor: colors.gray300 }]} />
              </View>

              <View style={styles.header}>
                <Text style={[styles.title, { color: colors.text }]}>
                  {purchasedCert ? "Ваш сертификат" : "Подарочный сертификат"}
                </Text>
                <TouchableOpacity onPress={handleClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <X size={22} color={colors.textMuted} />
                </TouchableOpacity>
              </View>

              {purchasedCert ? (
                <ScrollView showsVerticalScrollIndicator={false}>
                  <View style={[styles.voucherCard, { backgroundColor: colors.navy }]}>
                    <View style={styles.voucherHeader}>
                      <Text style={styles.voucherBrand}>{"YAVOY"}</Text>
                      <Gift size={24} color={colors.gold} />
                    </View>
                    <Text style={styles.voucherLabel}>{"ПОДАРОЧНЫЙ СЕРТИФИКАТ"}</Text>
                    <Text style={styles.voucherNominal}>{`${purchasedCert.nominal.toLocaleString()} ${purchasedCert.currency}`}</Text>
                    <View style={styles.voucherDivider} />
                    <View style={styles.voucherRow}>
                      <Text style={styles.voucherFieldLabel}>{"Кому:"}</Text>
                      <Text style={styles.voucherFieldValue}>{purchasedCert.toName}</Text>
                    </View>
                    <View style={styles.voucherRow}>
                      <Text style={styles.voucherFieldLabel}>{"От:"}</Text>
                      <Text style={styles.voucherFieldValue}>{purchasedCert.fromName}</Text>
                    </View>
                    <View style={styles.voucherRow}>
                      <Text style={styles.voucherFieldLabel}>{"Код:"}</Text>
                      <Text style={[styles.voucherFieldValue, styles.voucherCode]}>{purchasedCert.code}</Text>
                    </View>
                    <View style={styles.qrPlaceholder}>
                      <Text style={styles.qrText}>{"QR"}</Text>
                      <Text style={styles.qrSubtext}>{purchasedCert.code}</Text>
                    </View>
                    <Text style={styles.voucherFooter}>{`Дата: ${purchasedCert.purchasedAt}`}</Text>
                  </View>
                </ScrollView>
              ) : (
                <ScrollView showsVerticalScrollIndicator={false}>
                  <Text style={[styles.sectionLabel, { color: colors.text }]}>{"Номинал"}</Text>
                  <View style={styles.nominalsGrid}>
                    {nominals.map((n) => (
                      <TouchableOpacity
                        key={n}
                        style={[
                          styles.nominalChip,
                          { borderColor: colors.border },
                          nominal === n && { backgroundColor: colors.teal, borderColor: colors.teal },
                        ]}
                        onPress={() => setNominal(n)}
                        activeOpacity={0.7}
                      >
                        <Text style={[
                          styles.nominalText,
                          { color: colors.textSecondary },
                          nominal === n && { color: "#FFFFFF" },
                        ]}>{`${n.toLocaleString()} ₽`}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={[styles.sectionLabel, { color: colors.text }]}>{"Кому"}</Text>
                  <View style={[styles.inputWrap, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
                    <User size={16} color={colors.textMuted} />
                    <TextInput
                      style={[styles.input, { color: colors.text }]}
                      placeholder="Имя получателя"
                      placeholderTextColor={colors.textMuted}
                      value={toName}
                      onChangeText={setToName}
                    />
                  </View>

                  <Text style={[styles.sectionLabel, { color: colors.text }]}>{"От кого"}</Text>
                  <View style={[styles.inputWrap, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
                    <User size={16} color={colors.textMuted} />
                    <TextInput
                      style={[styles.input, { color: colors.text }]}
                      placeholder="Ваше имя"
                      placeholderTextColor={colors.textMuted}
                      value={fromName}
                      onChangeText={setFromName}
                    />
                  </View>

                  <TouchableOpacity
                    style={[styles.buyBtn, { backgroundColor: colors.teal }]}
                    onPress={handlePurchase}
                    activeOpacity={0.8}
                  >
                    <CreditCard size={18} color="#FFFFFF" />
                    <Text style={styles.buyBtnText}>{`Купить за ${nominal.toLocaleString()} ₽`}</Text>
                  </TouchableOpacity>
                </ScrollView>
              )}
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.5)" },
  content: { borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: "85%", minHeight: "50%", paddingBottom: 30 },
  handle: { alignItems: "center", paddingTop: 12, paddingBottom: 4 },
  handleBar: { width: 40, height: 4, borderRadius: 2 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 },
  title: { fontSize: 20, fontWeight: "700" as const },
  sectionLabel: { fontSize: 14, fontWeight: "600" as const, paddingHorizontal: 20, marginTop: 16, marginBottom: 8 },
  nominalsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, paddingHorizontal: 20 },
  nominalChip: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 12, borderWidth: 1.5 },
  nominalText: { fontSize: 14, fontWeight: "600" as const },
  inputWrap: { flexDirection: "row", alignItems: "center", gap: 10, marginHorizontal: 20, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 12, borderWidth: 1 },
  input: { flex: 1, fontSize: 15 },
  buyBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginHorizontal: 20, marginTop: 24, paddingVertical: 16, borderRadius: 14 },
  buyBtnText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" as const },
  voucherCard: { marginHorizontal: 20, borderRadius: 20, padding: 24, marginTop: 8 },
  voucherHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  voucherBrand: { fontSize: 24, fontWeight: "900" as const, color: "#FFFFFF", letterSpacing: 6 },
  voucherLabel: { fontSize: 11, color: "rgba(255,255,255,0.6)", letterSpacing: 3, marginBottom: 8 },
  voucherNominal: { fontSize: 36, fontWeight: "800" as const, color: "#E8B931", marginBottom: 16 },
  voucherDivider: { height: 1, backgroundColor: "rgba(255,255,255,0.15)", marginBottom: 16 },
  voucherRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  voucherFieldLabel: { fontSize: 13, color: "rgba(255,255,255,0.5)" },
  voucherFieldValue: { fontSize: 13, color: "#FFFFFF", fontWeight: "600" as const },
  voucherCode: { fontFamily: "monospace", letterSpacing: 1 },
  qrPlaceholder: { alignSelf: "center", width: 120, height: 120, borderRadius: 16, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center", marginVertical: 20 },
  qrText: { fontSize: 28, fontWeight: "800" as const, color: "#1B2838" },
  qrSubtext: { fontSize: 8, color: "#1B2838", fontFamily: "monospace", marginTop: 4 },
  voucherFooter: { fontSize: 11, color: "rgba(255,255,255,0.4)", textAlign: "center" as const },
});
