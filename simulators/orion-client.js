require("dotenv").config();
const axios = require("axios");

const ORION_URL = process.env.ORION_URL || "http://localhost:1026";
const FIWARE_SERVICE = process.env.FIWARE_SERVICE || "irfane";
const FIWARE_SERVICEPATH = process.env.FIWARE_SERVICEPATH || "/";

const headers = {
  "Content-Type": "application/json",
  "fiware-service": FIWARE_SERVICE,
  "fiware-servicepath": FIWARE_SERVICEPATH,
};

async function upsertEntity(entity) {
  const url = `${ORION_URL}/v2/entities/${entity.id}/attrs`;
  const { id, type, ...attrs } = entity;
  try {
    await axios.patch(url, attrs, { headers });
  } catch (err) {
    if (err.response && err.response.status === 404) {
      await axios.post(`${ORION_URL}/v2/entities`, entity, { headers });
      console.log(`[CREATED] ${entity.type} :: ${entity.id}`);
    } else {
      throw err;
    }
  }
}

const rand = (min, max) => Math.random() * (max - min) + min;
const randInt = (min, max) => Math.floor(rand(min, max));
const fluctuate = (base, pct) => base + base * (rand(-pct, pct) / 100);
const pick = (arr) => arr[randInt(0, arr.length)];

module.exports = { upsertEntity, rand, randInt, fluctuate, pick, ORION_URL, FIWARE_SERVICE };