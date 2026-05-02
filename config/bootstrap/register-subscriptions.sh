#!/bin/sh
# Registers 6 Orion subscriptions + 3 Perseo alert rules on startup

ORION="http://orion:1026"
FIWARE_SERVICE="irfane"
FIWARE_PATH="/"
CYGNUS="http://cygnus:5080"
QL="http://quantumleap:8668"
PERSEO="http://perseo-fe:9090"

echo "Waiting for Orion..."
until curl -sf "$ORION/version" > /dev/null; do sleep 3; done

post_sub() {
  LABEL=$1; PAYLOAD=$2
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
    -X POST "$ORION/v2/subscriptions" \
    -H "Content-Type: application/json" \
    -H "fiware-service: $FIWARE_SERVICE" \
    -H "fiware-servicepath: $FIWARE_PATH" \
    -d "$PAYLOAD")
  echo "[$STATUS] $LABEL"
}

# SUB 1 — Cygnus: all entities → MongoDB
post_sub "Cygnus all entities" '{
  "description":"Cygnus: persist all context changes to MongoDB",
  "subject":{"entities":[{"idPattern":".*"}],"condition":{"attrs":[]}},
  "notification":{"http":{"url":"'"$CYGNUS"'/notify"},"attrsFormat":"normalized"},
  "throttling":2}'

# SUB 2 — QuantumLeap: TrafficFlowObserved
post_sub "QL TrafficFlowObserved" '{
  "description":"QuantumLeap: traffic time-series",
  "subject":{"entities":[{"idPattern":"urn:ngsi-ld:TrafficFlowObserved:.*","type":"TrafficFlowObserved"}],
    "condition":{"attrs":["intensity","averageVehicleSpeed","occupancy"]}},
  "notification":{"http":{"url":"'"$QL"'/v2/notify"},"attrsFormat":"normalized",
    "metadata":["dateCreated","dateModified"]},"throttling":1}'

# SUB 3 — QuantumLeap: Vehicle (Tramway)
post_sub "QL Vehicle Tramway" '{
  "description":"QuantumLeap: tramway GPS time-series",
  "subject":{"entities":[{"idPattern":"urn:ngsi-ld:Vehicle:Tramway.*","type":"Vehicle"}],
    "condition":{"attrs":["location","speed","serviceStatus"]}},
  "notification":{"http":{"url":"'"$QL"'/v2/notify"},"attrsFormat":"normalized",
    "metadata":["dateCreated","dateModified"]},"throttling":1}'

# SUB 4 — QuantumLeap: WeatherObserved
post_sub "QL WeatherObserved" '{
  "description":"QuantumLeap: temperature time-series",
  "subject":{"entities":[{"idPattern":"urn:ngsi-ld:WeatherObserved:.*","type":"WeatherObserved"}],
    "condition":{"attrs":["temperature","relativeHumidity","atmosphericPressure"]}},
  "notification":{"http":{"url":"'"$QL"'/v2/notify"},"attrsFormat":"normalized",
    "metadata":["dateCreated","dateModified"]},"throttling":2}'

# SUB 5 — QuantumLeap: GreenspaceRecord
post_sub "QL GreenspaceRecord" '{
  "description":"QuantumLeap: grass time-series",
  "subject":{"entities":[{"idPattern":"urn:ngsi-ld:GreenspaceRecord:.*","type":"GreenspaceRecord"}],
    "condition":{"attrs":["soilMoistureVwc","soilTemperature","status"]}},
  "notification":{"http":{"url":"'"$QL"'/v2/notify"},"attrsFormat":"normalized",
    "metadata":["dateCreated","dateModified"]},"throttling":2}'

# SUB 6 — Perseo: weather + greenspace alerts
post_sub "Perseo weather+grass" '{
  "description":"Perseo CEP: weather and soil alert rules",
  "subject":{"entities":[
    {"idPattern":"urn:ngsi-ld:WeatherObserved:.*","type":"WeatherObserved"},
    {"idPattern":"urn:ngsi-ld:GreenspaceRecord:.*","type":"GreenspaceRecord"}],
    "condition":{"attrs":["temperature","soilMoistureVwc"]}},
  "notification":{"http":{"url":"'"$PERSEO"'/notices"},"attrsFormat":"normalized"}}'

# Perseo Rule 1: low soil moisture
curl -s -o /dev/null -w "[%{http_code}] Perseo: low-soil-moisture\n" \
  -X POST "$PERSEO/rules" -H "Content-Type: application/json" \
  -d '{"name":"low-soil-moisture",
    "text":"select *,\"low-soil-moisture\" as ruleName from pattern [every ev=iotEvent(cast(cast(ev.soilMoistureVwc?,String),float) < 20 and type=\"GreenspaceRecord\")]",
    "action":{"type":"email","template":"ALERT: Low moisture at ${id}. Value: ${soilMoistureVwc}% VWC.",
      "parameters":{"to":"ops@irfane-rabat.ma","from":"alerts@irfane-rabat.ma","subject":"Low Soil Moisture"}}}'

# Perseo Rule 2: high temperature
curl -s -o /dev/null -w "[%{http_code}] Perseo: high-temperature\n" \
  -X POST "$PERSEO/rules" -H "Content-Type: application/json" \
  -d '{"name":"high-temperature",
    "text":"select *,\"high-temperature\" as ruleName from pattern [every ev=iotEvent(cast(cast(ev.temperature?,String),float) > 38 and type=\"WeatherObserved\")]",
    "action":{"type":"email","template":"ALERT: High temperature at ${id}: ${temperature}°C",
      "parameters":{"to":"ops@irfane-rabat.ma","from":"alerts@irfane-rabat.ma","subject":"High Temperature Alert"}}}'

# Perseo Rule 3: tramway out of service
curl -s -o /dev/null -w "[%{http_code}] Perseo: tramway-stopped\n" \
  -X POST "$PERSEO/rules" -H "Content-Type: application/json" \
  -d '{"name":"tramway-stopped",
    "text":"select *,\"tramway-stopped\" as ruleName from pattern [every ev=iotEvent(ev.serviceStatus=\"outOfService\" and type=\"Vehicle\")]",
    "action":{"type":"post","url":"http://frontend:3000/api/alerts/tramway","method":"POST",
      "headers":{"Content-Type":"application/json"},
      "parameters":{"entityId":"${id}","status":"${serviceStatus}"}}}'

echo "Bootstrap complete."