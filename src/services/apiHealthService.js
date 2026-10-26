/**
 * Real-time API Health and Frametime Diagnostic Service
 * Monitors all core network intelligence and edge APIs utilized by LPUtility.
 */

export const MONITORED_APIS = [
  {
    id: 'cloudflare-cdn',
    name: 'Cloudflare Anycast CDN',
    provider: 'Cloudflare, Inc.',
    role: 'Bandwidth Saturation & High-Throughput Edge',
    url: 'https://speed.cloudflare.com/__down?bytes=1000',
    protocol: 'HTTP/2 HTTPS',
    headers: {},
  },
  {
    id: 'cloudflare-doh',
    name: 'Cloudflare DNS-over-HTTPS',
    provider: 'Cloudflare 1.1.1.1',
    role: 'RFC 8484 Secure Edge Name Resolution',
    url: 'https://cloudflare-dns.com/dns-query?name=cloudflare.com&type=A',
    protocol: 'DoH (RFC 8484)',
    headers: { 'Accept': 'application/dns-json' },
  },
  {
    id: 'ripestat',
    name: 'RIPE NCC RIPEstat Data API',
    provider: 'RIPE Network Coordination Centre',
    role: 'BGP Routing Registry & ASN Autonomous System Intelligence',
    url: 'https://stat.ripe.net/data/as-overview/data.json?resource=AS13335',
    protocol: 'REST JSON',
    headers: {},
  },
  {
    id: 'ipify',
    name: 'IPify Edge Discovery API',
    provider: 'IPify Anycast',
    role: 'Public Edge IPv4 / IPv6 Ingress Identification',
    url: 'https://api.ipify.org?format=json',
    protocol: 'REST JSON',
    headers: {},
  },
  {
    id: 'globalping',
    name: 'Globalping Distributed Probe API',
    provider: 'jsDelivr / Globalping Foundation',
    role: 'Global Multi-Region Network Vantage Points & Probes',
    url: 'https://api.globalping.io/v1/limits',
    protocol: 'REST JSON',
    headers: {},
  },
  {
    id: 'google-doh',
    name: 'Google Public DNS DoH',
    provider: 'Google LLC',
    role: 'Anycast DNS-over-HTTPS Secondary Resolver',
    url: 'https://dns.google/resolve?name=example.com&type=A',
    protocol: 'DoH JSON',
    headers: { 'Accept': 'application/json' },
  },
];

/**
 * Probes a single API and returns status, frametime (latency in ms), and HTTP code
 */
export async function probeApi(apiDef) {
  const start = performance.now();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4500);

  try {
    const res = await fetch(`${apiDef.url}${apiDef.url.includes('?') ? '&' : '?'}_cb=${Date.now()}_${Math.random()}`, {
      method: 'GET',
      headers: apiDef.headers || {},
      signal: controller.signal,
      cache: 'no-store',
      mode: 'cors',
    });
    clearTimeout(timeoutId);

    const frametime = Math.max(1, Math.round(performance.now() - start));
    const isSuccess = res.ok || res.status === 304;

    return {
      id: apiDef.id,
      name: apiDef.name,
      provider: apiDef.provider,
      role: apiDef.role,
      protocol: apiDef.protocol,
      url: apiDef.url,
      status: isSuccess ? (frametime < 400 ? 'online' : 'degraded') : 'degraded',
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
