import { describe, it, expect } from 'vitest';
import { calculateSubnet, splitSubnet, isValidIpv4 } from '../utils/ipv4';
import { calculateIpv6, parseAndExpandIpv6, compressIpv6, classifyIpv6, ipv6ToBigInt } from '../utils/ipv6';
import { calculateEntropy, evaluateStrength, generateSecurePassword } from '../utils/crypto';
import { calculateBufferbloatGrade } from '../services/bufferbloatService';

describe('IPv4 Subnetting Algorithms', () => {
  it('correctly calculates /24 subnet boundaries', () => {
    const res = calculateSubnet('192.168.1.45', 24);
    expect(res.networkAddress).toBe('192.168.1.0');
    expect(res.broadcastAddress).toBe('192.168.1.255');
    expect(res.subnetMask).toBe('255.255.255.0');
    expect(res.wildcardMask).toBe('0.0.0.255');
    expect(res.firstUsableHost).toBe('192.168.1.1');
    expect(res.lastUsableHost).toBe('192.168.1.254');
    expect(res.usableHosts).toBe(254);
  });

  it('correctly calculates /26 subnet boundaries', () => {
    const res = calculateSubnet('172.16.85.120', 26);
    expect(res.networkAddress).toBe('172.16.85.64');
    expect(res.broadcastAddress).toBe('172.16.85.127');
    expect(res.subnetMask).toBe('255.255.255.192');
    expect(res.firstUsableHost).toBe('172.16.85.65');
    expect(res.lastUsableHost).toBe('172.16.85.126');
    expect(res.usableHosts).toBe(62);
  });

  it('correctly splits /24 into /26 subnets', () => {
    const subs = splitSubnet('192.168.1.0', 24, 26);
    expect(subs.length).toBe(4);
    expect(subs[0].networkAddress).toBe('192.168.1.0');
    expect(subs[1].networkAddress).toBe('192.168.1.64');
    expect(subs[2].networkAddress).toBe('192.168.1.128');
    expect(subs[3].networkAddress).toBe('192.168.1.192');
  });

  it('validates IPv4 format correctly', () => {
    expect(isValidIpv4('192.168.1.1')).toBe(true);
    expect(isValidIpv4('256.0.0.1')).toBe(false);
    expect(isValidIpv4('10.0.0')).toBe(false);
    expect(isValidIpv4('abc.def.ghi.jkl')).toBe(false);
  });
});

describe('IPv6 128-Bit Engine & BigInt Math', () => {
  it('expands compressed IPv6 addresses', () => {
    const expanded = parseAndExpandIpv6('2001:db8::1');
    expect(expanded).toBe('2001:0db8:0000:0000:0000:0000:0000:0001');
  });

  it('compresses IPv6 addresses according to RFC 5952', () => {
    const comp = compressIpv6('2001:0db8:0000:0000:0000:0000:0000:0001');
    expect(comp).toBe('2001:db8::1');
  });

  it('correctly counts /64 subnets inside /48 block', () => {
    const res = calculateIpv6('2001:db8:abcd::', 48);
    // 2^(64-48) = 2^16 = 65,536
    expect(res.slash64BigIntCount).toBe('65536');
    expect(res.slash64Subnets).toBe('65,536');
  });

  it('correctly classifies IPv6 address types', () => {
    const loopback = calculateIpv6('::1', 128);
    expect(loopback.type).toBe('Loopback Address');

    const linkLocal = calculateIpv6('fe80::5', 64);
    expect(linkLocal.type).toBe('Link-Local Unicast');

    const ula = calculateIpv6('fd00::1', 64);
    expect(ula.type).toBe('Unique Local Address (ULA)');

    const gua = calculateIpv6('2001:4860:4860::8888', 64);
    expect(gua.type).toBe('Global Unicast Address (GUA)');
  });
});

describe('Security & NIST SP 800-63B Analysis', () => {
  it('calculates entropy correctly', () => {
    // 16 chars from 62 pool: 16 * log2(62) = 16 * 5.954 = ~95.3 bits
    const entropy = calculateEntropy(16, 62);
    expect(entropy).toBeGreaterThan(90);
    expect(entropy).toBeLessThan(100);
  });

  it('warns when length is below 15 per NIST guidelines', () => {
    const evalShort = evaluateStrength(50, 12);
    expect(evalShort.isNistCompliant).toBe(false);
    expect(evalShort.nistWarning).not.toBeNull();

    const evalOk = evaluateStrength(95, 16);
    expect(evalOk.isNistCompliant).toBe(true);
    expect(evalOk.nistWarning).toBeNull();
  });
});

describe('Password Generator', () => {
  it('generates the requested length from the selected sets only', () => {
    const r = generateSecurePassword({ length: 24, useLower: false, useUpper: false, useNumbers: true, useSymbols: false });
    expect(r.password).toMatch(/^[0-9]{24}$/);
    expect(r.poolSize).toBe(10);
  });

  it('throws when no character set is selected', () => {
    expect(() => generateSecurePassword({ useLower: false, useUpper: false, useNumbers: false, useSymbols: false })).toThrow();
  });

  it('flags passwords under 15 characters per NIST SP 800-63B', () => {
    expect(generateSecurePassword({ length: 12 }).isNistCompliant).toBe(false);
    expect(generateSecurePassword({ length: 16 }).isNistCompliant).toBe(true);
  });
});

describe('Bufferbloat Grading Engine (Waveform Equivalent)', () => {
  it('assigns Grade A+ when latency delta is 0 to 5ms', () => {
    const res = calculateBufferbloatGrade(15, 18, 19);
    expect(res.grade).toBe('A+');
    expect(res.maxDelta).toBe(4);
    expect(res.ratings.gaming).toBe('Flawless');
  });

  it('assigns Grade A when latency delta is 6 to 15ms', () => {
    const res = calculateBufferbloatGrade(20, 31, 28);
    expect(res.grade).toBe('A');
    expect(res.maxDelta).toBe(11);
    expect(res.ratings.gaming).toBe('Excellent');
  });

  it('assigns Grade B when latency delta is 16 to 40ms', () => {
    const res = calculateBufferbloatGrade(25, 55, 45);
    expect(res.grade).toBe('B');
    expect(res.maxDelta).toBe(30);
    expect(res.ratings.gaming).toBe('Good');
  });

  it('assigns Grade C when latency delta is 41 to 100ms', () => {
    const res = calculateBufferbloatGrade(20, 105, 70);
    expect(res.grade).toBe('C');
    expect(res.maxDelta).toBe(85);
    expect(res.ratings.gaming).toBe('Fair');
  });

  it('assigns Grade D when latency delta is 101 to 300ms', () => {
    const res = calculateBufferbloatGrade(25, 210, 180);
    expect(res.grade).toBe('D');
    expect(res.maxDelta).toBe(185);
    expect(res.ratings.gaming).toBe('Frequent Lag');
  });

  it('assigns Grade F when latency delta exceeds 300ms', () => {
    const res = calculateBufferbloatGrade(30, 480, 320);
    expect(res.grade).toBe('F');
    expect(res.maxDelta).toBe(450);
    expect(res.ratings.gaming).toBe('Unplayable Under Load');
  });
});
