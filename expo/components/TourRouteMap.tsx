import React, { useMemo, useRef, useState, useCallback } from "react";
import { View, Text, StyleSheet, Dimensions, PanResponder, TouchableOpacity } from "react-native";
import { Image } from "expo-image";
import Svg, { Polyline, Circle } from "react-native-svg";
import { Minus, Plus, LocateFixed, MapPin } from "lucide-react-native";
import { useTheme } from "@/providers/ThemeProvider";
import { getCityGeo, CityPoint } from "@/mocks/cityGeo";

const TILE = 256;
const MAP_HEIGHT = 230;
const TILE_URL = "https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png";

interface TourRouteMapProps {
  cityId: string;
  highlight?: { lat: number; lng: number } | null;
}

function lngToWorldX(lng: number, z: number): number {
  return ((lng + 180) / 360) * TILE * Math.pow(2, z);
}

function latToWorldY(lat: number, z: number): number {
  const s = Math.sin((lat * Math.PI) / 180);
  return (0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI)) * TILE * Math.pow(2, z);
}

/**
 * Лёгкая интерактивная карта (пан/зум) на растровых тайлах OSM/Carto:
 * показывает маршрут экскурсии и точки интереса в городе тура.
 */
export default function TourRouteMap({ cityId, highlight }: TourRouteMapProps) {
  const { colors } = useTheme();
  const geo = useMemo(() => getCityGeo(cityId), [cityId]);
  const [zoom, setZoom] = useState<number>(13);
  const [offset, setOffset] = useState<{ dx: number; dy: number }>({ dx: 0, dy: 0 });
  const [selectedPoint, setSelectedPoint] = useState<CityPoint | null>(null);
  const offsetRef = useRef(offset);
  offsetRef.current = offset;
  const offsetBase = useRef(offset);

  const width = useMemo(() => {
    const w = Dimensions.get("window").width - 40;
    return w > 0 ? w : 360;
  }, []);
  const height = MAP_HEIGHT;

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_e, gesture) => Math.abs(gesture.dx) > 2 || Math.abs(gesture.dy) > 2,
        onPanResponderGrant: () => {
          offsetBase.current = offsetRef.current;
        },
        onPanResponderMove: (_e, gesture) => {
          const clamp = (v: number) => Math.max(-3000, Math.min(3000, v));
          setOffset({
            dx: clamp(offsetBase.current.dx + gesture.dx),
            dy: clamp(offsetBase.current.dy + gesture.dy),
          });
        },
      }),
    []
  );

  const recenter = useCallback(() => {
    setOffset({ dx: 0, dy: 0 });
    setSelectedPoint(null);
  }, []);

  const changeZoom = useCallback((delta: number) => {
    setZoom((z) => Math.max(10, Math.min(16, z + delta)));
    setOffset({ dx: 0, dy: 0 });
  }, []);

  const route = useMemo(() => (geo ? [geo.center, ...geo.points.map((p) => ({ lat: p.lat, lng: p.lng }))] : []), [geo]);

  const { tiles, markers, routePixels, highlightPx } = useMemo(() => {
    if (!geo) return { tiles: [] as { key: string; url: string; x: number; y: number }[], markers: [] as { p: CityPoint; x: number; y: number }[], routePixels: "", highlightPx: null as { x: number; y: number } | null };
    const n = Math.pow(2, zoom);
    const centerX = lngToWorldX(geo.center.lng, zoom);
    const centerY = latToWorldY(geo.center.lat, zoom);
    const topLeftX = centerX - width / 2 - offset.dx;
    const topLeftY = centerY - height / 2 - offset.dy;

    const nextTiles: { key: string; url: string; x: number; y: number }[] = [];
    const startX = Math.floor(topLeftX / TILE);
    const endX = Math.floor((topLeftX + width) / TILE);
    const startY = Math.max(0, Math.floor(topLeftY / TILE));
    const endY = Math.min(n - 1, Math.floor((topLeftY + height) / TILE));
    for (let tx = startX; tx <= endX; tx++) {
      const wrapped = ((tx % n) + n) % n;
      for (let ty = startY; ty <= endY; ty++) {
        nextTiles.push({
          key: `${tx}-${ty}`,
          url: TILE_URL.replace("{z}", String(zoom)).replace("{x}", String(wrapped)).replace("{y}", String(ty)),
          x: tx * TILE - topLeftX,
          y: ty * TILE - topLeftY,
        });
      }
    }

    const toPx = (lat: number, lng: number) => ({ x: lngToWorldX(lng, zoom) - topLeftX, y: latToWorldY(lat, zoom) - topLeftY });

    const nextMarkers = geo.points
      .map((p) => ({ p, ...toPx(p.lat, p.lng) }))
      .filter((m) => m.x > -40 && m.x < width + 40 && m.y > -40 && m.y < height + 40);

    const routeStr = route.map((c) => `${toPx(c.lat, c.lng).x},${toPx(c.lat, c.lng).y}`).join(" ");
    const hp = highlight ? toPx(highlight.lat, highlight.lng) : null;
    return { tiles: nextTiles, markers: nextMarkers, routePixels: routeStr, highlightPx: hp };
  }, [geo, zoom, offset, width, height, route]);

  if (!geo) return null;

  return (
    <View style={[styles.mapCard, { backgroundColor: colors.surface, shadowColor: colors.cardShadow }]}>
      <View style={[styles.mapWrap, { width, height }]} {...panResponder.panHandlers}>
        {tiles.map((t) => (
          <Image
            key={t.key}
            source={{ uri: t.url }}
            style={[styles.tile, { left: t.x, top: t.y, width: TILE, height: TILE }]}
            contentFit="fill"
            cachePolicy="memory-disk"
            recyclingKey={t.key}
          />
        ))}

        <Svg width={width} height={height} style={styles.svgLayer} pointerEvents="none">
          <Polyline points={routePixels} fill="none" stroke={colors.teal} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" strokeDasharray="1,8" />
          {highlightPx ? (
            <Circle cx={highlightPx.x} cy={highlightPx.y} r={7} fill={colors.gold} stroke="#FFFFFF" strokeWidth={2} />
          ) : null}
        </Svg>

        {markers.map((m) => (
          <TouchableOpacity
            key={m.p.name}
            style={[styles.marker, { left: m.x - 17, top: m.y - 34 }]}
            onPress={() => setSelectedPoint(selectedPoint?.name === m.p.name ? null : m.p)}
            activeOpacity={0.8}
            testID={`map-pin-${m.p.name}`}
          >
            <Text style={styles.markerEmoji}>{m.p.emoji}</Text>
          </TouchableOpacity>
        ))}

        <View style={styles.mapControls}>
          <TouchableOpacity style={[styles.controlBtn, { backgroundColor: colors.surface }]} onPress={() => changeZoom(1)} activeOpacity={0.7} testID="map-zoom-in">
            <Plus size={16} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.controlBtn, { backgroundColor: colors.surface }]} onPress={() => changeZoom(-1)} activeOpacity={0.7} testID="map-zoom-out">
            <Minus size={16} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.controlBtn, { backgroundColor: colors.surface }]} onPress={recenter} activeOpacity={0.7} testID="map-recenter">
            <LocateFixed size={16} color={colors.teal} />
          </TouchableOpacity>
        </View>

        {selectedPoint ? (
          <View style={[styles.callout, { backgroundColor: colors.surface }]}>
            <MapPin size={13} color={colors.teal} />
            <Text style={[styles.calloutText, { color: colors.text }]} numberOfLines={1}>
              {`${selectedPoint.emoji} ${selectedPoint.name}`}
            </Text>
          </View>
        ) : null}
      </View>
      <Text style={[styles.hint, { color: colors.textMuted }]}>{"Двигайте карту пальцем · точки интереса тапабельны"}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  mapCard: {
    borderRadius: 16,
    padding: 10,
    marginBottom: 12,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 6,
  },
  mapWrap: {
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#EAE6DF",
    alignSelf: "center",
  },
  tile: {
    position: "absolute",
  },
  svgLayer: {
    position: "absolute",
    top: 0,
    left: 0,
  },
  marker: {
    position: "absolute",
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
    borderWidth: 2,
    borderColor: "#0FA3B1",
  },
  markerEmoji: {
    fontSize: 15,
  },
  mapControls: {
    position: "absolute",
    top: 10,
    right: 10,
    gap: 8,
  },
  controlBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  callout: {
    position: "absolute",
    bottom: 10,
    left: 10,
    right: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  calloutText: {
    fontSize: 13,
    fontWeight: "600" as const,
    flex: 1,
  },
  hint: {
    fontSize: 11,
    marginTop: 8,
    marginLeft: 4,
  },
});
