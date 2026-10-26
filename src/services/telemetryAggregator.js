/**
 * Telemetry Aggregator Module
 * Merges active distributed probe measurements (Globalping API)
 * with authoritative Autonomous System & BGP routing context (RIPE Stat API).
 */

import { executeGlobalpingTest } from './globalping';
import { fetchInfrastructureTelemetry } from './ripestat';

const STORAGE_KEY = 'netpulse_telemetry_history_v1';

/**
 * Saves a completed telemetry record to local storage history
 */
export function saveTelemetryRun(record) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const history = raw ? JSON.parse(raw) : [];
    // Keep last 15 items
    const updated = [record, ...history.filter(h => h.id !== record.id)].slice(0, 15);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // ignore local storage errors in private browsing
  }
}

/**
 * Retrieves past telemetry runs from local storage
 */
export function getTelemetryHistory() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Clears telemetry history
 */
export function clearTelemetryHistory() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

/**
 * Executes a dual-API telemetry test combining Globalping & RIPE Stat
 */
export async function runCombinedTelemetry({
  type = 'ping',
  target,
  locations = [{ continent: 'EU', limit: 1 }, { continent: 'AS', limit: 1 }, { continent: 'NA', limit: 1 }],
  options = {},
  isSimulatedFailure = false,
  onProgress = null,
}) {
  const startTime = performance.now();
  const runId = `run_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

  // Controlled academic failure simulation mode
  if (isSimulatedFailure) {
    await new Promise(r => setTimeout(r, 600));
    const simulatedErr = new Error('Simulated Network & Reachability Failure for Academic Demonstration');
    simulatedErr.isSimulated = true;
    simulatedErr.code = 'SIMULATED_TEST_FAULT';
    throw simulatedErr;
  }

  // Handle special deliberate invalid target
  if (target === 'empty.invalid' || target === 'trigger-empty-state') {
    return {
      id: runId,
      timestamp: new Date().toISOString(),
      target,
      type,
      isEmpty: true,
      globalping: { probes: [], probesCount: 0, avgLatency: null },
      ripestat: null,
      correlation: {
        analysis: 'No active probes or routing records matched the specified diagnostic target.',
      },
      durations: { total: 120 },
      isPartial: false,
    };
  }

  // Concurrently dispatch Globalping active probes and RIPE Stat passive routing lookup
  let globalpingResult = null;
  let globalpingError = null;
  let ripestatResult = null;
  let ripestatError = null;

  const globalpingPromise = executeGlobalpingTest({
    type,
    target,
    locations,
    options,
    onProgress: (p) => {
      if (onProgress) {
        onProgress({ stage: 'probes', ...p });
      }
    },
  }).catch((err) => {
    globalpingError = err;
    return null;
  });

  const ripestatPromise = fetchInfrastructureTelemetry(target)
    .catch((err) => {
      ripestatError = err;
      return null;
    });

  // Await both promises in parallel
  const [gpData, ripeData] = await Promise.all([globalpingPromise, ripestatPromise]);
  globalpingResult = gpData;
  ripestatResult = ripeData;

  const totalDurationMs = Math.round(performance.now() - startTime);

  // If both failed, propagate combined error
  if (!globalpingResult && !ripestatResult) {
    const combinedError = new Error(
      `Both telemetry sources failed. Active Probes: ${globalpingError?.message || 'Failed'}; Routing: ${ripestatError?.message || 'Failed'}`
    );
    combinedError.globalpingError = globalpingError;
    combinedError.ripestatError = ripestatError;
    throw combinedError;
  }

  // Correlate active measurement results with BGP infrastructure context
  const correlation = synthesizeTelemetryCorrelation({
    target,
    type,
    globalpingResult,
    ripestatResult,
  });

  const record = {
    id: runId,
    timestamp: new Date().toISOString(),
    target,
    type,
    isEmpty: false,
    globalping: globalpingResult,
    globalpingError: globalpingError ? globalpingError.message : null,
    ripestat: ripestatResult,
    ripestatError: ripestatError ? ripestatError.message : null,
    isPartial: Boolean(globalpingError || ripestatError),
    partialNote: globalpingError 
      ? 'Active probe measurements temporarily unavailable; showing authoritative BGP routing registry context.'
      : ripestatError 
      ? 'BGP routing registry lookup unavailable; showing live active probe measurements.'
      : null,
    correlation,
    durations: {
      total: totalDurationMs,
      activeProbes: globalpingResult?.totalTimeMs || 0,
      routingContext: ripestatResult?.totalTimeMs || 0,
    },
  };

  saveTelemetryRun(record);
  return record;
}

/**
 * Technical correlation logic synthesizing active probe data with BGP routing data
 */
export function synthesizeTelemetryCorrelation({ target, type, globalpingResult, ripestatResult }) {
  if (!globalpingResult && !ripestatResult) {
    return { summary: 'No telemetry data available to correlate.', findings: [] };
  }

  const findings = [];
  const probes = globalpingResult?.probes || [];
  const avgLatency = globalpingResult?.avgLatency;
  const asHolder = ripestatResult?.asHolder || 'Unknown';
  const primaryAsn = ripestatResult?.primaryAsn || 'N/A';
  const prefix = ripestatResult?.prefix || 'N/A';

  // Finding 1: Infrastructure Ownership
  if (primaryAsn !== 'N/A') {
    findings.push({
      label: 'Autonomous System Origin',
      detail: `Target ${target} resides in ${primaryAsn} (${asHolder}), announced via BGP prefix ${prefix}.`,
      type: 'info',
    });
  }

  // Finding 2: Latency & Regional Spread
  if (probes.length > 0 && avgLatency !== null) {
    const latencies = probes.map(p => p.latency).filter(l => typeof l === 'number');
    const minLatency = latencies.length > 0 ? Math.min(...latencies) : null;
    const maxLatency = latencies.length > 0 ? Math.max(...latencies) : null;
    const spread = (minLatency !== null && maxLatency !== null) ? Math.round(maxLatency - minLatency) : null;

    findings.push({
      label: 'Multi-Vantage Latency Profile',
      detail: `Average RTT across ${probes.length} regional vantage points is ${avgLatency}ms (fastest: ${minLatency ?? 'N/A'}ms, slowest: ${maxLatency ?? 'N/A'}ms, spread: ${spread ?? 'N/A'}ms).`,
      type: avgLatency < 60 ? 'optimal' : avgLatency < 180 ? 'nominal' : 'elevated',
    });

    // Detect CDN or Anycast edge routing behavior
    if (spread !== null && spread < 35 && probes.length >= 2) {
      findings.push({
        label: 'Anycast / Edge Routing Indicator',
        detail: `Low inter-regional latency delta (${spread}ms) indicates Anycast BGP routing or a globally distributed CDN edge for ${asHolder}.`,
        type: 'insight',
      });
    }
  }

  // Finding 3: Packet Reliability
  if (probes.length > 0) {
    const droppedProbes = probes.filter(p => p.packetLoss && p.packetLoss > 0);
    if (droppedProbes.length === 0) {
      findings.push({
        label: 'Packet Delivery & Loss',
        detail: '100% packet delivery confirmed across all sampled geographic vantage points (0% packet drop).',
        type: 'optimal',
      });
    } else {
      findings.push({
        label: 'Packet Drop Observed',
        detail: `${droppedProbes.length} of ${probes.length} probe locations reported packet loss during active transmission.`,
        type: 'warning',
      });
    }
  }

  return {
    summary: `Telemetry synthesized from ${probes.length} active probe(s) and authoritative routing record ${primaryAsn}.`,
    findings,
  };
}
