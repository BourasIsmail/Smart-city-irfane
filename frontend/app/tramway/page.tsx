"use client";

import useSWR from "swr";
import { getEntities } from "@/lib/fiware";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from "recharts";
import { Train, Users, MapPin, Gauge } from "lucide-react";
import clsx from "clsx";

interface TramwayEntity {
  id: string;
  vehicleName?: { value: string };
  vehiclePlateIdentifier?: { value: string };
  category?: { value: string[] };
  serviceStatus?: { value: string };
  currentStop?: { value: string };
  nextStop?: { value: string };
  speed?: { value: number };
  passengerCount?: { value: number };
  vehicleCapacity?: { value: number };
}

function StatusBadge({ status }: { status: string }) {
  const isInService = status === "inService";
  return (
    <span
      className={clsx(
        "px-2 py-1 rounded text-xs font-medium",
        isInService ? "badge-inService" : "badge-stopped"
      )}
    >
      {isInService ? "En service" : "Arrete"}
    </span>
  );
}

function TramCard({ tram }: { tram: TramwayEntity }) {
  const capacity = tram.vehicleCapacity?.value || 180;
  const passengers = tram.passengerCount?.value || 0;
  const loadPercent = Math.min((passengers / capacity) * 100, 100);

  return (
    <div className="sensor-card">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-semibold text-white">
            {tram.vehicleName?.value || tram.id.split(":").pop()}
          </h3>
          <p className="text-sm text-gray-400">
            {tram.vehiclePlateIdentifier?.value || ""}
          </p>
        </div>
        <StatusBadge status={tram.serviceStatus?.value || "inService"} />
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm">
          <MapPin className="h-4 w-4 text-purple-400" />
          <span className="text-gray-400">Arret actuel:</span>
          <span className="text-white">{tram.currentStop?.value || "En transit"}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <MapPin className="h-4 w-4 text-gray-500" />
          <span className="text-gray-400">Prochain arret:</span>
          <span className="text-white">{tram.nextStop?.value || "-"}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Gauge className="h-4 w-4 text-blue-400" />
          <span className="text-gray-400">Vitesse:</span>
          <span className="text-white">{tram.speed?.value?.toFixed(0) || 0} km/h</span>
        </div>
      </div>

      {/* Passenger Load Bar */}
      <div className="mt-4">
        <div className="flex items-center justify-between text-sm mb-1">
          <span className="text-gray-400 flex items-center gap-1">
            <Users className="h-4 w-4" />
            Passagers
          </span>
          <span className="text-white">
            {passengers}/{capacity}
          </span>
        </div>
        <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
          <div
            className={clsx(
              "h-full rounded-full transition-all",
              loadPercent > 90
                ? "bg-red-500"
                : loadPercent > 70
                  ? "bg-amber-500"
                  : "bg-purple-500"
            )}
            style={{ width: `${loadPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
}

export default function TramwayPage() {
  const { data: tramways } = useSWR<TramwayEntity[]>(
    "tramways",
    () => getEntities("Vehicle"),
    { refreshInterval: 3000 }
  );

  // Separate by line (T1 vs T2 based on category or name pattern)
  const t1Trams =
    tramways?.filter(
      (t) =>
        t.vehicleName?.value?.includes("T1") ||
        t.category?.value?.includes("T1")
    ) || [];
  const t2Trams =
    tramways?.filter(
      (t) =>
        t.vehicleName?.value?.includes("T2") ||
        t.category?.value?.includes("T2")
    ) || [];

  // Chart data
  const chartData = tramways?.map((tram) => ({
    name: tram.vehicleName?.value || tram.id.split(":").pop(),
    passengers: tram.passengerCount?.value || 0,
    capacity: tram.vehicleCapacity?.value || 180,
  }));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <Train className="h-8 w-8 text-purple-400" />
          Reseau Tramway
        </h1>
        <p className="text-gray-400 mt-1">
          Suivi en temps reel des lignes T1 et T2 - Rabat
        </p>
      </div>

      {/* Line T1 */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <span className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-lg text-sm">
            Ligne T1
          </span>
          <span className="text-gray-400 text-sm font-normal">
            Irfane - Bab El Had
          </span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {t1Trams.length > 0 ? (
            t1Trams.map((tram) => <TramCard key={tram.id} tram={tram} />)
          ) : (
            <div className="sensor-card col-span-full">
              <p className="text-gray-500">Chargement des tramways T1...</p>
            </div>
          )}
        </div>
      </div>

      {/* Line T2 */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-lg text-sm">
            Ligne T2
          </span>
          <span className="text-gray-400 text-sm font-normal">
            Technopolis - Dawliz
          </span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {t2Trams.length > 0 ? (
            t2Trams.map((tram) => <TramCard key={tram.id} tram={tram} />)
          ) : (
            <div className="sensor-card col-span-full">
              <p className="text-gray-500">Chargement des tramways T2...</p>
            </div>
          )}
        </div>
      </div>

      {/* Passenger Chart */}
      <div className="sensor-card">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Users className="h-5 w-5 text-purple-400" />
          Charge de passagers par tramway
        </h2>
        {chartData && chartData.length > 0 ? (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  type="number"
                  stroke="#9ca3af"
                  fontSize={12}
                  domain={[0, 180]}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  stroke="#9ca3af"
                  fontSize={12}
                  width={80}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    border: "1px solid #374151",
                    borderRadius: "0.5rem",
                  }}
                  labelStyle={{ color: "#9ca3af" }}
                  formatter={(value: number) => [`${value} passagers`, "Charge"]}
                />
                <ReferenceLine
                  x={180}
                  stroke="#ef4444"
                  strokeDasharray="3 3"
                  label={{
                    value: "Capacite max",
                    fill: "#ef4444",
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="passengers" name="Passagers" radius={[0, 4, 4, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        entry.passengers > 162
                          ? "#ef4444"
                          : entry.passengers > 126
                            ? "#f59e0b"
                            : "#a855f7"
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-80 flex items-center justify-center text-gray-500">
            Chargement des donnees...
          </div>
        )}
      </div>
    </div>
  );
}
