/**
 * Globalping API Service Module
 * Dispatches distributed network measurements (ping, dns, http, traceroute)
 * via jsDelivr's Globalping measurement network.
 * 
 * Official documentation: https://globalping.io/docs
 * Public REST API: https://api.globalping.io/v1
 */

const GLOBALPING_API_BASE = 'https://api.globalping.io/v1';

export const SUPPORTED_LOCATIONS = [
  { id: 'world', label: 'Worldwide (Any)', continent: null },
  { id: 'NA', label: 'North America', continent: 'NA' },
  { id: 'EU', label: 'Europe', continent: 'EU' },
  { id: 'AS', label: 'Asia-Pacific', continent: 'AS' },
  { id: 'OC', label: 'Oceania', continent: 'OC' },
  { id: 'SA', label: 'South America', continent: 'SA' },
  { id: 'AF', label: 'Africa', continent: 'AF' },
];

/**
 * Validates a target host or IP
 */
export function validateTarget(target) {
  if (!target || typeof target !== 'string') {
    return { valid: false, error: 'Target host or IP address is required' };
  }
  const clean = target.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
  if (!clean) {
    return { valid: false, error: 'Target cannot be empty' };
  }
  // Basic hostname/IP regex check
  const hostRegex = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i;
  const ipv4Regex = /^(?:\d{1,3}\.){3}\d{1,3}$/;
  const ipv6Regex = /^[0-9a-f:]+$/i;

  if (!hostRegex.test(clean) && !ipv4Regex.test(clean) && !ipv6Regex.test(clean) && clean !== 'localhost') {
    return { valid: false, error: 'Invalid hostname or IP address format' };
  }
  return { valid: true, clean };
}

/**
 * Creates a measurement on Globalping API
 */
export async function createMeasurement({ type = 'ping', target, locations = [{ continent: 'EU', limit: 1 }, { continent: 'AS', limit: 1 }], options = {} }) {
  const targetCheck = validateTarget(target);
  if (!targetCheck.valid) {
    throw new Error(targetCheck.error);
  }

  const cleanTarget = targetCheck.clean;
  const payload = {
    type,
    target: cleanTarget,
    locations: locations.length > 0 ? locations : [{ continent: 'EU', limit: 1 }],
  };

  if (type === 'dns' && options.queryType) {
    payload.measurementOptions = { query: { type: options.queryType.toUpperCase() } };
  } else if (type === 'http') {
    payload.measurementOptions = {
      request: {
        method: options.method || 'HEAD',
        path: options.path || '/',
      }
    };
  }

  const startTime = performance.now();
  const response = await fetch(`${GLOBALPING_API_BASE}/measurements`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const durationMs = Math.round(performance.now() - startTime);

  if (!response.ok) {
    let errorDetail = `Globalping API error (${response.status})`;
    try {
      const errJson = await response.json();
      if (errJson.error?.message) {
        errorDetail = errJson.error.message;
      }
    } catch {
      // ignore json parse error
    }
    const err = new Error(errorDetail);
    err.status = response.status;
    err.durationMs = durationMs;
    throw err;
  }

  const data = await response.json();
  return {
    id: data.id,
    probesCount: data.probesCount,
    durationMs,
    status: response.status,
  };
}

/**
 * Polls for measurement results until finished or timed out
 */
export async function pollMeasurement(id, { maxAttempts = 10, intervalMs = 1200, onProgress = null } = {}) {
  const startTime = performance.now();

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const pollStart = performance.now();
    const res = await fetch(`${GLOBALPING_API_BASE}/measurements/${id}`, {
      headers: { 'Accept': 'application/json' }
    });

    const pollDurationMs = Math.round(performance.now() - pollStart);

    if (!res.ok) {
      const err = new Error(`Failed to retrieve measurement (${res.status})`);
      err.status = res.status;
      throw err;
    }

    const data = await res.json();
    if (onProgress) {
      onProgress({
        attempt,
        maxAttempts,
        status: data.status,
        probesCount: data.probesCount,
        resultsSoFar: data.results?.length || 0,
      });
    }

    if (data.status === 'finished') {
      const totalTimeMs = Math.round(performance.now() - startTime);
      return normalizeGlobalpingResults(data, totalTimeMs);
    }

    if (attempt < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, intervalMs));
    }
  }

  throw new Error('Measurement timed out while awaiting probe responses.');
}

/**
 * Normalizes raw Globalping output into a clean, structured model
 */
export function normalizeGlobalpingResults(rawData, totalTimeMs) {
  const probes = (rawData.results || []).map((item) => {
    const probe = item.probe || {};
    const result = item.result || {};

    let summary = 'No result data';
    let latency = null;
    let packetLoss = null;

    if (rawData.type === 'ping' && result.stats) {
      latency = result.stats.avg;
      packetLoss = result.stats.loss;
      summary = `RTT Avg: ${result.stats.avg}ms (Min: ${result.stats.min}ms / Max: ${result.stats.max}ms) â€¢ Loss: ${result.stats.loss}%`;
    } else if (rawData.type === 'dns') {
      const answers = result.answers || [];
      const statusCode = result.statusCodeName || 'NOERROR';
      summary = `DNS: ${statusCode} â€¢ ${answers.length} answer(s) â€¢ Resolver RTT: ${result.timings?.total || 'N/A'}ms`;
      latency = result.timings?.total || null;
    } else if (rawData.type === 'http') {
      summary = `HTTP ${result.statusCode || 'N/A'} â€¢ TTFB: ${result.timings?.firstByte || 'N/A'}ms â€¢ Total: ${result.timings?.total || 'N/A'}ms`;
      latency = result.timings?.total || null;
    } else if (rawData.type === 'traceroute') {
      const hops = result.hops || [];
      summary = `Traceroute: ${hops.length} hop(s) reached`;
    }

    return {
      probeId: `${probe.city || 'Unknown'}-${probe.asn || '0'}`,
      city: probe.city || 'Unknown City',
      country: probe.country || 'XX',
      continent: probe.continent || 'Global',
      asn: probe.asn || null,
      network: probe.network || 'Unknown Network',
      latitude: probe.latitude,
      longitude: probe.longitude,
      status: result.status || 'finished',
      rawOutput: result.rawOutput || '',
      summary,
      latency,
      packetLoss,
      stats: result.stats || null,
      answers: result.answers || [],
      hops: result.hops || [],
      timings: result.timings || null,
    };
  });

  // Calculate aggregated stats
  const validLatencies = probes.map(p => p.latency).filter(l => typeof l === 'number' && !isNaN(l));
  const avgLatency = validLatencies.length > 0
    ? Math.round((validLatencies.reduce((a, b) => a + b, 0) / validLatencies.length) * 10) / 10
    : null;

  return {
    id: rawData.id,
    type: rawData.type,
    target: rawData.target,
    createdAt: rawData.createdAt,
    updatedAt: rawData.updatedAt,
    probesCount: probes.length,
    probes,
    avgLatency,
    totalTimeMs,
    raw: rawData,
  };
}

/**
 * End-to-end measurement runner
 */
export async function executeGlobalpingTest({ type = 'ping', target, locations, options, onProgress }) {
  const init = await createMeasurement({ type, target, locations, options });
  return await pollMeasurement(init.id, { onProgress });
}
