// Simulates GreenspaceRecord entities for 5 Irfane green zones
require("dotenv").config();
const { upsertEntity, fluctuate, rand } = require("./orion-client");

const INTERVAL_MS = parseInt(process.env.GRASS_INTERVAL_MS || "15000");
const MONTHLY_RAINFALL = [56,46,45,35,18,4,0,1,8,34,60,70];

function getSeasonalMoisture() {
  return 10 + (MONTHLY_RAINFALL[new Date().getMonth()] / 70) * 55;
}

const GREENSPACES = [
  { id: "urn:ngsi-ld:GreenspaceRecord:Irfane-Parc-Principal",
    name: "Parc Principal Irfane", location: { lat: 33.9997, lon: -6.8468 },
    area: 12000, type: "park", irrigated: true, grassType: "Cynodon dactylon" },
  { id: "urn:ngsi-ld:GreenspaceRecord:Irfane-Jardin-Nahda",
    name: "Jardin Hay Nahda", location: { lat: 34.0265, lon: -6.8051 },
    area: 4500, type: "garden", irrigated: true, grassType: "Festuca arundinacea" },
  { id: "urn:ngsi-ld:GreenspaceRecord:Agdal-Jardins",
    name: "Jardins de l'Agdal", location: { lat: 33.9916, lon: -6.8531 },
    area: 35000, type: "historical-garden", irrigated: false, grassType: "Poa pratensis" },
  { id: "urn:ngsi-ld:GreenspaceRecord:Irfane-Mediane-Boulevard",
    name: "Médiane Boulevard Nations Unies", location: { lat: 34.0027, lon: -6.8455 },
    area: 2200, type: "roadside", irrigated: true, grassType: "Cynodon dactylon" },
  { id: "urn:ngsi-ld:GreenspaceRecord:UM5-Campus-Green",
    name: "Espaces Verts UM5", location: { lat: 33.9862, lon: -6.8554 },
    area: 8000, type: "campus", irrigated: true, grassType: "Lolium perenne" },
];

const state = {};
GREENSPACES.forEach(g => {
  const base = getSeasonalMoisture();
  state[g.id] = { moisture: g.irrigated ? base + 10 : base, soilTemp: 18, lastIrrigation: null };
});

function grassHealthStatus(moisture, soilTemp) {
  if (moisture < 15) return "stressed";
  if (moisture < 22) return "dry";
  if (moisture > 75) return "waterlogged";
  if (soilTemp > 40) return "heat-stressed";
  return "healthy";
}

function buildEntity(g) {
  const s = state[g.id];
  const hour = new Date().getHours();
  const evapRate = hour >= 9 && hour <= 17 ? 0.08 : 0.02;
  s.moisture = Math.max(5, s.moisture - fluctuate(evapRate, 30));
  if (g.irrigated && s.moisture < 25 && hour >= 6 && hour <= 8) {
    s.moisture = Math.min(70, s.moisture + rand(15, 25));
    s.lastIrrigation = new Date().toISOString();
  }
  const targetSoilTemp = 15 + 10 * Math.sin(((hour - 8) * Math.PI) / 14);
  s.soilTemp = s.soilTemp + (targetSoilTemp - s.soilTemp) * 0.05;

  const moisture = parseFloat(fluctuate(s.moisture, 5).toFixed(1));
  const soilTemp = parseFloat(fluctuate(s.soilTemp, 3).toFixed(1));

  return {
    id: g.id, type: "GreenspaceRecord",
    name: { type: "Text", value: g.name },
    location: { type: "geo:json", value: { type: "Point", coordinates: [g.location.lon, g.location.lat] } },
    soilMoistureVwc: { type: "Number", value: moisture },
    soilTemperature: { type: "Number", value: soilTemp },
    grassHeight: { type: "Number", value: parseFloat(rand(3, 12).toFixed(1)) },
    status: { type: "Text", value: grassHealthStatus(moisture, soilTemp) },
    greenspaceType: { type: "Text", value: g.type },
    area: { type: "Number", value: g.area },
    grassSpecies: { type: "Text", value: g.grassType },
    irrigationSystemActive: { type: "Boolean", value: g.irrigated && s.moisture < 25 && hour >= 6 && hour <= 8 },
    lastIrrigationDate: { type: "DateTime", value: s.lastIrrigation || new Date(Date.now()-86400000).toISOString() },
    dateObserved: { type: "DateTime", value: new Date().toISOString() },
  };
}

async function runCycle() {
  for (const g of GREENSPACES) {
    try {
      const entity = buildEntity(g);
      await upsertEntity(entity);
      console.log(`[GRASS] ${entity.name.value.padEnd(40)} moisture=${entity.soilMoistureVwc.value}%  soilT=${entity.soilTemperature.value}°C  ${entity.status.value}`);
    } catch (err) { console.error(`[GRASS ERROR]`, err.message); }
  }
}

console.log(`🌿  Grass simulator started — ${GREENSPACES.length} zones`);
runCycle(); setInterval(runCycle, INTERVAL_MS);