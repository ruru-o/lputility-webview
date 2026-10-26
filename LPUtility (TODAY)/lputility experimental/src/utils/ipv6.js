/**
 * IPv6 128-bit BigInt Calculator and Analyzer
 */

export function parseAndExpandIpv6(ipStr) {
  let cleaned = ipStr.trim().toLowerCase();
  if (!cleaned) throw new Error('IPv6 address cannot be empty');

  // Handle double colon ::
  if (cleaned.includes(':::')) {
    throw new Error('Invalid IPv6 syntax: ":::" is not allowed');
  }

  const parts = cleaned.split('::');
  if (parts.length > 2) {
    throw new Error('Only one "::" is allowed in an IPv6 address');
  }

  let left = parts[0] ? parts[0].split(':') : [];
  let right = parts[1] ? parts[1].split(':') : [];

  // Handle IPv4 mapped if present in last block
  const expandPart = (partList) => {
    return partList.map((segment) => {
      if (segment.length > 4 || !/^[0-9a-f]{1,4}$/.test(segment)) {
        throw new Error(`Invalid IPv6 hex segment: "${segment}"`);
      }
      return segment.padStart(4, '0');
    });
  };

  left = expandPart(left);
  right = expandPart(right);

  const missing = 8 - (left.length + right.length);
  if (parts.length === 2 && missing < 0) {
    throw new Error('Too many hex segments in IPv6 address');
  }
  if (parts.length === 1 && left.length !== 8) {
    throw new Error('IPv6 address must contain 8 segments or use "::"');
  }

  const middle = Array(missing).fill('0000');
  const full = [...left, ...middle, ...right];
  if (full.length !== 8) {
    throw new Error('Failed to parse into 8 16-bit blocks');
  }

  return full.join(':');
}

export function compressIpv6(expandedIp) {
  const groups = expandedIp.split(':').map((g) => parseInt(g, 16).toString(16));

  // Find longest run of zeros
  let bestStart = -1;
  let bestLen = 0;
  let currentStart = -1;
  let currentLen = 0;

  for (let i = 0; i < groups.length; i++) {
    if (groups[i] === '0') {
      if (currentStart === -1) currentStart = i;
      currentLen++;
      if (currentLen > bestLen) {
        bestLen = currentLen;
        bestStart = currentStart;
      }
    } else {
      currentStart = -1;
      currentLen = 0;
    }
  }

  if (bestLen > 1) {
    const head = groups.slice(0, bestStart).join(':');
    const tail = groups.slice(bestStart + bestLen).join(':');
    if (!head && !tail) return '::';
    if (!head) return `::${tail}`;
    if (!tail) return `${head}::`;
    return `${head}::${tail}`;
  }

  return groups.join(':');
}

export function ipv6ToBigInt(expandedIp) {
  const groups = expandedIp.split(':');
  let result = 0n;
  for (const group of groups) {
    result = (result << 16n) | BigInt(parseInt(group, 16));
  }
  return result;
}

export function bigIntToIpv6(bigIntVal) {
  let val = bigIntVal;
  const groups = [];
  const mask16 = 0xffffn;
  for (let i = 0; i < 8; i++) {
    const chunk = Number(val & mask16);
    groups.unshift(chunk.toString(16).padStart(4, '0'));
    val >>= 16n;
  }
  return groups.join(':');
}

