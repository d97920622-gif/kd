// path: scripts/checks/encryption.mjs
/**
 * check:encryption -- the encryption core is the only place a key or cipher is
 * used, and its configuration agrees with the database migration (sub-step 2.9).
 *
 * Text checks, run before a commit exists, with no database and no key:
 *
 *   1. the core files exist (config, root key, cipher, vault, blind index,
 *      rotation, PII redaction);
 *   2. the cipher is AES-256-GCM with a 96-bit nonce and a 128-bit tag, and it
 *      is used only in lib/encryption/aes-256-gcm.ts;
 *   3. no tracked source uses a weak or unauthenticated cipher or mode (ECB,
 *      CBC, CTR, DES, RC4) or the deprecated createCipher/createDecipher;
 *   4. HKDF is called only in lib/encryption/key-vault.ts, so there is one
 *      derivation path for encryption keys. Generic HMAC (lib/utils/hash.ts,
 *      caller-supplied keys) is not an encryption-key path and is not policed;
 *      the vault's own MAC is refused for every purpose except blind_index;
 *   5. ENCRYPTION_KEY is read from the environment only in lib/env/validate-env.ts;
 *   6. the purposes and the key version range in config/encryption.ts match the
 *      CHECK constraints in the 2.9 migration, so the two cannot drift apart;
 *   7. the active version of every purpose is a valid version, and the rotation
 *      interval config is a whole number of days within the allowed bounds;
 *   8. the 2.9 deliverables named in the plan exist.
 *
 * Findings never print a key or a value; they print the file and the rule.
 */
import { findMatches, listTrackedFiles, positionOf, readTextFile, reportResult } from './_lib.mjs';

const CONFIG_FILE = 'config/encryption.ts';
const CIPHER_FILE = 'lib/encryption/aes-256-gcm.ts';
const VAULT_FILE = 'lib/encryption/key-vault.ts';
const ENV_FILE = 'lib/env/validate-env.ts';
const MIGRATION_FILE = 'migrations/20260116080000_encryption_core.sql';

const REQUIRED_FILES = [
  CONFIG_FILE,
  'lib/encryption/root-key.ts',
  CIPHER_FILE,
  VAULT_FILE,
  'lib/encryption/blind-index.ts',
  'lib/encryption/key-rotation.ts',
  'lib/encryption/pii-redaction.ts',
  MIGRATION_FILE,
  'migrations/20260116080000_encryption_core_down.sql',
  'scripts/encryption/activate-key-version.ts',
  'scripts/encryption/check-key-ledger.ts',
  'scripts/encryption/rotation-rehearsal.ts',
  'scripts/encryption/benchmark.ts',
  'docs/security/ENCRYPTION_BENCHMARK.md',
  'docs/security/ENCRYPTION_KEY_ROTATION.md',
  'docs/EVIDENCE/step-02/2.9-encryption-core.md',
];

/** Files that may read the cipher or the MAC primitives. */
const CRYPTO_SOURCE_PATTERN = /\.(?:[cm]?[jt]sx?)$/;
const SCANNED_ROOTS = /^(?:app|components|config|lib|scripts|src|migrations|docs)\//;
const SELF = 'scripts/checks/encryption.mjs';

