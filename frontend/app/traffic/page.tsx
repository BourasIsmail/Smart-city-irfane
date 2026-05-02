"use client";

import { useState } from "react";
import useSWR from "swr";
import { getEntities, getTimeSeries } from "@/lib/fiware";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Car, Activity, Gauge, Clock } from "lucide-react";
import clsx from "clsx";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface TrafficEntity {
  id: string;
  name?: { value: string };
  averageVehicleSpeed?: { value: number };
  intensity?: { value: number };
  occupancy?: { value: number };
  congestionLevel?: { value: string };
  laneDirection?: { value: string };
  dateObserved?: { value: string };
}

function StatusBadge({ status }: { status: string }) {
  const badgeClass = `badge-${status}`;
  const labels: Record<string, string> = {
    freeFlow: "Fluide",
    moderate: "Modere",
    heavy: "Dense",
    congestion: "Congestion",
  };
  return (
    <span className={clsx("px-2 py-1 rounded text-xs font-medium", badgeClass)}>
      {labels[status] || status}
    </span>
  );
}

export default function TrafficPage() {
  const [selectedSensor, setSelectedSensor] = useState<string | null>(null);

  const { data: sensors } = useSWR<TrafficEntity[]>(
    "traffic-sensors",
    () => getEntities("TrafficFlowObserved"),
    { refreshInterval: 5000 }
  );

  const { data: intensityHistory } = useSWR(
    selectedSensor ? `traffic-intensity-${selectedSensor}` : null,
    () => getTimeSeries(selectedSensor!, "intensity", { lastN: 60 }),
    { refreshInterval: 10000 }
  );

  const { data: speedHistory } = useSWR(
    selectedSensor ? `traffic-speed-${selectedSensor}` : null,
    () => getTimeSeries(selectedSensor!, "averageVehicleSpeed", { lastN: 60 }),
    { refreshInterval: 10000 }
  );

  // Combine history data for chart
  const chartData =
    intensityHistory && speedHistory
      ? intensityHistory.map(
          (item: { ts: string; value: number }, index: number) => ({
            time: format(new Date(item.ts), "HH:mm", { locale: fr }),
            intensity: item.value,
            speed: speedHistory[index]?.value || 0,
          })
        )
      : [];

  const selected = sensors?.find((s) => s.id === selectedSensor);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <Car className="h-8 w-8 text-blue-400" />
          Surveillance du Trafic
        </h1>
        <p className="text-gray-400 mt-1">
          Donnees en temps reel des capteurs de trafic - Quartier Irfane
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sensor Cards */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-white">Capteurs</h2>
          {sensors?.map((sensor) => (
            <button
              key={sensor.id}
              onClick={() => setSelectedSensor(sensor.id)}
              className={clsx(
                "sensor-card w-full text-left cursor-pointer",
                selectedSensor === sensor.id && "border-blue-500 bg-blue-500/10"
              )}
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold text-white">
                  {sensor.name?.value || sensor.id.split(":").pop()}
                </h3>
                <StatusBadge
                  status={sensor.congestionLevel?.value || "freeFlow"}
                />
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-500">Vitesse</span>
                  <p className="text-white font-medium">
                    {sensor.averageVehicleSpeed?.value?.toFixed(0) || 0} km/h
                  </p>
                </div>
                <div>
                  <span className="text-gray-500">Intensite</span>
                  <p className="text-white font-medium">
                    {sensor.intensity?.value || 0} veh/h
                  </p>
                </div>
              </div>
            </button>
          ))}
          {(!sensors || sensors.length === 0) && (
            <div className="sensor-card">
              <p className="text-gray-500">Chargement des capteurs...</p>
            </div>
          )}
        </div>

        {/* Chart and Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Chart */}
          <div className="sensor-card">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-400" />
              Historique
              {selected && (
                <span className="text-gray-400 font-normal">
                  - {selected.name?.value || selected.id.split(":").pop()}
                </span>
              )}
            </h2>
            {selectedSensor && chartData.length > 0 ? (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis
                      dataKey="time"
                      stroke="#9ca3af"
                      fontSize={12}
                      tickLine={false}
                    />
                    <YAxis
                      yAxisId="left"
                      stroke="#3b82f6"
                      fontSize={12}
                      tickLine={false}
                      label={{
                        value: "veh/h",
                        angle: -90,
                        position: "insideLeft",
                        fill: "#3b82f6",
                      }}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      stroke="#a855f7"
                      fontSize={12}
                      tickLine={false}
                      label={{
                        value: "km/h",
                        angle: 90,
                        position: "insideRight",
                        fill: "#a855f7",
                      }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1f2937",
                        border: "1px solid #374151",
                        borderRadius: "0.5rem",
                      }}
                      labelStyle={{ color: "#9ca3af" }}
                    />
                    <Legend />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="intensity"
                      name="Intensite (veh/h)"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="speed"
                      name="Vitesse (km/h)"
                      stroke="#a855f7"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-80 flex items-center justify-center text-gray-500">
                {selectedSensor
                  ? "Chargement des donnees historiques..."
                  : "Selectionnez un capteur pour voir l'historique"}
              </div>
            )}
          </div>

          {/* Detail Panel */}
          {selected && (
            <div className="sensor-card">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Gauge className="h-5 w-5 text-blue-400" />
                Details du capteur
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <p className="text-sm text-gray-400">Vitesse moyenne</p>
                  <p className="text-2xl font-bold text-white">
                    {selected.averageVehicleSpeed?.value?.toFixed(0) || 0}
                    <span className="text-sm text-gray-400 ml-1">km/h</span>
                  </p>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <p className="text-sm text-gray-400">Intensite</p>
                  <p className="text-2xl font-bold text-white">
                    {selected.intensity?.value || 0}
                    <span className="text-sm text-gray-400 ml-1">veh/h</span>
                  </p>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <p className="text-sm text-gray-400">Occupation</p>
                  <p className="text-2xl font-bold text-white">
                    {selected.occupancy?.value?.toFixed(0) || 0}
                    <span className="text-sm text-gray-400 ml-1">%</span>
                  </p>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <p className="text-sm text-gray-400">Direction</p>
                  <p className="text-lg font-bold text-white">
                    {selected.laneDirection?.value || "N/A"}
                  </p>
                </div>
              </div>
              {selected.dateObserved?.value && (
                <div className="mt-4 flex items-center gap-2 text-sm text-gray-400">
                  <Clock className="h-4 w-4" />
                  Derniere mise a jour:{" "}
                  {format(
                    new Date(selected.dateObserved.value),
                    "dd MMM yyyy HH:mm:ss",
                    { locale: fr }
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
