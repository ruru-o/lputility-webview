/**
 * RIPE Stat Data API Service Module
 * Authoritative Autonomous System (ASN), BGP Routing, and Network Registry Intelligence
 * provided by RIPE NCC (RÃ©seaux IP EuropÃ©ens Network Coordination Centre).
 * 
 * Official documentation: https://stat.ripe.net/docs/02.data_api/
 * Public REST endpoint: https://stat.ripe.net/data/
 */

const RIPESTAT_API_BASE = 'https://stat.ripe.net/data';
const DOH_RESOLVER_BASE = 'https://cloudflare-dns.com/dns-query';

/**
 * Resolves a domain name to an IPv4 address using DNS over HTTPS (DoH)
 */
export async function resolveDomainToIp(domain) {
  const clean = domain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
  const ipv4Regex = /^(?:\d{1,3}\.){3}\d{1,3}$/;
  const ipv6Regex = /^[0-9a-f:]+$/i;

  if (ipv4Regex.test(clean) || ipv6Regex.test(clean)) {
    return { ip: clean, resolved: false, original: clean };
  }

  const startTime = performance.now();
  const res = await fetch(`${DOH_RESOLVER_BASE}?name=${encodeURIComponent(clean)}&type=A`, {
    headers: { 'Accept': 'application/dns-json' },
  });

  const durationMs = Math.round(performance.now() - startTime);

  if (!res.ok) {
    throw new Error(`DNS resolution failed for "${clean}" (HTTP ${res.status})`);
  }

  const data = await res.json();
  const answer = (data.Answer || []).find(a => a.type === 1 && a.data); // Type 1 = A record
  if (!answer) {
    throw new Error(`No DNS A records found for "${clean}"`);
  }

  return {
    ip: answer.data,
    resolved: true,
    original: clean,
    durationMs,
    ttl: answer.TTL,
  };
}

/**
 * Queries RIPE Stat Network Info for an IP address or prefix
 */
export async function getNetworkInfo(resource) {
  const startTime = performance.now();
  const url = `${RIPESTAT_API_BASE}/network-info/data.json?resource=${encodeURIComponent(resource)}`;

  const res = await fetch(url, {
    headers: { 'Accept': 'application/json' }
  });

  const durationMs = Math.round(performance.now() - startTime);

  if (!res.ok) {
    throw new Error(`RIPE Stat network-info error (${res.status})`);
  }

  const json = await res.json();
  return {
    data: json.data || {},
    durationMs,
    status: res.status,
  };
}

/**
 * Queries RIPE Stat AS Overview for an Autonomous System
 */
export async function getAsOverview(asn) {
  const cleanAsn = String(asn).replace(/^AS/i, '');
  const startTime = performance.now();
  const url = `${RIPESTAT_API_BASE}/as-overview/data.json?resource=AS${encodeURIComponent(cleanAsn)}`;

  const res = await fetch(url, {
    headers: { 'Accept': 'application/json' }
  });

  const durationMs = Math.round(performance.now() - startTime);

  if (!res.ok) {
    throw new Error(`RIPE Stat as-overview error for AS${cleanAsn} (${res.status})`);
  }

  const json = await res.json();
  return {
    data: json.data || {},
    durationMs,
    status: res.status,
  };
}

/**
 * Queries RIPE Stat Routing Status
 */
export async function getRoutingStatus(resource) {
  const startTime = performance.now();
  const url = `${RIPESTAT_API_BASE}/routing-status/data.json?resource=${encodeURIComponent(resource)}`;

  const res = await fetch(url, {
    headers: { 'Accept': 'application/json' }
  });

  const durationMs = Math.round(performance.now() - startTime);

  if (!res.ok) {
    throw new Error(`RIPE Stat routing-status error (${res.status})`);
  }

  const json = await res.json();
  return {
    data: json.data || {},
    durationMs,
    status: res.status,
  };
}

/**
 * Fetches comprehensive infrastructure routing telemetry for a target
 */
export async function fetchInfrastructureTelemetry(target) {
  const t0 = performance.now();
  let resolvedIp = null;
  let dnsDetails = null;

  // Step 1: DNS resolution if needed
  try {
    const dnsRes = await resolveDomainToIp(target);
    resolvedIp = dnsRes.ip;
    dnsDetails = dnsRes;
  } catch (err) {
    // If DoH fails or target was already an IP, use directly
    resolvedIp = target.trim();
  }

  // Step 2: Query network info
  const netInfoRes = await getNetworkInfo(resolvedIp);
  const netData = netInfoRes.data || {};
  const asns = netData.asns || [];
  const prefix = netData.prefix || 'Unknown Prefix';
  const primaryAsn = asns[0] || null;

  // Step 3: Query AS overview if ASN is available
  let asData = null;
  let asDurationMs = 0;
  if (primaryAsn) {
    try {
      const asRes = await getAsOverview(primaryAsn);
      asData = asRes.data;
      asDurationMs = asRes.durationMs;
    } catch {
      asData = null;
    }
  }

  // Step 4: Routing status check
  let routingData = null;
  try {
    const routingRes = await getRoutingStatus(prefix !== 'Unknown Prefix' ? prefix : resolvedIp);
    routingData = routingRes.data;
  } catch {
    routingData = null;
  }

  const totalTimeMs = Math.round(performance.now() - t0);

  return {
    target,
    resolvedIp,
    dnsDetails,
    prefix,
    asns,
    primaryAsn: primaryAsn ? `AS${primaryAsn}` : 'N/A',
    asHolder: asData?.holder || 'Unknown AS Holder',
    asBlock: asData?.block?.name || asData?.block?.desc || 'Global Registry',
    asAnnounced: asData?.announced ?? null,
    visibility: routingData?.visibility?.v4?.ris_peers_seeing ? `${routingData.visibility.v4.ris_peers_seeing} peers` : 'Announced globally',
    firstSeen: routingData?.first_seen || null,
    totalTimeMs,
    durations: {
      dns: dnsDetails?.durationMs || 0,
      networkInfo: netInfoRes.durationMs,
      asOverview: asDurationMs,
    },
  };
}
