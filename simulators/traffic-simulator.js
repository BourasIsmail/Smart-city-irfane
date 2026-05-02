// Simulates TrafficFlowObserved entities at 5 Irfane/Rabat intersections
require("dotenv").config();
const { upsertEntity, fluctuate, randInt, pick } = require("./orion-client");

const INTERVAL_MS = parseInt(process.env.TRAFFIC_INTERVAL_MS || "5000");

const SENSORS = [
  { id: "urn:ngsi-ld:TrafficFlowObserved:Irfane-Avenue-Hassan2-N",
    name: "Avenue Hassan II — Nord", location: { lat: 33.9997, lon: -6.8474 }, lane: "N", baseFlow: 420, baseSpeed: 48 },
  { id: "urn:ngsi-ld:TrafficFlowObserved:Irfane-Avenue-Hassan2-S",
    name: "Avenue Hassan II — Sud", location: { lat: 33.9981, lon: -6.8474 }, lane: "S", baseFlow: 390, baseSpeed: 52 },
  { id: "urn:ngsi-ld:TrafficFlowObserved:Irfane-Rond-Point-Nations",
    name: "Rond-Point Nations Unies", location: { lat: 34.002, lon: -6.851 }, lane: "E", baseFlow: 780, baseSpeed: 28 },
  { id: "urn:ngsi-ld:TrafficFlowObserved:Irfane-Rue-Oued-Fes",
    name: "Rue Oued Fès", location: { lat: 33.9963, lon: -6.8553 }, lane: "W", baseFlow: 210, baseSpeed: 35 },
  { id: "urn:ngsi-ld:TrafficFlowObserved:Agdal-Avenue-Annakhil",
    name: "Avenue Annakhil — Agdal", location: { lat: 33.9916, lon: -6.8509 }, lane: "N", baseFlow: 550, baseSpeed: 44 },
];

function getRushMultiplier() {
  const hour = new Date().getHours();
  if ((hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19)) return 1.8;
  if (hour >= 12 && hour <= 13) return 1.3;
  if (hour >= 22 || hour <= 5) return 0.2;
  return 1.0;
}

function buildEntity(sensor) {
  const rush = getRushMultiplier();
  const intensity = Math.round(fluctuate(sensor.baseFlow * rush, 15));
  const speed = Math.round(fluctuate(sensor.baseSpeed / Math.max(1, rush * 0.6), 10));
  const occupancy = Math.min(1, intensity / 1200);
  const congestionLevel = occupancy > 0.85 ? "congestion" : occupancy > 0.6 ? "heavy" : occupancy > 0.35 ? "moderate" : "freeFlow";

  return {
    id: sensor.id, type: "TrafficFlowObserved",
    name: { type: "Text", value: sensor.name },
    location: { type: "geo:json", value: { type: "Point", coordinates: [sensor.location.lon, sensor.location.lat] } },
    intensity: { type: "Number", value: intensity },
    averageVehicleSpeed: { type: "Number", value: speed },
    occupancy: { type: "Number", value: parseFloat(occupancy.toFixed(3)) },
    congestionLevel: { type: "Text", value: congestionLevel },
    laneDirection: { type: "Text", value: sensor.lane },
    averageHeadwayTime: { type: "Number", value: intensity > 0 ? parseFloat((3600 / intensity).toFixed(2)) : 999 },
    dateObserved: { type: "DateTime", value: new Date().toISOString() },
  };
}

async function runCycle() {
  for (const sensor of SENSORS) {
    try {
      const entity = buildEntity(sensor);
      await upsertEntity(entity);
      console.log(`[TRAFFIC] ${sensor.name.padEnd(40)} intensity=${entity.intensity.value} veh/h  speed=${entity.averageVehicleSpeed.value} km/h  ${entity.congestionLevel.value}`);
    } catch (err) { console.error(`[TRAFFIC ERROR] ${sensor.id}:`, err.message); }
  }
}

console.log(`🚗  Traffic simulator started — ${SENSORS.length} sensors, interval ${INTERVAL_MS}ms`);
runCycle();
setInterval(runCycle, INTERVAL_MS);