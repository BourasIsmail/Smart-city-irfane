"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import useSWR from "swr";
import { getEntities } from "@/lib/fiware";
import { Car, Train, CloudSun, TreePine } from "lucide-react";
import clsx from "clsx";

const LiveMap = dynamic(() => import("@/components/LiveMap"), {
  ssr: false,
  loading: () => (
    <div className="h-full bg-gray-900 rounded-xl flex items-center justify-center">
      <p className="text-gray-400">Chargement de la carte...</p>
    </div>
  ),
});

interface LayerToggleProps {
  icon: React.ElementType;
  label: string;
  active: boolean;
  color: string;
  onClick: () => void;
}

function LayerToggle({
  icon: Icon,
  label,
  active,
  color,
  onClick,
}: LayerToggleProps) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all",
        active
          ? `${color} border border-current`
          : "bg-gray-800 text-gray-400 border border-gray-700 hover:border-gray-600"
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

export default function MapPage() {
  const [layers, setLayers] = useState({
    traffic: true,
    tramway: true,
    weather: true,
    greenspace: true,
  });

  const { data: trafficData } = useSWR(
    "map-traffic",
    () => getEntities("TrafficFlowObserved"),
    { refreshInterval: 5000 }
  );

  const { data: tramwayData } = useSWR(
    "map-tramway",
    () => getEntities("Vehicle"),
    { refreshInterval: 3000 }
  );

  const { data: weatherData } = useSWR(
    "map-weather",
    () => getEntities("WeatherObserved"),
    { refreshInterval: 10000 }
  );

  const { data: greenspaceData } = useSWR(
    "map-greenspace",
    () => getEntities("GreenspaceRecord"),
    { refreshInterval: 15000 }
  );

  const toggleLayer = (layer: keyof typeof layers) => {
    setLayers((prev) => ({ ...prev, [layer]: !prev[layer] }));
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col p-4 gap-4">
      {/* Layer Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm text-gray-400 mr-2">Couches:</span>
        <LayerToggle
          icon={Car}
          label="Trafic"
          active={layers.traffic}
          color="bg-blue-500/20 text-blue-400"
          onClick={() => toggleLayer("traffic")}
        />
        <LayerToggle
          icon={Train}
          label="Tramway"
          active={layers.tramway}
          color="bg-purple-500/20 text-purple-400"
          onClick={() => toggleLayer("tramway")}
        />
        <LayerToggle
          icon={CloudSun}
          label="Meteo"
          active={layers.weather}
          color="bg-orange-500/20 text-orange-400"
          onClick={() => toggleLayer("weather")}
        />
        <LayerToggle
          icon={TreePine}
          label="Espaces verts"
          active={layers.greenspace}
          color="bg-emerald-500/20 text-emerald-400"
          onClick={() => toggleLayer("greenspace")}
        />
      </div>

      {/* Map Container */}
      <div className="flex-1 rounded-xl overflow-hidden border border-gray-800">
        <LiveMap
          trafficData={trafficData || []}
          tramwayData={tramwayData || []}
          weatherData={weatherData || []}
          greenspaceData={greenspaceData || []}
          layers={layers}
        />
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-6 px-2">
        <div className="flex items-center gap-4">
          <span className="text-xs text-gray-500">Trafic:</span>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-emerald-500" />
            <span className="text-xs text-gray-400">Fluide</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-yellow-500" />
            <span className="text-xs text-gray-400">Modere</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-orange-500" />
            <span className="text-xs text-gray-400">Dense</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-red-500" />
            <span className="text-xs text-gray-400">Congestion</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-gray-500">Espaces verts:</span>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-emerald-500" />
            <span className="text-xs text-gray-400">Sain</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-amber-500" />
            <span className="text-xs text-gray-400">Sec</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-red-500" />
            <span className="text-xs text-gray-400">Stresse</span>
          </div>
        </div>
      </div>
    </div>
  );
}
