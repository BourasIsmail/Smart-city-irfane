"use client";

import useSWR from "swr";
import { getPerseoRules, getEntities } from "@/lib/fiware";
import {
  Bell,
  AlertTriangle,
  Mail,
  Webhook,
  MessageSquare,
  Check,
  X,
  Thermometer,
  Droplets,
  Train,
} from "lucide-react";
import clsx from "clsx";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface PerseoRule {
  name: string;
  text?: string;
  action?: {
    type: string;
    parameters?: {
      to?: string;
      url?: string;
      subject?: string;
    };
  };
}

interface AlertItem {
  id: string;
  type: "error" | "warning" | "info";
  entityType: string;
  entityName: string;
  message: string;
  value: string;
  timestamp: Date;
}

function getActionIcon(type: string) {
  switch (type) {
    case "email":
      return Mail;
    case "post":
      return Webhook;
    case "sms":
      return MessageSquare;
    default:
      return Bell;
  }
}

function AlertCard({ alert }: { alert: AlertItem }) {
  const colors = {
    error: "border-red-500/30 bg-red-500/10",
    warning: "border-amber-500/30 bg-amber-500/10",
    info: "border-blue-500/30 bg-blue-500/10",
  };
  const iconColors = {
    error: "text-red-400",
    warning: "text-amber-400",
    info: "text-blue-400",
  };
  const Icon =
    alert.entityType === "WeatherObserved"
      ? Thermometer
      : alert.entityType === "GreenspaceRecord"
        ? Droplets
        : alert.entityType === "Vehicle"
          ? Train
          : AlertTriangle;

  return (
    <div className={clsx("sensor-card border", colors[alert.type])}>
      <div className="flex items-start gap-3">
        <div className={clsx("mt-1", iconColors[alert.type])}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-white">{alert.entityName}</h3>
            <span className="text-xs text-gray-500">
              {format(alert.timestamp, "dd/MM HH:mm", { locale: fr })}
            </span>
          </div>
          <p className="text-sm text-gray-300 mt-1">{alert.message}</p>
          <p className="text-sm font-medium text-gray-400 mt-1">
            Valeur: <span className="text-white">{alert.value}</span>
          </p>
        </div>
      </div>
    </div>
  );
}

function RuleCard({ rule }: { rule: PerseoRule }) {
  const ActionIcon = getActionIcon(rule.action?.type || "email");
  const destination =
    rule.action?.parameters?.to ||
    rule.action?.parameters?.url ||
    "Non configure";

  return (
    <div className="sensor-card">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-white">{rule.name}</h3>
          <p className="text-sm text-gray-400 mt-1 line-clamp-2">
            {rule.text?.substring(0, 100)}...
          </p>
        </div>
        <div className="p-2 bg-gray-800 rounded-lg">
          <ActionIcon className="h-5 w-5 text-purple-400" />
        </div>
      </div>
      <div className="mt-3 pt-3 border-t border-gray-800 text-sm">
        <span className="text-gray-500">Destination:</span>
        <span className="text-gray-300 ml-2 break-all">{destination}</span>
      </div>
    </div>
  );
}

