import { describe, it, expect } from 'vitest';
import { validateTarget, normalizeGlobalpingResults } from '../services/globalping';
import { synthesizeTelemetryCorrelation } from '../services/telemetryAggregator';

describe('Globalping Target Validation', () => {
  it('accepts valid hostnames and trims protocols', () => {
    expect(validateTarget('https://google.com/').valid).toBe(true);
    expect(validateTarget('https://google.com/').clean).toBe('google.com');
    expect(validateTarget('api.github.com').valid).toBe(true);
    expect(validateTarget('api.github.com').clean).toBe('api.github.com');
  });

  it('accepts valid IPv4 and IPv6 addresses', () => {
    expect(validateTarget('1.1.1.1').valid).toBe(true);
    expect(validateTarget('1.1.1.1').clean).toBe('1.1.1.1');
    expect(validateTarget('2606:4700:4700::1111').valid).toBe(true);
  });

  it('rejects invalid targets', () => {
    expect(validateTarget('').valid).toBe(false);
    expect(validateTarget('not a domain or ip').valid).toBe(false);
    expect(validateTarget(null).valid).toBe(false);
  });
});

describe('Globalping Result Normalization', () => {
  it('correctly parses ping results and extracts latency statistics', () => {
    const rawPingData = {
      id: 'test_gp_123',
      type: 'ping',
      target: '1.1.1.1',
      createdAt: '2026-10-26T12:00:00Z',
      updatedAt: '2026-10-26T12:00:02Z',
      results: [
        {
          probe: { city: 'Tokyo', country: 'JP', continent: 'AS', asn: 13335, network: 'Cloudflare' },
          result: {
            status: 'finished',
            stats: { min: 1.5, avg: 1.8, max: 2.1, loss: 0 },
            rawOutput: '3 packets transmitted, 3 received, 0% packet loss',
          }
        },
        {
          probe: { city: 'London', country: 'GB', continent: 'EU', asn: 13335, network: 'Cloudflare' },
          result: {
            status: 'finished',
            stats: { min: 12.0, avg: 13.5, max: 15.0, loss: 0 },
            rawOutput: '3 packets transmitted, 3 received, 0% packet loss',
          }
        }
      ]
    };

    const normalized = normalizeGlobalpingResults(rawPingData, 850);
    expect(normalized.id).toBe('test_gp_123');
    expect(normalized.probesCount).toBe(2);
    expect(normalized.avgLatency).toBe(7.7); // (1.8 + 13.5)/2 = 7.65 -> rounded to 7.7
    expect(normalized.probes[0].city).toBe('Tokyo');
    expect(normalized.probes[0].latency).toBe(1.8);
    expect(normalized.probes[1].city).toBe('London');
    expect(normalized.probes[1].latency).toBe(13.5);
  });

  it('correctly parses DNS results', () => {
    const rawDnsData = {
      id: 'test_dns_456',
      type: 'dns',
      target: 'example.com',
      results: [
        {
          probe: { city: 'Frankfurt', country: 'DE', continent: 'EU', asn: 24940 },
          result: {
            statusCodeName: 'NOERROR',
            answers: [{ name: 'example.com', type: 'A', value: '93.184.216.34', ttl: 3600 }],
            timings: { total: 18 }
          }
        }
      ]
    };

    const normalized = normalizeGlobalpingResults(rawDnsData, 420);
    expect(normalized.probesCount).toBe(1);
    expect(normalized.probes[0].answers.length).toBe(1);
    expect(normalized.probes[0].latency).toBe(18);
  });
});

describe('Telemetry Correlation & Synthesis Engine', () => {
  it('detects Anycast edge distribution when regional latency delta is tight', () => {
    const mockGlobalping = {
      probes: [
        { city: 'New York', latency: 12.4, packetLoss: 0 },
        { city: 'Amsterdam', latency: 14.1, packetLoss: 0 },
        { city: 'Singapore', latency: 16.2, packetLoss: 0 },
      ],
      avgLatency: 14.2,
    };

    const mockRipestat = {
      primaryAsn: 'AS13335',
      asHolder: 'CLOUDFLARENET - Cloudflare, Inc.',
      prefix: '1.1.1.0/24',
    };

    const synthesis = synthesizeTelemetryCorrelation({
      target: '1.1.1.1',
      type: 'ping',
      globalpingResult: mockGlobalping,
      ripestatResult: mockRipestat,
    });

    expect(synthesis.findings.length).toBeGreaterThan(2);
    const anycastFinding = synthesis.findings.find(f => f.label.includes('Anycast'));
    expect(anycastFinding).toBeDefined();
    expect(anycastFinding.detail).toContain('Cloudflare, Inc.');
  });

  it('synthesizes partial results when routing info is unavailable', () => {
    const mockGlobalping = {
      probes: [{ city: 'Paris', latency: 25.0, packetLoss: 0 }],
      avgLatency: 25.0,
    };

    const synthesis = synthesizeTelemetryCorrelation({
      target: 'test.local',
      type: 'ping',
      globalpingResult: mockGlobalping,
      ripestatResult: null,
    });

    expect(synthesis.findings.length).toBeGreaterThan(0);
    expect(synthesis.summary).toContain('1 active probe');
  });
});
