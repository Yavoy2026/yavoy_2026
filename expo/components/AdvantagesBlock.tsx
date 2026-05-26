import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Shield, Headphones, CreditCard, Globe, Award, Zap } from "lucide-react-native";
import { useTheme } from "@/providers/ThemeProvider";

const advantages = [
  {
    icon: Shield,
    title: "Проверенные организаторы",
    desc: "Все партнёры проходят верификацию и имеют лицензии",
    color: "#3B82F6",
  },
  {
    icon: Zap,
    title: "Мгновенное подтверждение",
    desc: "Бронируйте и получайте билеты за секунды",
    color: "#F59E0B",
  },
  {
    icon: CreditCard,
    title: "Безопасная оплата",
    desc: "Гарантия возврата средств и защита транзакций",
    color: "#10B981",
  },
  {
    icon: Headphones,
    title: "Поддержка 24/7",
    desc: "Круглосуточная помощь на маршруте и при бронировании",
    color: "#8B5CF6",
  },
  {
    icon: Globe,
    title: "1000+ экскурсий",
    desc: "По всей России от проверенных гидов",
    color: "#0FA3B1",
  },
  {
    icon: Award,
    title: "Лучшие цены",
    desc: "Гарантия лучшей цены или вернём разницу",
    color: "#EC4899",
  },
];

export default React.memo(function AdvantagesBlock() {
  const { colors, isDark } = useTheme();
  return (
    <View style={[styles.container, { backgroundColor: isDark ? colors.surfaceSecondary : colors.headerBg }]}>
      <View style={styles.header}>
        <Text style={styles.title}>{"Почему YaVoy?"}</Text>
        <Text style={[styles.subtitle, { color: isDark ? colors.textMuted : "#B0B8C4" }]}>{"Мы объединяем лучших организаторов туров по России"}</Text>
      </View>
      <View style={styles.grid}>
        {advantages.map((item, index) => {
          const IconComp = item.icon;
          return (
            <View key={index} style={[styles.card, { backgroundColor: isDark ? colors.surface : "#243447" }]}>
              <View style={[styles.iconContainer, { backgroundColor: item.color + "20" }]}>
                <IconComp size={22} color={item.color} />
              </View>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={[styles.cardDesc, { color: isDark ? colors.textMuted : "#B0B8C4" }]}>{item.desc}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
    marginHorizontal: 16,
    marginBottom: 32,
    padding: 20,
    borderRadius: 22,
  },
  header: {
    marginBottom: 20,
    alignItems: "center" as const,
  },
  title: {
    fontSize: 22,
    fontWeight: "800" as const,
    color: "#FFFFFF",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: "center" as const,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  card: {
    width: "47%",
    borderRadius: 14,
    padding: 14,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: "700" as const,
    color: "#FFFFFF",
    marginBottom: 3,
  },
  cardDesc: {
    fontSize: 11,
    lineHeight: 15,
  },
});
