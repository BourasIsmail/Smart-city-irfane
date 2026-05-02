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
import {
  CloudSun,
  Thermometer,
  Droplets,
  Wind,
  Gauge,
  Clock,
} from "lucide-react";
import clsx from "clsx";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface WeatherEntity {
  id: string;
  name?: { value: string };
  temperature?: { value: number };
  relativeHumidity?: { value: number };
  windSpeed?: { value: number };
  windDirection?: { value: number };
  atmosphericPressure?: { value: number };
  weatherType?: { value: string };
  dateObserved?: { value: string };
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  unit,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  unit: string;
  color: string;
}) {
  return (
    <div className="sensor-card">
      <div className="flex items-center gap-3">
        <div className={clsx("p-3 rounded-xl", color)}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm text-gray-400">{label}</p>
          <p className="text-xl font-bold text-white">
            {value}
            <span className="text-sm text-gray-400 ml-1">{unit}</span>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function WeatherPage() {
  const [selectedStation, setSelectedStation] = useState<string | null>(null);

  const { data: stations } = useSWR<WeatherEntity[]>(
    "weather-stations",
    () => getEntities("WeatherObserved"),
    { refreshInterval: 10000 }
  );

  const { data: tempHistory } = useSWR(
    selectedStation ? `weather-temp-${selectedStation}` : null,
    () => getTimeSeries(selectedStation!, "temperature", { lastN: 72 }),
    { refreshInterval: 30000 }
  );

  const { data: humidityHistory } = useSWR(
    selectedStation ? `weather-humidity-${selectedStation}` : null,
    () => getTimeSeries(selectedStation!, "relativeHumidity", { lastN: 72 }),
    { refreshInterval: 30000 }
  );

  // Set first station as default
  if (stations && stations.length > 0 && !selectedStation) {
    setSelectedStation(stations[0].id);
  }

  // Calculate summary stats
  const maxTemp = stations
    ? Math.max(...stations.map((s) => s.temperature?.value || 0))
    : 0;
  const minTemp = stations
    ? Math.min(
        ...stations.map((s) => s.temperature?.value || Infinity)
      )
    : 0;
  const avgHumidity = stations
    ? Math.round(
        stations.reduce((sum, s) => sum + (s.relativeHumidity?.value || 0), 0) /
          stations.length
      )
    : 0;
  const avgWind = stations
    ? Math.round(
        (stations.reduce((sum, s) => sum + (s.windSpeed?.value || 0), 0) /
          stations.length) *
          10
      ) / 10
    : 0;

  // Chart data
  const chartData =
    tempHistory && humidityHistory
      ? tempHistory.map((item: { ts: string; value: number }, index: number) => ({
          time: format(new Date(item.ts), "HH:mm", { locale: fr }),
          temperature: item.value,
          humidity: humidityHistory[index]?.value || 0,
        }))
      : [];

  const selected = stations?.find((s) => s.id === selectedStation);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <CloudSun className="h-8 w-8 text-orange-400" />
          Conditions Meteorologiques
        </h1>
        <p className="text-gray-400 mt-1">
          Donnees meteorologiques en temps reel - Quartier Irfane
        </p>
      </div>

      {/* Summary Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <SummaryCard
          icon={Thermometer}
          label="Temperature max"
          value={maxTemp.toFixed(1)}
          unit="C"
          color="bg-red-500/20 text-red-400"
        />
        <SummaryCard
          icon={Thermometer}
          label="Temperature min"
          value={minTemp.toFixed(1)}
          unit="C"
          color="bg-blue-500/20 text-blue-400"
        />
        <SummaryCard
          icon={Droplets}
          label="Humidite moyenne"
          value={avgHumidity}
          unit="%"
          color="bg-cyan-500/20 text-cyan-400"
        />
        <SummaryCard
          icon={Wind}
          label="Vent moyen"
          value={avgWind}
          unit="m/s"
          color="bg-gray-500/20 text-gray-400"
        />
      </div>

      {/* Station Selector Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {stations?.map((station) => (
          <button
            key={station.id}
            onClick={() => setSelectedStation(station.id)}
            className={clsx(
              "px-4 py-2 rounded-lg font-medium text-sm transition-all",
              selectedStation === station.id
                ? "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                : "bg-gray-800 text-gray-400 border border-gray-700 hover:border-gray-600"
            )}
          >
            {station.name?.value || station.id.split(":").pop()}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="lg:col-span-2 sensor-card">
          <h2 className="text-lg font-semibold text-white mb-4">
            Historique (72 derniers releves)
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
                    yAxisId="left"
                    stroke="#f97316"
                    fontSize={12}
                    tickLine={false}
                    domain={["dataMin - 2", "dataMax + 2"]}
                    label={{
                      value: "C",
                      angle: -90,
                      position: "insideLeft",
                      fill: "#f97316",
                    }}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    stroke="#06b6d4"
                    fontSize={12}
                    tickLine={false}
                    domain={[0, 100]}
                    label={{
                      value: "%",
                      angle: 90,
                      position: "insideRight",
                      fill: "#06b6d4",
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
                    dataKey="temperature"
                    name="Temperature (C)"
                    stroke="#f97316"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="humidity"
                    name="Humidite (%)"
                    stroke="#06b6d4"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-80 flex items-center justify-center text-gray-500">
              Chargement des donnees historiques...
            </div>
          )}
        </div>

        {/* Detail Panel */}
        <div className="sensor-card">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Gauge className="h-5 w-5 text-orange-400" />
            Details de la station
          </h2>
          {selected ? (
            <div className="space-y-4">
              <div className="bg-gray-800/50 rounded-lg p-4">
                <p className="text-sm text-gray-400">Temperature</p>
                <p className="text-3xl font-bold text-orange-400">
                  {selected.temperature?.value?.toFixed(1) || 0}
                  <span className="text-lg text-gray-400 ml-1">C</span>
                </p>
              </div>

              <div className="bg-gray-800/50 rounded-lg p-4">
                <p className="text-sm text-gray-400">Humidite relative</p>
                <p className="text-3xl font-bold text-cyan-400">
                  {selected.relativeHumidity?.value?.toFixed(0) || 0}
                  <span className="text-lg text-gray-400 ml-1">%</span>
                </p>
              </div>

              <div className="bg-gray-800/50 rounded-lg p-4">
                <p className="text-sm text-gray-400">Vitesse du vent</p>
                <p className="text-2xl font-bold text-white">
                  {selected.windSpeed?.value?.toFixed(1) || 0}
                  <span className="text-sm text-gray-400 ml-1">m/s</span>
                </p>
              </div>

              <div className="bg-gray-800/50 rounded-lg p-4">
                <p className="text-sm text-gray-400">Direction du vent</p>
                <p className="text-2xl font-bold text-white">
                  {selected.windDirection?.value?.toFixed(0) || 0}
                  <span className="text-sm text-gray-400 ml-1">deg</span>
                </p>
              </div>

              <div className="bg-gray-800/50 rounded-lg p-4">
                <p className="text-sm text-gray-400">Pression atmospherique</p>
                <p className="text-2xl font-bold text-white">
                  {selected.atmosphericPressure?.value?.toFixed(0) || 1013}
                  <span className="text-sm text-gray-400 ml-1">hPa</span>
                </p>
              </div>

              {selected.dateObserved?.value && (
                <div className="flex items-center gap-2 text-sm text-gray-400 pt-2">
                  <Clock className="h-4 w-4" />
                  {format(
                    new Date(selected.dateObserved.value),
                    "dd MMM yyyy HH:mm",
                    { locale: fr }
                  )}
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-500">Selectionnez une station</p>
          )}
        </div>
      </div>
    </div>
  );
}
