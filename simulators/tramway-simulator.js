// Simulates 7 tramway GPS positions along Rabat T1 & T2 lines
require("dotenv").config();
const { upsertEntity, rand, fluctuate } = require("./orion-client");

const INTERVAL_MS = parseInt(process.env.TRAMWAY_INTERVAL_MS || "3000");

const T1_STOPS = [
  { name: "Irfane", lat: 33.9997, lon: -6.8474 },
  { name: "Nations Unies", lat: 34.0027, lon: -6.8469 },
  { name: "Agdal", lat: 33.9916, lon: -6.8531 },
  { name: "UM5 Université", lat: 33.9862, lon: -6.8554 },
  { name: "Sidi Yahia", lat: 33.9791, lon: -6.8593 },
  { name: "Hay Riad", lat: 33.9723, lon: -6.8609 },
  { name: "Place de la Victoire", lat: 34.0085, lon: -6.8414 },
  { name: "Mohammed V", lat: 34.0122, lon: -6.8376 },
  { name: "Bab Chellah", lat: 34.0157, lon: -6.8295 },
  { name: "Bab El Had", lat: 34.0175, lon: -6.8248 },
];

const T2_STOPS = [
  { name: "Technopolis", lat: 34.0541, lon: -6.7516 },
  { name: "Akreuch", lat: 34.0388, lon: -6.7821 },
  { name: "Hay Nahda", lat: 34.0265, lon: -6.8051 },
  { name: "Orangers", lat: 34.0181, lon: -6.8189 },
  { name: "Bab El Had", lat: 34.0175, lon: -6.8248 },
  { name: "Hassan", lat: 34.0143, lon: -6.8312 },
  { name: "Les Oudayas", lat: 34.0193, lon: -6.8288 },
  { name: "Dawliz", lat: 34.0228, lon: -6.8221 },
];

function interpolate(a, b, t) {
  return { lat: a.lat + (b.lat - a.lat) * t, lon: a.lon + (b.lon - a.lon) * t };
}

class TramCar {
  constructor(id, line, stops, startIndex = 0, dir = 1) {
    this.id = id; this.line = line; this.stops = stops;
    this.stopIndex = startIndex % (stops.length - 1);
    this.direction = dir; this.progress = rand(0, 1);
    this.speed = rand(20, 35); this.passengerLoad = Math.floor(rand(10, 120));
    this.status = "inService"; this.dwellTimer = 0;
  }
  get nextStopIndex() { return this.stopIndex + this.direction; }

  tick(dtSec) {
    if (this.dwellTimer > 0) { this.dwellTimer -= dtSec; this.speed = 0; return; }
    const a = this.stops[this.stopIndex], b = this.stops[this.nextStopIndex];
    if (!b) { this.direction *= -1; return; }
    const dx = (b.lon - a.lon) * Math.cos((a.lat * Math.PI) / 180) * 111.32;
    const dy = (b.lat - a.lat) * 110.574;
    const distKm = Math.sqrt(dx * dx + dy * dy);
    this.speed = fluctuate(28, 20);
    this.progress += (this.speed / (distKm * 3600)) * dtSec;
    if (this.progress >= 1) {
      this.progress = 0; this.stopIndex = this.nextStopIndex;
      this.dwellTimer = rand(15, 45);
      this.passengerLoad = Math.min(180, Math.max(0, this.passengerLoad + Math.floor(rand(-20, 30))));
      const atTerminus = this.stopIndex === 0 || this.stopIndex === this.stops.length - 1;
      if (atTerminus) this.direction *= -1;
    }
  }

  getPosition() {
    const a = this.stops[this.stopIndex];
    const b = this.stops[Math.min(this.nextStopIndex, this.stops.length - 1)];
    return interpolate(a, b, Math.max(0, Math.min(1, this.progress)));
  }

  toEntity() {
    const pos = this.getPosition();
    return {
      id: `urn:ngsi-ld:Vehicle:Tramway-${this.id}`, type: "Vehicle",
      name: { type: "Text", value: `Tram ${this.id} — Line ${this.line}` },
      vehicleType: { type: "Text", value: "tram" },
      serviceStatus: { type: "Text", value: this.dwellTimer > 0 ? "stopped" : this.status },
      location: { type: "geo:json", value: { type: "Point", coordinates: [pos.lon, pos.lat] } },
      speed: { type: "Number", value: Math.round(this.speed) },
      passengerCount: { type: "Number", value: this.passengerLoad },
      currentStop: { type: "Text", value: this.stops[this.stopIndex].name },
      nextStop: { type: "Text", value: this.stops[this.nextStopIndex]?.name ?? "Terminal" },
      lineName: { type: "Text", value: `Line ${this.line}` },
      dateObserved: { type: "DateTime", value: new Date().toISOString() },
    };
  }
}

const fleet = [
  new TramCar("T1-001","T1",T1_STOPS,0,1), new TramCar("T1-002","T1",T1_STOPS,3,1),
  new TramCar("T1-003","T1",T1_STOPS,6,-1), new TramCar("T1-004","T1",T1_STOPS,8,-1),
  new TramCar("T2-001","T2",T2_STOPS,0,1), new TramCar("T2-002","T2",T2_STOPS,3,1),
  new TramCar("T2-003","T2",T2_STOPS,6,-1),
];

let lastTick = Date.now();

async function runCycle() {
  const now = Date.now(); const dtSec = (now - lastTick) / 1000; lastTick = now;
  for (const tram of fleet) {
    tram.tick(dtSec);
    try {
      await upsertEntity(tram.toEntity());
      const pos = tram.getPosition();
      console.log(`[TRAM] Tramway-${tram.id.padEnd(8)} speed=${Math.round(tram.speed).toString().padStart(3)} km/h  stop=${tram.stops[tram.stopIndex].name.padEnd(22)} lat=${pos.lat.toFixed(5)}`);
    } catch (err) { console.error(`[TRAM ERROR] ${tram.id}:`, err.message); }
  }
}

console.log(`🚊  Tramway simulator started — ${fleet.length} trams`);
runCycle();
setInterval(runCycle, INTERVAL_MS);