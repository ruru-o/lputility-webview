/**
 * Real-time API Health and Frametime Diagnostic Service
 * Monitors all core network intelligence and edge APIs utilized by LPUtility.
 */

export const MONITORED_APIS = [
  {
    id: 'cloudflare-latency',
    name: 'Cloudflare Latency & Ping Engine',
    provider: 'Cloudflare Speedtest Network',
    role: 'Waveform Bufferbloat Baseline Ping (<10ms TTFB)',
    url: 'https://speed.cloudflare.com/__down?bytes=0',
    method: 'GET',
    protocol: 'HTTP/2 HTTPS',
    headers: {},
    typicalFrametime: 8,
  },
  {
    id: 'cloudflare-doh',
    name: 'Cloudflare 1.1.1.1 DoH (IPv4)',
    provider: 'Cloudflare 1.1.1.1',
    role: 'RFC 8484 Anycast Secure Name Resolution',
    url: 'https://cloudflare-dns.com/dns-query?name=cloudflare.com&type=A',
    method: 'GET',
    protocol: 'DoH (RFC 8484)',
    headers: { 'Accept': 'application/dns-json' },
    typicalFrametime: 12,
  },
  {
    id: 'cloudflare-doh6',
    name: 'Cloudflare 1.1.1.1 DoH (IPv6)',
    provider: 'Cloudflare 1.1.1.1',
    role: 'RFC 8484 AAAA Record Edge Resolution',
    url: 'https://cloudflare-dns.com/dns-query?name=cloudflare.com&type=AAAA',
    method: 'GET',
    protocol: 'DoH (RFC 8484)',
    headers: { 'Accept': 'application/dns-json' },
    typicalFrametime: 14,
  },
  {
    id: 'google-doh',
    name: 'Google Public DNS DoH',
    provider: 'Google LLC (8.8.8.8)',
    role: 'Global Anycast Secondary Resolver Reference',
    url: 'https://dns.google/resolve?name=dns.google&type=A',
    method: 'GET',
    protocol: 'DoH JSON',
    headers: { 'Accept': 'application/json' },
    typicalFrametime: 18,
  },
  {
    id: 'cloudflare-downlink',
    name: 'Cloudflare Downlink Saturation Buffer',
    provider: 'Cloudflare Speedtest Network',
    role: 'Waveform Downlink Queue Saturation Measurement',
    url: 'https://speed.cloudflare.com/__down?bytes=100000',
    method: 'GET',
    protocol: 'HTTP/2 HTTPS',
    headers: {},
    typicalFrametime: 26,
  },
  {
    id: 'cloudflare-uplink',
    name: 'Cloudflare Uplink Buffer Saturation',
    provider: 'Cloudflare Speedtest Network',
    role: 'Waveform Uplink Queue Egress Saturation Measurement',
    url: 'https://speed.cloudflare.com/__up',
    method: 'POST',
    body: 'ping',
    protocol: 'HTTP/2 POST',
    headers: { 'Content-Type': 'text/plain' },
    typicalFrametime: 28,
  },
];

/**
 * Probes a single API and returns status, frametime (latency in ms), and HTTP code
 */
export async function probeApi(apiDef) {
  const start = performance.now();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4500);

  const targetUrl = `${apiDef.url}${apiDef.url.includes('?') ? '&' : '?'}_cb=${Date.now()}_${Math.random()}`;

  try {
    const fetchOptions = {
      method: apiDef.method || 'GET',
      headers: apiDef.headers || {},
      signal: controller.signal,
      cache: 'no-store',
      mode: 'cors',
    };
    if (apiDef.body) {
      fetchOptions.body = apiDef.body;
    }

    const res = await fetch(targetUrl, fetchOptions);
    clearTimeout(timeoutId);

    let frametime = Math.max(1, Math.round(performance.now() - start));

    // 1. Cloudflare Server-Timing L4 Edge RTT (mirroring Cloudflare Speedtest & Waveform engine)
    try {
      const serverTiming = res.headers && typeof res.headers.get === 'function' ? res.headers.get('server-timing') : null;
      if (serverTiming) {
        const rttMatch = serverTiming.match(/(?:min_rtt|rtt)=(\d+)/);
        if (rttMatch) {
          const edgeRtt = Math.round(parseInt(rttMatch[1], 10) / 1000);
          if (edgeRtt > 0 && edgeRtt < frametime) {
            frametime = edgeRtt;
          }
        }
      }
    } catch {
      // Ignore header parse errors
    }

    // 2. PerformanceResourceTiming extraction mirroring @cloudflare/speedtest engine
    if (typeof window !== 'undefined' && window.performance && window.performance.getEntriesByName) {
      try {
        const perf = window.performance.getEntriesByName(targetUrl).slice(-1)[0];
        if (perf) {
          const finalResponseStart = perf.finalResponseHeadersStart || perf.responseStart;
          if (finalResponseStart && perf.requestStart) {
            const ttfb = Math.round(finalResponseStart - perf.requestStart);
            if (ttfb > 0 && ttfb < frametime) {
              frametime = ttfb;
            }
          } else if (perf.duration > 0 && perf.duration < frametime) {
            frametime = Math.round(perf.duration);
          }
        }
      } catch {
        // Fallback to performance.now delta
      }
    }

    const isSuccess = res.ok || res.status === 304;

    return {
      id: apiDef.id,
      name: apiDef.name,
      provider: apiDef.provider,
      role: apiDef.role,
      protocol: apiDef.protocol,
      url: apiDef.url,
      status: isSuccess ? (frametime < 350 ? 'online' : 'degraded') : 'degraded',
      frametime,
      httpStatus: `${res.status} ${res.statusText || 'OK'}`,
      lastChecked: Date.now(),
      error: isSuccess ? null : `HTTP ${res.status}`,
    };
  } catch (err) {
    clearTimeout(timeoutId);
    const frametime = Math.max(1, Math.round(performance.now() - start));
    const isTimeout = err.name === 'AbortError';

    return {
      id: apiDef.id,
      name: apiDef.name,
      provider: apiDef.provider,
      role: apiDef.role,
      protocol: apiDef.protocol,
      url: apiDef.url,
      status: 'offline',
      frametime: isTimeout ? 4500 : frametime,
      httpStatus: isTimeout ? 'Timeout (>4500ms)' : 'Network Error',
      lastChecked: Date.now(),
      error: isTimeout ? 'Gateway probe timed out' : (err.message || 'Connection failed'),
    };
  }
}

/**
 * Probes all monitored APIs concurrently
 */
export async function probeAllApis() {
  const promises = MONITORED_APIS.map(api => probeApi(api));
  const results = await Promise.allSettled(promises);
  return results.map((r, i) => {
    if (r.status === 'fulfilled') return r.value;
    return {
      id: MONITORED_APIS[i].id,
      name: MONITORED_APIS[i].name,
      provider: MONITORED_APIS[i].provider,
      role: MONITORED_APIS[i].role,
      protocol: MONITORED_APIS[i].protocol,
      url: MONITORED_APIS[i].url,
      status: 'offline',
      frametime: 0,
      httpStatus: 'Failed',
      lastChecked: Date.now(),
      error: 'Probe rejection',
    };
  });
}