const WEAK_CIPHER_PATTERNS = [
  { label: 'ECB mode', pattern: /\baes-(?:128|192|256)-ecb\b/gi },
  { label: 'CBC mode (unauthenticated)', pattern: /\baes-(?:128|192|256)-cbc\b/gi },
  { label: 'CTR mode (unauthenticated)', pattern: /\baes-(?:128|192|256)-ctr\b/gi },
  { label: 'DES', pattern: /\bdes(?:-ede3?)?(?:-cbc|-ecb)?\b(?=['"])/gi },
  { label: 'RC4', pattern: /\brc4\b/gi },
  { label: 'deprecated createCipher (no IV)', pattern: /\bcreateCipher\s*\(/g },
  { label: 'deprecated createDecipher (no IV)', pattern: /\bcreateDecipher\s*\(/g },
];

const CIPHER_CALL_PATTERN = /\b(?:createCipheriv|createDecipheriv)\s*\(/g;
const HKDF_CALL_PATTERN = /\bhkdfSync\s*\(|\bhkdf\s*\(/g;
const ENV_READ_PATTERN = /\bprocess\.env(?:\.ENCRYPTION_KEY\b|\[\s*['"]ENCRYPTION_KEY['"]\s*\])/g;

const findings = [];

function add(file, source, index, message) {
  const { line, column } = positionOf(source, index);
  findings.push({ file, line, column, message });
}

/** Missing files are reported once, by main(); this only reads them. */
function readRequired(file) {
  return readTextFile(file);
}

/** Read a numeric or string constant from the config's object literal. */
function configValue(source, key) {
  const pattern = new RegExp(`\\b${key}:\\s*([^,\\n]+),`);
  const match = pattern.exec(source);
  return match === null ? null : match[1].trim().replace(/\s+as const$/, '');
}

function checkConfig() {
  const source = readRequired(CONFIG_FILE);
  if (source === null) {
    return { purposes: null, maxKeyVersion: null };
  }

  const expectations = [
    ['rootKeyBytes', '32'],
    ['derivationSalt', "'kd.encryption.v1'"],
    ['cipher', "'aes-256-gcm'"],
    ['ivBytes', '12'],
    ['tagBytes', '16'],
    ['maxKeyVersion', '100000'],
  ];
  for (const [key, expected] of expectations) {
    const actual = configValue(source, key);
    if (actual !== expected) {
      add(CONFIG_FILE, source, 0, `${key} must be ${expected}, found ${actual ?? 'nothing'}`);
    }
  }

  const purposesMatch = /ENCRYPTION_PURPOSES\s*=\s*\[([^\]]*)\]/.exec(source);
  const purposes =
    purposesMatch === null
      ? null
      : [...purposesMatch[1].matchAll(/'([a-z_]+)'/g)].map((entry) => entry[1]);
  if (purposes === null || purposes.length === 0) {
    add(CONFIG_FILE, source, 0, 'ENCRYPTION_PURPOSES must list the purposes as string literals');
  }

  const interval = configValue(source, 'rotationIntervalDays');
  if (interval === null || !/^\d+$/.test(interval)) {
    add(CONFIG_FILE, source, 0, 'rotationIntervalDays must be a whole number of days');
  } else {
    const days = Number(interval);
    if (days < 1 || days > 365) {
      add(CONFIG_FILE, source, 0, 'rotationIntervalDays must be between 1 and 365');
    }
  }

  const activeMatch = /activeVersions:\s*\{([^}]*)\}/.exec(source);
  if (activeMatch === null) {
    add(CONFIG_FILE, source, 0, 'activeVersions must be an object literal');
  } else {
    const versions = [...activeMatch[1].matchAll(/([a-z_]+):\s*(\d+)/g)];
    for (const purpose of purposes ?? []) {
      const entry = versions.find((item) => item[1] === purpose);
      if (entry === undefined || Number(entry[2]) < 1) {
        add(CONFIG_FILE, source, 0, `activeVersions must set ${purpose} to a version of 1 or more`);
      }
    }
  }

  const maxKeyVersion = Number(configValue(source, 'maxKeyVersion'));
  return { purposes, maxKeyVersion: Number.isFinite(maxKeyVersion) ? maxKeyVersion : null };
}

function checkMigration(purposes, maxKeyVersion) {
  const source = readRequired(MIGRATION_FILE);
  if (source === null) {
    return;
  }
  const purposeCheck = /purpose IN \(([^)]*)\)/.exec(source);
  if (purposeCheck === null) {
    add(MIGRATION_FILE, source, 0, 'purpose CHECK constraint is missing');
  } else {
    const dbPurposes = [...purposeCheck[1].matchAll(/'([a-z_]+)'/g)].map((entry) => entry[1]);
    const same =
      purposes !== null &&
      dbPurposes.length === purposes.length &&
      purposes.every((value) => dbPurposes.includes(value));
    if (!same) {
      add(
        MIGRATION_FILE,
        source,
        purposeCheck.index,
        `purpose CHECK (${dbPurposes.join(', ')}) does not match ENCRYPTION_PURPOSES in config`,
      );
    }
  }
  const rangeCheck = /key_version BETWEEN 1 AND (\d+)/.exec(source);
  if (rangeCheck === null || Number(rangeCheck[1]) !== maxKeyVersion) {
    add(
      MIGRATION_FILE,
      source,
      rangeCheck === null ? 0 : rangeCheck.index,
      `key_version range must end at maxKeyVersion ${String(maxKeyVersion)} in config`,
    );
  }
}

function checkSourceFiles(files) {
  for (const file of files) {
    if (!SCANNED_ROOTS.test(file) || !CRYPTO_SOURCE_PATTERN.test(file)) {
      continue;
    }
    if (file === SELF) {
      continue;
    }
    const source = readTextFile(file);
    if (source === null) {
      continue;
    }

    for (const weak of WEAK_CIPHER_PATTERNS) {
      for (const match of findMatches(source, weak.pattern)) {
        add(file, source, match.index, `${weak.label} is not allowed; use aes-256-gcm`);
      }
    }

    if (file !== CIPHER_FILE) {
      for (const match of findMatches(source, CIPHER_CALL_PATTERN)) {
        add(
          file,
          source,
          match.index,
          'cipher primitives are used only in lib/encryption/aes-256-gcm.ts',
        );
      }
    }
    if (file !== VAULT_FILE) {
      for (const match of findMatches(source, HKDF_CALL_PATTERN)) {
        add(
          file,
          source,
          match.index,
          'key derivation is done only in lib/encryption/key-vault.ts',
        );
      }
    }
    if (file !== ENV_FILE) {
      for (const match of findMatches(source, ENV_READ_PATTERN)) {
        add(
          file,
          source,
          match.index,
          'ENCRYPTION_KEY is read only in lib/env/validate-env.ts; use getEnv()',
        );
      }
    }
  }
}

function main() {
  for (const file of REQUIRED_FILES) {
    if (readTextFile(file) === null) {
      findings.push({ file, line: 1, column: 1, message: 'required encryption file is missing' });
    }
  }
  const { purposes, maxKeyVersion } = checkConfig();
  checkMigration(purposes, maxKeyVersion);
  checkSourceFiles(listTrackedFiles());

  // The cipher call sites must exist in the one cipher file, otherwise the
  // primitives have moved and the rule above no longer protects anything.
  const cipherSource = readTextFile(CIPHER_FILE);
  if (cipherSource !== null && findMatches(cipherSource, CIPHER_CALL_PATTERN).length === 0) {
    findings.push({
      file: CIPHER_FILE,
      line: 1,
      column: 1,
      message: 'the cipher file must call createCipheriv and createDecipheriv',
    });
  }
  const vaultSource = readTextFile(VAULT_FILE);
  if (vaultSource !== null && findMatches(vaultSource, HKDF_CALL_PATTERN).length === 0) {
    findings.push({
      file: VAULT_FILE,
      line: 1,
      column: 1,
      message: 'the key vault must derive keys with hkdfSync',
    });
  }

  reportResult(
    'encryption',
    findings,
    `${String(REQUIRED_FILES.length)} files, cipher and key rules, config matches migration`,
  );
}

main();
