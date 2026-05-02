const ORION = process.env.NEXT_PUBLIC_ORION_URL || "http://localhost:1027";
const QL    = process.env.NEXT_PUBLIC_QL_URL    || "http://localhost:8668";
const SERVICE      = process.env.NEXT_PUBLIC_ORION_SERVICE      || "irfane";
const SERVICE_PATH = process.env.NEXT_PUBLIC_ORION_SERVICE_PATH || "/";

function fiwareHeaders(token?: string) {
  const h: Record<string,string> = {
    "Content-Type": "application/json",
    "fiware-service": SERVICE,
    "fiware-servicepath": SERVICE_PATH,
  };
  if (token) h["Authorization"] = `Bearer ${token}`;
  return h;
}

export async function getEntities(type: string, options?: {
  limit?: number; offset?: number; q?: string;
  georel?: string; geometry?: string; coords?: string; token?: string;
}) {
  const params = new URLSearchParams({ type, limit: String(options?.limit ?? 100) });
  if (options?.offset)   params.set("offset",   String(options.offset));
  if (options?.q)        params.set("q",         options.q);
  if (options?.georel)   params.set("georel",    options.georel);
  if (options?.geometry) params.set("geometry",  options.geometry);
  if (options?.coords)   params.set("coords",    options.coords);
  const res = await fetch(`${ORION}/v2/entities?${params}`, { headers: fiwareHeaders(options?.token), next: { revalidate: 0 } });
  if (!res.ok) throw new Error(`Orion error ${res.status}`);
  return res.json();
}

export async function getEntity(id: string, token?: string) {
  const res = await fetch(`${ORION}/v2/entities/${encodeURIComponent(id)}`, { headers: fiwareHeaders(token), next: { revalidate: 0 } });
  if (!res.ok) throw new Error(`Orion error ${res.status}`);
  return res.json();
}

export async function getTimeSeries(entityId: string, attr: string, options?: {
  lastN?: number; fromDate?: string; toDate?: string; token?: string;
}) {
  const params = new URLSearchParams();
  if (options?.lastN)    params.set("lastN",    String(options.lastN));
  if (options?.fromDate) params.set("fromDate", options.fromDate);
  if (options?.toDate)   params.set("toDate",   options.toDate);
  const res = await fetch(`${QL}/v2/entities/${encodeURIComponent(entityId)}/attrs/${attr}?${params}`, {
    headers: fiwareHeaders(options?.token), next: { revalidate: 0 },
  });
  if (!res.ok) throw new Error(`QL error ${res.status}`);
  const data = await res.json();
  return (data.attrName ? data.index : []).map((ts: string, i: number) => ({ ts, value: data.values?.[i] ?? null }));
}

export async function getPerseoRules(token?: string) {
  const PERSEO = process.env.NEXT_PUBLIC_PERSEO_URL || "http://localhost:9090";
  const res = await fetch(`${PERSEO}/rules`, { headers: fiwareHeaders(token), next: { revalidate: 30 } });
  if (!res.ok) throw new Error(`Perseo error ${res.status}`);
  return res.json();
}