export function classifyIpv6(bigIntVal) {
  const hex = bigIntToIpv6(bigIntVal);

  if (bigIntVal === 0n) {
    return {
      type: 'Unspecified Address',
      scope: 'Reserved',
      description: 'Used by hosts as source address before obtaining an IP (::/128).',
    };
  }
  if (bigIntVal === 1n) {
    return {
      type: 'Loopback Address',
      scope: 'Node-Local',
      description: 'Used to identify the local host interface, equivalent to 127.0.0.1 in IPv4 (::1/128).',
    };
  }

  // Link-Local: fe80::/10 (fe80 to febf)
  const first16 = Number((bigIntVal >> 112n) & 0xffffn);
  if (first16 >= 0xfe80 && first16 <= 0xfebf) {
    return {
      type: 'Link-Local Unicast',
      scope: 'Link-Local',
      description: 'Non-routable IP used for local link communication between directly connected devices (fe80::/10).',
    };
  }

  // Unique Local (ULA): fc00::/7 (fc00 to fdff)
  if (first16 >= 0xfc00 && first16 <= 0xfdff) {
    return {
      type: 'Unique Local Address (ULA)',
      scope: 'Organization-Local',
      description: 'Private routable IPv6 inside an organization, equivalent to RFC 1918 private IPv4 (fc00::/7).',
    };
  }

  // Multicast: ff00::/8 (ff00 to ffff)
  if (first16 >= 0xff00 && first16 <= 0xffff) {
    return {
      type: 'Multicast Address',
      scope: 'Group / Variable',
      description: 'Identifies a group of interfaces listening to traffic (ff00::/8).',
    };
  }

  // Documentation: 2001:db8::/32
  const first32 = Number((bigIntVal >> 96n) & 0xffffffffn);
  if (first32 === 0x20010db8) {
    return {
      type: 'Documentation Prefix',
      scope: 'Global',
      description: 'Reserved for textbook and academic examples (RFC 3849: 2001:db8::/32).',
    };
  }

  // Global Unicast: 2000::/3 (2000 to 3fff)
  if (first16 >= 0x2000 && first16 <= 0x3fff) {
    return {
      type: 'Global Unicast Address (GUA)',
      scope: 'Global Internet',
      description: 'Publicly routable IPv6 address on the global Internet (2000::/3).',
    };
  }

  return {
    type: 'Special / Reserved Address',
    scope: 'Special Registry',
    description: 'Special assignment within IANA address space registry.',
  };
}

export function calculateIpv6(ipInput, prefixLength = 64) {
  const prefix = Math.max(1, Math.min(128, parseInt(prefixLength, 10)));
  const expanded = parseAndExpandIpv6(ipInput);
  const compressed = compressIpv6(expanded);
  const ipBigInt = ipv6ToBigInt(expanded);

  // 128-bit mask
  const full128 = (1n << 128n) - 1n;
  const hostBits = BigInt(128 - prefix);
  const netMask = hostBits === 128n ? 0n : (full128 ^ ((1n << hostBits) - 1n));

  const networkBigInt = ipBigInt & netMask;
  const broadcastOrLastBigInt = networkBigInt | ((1n << hostBits) - 1n);

  const networkExpanded = bigIntToIpv6(networkBigInt);
  const networkCompressed = compressIpv6(networkExpanded);

  const firstAddrExpanded = networkExpanded;
  const firstAddrCompressed = networkCompressed;

  const lastAddrExpanded = bigIntToIpv6(broadcastOrLastBigInt);
  const lastAddrCompressed = compressIpv6(lastAddrExpanded);

  // /64 subnets count calculation
  let slash64Subnets = '0';
  let slash64BigInt = 0n;
  if (prefix <= 64) {
    slash64BigInt = 1n << BigInt(64 - prefix);
    slash64Subnets = slash64BigInt.toLocaleString();
  } else {
    slash64Subnets = '0 (Subnet is smaller than /64)';
  }

  const classification = classifyIpv6(ipBigInt);

  return {
    inputIp: ipInput,
    prefix,
    expanded,
    compressed,
    networkPrefix: `${networkCompressed}/${prefix}`,
    networkExpanded,
    firstAddress: `${firstAddrCompressed}`,
    firstAddressExpanded: firstAddrExpanded,
    lastAddress: `${lastAddrCompressed}`,
    lastAddressExpanded: lastAddrExpanded,
    slash64Subnets,
    slash64BigIntCount: slash64BigInt.toString(),
    type: classification.type,
    scope: classification.scope,
    typeDescription: classification.description,
  };
}

export const IPV6_PRESETS = [
  {
    name: 'Academic Sample (RFC 3849)',
    ip: '2001:0db8:85a3:0000:0000:8a2e:0370:7334',
    prefix: 64,
    note: 'Standard textbook /64 assignment',
  },
  {
    name: 'Enterprise /48 Site Allocation',
    ip: '2001:db8:abcd::',
    prefix: 48,
    note: 'Enterprise block yielding 65,536 /64 subnets',
  },
  {
    name: 'Link-Local Router Interface',
    ip: 'fe80::1',
    prefix: 64,
    note: 'Direct device-to-device local link',
  },
  {
    name: 'Unique Local (Private LAN)',
    ip: 'fd12:3456:789a:1::',
    prefix: 64,
    note: 'Private corporate/home ULA network',
  },
  {
    name: 'Loopback Host',
    ip: '::1',
    prefix: 128,
    note: 'Equivalent to 127.0.0.1 on local machine',
  },
];
