"use client";

import { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  CircleMarker,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface Entity {
  id: string;
  type: string;
  name?: { value: string };
  location?: { value: { coordinates: [number, number] } };
  // Traffic
  congestionLevel?: { value: string };
  averageVehicleSpeed?: { value: number };
  intensity?: { value: number };
  occupancy?: { value: number };
  // Tramway
  vehicleName?: { value: string };
  serviceStatus?: { value: string };
  currentStop?: { value: string };
  speed?: { value: number };
  passengerCount?: { value: number };
  // Weather
  temperature?: { value: number };
  relativeHumidity?: { value: number };
  windSpeed?: { value: number };
  // Greenspace
  soilMoistureVwc?: { value: number };
  status?: { value: string };
}

interface LiveMapProps {
  trafficData: Entity[];
  tramwayData: Entity[];
  weatherData: Entity[];
  greenspaceData: Entity[];
  layers: {
    traffic: boolean;
    tramway: boolean;
    weather: boolean;
    greenspace: boolean;
  };
}

const IRFANE_CENTER: [number, number] = [34.0, -6.848];

const trafficColors: Record<string, string> = {
  freeFlow: "#10b981",
  moderate: "#eab308",
  heavy: "#f97316",
  congestion: "#ef4444",
};

const greenspaceColors: Record<string, string> = {
  healthy: "#10b981",
  stressed: "#ef4444",
  dry: "#f59e0b",
  waterlogged: "#3b82f6",
};

function createDivIcon(emoji: string, color: string) {
  return L.divIcon({
    html: `<div style="font-size: 24px; filter: drop-shadow(0 2px 4px ${color}80);">${emoji}</div>`,
    className: "custom-div-icon",
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });
}

export default function LiveMap({
  trafficData,
  tramwayData,
  weatherData,
  greenspaceData,
  layers,
}: LiveMapProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="h-full bg-gray-900 rounded-xl flex items-center justify-center">
        <p className="text-gray-400">Chargement de la carte...</p>
      </div>
    );
  }

  return (
    <MapContainer
      center={IRFANE_CENTER}
      zoom={14}
      className="h-full w-full rounded-xl"
      style={{ background: "#1f2937" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://carto.com/">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />

      {/* Traffic Markers */}
      {layers.traffic &&
        trafficData.map((entity) => {
          const coords = entity.location?.value?.coordinates;
          if (!coords) return null;
          const level = entity.congestionLevel?.value || "freeFlow";
          const color = trafficColors[level] || "#10b981";
          return (
            <Marker
              key={entity.id}
              position={[coords[1], coords[0]]}
              icon={createDivIcon("🚗", color)}
            >
              <Popup className="dark-popup">
                <div className="p-2 min-w-48">
                  <h3 className="font-bold text-gray-900 mb-2">
                    {entity.name?.value || entity.id.split(":").pop()}
                  </h3>
                  <div className="space-y-1 text-sm text-gray-700">
                    <p>
                      <span className="font-medium">Niveau:</span>{" "}
                      {level === "freeFlow"
                        ? "Fluide"
                        : level === "moderate"
                          ? "Modere"
                          : level === "heavy"
                            ? "Dense"
                            : "Congestion"}
                    </p>
                    <p>
                      <span className="font-medium">Vitesse:</span>{" "}
                      {entity.averageVehicleSpeed?.value?.toFixed(0) || 0} km/h
                    </p>
                    <p>
                      <span className="font-medium">Intensite:</span>{" "}
                      {entity.intensity?.value || 0} veh/h
                    </p>
                    <p>
                      <span className="font-medium">Occupation:</span>{" "}
                      {entity.occupancy?.value?.toFixed(0) || 0}%
                    </p>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}

      {/* Tramway Markers */}
      {layers.tramway &&
        tramwayData.map((entity) => {
          const coords = entity.location?.value?.coordinates;
          if (!coords) return null;
          return (
            <Marker
              key={entity.id}
              position={[coords[1], coords[0]]}
              icon={createDivIcon("🚃", "#a855f7")}
            >
              <Popup className="dark-popup">
                <div className="p-2 min-w-48">
                  <h3 className="font-bold text-gray-900 mb-2">
                    {entity.vehicleName?.value || entity.id.split(":").pop()}
                  </h3>
                  <div className="space-y-1 text-sm text-gray-700">
                    <p>
                      <span className="font-medium">Statut:</span>{" "}
                      {entity.serviceStatus?.value === "inService"
                        ? "En service"
                        : "Arrete"}
                    </p>
                    <p>
                      <span className="font-medium">Arret actuel:</span>{" "}
                      {entity.currentStop?.value || "En transit"}
                    </p>
                    <p>
                      <span className="font-medium">Vitesse:</span>{" "}
                      {entity.speed?.value?.toFixed(0) || 0} km/h
                    </p>
                    <p>
                      <span className="font-medium">Passagers:</span>{" "}
                      {entity.passengerCount?.value || 0}
                    </p>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}

      {/* Weather Markers */}
      {layers.weather &&
        weatherData.map((entity) => {
          const coords = entity.location?.value?.coordinates;
          if (!coords) return null;
          return (
            <CircleMarker
              key={entity.id}
              center={[coords[1], coords[0]]}
              radius={20}
              pathOptions={{
                color: "#f97316",
                fillColor: "#f97316",
                fillOpacity: 0.3,
                weight: 2,
              }}
            >
              <Popup className="dark-popup">
                <div className="p-2 min-w-48">
                  <h3 className="font-bold text-gray-900 mb-2">
                    {entity.name?.value || entity.id.split(":").pop()}
                  </h3>
                  <div className="space-y-1 text-sm text-gray-700">
                    <p>
                      <span className="font-medium">Temperature:</span>{" "}
                      {entity.temperature?.value?.toFixed(1) || 0}C
                    </p>
                    <p>
                      <span className="font-medium">Humidite:</span>{" "}
                      {entity.relativeHumidity?.value?.toFixed(0) || 0}%
                    </p>
                    <p>
                      <span className="font-medium">Vent:</span>{" "}
                      {entity.windSpeed?.value?.toFixed(1) || 0} m/s
                    </p>
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}

      {/* Greenspace Markers */}
      {layers.greenspace &&
        greenspaceData.map((entity) => {
          const coords = entity.location?.value?.coordinates;
          if (!coords) return null;
          const status = entity.status?.value || "healthy";
          const color = greenspaceColors[status] || "#10b981";
          return (
            <Marker
              key={entity.id}
              position={[coords[1], coords[0]]}
              icon={createDivIcon("🌳", color)}
            >
              <Popup className="dark-popup">
                <div className="p-2 min-w-48">
                  <h3 className="font-bold text-gray-900 mb-2">
                    {entity.name?.value || entity.id.split(":").pop()}
                  </h3>
                  <div className="space-y-1 text-sm text-gray-700">
                    <p>
                      <span className="font-medium">Statut:</span>{" "}
                      {status === "healthy"
                        ? "Sain"
                        : status === "stressed"
                          ? "Stresse"
                          : status === "dry"
                            ? "Sec"
                            : "Sature"}
                    </p>
                    <p>
                      <span className="font-medium">Humidite sol:</span>{" "}
                      {entity.soilMoistureVwc?.value?.toFixed(1) || 0}%
                    </p>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
    </MapContainer>
  );
}
