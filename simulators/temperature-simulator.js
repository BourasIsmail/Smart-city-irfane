// Simulates WeatherObserved entities at 4 weather stations
require("dotenv").config();
const { upsertEntity, fluctuate, rand } = require("./orion-client");

const INTERVAL_MS = parseInt(process.env.TEMP_INTERVAL_MS || "10000");

const MONTHLY_AVG_TEMP =     [12,13,14,16,19,22,25,26,23,19,15,12];
const MONTHLY_AVG_HUMIDITY = [78,75,72,70,65,55,45,48,60,72,77,79];

function getBaseTemp() {
  const month = new Date().getMonth(), hour = new Date().getHours();
  return MONTHLY_AVG_TEMP[month] + 6 * Math.sin(((hour - 6) * Math.PI) / 12);
}
function getBaseHumidity() { return MONTHLY_AVG_HUMIDITY[new Date().getMonth()]; }

const STATIONS = [
  { id: "urn:ngsi-ld:WeatherObserved:Irfane-Station-001", name: "Station Météo Irfane Centre",
    location: { lat: 33.9997, lon: -6.8474 }, tempOffset: 0, humOffset: 0 },
  { id: "urn:ngsi-ld:WeatherObserved:Irfane-Station-002", name: "Station Météo Agdal Parc",
    location: { lat: 33.9916, lon: -6.8531 }, tempOffset: -0.5, humOffset: 5 },
  { id: "urn:ngsi-ld:WeatherObserved:Irfane-Station-003", name: "Station Météo Hay Riad",
    location: { lat: 33.9723, lon: -6.8609 }, tempOffset: 1.2, humOffset: -3 },
  { id: "urn:ngsi-ld:WeatherObserved:Irfane-Station-004", name: "Station Météo UM5 Campus",
    location: { lat: 33.9862, lon: -6.8554 }, tempOffset: 0.3, humOffset: 2 },
];

function buildEntity(station, baseTemp, baseHumidity) {
  const temp = parseFloat(fluctuate(baseTemp + station.tempOffset, 3).toFixed(1));
  const humidity = Math.min(100, Math.max(20, Math.round(fluctuate(baseHumidity + station.humOffset, 5))));
  const hour = new Date().getHours();
  const weatherType = humidity > 88 ? "rainy" : humidity > 75 ? "cloudy" : hour < 6 || hour > 21 ? "clear-night" : temp > 35 ? "hot" : "clear";

  return {
    id: station.id, type: "WeatherObserved",
    name: { type: "Text", value: station.name },
    location: { type: "geo:json", value: { type: "Point", coordinates: [station.location.lon, station.location.lat] } },
    temperature: { type: "Number", value: temp },
    relativeHumidity: { type: "Number", value: humidity },
    atmosphericPressure: { type: "Number", value: parseFloat(fluctuate(1013.25, 0.5).toFixed(1)) },
    windSpeed: { type: "Number", value: parseFloat(rand(0, 25).toFixed(1)) },
    windDirection: { type: "Number", value: Math.round(rand(0, 360)) },
    precipitation: { type: "Number", value: humidity > 85 ? parseFloat(rand(0, 5).toFixed(1)) : 0 },
    visibility: { type: "Number", value: Math.round(rand(5000, 20000)) },
    uvIndexMax: { type: "Number", value: hour >= 6 && hour <= 18 ? parseFloat((rand(0,1)*Math.sin(((hour-6)*Math.PI)/12)*10).toFixed(1)) : 0 },
    weatherType: { type: "Text", value: weatherType },
    feelsLikeTemperature: { type: "Number", value: parseFloat((temp - 0.4*(1-humidity/100)*(temp-10)).toFixed(1)) },
    dateObserved: { type: "DateTime", value: new Date().toISOString() },
  };
}

async function runCycle() {
  const bt = getBaseTemp(), bh = getBaseHumidity();
  for (const station of STATIONS) {
    try {
      const entity = buildEntity(station, bt, bh);
      await upsertEntity(entity);
      console.log(`[TEMP] ${entity.name.value.padEnd(40)} T=${entity.temperature.value}°C  H=${entity.relativeHumidity.value}%  ${entity.weatherType.value}`);
    } catch (err) { console.error(`[TEMP ERROR]`, err.message); }
  }
}

console.log(`🌡️  Temperature simulator started — ${STATIONS.length} stations`);
runCycle(); setInterval(runCycle, INTERVAL_MS);