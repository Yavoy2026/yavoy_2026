import { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { getCityGeo } from "@/data/cityGeo";

interface TourMapProps {
  cityId: string;
  highlight?: { lat: number; lng: number } | null;
}

function pinIcon(emoji: string, active: boolean): L.DivIcon {
  return L.divIcon({
    html: `<div class="yavay-map-pin${active ? " yavay-map-pin--active" : ""}">${emoji}</div>`,
    className: "yavay-map-pin-wrap",
    iconSize: [34, 34],
    iconAnchor: [17, 34],
    popupAnchor: [0, -30],
  });
}

function FitBounds({ coords }: { coords: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (coords.length > 1) {
      map.fitBounds(L.latLngBounds(coords), { padding: [40, 40] });
    }
  }, [coords, map]);
  return null;
}

/** Интерактивная карта маршрута и точек интереса города тура (Leaflet + OpenStreetMap). */
export function TourMap({ cityId, highlight }: TourMapProps) {
  const geo = useMemo(() => getCityGeo(cityId), [cityId]);

  if (!geo) return null;

  const routeCoords: [number, number][] = [
    [geo.center.lat, geo.center.lng],
    ...geo.points.map((p) => [p.lat, p.lng] as [number, number]),
  ];

  return (
    <div className="overflow-hidden rounded-2xl ring-1 ring-border/60">
      <MapContainer
        center={[geo.center.lat, geo.center.lng]}
        zoom={13}
        scrollWheelZoom={false}
        style={{ height: 280, width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
          url="https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        <FitBounds coords={routeCoords} />
        <Polyline positions={routeCoords} pathOptions={{ color: "#0FA3B1", weight: 3, dashArray: "1 8", lineCap: "round" }} />
        {geo.points.map((p) => (
          <Marker key={p.name} position={[p.lat, p.lng]} icon={pinIcon(p.emoji, false)}>
            <Popup>
              <span className="text-sm font-semibold">{p.name}</span>
            </Popup>
          </Marker>
        ))}
        {highlight ? (
          <Marker position={[highlight.lat, highlight.lng]} icon={pinIcon("📍", true)}>
            <Popup>
              <span className="text-sm font-semibold">Место встречи</span>
            </Popup>
          </Marker>
        ) : null}
      </MapContainer>
    </div>
  );
}