function ChannelStatus({
  name,
  icon: Icon,
  active,
}: {
  name: string;
  icon: React.ElementType;
  active: boolean;
}) {
  return (
    <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
      <div className="flex items-center gap-3">
        <Icon className="h-5 w-5 text-gray-400" />
        <span className="text-white">{name}</span>
      </div>
      <div
        className={clsx(
          "flex items-center gap-1 px-2 py-1 rounded text-xs font-medium",
          active
            ? "bg-emerald-500/20 text-emerald-400"
            : "bg-gray-700 text-gray-500"
        )}
      >
        {active ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
        {active ? "Actif" : "Inactif"}
      </div>
    </div>
  );
}

export default function AlertsPage() {
  const { data: rules } = useSWR<{ data?: PerseoRule[] }>(
    "perseo-rules",
    () => getPerseoRules(),
    { refreshInterval: 30000 }
  );

  // Fetch current data to generate live alerts
  const { data: weatherData } = useSWR(
    "alerts-weather",
    () => getEntities("WeatherObserved"),
    { refreshInterval: 10000 }
  );

  const { data: greenspaceData } = useSWR(
    "alerts-greenspace",
    () => getEntities("GreenspaceRecord"),
    { refreshInterval: 15000 }
  );

  const { data: tramwayData } = useSWR(
    "alerts-tramway",
    () => getEntities("Vehicle"),
    { refreshInterval: 5000 }
  );

  // Generate alerts from current data
  const alerts: AlertItem[] = [];

  // High temperature alerts
  weatherData?.forEach((station: { id: string; name?: { value: string }; temperature?: { value: number } }) => {
    if (station.temperature?.value && station.temperature.value > 38) {
      alerts.push({
        id: `temp-${station.id}`,
        type: "error",
        entityType: "WeatherObserved",
        entityName: station.name?.value || station.id.split(":").pop() || "",
        message: "Temperature elevee detectee",
        value: `${station.temperature.value.toFixed(1)}C`,
        timestamp: new Date(),
      });
    }
  });

  // Low soil moisture alerts
  greenspaceData?.forEach((zone: { id: string; name?: { value: string }; soilMoistureVwc?: { value: number }; status?: { value: string } }) => {
    if (zone.soilMoistureVwc?.value && zone.soilMoistureVwc.value < 20) {
      alerts.push({
        id: `moisture-${zone.id}`,
        type: zone.soilMoistureVwc.value < 15 ? "error" : "warning",
        entityType: "GreenspaceRecord",
        entityName: zone.name?.value || zone.id.split(":").pop() || "",
        message:
          zone.soilMoistureVwc.value < 15
            ? "Niveau d'humidite critique"
            : "Niveau d'humidite bas",
        value: `${zone.soilMoistureVwc.value.toFixed(1)}% VWC`,
        timestamp: new Date(),
      });
    }
  });

  // Tramway out of service alerts
  tramwayData?.forEach((tram: { id: string; vehicleName?: { value: string }; serviceStatus?: { value: string } }) => {
    if (tram.serviceStatus?.value === "outOfService") {
      alerts.push({
        id: `tram-${tram.id}`,
        type: "warning",
        entityType: "Vehicle",
        entityName: tram.vehicleName?.value || tram.id.split(":").pop() || "",
        message: "Tramway hors service",
        value: "outOfService",
        timestamp: new Date(),
      });
    }
  });

  const perseoRules = rules?.data || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <Bell className="h-8 w-8 text-amber-400" />
          Alertes et Notifications
        </h1>
        <p className="text-gray-400 mt-1">
          Regles CEP Perseo et alertes en temps reel
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Alert Log */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-400" />
            Alertes actives
            {alerts.length > 0 && (
              <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded text-sm">
                {alerts.length}
              </span>
            )}
          </h2>

          {alerts.length > 0 ? (
            <div className="space-y-3">
              {alerts.map((alert) => (
                <AlertCard key={alert.id} alert={alert} />
              ))}
            </div>
          ) : (
            <div className="sensor-card">
              <div className="flex items-center gap-3 text-gray-400">
                <Check className="h-5 w-5 text-emerald-400" />
                <p>Aucune alerte active - Tous les systemes sont normaux</p>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Notification Channels */}
          <div className="sensor-card">
            <h2 className="text-lg font-semibold text-white mb-4">
              Canaux de notification
            </h2>
            <div className="space-y-2">
              <ChannelStatus name="Email" icon={Mail} active={true} />
              <ChannelStatus name="Webhook" icon={Webhook} active={true} />
              <ChannelStatus name="SMS" icon={MessageSquare} active={false} />
            </div>
          </div>

          {/* Perseo Rules */}
          <div>
            <h2 className="text-lg font-semibold text-white mb-4">
              Regles Perseo CEP
            </h2>
            {perseoRules.length > 0 ? (
              <div className="space-y-3">
                {perseoRules.map((rule) => (
                  <RuleCard key={rule.name} rule={rule} />
                ))}
              </div>
            ) : (
              <div className="sensor-card">
                <p className="text-gray-500">
                  Chargement des regles Perseo...
                </p>
                <p className="text-xs text-gray-600 mt-2">
                  Les regles CEP sont configurees pour:
                </p>
                <ul className="text-xs text-gray-500 mt-1 space-y-1">
                  <li>- Humidite du sol basse (&lt;20%)</li>
                  <li>- Temperature elevee (&gt;38C)</li>
                  <li>- Tramway hors service</li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
