/**
 * Secure Password Generation & NIST SP 800-63B Entropy Evaluation
 */

export const CHARSETS = {
  lowercase: {
    id: 'lowercase',
    label: 'Lowercase (a-z)',
    chars: 'abcdefghijklmnopqrstuvwxyz',
    count: 26,
  },
  uppercase: {
    id: 'uppercase',
    label: 'Uppercase (A-Z)',
    chars: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    count: 26,
  },
  numbers: {
    id: 'numbers',
    label: 'Numbers (0-9)',
    chars: '0123456789',
    count: 10,
  },
  symbols: {
    id: 'symbols',
    label: 'Symbols (!@#$%...)',
    chars: '!@#$%^&*()_+-=[]{}|;:,.<>?~',
    count: 27,
  },
};

export function calculateEntropy(length, poolSize) {
  if (poolSize <= 0 || length <= 0) return 0;
  const entropy = length * Math.log2(poolSize);
  return Math.round(entropy * 10) / 10;
}

export function evaluateStrength(entropyBits, length) {
  let tier = 'Weak';
  let color = '#ef4444';
  let percentage = 20;

  if (entropyBits < 40) {
    tier = 'Very Weak';
    color = '#ef4444';
    percentage = 20;
  } else if (entropyBits < 60) {
    tier = 'Weak';
    color = '#f97316';
    percentage = 40;
  } else if (entropyBits < 80) {
    tier = 'Moderate';
    color = '#eab308';
    percentage = 65;
  } else if (entropyBits < 100) {
    tier = 'Strong';
    color = '#22c55e';
    percentage = 85;
  } else {
    tier = 'Exceptional';
    color = '#10b981';
    percentage = 100;
  }

  // Cracking time estimate assuming 10^11 (100 billion) hashes/sec GPU rig
  const combinations = Math.pow(2, entropyBits);
  const seconds = combinations / (2 * 1e11); // average time is half the keyspace
  let crackTime = 'Instant';

  if (seconds < 1) crackTime = '< 1 second';
  else if (seconds < 60) crackTime = `${Math.round(seconds)} seconds`;
  else if (seconds < 3600) crackTime = `${Math.round(seconds / 60)} minutes`;
  else if (seconds < 86400) crackTime = `${Math.round(seconds / 3600)} hours`;
  else if (seconds < 31536000) crackTime = `${Math.round(seconds / 86400)} days`;
  else if (seconds < 31536000000) crackTime = `${Math.round(seconds / 31536000)} years`;
  else crackTime = 'Centuries+';

  const isNistCompliant = length >= 15;

  return {
    entropyBits,
    tier,
    color,
    percentage,
    crackTime,
    isNistCompliant,
    nistWarning: !isNistCompliant
      ? 'NIST SP 800-63B recommends at least 15 characters for single-factor passwords.'
      : null,
  };
}

function secureRandomIndex(max, cryptoObj) {
  // Rejection sampling: avoids modulo bias so every character is equally likely.
  const limit = Math.floor(0x100000000 / max) * max;
  const buf = new Uint32Array(1);
  do {
    cryptoObj.getRandomValues(buf);
  } while (buf[0] >= limit);
  return buf[0] % max;
}

export function generateSecurePassword({
  length = 16,
  useLower = true,
  useUpper = true,
  useNumbers = true,
  useSymbols = true,
} = {}) {
  let pool = '';
  if (useLower) pool += CHARSETS.lowercase.chars;
  if (useUpper) pool += CHARSETS.uppercase.chars;
  if (useNumbers) pool += CHARSETS.numbers.chars;
  if (useSymbols) pool += CHARSETS.symbols.chars;

  if (!pool) {
    throw new Error('Please select at least one character set.');
  }

  const cryptoObj = globalThis.crypto;
  if (!cryptoObj || !cryptoObj.getRandomValues) {
    throw new Error('Cryptographically secure Web Crypto API is not available.');
  }

  const len = Math.min(128, Math.max(1, Math.floor(Number(length) || 16)));
  const poolLen = pool.length;

  let password = '';
  for (let i = 0; i < len; i++) {
    password += pool[secureRandomIndex(poolLen, cryptoObj)];
  }

  const entropy = calculateEntropy(len, poolLen);
  const evaluation = evaluateStrength(entropy, len);

  return {
    password,
    length: len,
    poolSize: poolLen,
    ...evaluation,
  };
}
