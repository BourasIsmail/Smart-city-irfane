"use client";

import useSWR from "swr";
import { getEntities } from "@/lib/fiware";
import {
  Car,
  Train,
  Thermometer,
  TreePine,
  AlertTriangle,
  Activity,
  Users,
  Droplets,
} from "lucide-react";
import clsx from "clsx";

interface TrafficEntity {
  id: string;
  name?: { value: string };
  averageVehicleSpeed?: { value: number };
  intensity?: { value: number };
  occupancy?: { value: number };
  congestionLevel?: { value: string };
}

interface TramwayEntity {
  id: string;
  vehicleName?: { value: string };
  serviceStatus?: { value: string };
  currentStop?: { value: string };
  nextStop?: { value: string };
  speed?: { value: number };
  passengerCount?: { value: number };
}

interface WeatherEntity {
  id: string;
  name?: { value: string };
  temperature?: { value: number };
  relativeHumidity?: { value: number };
  windSpeed?: { value: number };
}

interface GreenspaceEntity {
  id: string;
  name?: { value: string };
  soilMoistureVwc?: { value: number };
  status?: { value: string };
  soilTemperature?: { value: number };
  irrigationActive?: { value: boolean };
}

function KPICard({
  icon: Icon,
  label,
  value,
  unit,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  unit?: string;
  color: string;
}) {
  return (
    <div className="sensor-card">
      <div className="flex items-center gap-4">
        <div className={clsx("p-3 rounded-xl", color)}>
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <p className="text-sm text-gray-400">{label}</p>
          <p className="text-2xl font-bold text-white">
            {value}
            {unit && <span className="text-lg text-gray-400 ml-1">{unit}</span>}
          </p>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const badgeClass = `badge-${status}`;
  const labels: Record<string, string> = {
    freeFlow: "Fluide",
    moderate: "Modere",
    heavy: "Dense",
    congestion: "Congestion",
    inService: "En service",
    stopped: "Arrete",
    outOfService: "Hors service",
    healthy: "Sain",
    stressed: "Stresse",
    dry: "Sec",
    waterlogged: "Sature",
  };
  return (
    <span className={clsx("px-2 py-1 rounded text-xs font-medium", badgeClass)}>
      {labels[status] || status}
    </span>
  );
}

export default function OverviewPage() {
  const { data: trafficData } = useSWR<TrafficEntity[]>(
    "traffic",
    () => getEntities("TrafficFlowObserved"),
    { refreshInterval: 5000 }
  );

  const { data: tramwayData } = useSWR<TramwayEntity[]>(
    "tramway",
    () => getEntities("Vehicle"),
    { refreshInterval: 3000 }
  );

  const { data: weatherData } = useSWR<WeatherEntity[]>(
    "weather",
    () => getEntities("WeatherObserved"),
    { refreshInterval: 10000 }
  );

  const { data: greenspaceData } = useSWR<GreenspaceEntity[]>(
    "greenspace",
    () => getEntities("GreenspaceRecord"),
    { refreshInterval: 15000 }
  );

  // Calculate KPIs
  const avgSpeed =
    trafficData && trafficData.length > 0
      ? Math.round(
          trafficData.reduce(
            (sum, t) => sum + (t.averageVehicleSpeed?.value || 0),
            0
          ) / trafficData.length
        )
      : 0;

  const tramsRunning = tramwayData
    ? tramwayData.filter((t) => t.serviceStatus?.value === "inService").length
    : 0;
  const totalTrams = tramwayData?.length || 0;

  const avgTemp =
    weatherData && weatherData.length > 0
      ? Math.round(
          (weatherData.reduce(
            (sum, w) => sum + (w.temperature?.value || 0),
            0
          ) /
            weatherData.length) *
            10
        ) / 10
      : 0;

  const stressedZones = greenspaceData
    ? greenspaceData.filter(
        (g) => g.status?.value === "stressed" || g.status?.value === "dry"
      ).length
    : 0;

  const congestedAxes = trafficData
    ? trafficData.filter(
        (t) =>
          t.congestionLevel?.value === "congestion" ||
          t.congestionLevel?.value === "heavy"
      )
    : [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Vue d&apos;ensemble</h1>
        <p className="text-gray-400 mt-1">
          Surveillance en temps reel du quartier Irfane, Rabat
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KPICard
          icon={Car}
          label="Vitesse moyenne"
          value={avgSpeed}
          unit="km/h"
          color="bg-blue-500/20 text-blue-400"
        />
        <KPICard
          icon={Train}
          label="Tramways en service"
          value={`${tramsRunning}/${totalTrams}`}
          color="bg-purple-500/20 text-purple-400"
        />
        <KPICard
          icon={Thermometer}
          label="Temperature moyenne"
          value={avgTemp}
          unit="C"
          color="bg-orange-500/20 text-orange-400"
        />
        <KPICard
          icon={TreePine}
          label="Zones stressees"
          value={stressedZones}
          unit={`/${greenspaceData?.length || 0}`}
          color="bg-emerald-500/20 text-emerald-400"
        />
      </div>

      {/* Alert Summary */}
      {(congestedAxes.length > 0 || stressedZones > 0) && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-8">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-5 w-5 text-amber-400" />
            <h2 className="font-semibold text-amber-400">Alertes actives</h2>
          </div>
          <div className="space-y-2 text-sm">
            {congestedAxes.length > 0 && (
              <p className="text-gray-300">
                <span className="text-amber-400 font-medium">Trafic:</span>{" "}
                {congestedAxes
                  .map((t) => t.name?.value || t.id.split(":").pop())
                  .join(", ")}{" "}
                - congestion detectee
              </p>
            )}
            {stressedZones > 0 && (
              <p className="text-gray-300">
                <span className="text-amber-400 font-medium">
                  Espaces verts:
                </span>{" "}
                {stressedZones} zone(s) necessitant une irrigation
              </p>
            )}
          </div>
        </div>
      )}

      {/* Status Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Traffic Status */}
        <div className="sensor-card">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="h-5 w-5 text-blue-400" />
            <h2 className="font-semibold text-white">Etat du trafic</h2>
          </div>
          <div className="space-y-3">
            {trafficData?.map((sensor) => (
              <div
                key={sensor.id}
                className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0"
              >
                <span className="text-sm text-gray-300">
                  {sensor.name?.value || sensor.id.split(":").pop()}
                </span>
                <StatusBadge status={sensor.congestionLevel?.value || "freeFlow"} />
              </div>
            ))}
            {(!trafficData || trafficData.length === 0) && (
              <p className="text-sm text-gray-500">Chargement...</p>
            )}
          </div>
        </div>

        {/* Tramway Status */}
        <div className="sensor-card">
          <div className="flex items-center gap-2 mb-4">
            <Users className="h-5 w-5 text-purple-400" />
            <h2 className="font-semibold text-white">Etat des tramways</h2>
          </div>
          <div className="space-y-3">
            {tramwayData?.map((tram) => (
              <div
                key={tram.id}
                className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0"
              >
                <div>
                  <span className="text-sm text-gray-300">
                    {tram.vehicleName?.value || tram.id.split(":").pop()}
                  </span>
                  <p className="text-xs text-gray-500">
                    {tram.currentStop?.value || "En transit"}
                  </p>
                </div>
                <StatusBadge status={tram.serviceStatus?.value || "inService"} />
              </div>
            ))}
            {(!tramwayData || tramwayData.length === 0) && (
              <p className="text-sm text-gray-500">Chargement...</p>
            )}
          </div>
        </div>

        {/* Greenspace Status */}
        <div className="sensor-card">
          <div className="flex items-center gap-2 mb-4">
            <Droplets className="h-5 w-5 text-emerald-400" />
            <h2 className="font-semibold text-white">Espaces verts</h2>
          </div>
          <div className="space-y-3">
            {greenspaceData?.map((zone) => (
              <div
                key={zone.id}
                className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0"
              >
                <div>
                  <span className="text-sm text-gray-300">
                    {zone.name?.value || zone.id.split(":").pop()}
                  </span>
                  <p className="text-xs text-gray-500">
                    Humidite: {zone.soilMoistureVwc?.value?.toFixed(1) || 0}%
                  </p>
                </div>
                <StatusBadge status={zone.status?.value || "healthy"} />
              </div>
            ))}
            {(!greenspaceData || greenspaceData.length === 0) && (
              <p className="text-sm text-gray-500">Chargement...</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
