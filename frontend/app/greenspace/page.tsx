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
  ReferenceLine,
} from "recharts";
import {
  TreePine,
  Droplets,
  Thermometer,
  AlertTriangle,
  Sprout,
  Clock,
} from "lucide-react";
import clsx from "clsx";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface GreenspaceEntity {
  id: string;
  name?: { value: string };
  soilMoistureVwc?: { value: number };
  status?: { value: string };
  soilTemperature?: { value: number };
  irrigationActive?: { value: boolean };
  dateObserved?: { value: string };
}

function StatusBadge({ status }: { status: string }) {
  const badgeClass = `badge-${status}`;
  const labels: Record<string, string> = {
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

function getMoistureColor(moisture: number): string {
  if (moisture < 15) return "bg-red-500";
  if (moisture < 22) return "bg-amber-500";
  if (moisture > 75) return "bg-blue-500";
  return "bg-emerald-500";
}

function ZoneCard({
  zone,
  selected,
  onClick,
}: {
  zone: GreenspaceEntity;
  selected: boolean;
  onClick: () => void;
}) {
  const moisture = zone.soilMoistureVwc?.value || 0;

  return (
    <button
      onClick={onClick}
      className={clsx(
        "sensor-card w-full text-left cursor-pointer",
        selected && "border-emerald-500 bg-emerald-500/10"
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-semibold text-white">
          {zone.name?.value || zone.id.split(":").pop()}
        </h3>
        <StatusBadge status={zone.status?.value || "healthy"} />
      </div>

      {/* Moisture Bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-sm mb-1">
          <span className="text-gray-400 flex items-center gap-1">
            <Droplets className="h-4 w-4" />
            Humidite du sol
          </span>
          <span className="text-white">{moisture.toFixed(1)}%</span>
        </div>
        <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
          <div
            className={clsx(
              "h-full rounded-full transition-all",
              getMoistureColor(moisture)
            )}
            style={{ width: `${Math.min(moisture, 100)}%` }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <Thermometer className="h-4 w-4 text-orange-400" />
          <span className="text-gray-400">Sol:</span>
          <span className="text-white">
            {zone.soilTemperature?.value?.toFixed(1) || 0}C
          </span>
        </div>
        {zone.irrigationActive?.value && (
          <div className="flex items-center gap-1 text-blue-400">
            <Sprout className="h-4 w-4" />
            <span className="text-xs">Irrigation active</span>
          </div>
        )}
      </div>
    </button>
  );
}

export default function GreenspacePage() {
  const [selectedZone, setSelectedZone] = useState<string | null>(null);

  const { data: zones } = useSWR<GreenspaceEntity[]>(
    "greenspace-zones",
    () => getEntities("GreenspaceRecord"),
    { refreshInterval: 15000 }
  );

  const { data: moistureHistory } = useSWR(
    selectedZone ? `greenspace-moisture-${selectedZone}` : null,
    () => getTimeSeries(selectedZone!, "soilMoistureVwc", { lastN: 48 }),
    { refreshInterval: 60000 }
  );

  // Set first zone as default
  if (zones && zones.length > 0 && !selectedZone) {
    setSelectedZone(zones[0].id);
  }

  // Check for stressed zones
  const stressedZones = zones?.filter(
    (z) => z.status?.value === "stressed" || z.status?.value === "dry"
  );

  // Chart data
  const chartData = moistureHistory
    ? moistureHistory.map((item: { ts: string; value: number }) => ({
        time: format(new Date(item.ts), "HH:mm", { locale: fr }),
        moisture: item.value,
      }))
    : [];

  const selected = zones?.find((z) => z.id === selectedZone);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <TreePine className="h-8 w-8 text-emerald-400" />
          Espaces Verts
        </h1>
        <p className="text-gray-400 mt-1">
          Surveillance de l&apos;irrigation et de la sante des espaces verts -
          Quartier Irfane
        </p>
      </div>

      {/* Alert Banner */}
      {stressedZones && stressedZones.length > 0 && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-8">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-5 w-5 text-red-400" />
            <h2 className="font-semibold text-red-400">
              Zones necessitant une attention
            </h2>
          </div>
          <p className="text-sm text-gray-300">
            {stressedZones.length} zone(s) en etat de stress hydrique:{" "}
            {stressedZones
              .map((z) => z.name?.value || z.id.split(":").pop())
              .join(", ")}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Zone Cards */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-white">Zones vertes</h2>
          {zones?.map((zone) => (
            <ZoneCard
              key={zone.id}
              zone={zone}
              selected={selectedZone === zone.id}
              onClick={() => setSelectedZone(zone.id)}
            />
          ))}
          {(!zones || zones.length === 0) && (
            <div className="sensor-card">
              <p className="text-gray-500">Chargement des zones...</p>
            </div>
          )}
        </div>

        {/* Chart and Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Chart */}
          <div className="sensor-card">
            <h2 className="text-lg font-semibold text-white mb-4">
              Historique d&apos;humidite
              {selected && (
                <span className="text-gray-400 font-normal ml-2">
                  - {selected.name?.value || selected.id.split(":").pop()}
                </span>
              )}
            </h2>
            {chartData.length > 0 ? (
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
                      stroke="#10b981"
                      fontSize={12}
                      tickLine={false}
                      domain={[0, 100]}
                      label={{
                        value: "% VWC",
                        angle: -90,
                        position: "insideLeft",
                        fill: "#10b981",
                      }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1f2937",
                        border: "1px solid #374151",
                        borderRadius: "0.5rem",
                      }}
                      labelStyle={{ color: "#9ca3af" }}
                      formatter={(value: number) => [
                        `${value.toFixed(1)}%`,
                        "Humidite",
                      ]}
                    />
                    {/* Reference lines */}
                    <ReferenceLine
                      y={15}
                      stroke="#ef4444"
                      strokeDasharray="3 3"
                      label={{
                        value: "Critique (15%)",
                        fill: "#ef4444",
                        fontSize: 10,
                        position: "right",
                      }}
                    />
                    <ReferenceLine
                      y={22}
                      stroke="#f59e0b"
                      strokeDasharray="3 3"
                      label={{
                        value: "Sec (22%)",
                        fill: "#f59e0b",
                        fontSize: 10,
                        position: "right",
                      }}
                    />
                    <ReferenceLine
                      y={75}
                      stroke="#3b82f6"
                      strokeDasharray="3 3"
                      label={{
                        value: "Sature (75%)",
                        fill: "#3b82f6",
                        fontSize: 10,
                        position: "right",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="moisture"
                      name="Humidite (%)"
                      stroke="#10b981"
                      strokeWidth={2}
                      dot={false}
                      fill="url(#moistureGradient)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-80 flex items-center justify-center text-gray-500">
                {selectedZone
                  ? "Chargement des donnees historiques..."
                  : "Selectionnez une zone pour voir l'historique"}
              </div>
            )}
          </div>

          {/* Detail Panel */}
          {selected && (
            <div className="sensor-card">
              <h2 className="text-lg font-semibold text-white mb-4">
                Details de la zone
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <p className="text-sm text-gray-400">Humidite du sol</p>
                  <p className="text-2xl font-bold text-emerald-400">
                    {selected.soilMoistureVwc?.value?.toFixed(1) || 0}
                    <span className="text-sm text-gray-400 ml-1">%</span>
                  </p>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <p className="text-sm text-gray-400">Temperature du sol</p>
                  <p className="text-2xl font-bold text-orange-400">
                    {selected.soilTemperature?.value?.toFixed(1) || 0}
                    <span className="text-sm text-gray-400 ml-1">C</span>
                  </p>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <p className="text-sm text-gray-400">Statut</p>
                  <div className="mt-1">
                    <StatusBadge status={selected.status?.value || "healthy"} />
                  </div>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <p className="text-sm text-gray-400">Irrigation</p>
                  <p
                    className={clsx(
                      "text-lg font-bold",
                      selected.irrigationActive?.value
                        ? "text-blue-400"
                        : "text-gray-500"
                    )}
                  >
                    {selected.irrigationActive?.value ? "Active" : "Inactive"}
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
