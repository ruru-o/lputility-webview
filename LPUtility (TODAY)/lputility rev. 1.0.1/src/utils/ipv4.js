/**
 * IPv4 Subnetting and Calculation Engine
 */

export function ipToInt(ip) {
  return ip
    .split('.')
    .reduce((acc, octet) => ((acc << 8) + parseInt(octet, 10)) >>> 0, 0);
}

export function intToIp(int) {
  return [
    (int >>> 24) & 255,
    (int >>> 16) & 255,
    (int >>> 8) & 255,
    int & 255,
  ].join('.');
}

export function isValidIpv4(ip) {
  const parts = ip.trim().split('.');
  if (parts.length !== 4) return false;
  return parts.every((p) => {
    if (!/^\d+$/.test(p)) return false;
    const n = parseInt(p, 10);
    return n >= 0 && n <= 255;
  });
}

export function cidrToMaskInt(cidr) {
  if (cidr === 0) return 0;
  return (~0 << (32 - cidr)) >>> 0;
}

export function cidrToMask(cidr) {
  return intToIp(cidrToMaskInt(cidr));
}

export function cidrToWildcard(cidr) {
  const mask = cidrToMaskInt(cidr);
  return intToIp((~mask) >>> 0);
}

export function toBinaryString(intVal) {
  const binary = (intVal >>> 0).toString(2).padStart(32, '0');
  return `${binary.slice(0, 8)}.${binary.slice(8, 16)}.${binary.slice(16, 24)}.${binary.slice(24, 32)}`;
}

export function calculateSubnet(ipStr, cidr) {
  if (!isValidIpv4(ipStr)) {
    throw new Error('Invalid IPv4 address format');
  }
  const prefix = Math.max(1, Math.min(32, parseInt(cidr, 10)));
  const ipVal = ipToInt(ipStr.trim());
  const maskVal = cidrToMaskInt(prefix);
  const wildcardVal = (~maskVal) >>> 0;

  const networkVal = (ipVal & maskVal) >>> 0;
  const broadcastVal = (networkVal | wildcardVal) >>> 0;

  let totalHosts = Math.pow(2, 32 - prefix);
  let usableHosts = prefix >= 31 ? (prefix === 31 ? 2 : 1) : Math.max(0, totalHosts - 2);

  let firstUsableVal = prefix >= 31 ? networkVal : (networkVal + 1) >>> 0;
  let lastUsableVal = prefix >= 31 ? broadcastVal : (broadcastVal - 1) >>> 0;

  if (prefix === 32) {
    firstUsableVal = networkVal;
    lastUsableVal = networkVal;
  }

  return {
    inputIp: ipStr.trim(),
    cidr: prefix,
    subnetMask: intToIp(maskVal),
    wildcardMask: intToIp(wildcardVal),
    networkAddress: intToIp(networkVal),
    broadcastAddress: intToIp(broadcastVal),
    firstUsableHost: intToIp(firstUsableVal),
    lastUsableHost: intToIp(lastUsableVal),
    totalHosts,
    usableHosts,
    binaryIp: toBinaryString(ipVal),
    binaryMask: toBinaryString(maskVal),
    binaryNetwork: toBinaryString(networkVal),
    binaryBroadcast: toBinaryString(broadcastVal),
  };
}

export function generateRandomIpv4(rangeType = 'private') {
  let ip = '';
  let cidr = Math.floor(Math.random() * 13) + 18; // /18 to /30

  if (rangeType === 'private') {
    const pool = Math.floor(Math.random() * 3);
    if (pool === 0) {
      // 10.0.0.0/8
      const octet2 = Math.floor(Math.random() * 256);
      const octet3 = Math.floor(Math.random() * 256);
      const octet4 = Math.floor(Math.random() * 254) + 1;
      ip = `10.${octet2}.${octet3}.${octet4}`;
      cidr = Math.floor(Math.random() * 15) + 16; // /16 to /30
    } else if (pool === 1) {
      // 172.16.0.0/12
      const octet2 = Math.floor(Math.random() * 16) + 16; // 16 to 31
      const octet3 = Math.floor(Math.random() * 256);
      const octet4 = Math.floor(Math.random() * 254) + 1;
      ip = `172.${octet2}.${octet3}.${octet4}`;
      cidr = Math.floor(Math.random() * 13) + 18; // /18 to /30
    } else {
      // 192.168.0.0/16
      const octet3 = Math.floor(Math.random() * 256);
      const octet4 = Math.floor(Math.random() * 254) + 1;
      ip = `192.168.${octet3}.${octet4}`;
      cidr = Math.floor(Math.random() * 7) + 24; // /24 to /30
    }
  } else {
    // Public random (avoiding 0.x, 127.x, 224+.x)
    const octet1 = Math.floor(Math.random() * 220) + 1;
    const octet2 = Math.floor(Math.random() * 256);
    const octet3 = Math.floor(Math.random() * 256);
    const octet4 = Math.floor(Math.random() * 254) + 1;
    ip = `${octet1}.${octet2}.${octet3}.${octet4}`;
  }

  return { ip, cidr };
}

export function splitSubnet(baseNetworkIp, baseCidr, newCidr) {
  if (newCidr <= baseCidr) {
    throw new Error('New prefix must be greater than current prefix to split.');
  }
  if (newCidr > 32) {
    throw new Error('Prefix cannot exceed /32.');
  }

  const baseNetworkVal = (ipToInt(baseNetworkIp) & cidrToMaskInt(baseCidr)) >>> 0;
  const count = Math.pow(2, newCidr - baseCidr);
  const blockSize = Math.pow(2, 32 - newCidr);

  const subnets = [];
  for (let i = 0; i < count; i++) {
    const subNetVal = (baseNetworkVal + (i * blockSize)) >>> 0;
    const subNetIp = intToIp(subNetVal);
    subnets.push(calculateSubnet(subNetIp, newCidr));
  }
  return subnets;
}

export function generatePracticeQuestion() {
  const { ip, cidr } = generateRandomIpv4('private');
  const solution = calculateSubnet(ip, cidr);
  return {
    questionId: Date.now(),
    ip,
    cidr,
    solution,
  };
}
