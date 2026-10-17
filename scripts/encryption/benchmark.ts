// path: scripts/encryption/benchmark.ts
/**
 * encryption:benchmark -- measure the encryption core on this machine.
 *
 * It times, with a random in-memory root key and no database:
 *   - seal (encrypt) and open (decrypt) of a field at four sizes, from 256 bytes
 *     to the 1 MiB field limit;
 *   - a cold key derivation (HKDF), which the vault caches per version;
 *   - a blind index computation.
 *
 * The output is informational: it is recorded in docs/security/ENCRYPTION_BENCHMARK.md
 * and is not a gate in npm run verify, because timings depend on the machine.
 * Each line reports the median and the 95th percentile of the iterations.
 */
import { randomBytes, randomUUID } from 'node:crypto';
import { cpus } from 'node:os';
import { performance } from 'node:perf_hooks';

import { computeBlindIndex } from '../../lib/encryption/blind-index';
import { createKeyVault, type KeyVault } from '../../lib/encryption/key-vault';

import { start, write } from './_shared';

interface Sample {
  readonly name: string;
  readonly bytes: number;
  readonly iterations: number;
  readonly run: () => void;
}

function iterationsFor(bytes: number): number {
  if (bytes <= 4096) {
    return 2000;
  }
  return bytes <= 65536 ? 500 : 60;
}

/** Time each call and return the sorted durations in milliseconds. */
function time(iterations: number, run: () => void): number[] {
  const durations: number[] = [];
  for (let index = 0; index < iterations; index += 1) {
    const started = performance.now();
    run();
    durations.push(performance.now() - started);
  }
  return durations.sort((a, b) => a - b);
}

function percentile(sorted: readonly number[], fraction: number): number {
  const index = Math.min(sorted.length - 1, Math.ceil(sorted.length * fraction) - 1);
  return sorted[Math.max(0, index)] ?? 0;
}

const rootKey = randomBytes(32);
const vault: KeyVault = createKeyVault({ rootKey, activeVersions: { field: 1, blind_index: 1 } });
const companyId = randomUUID();
const context = 'kd.field|invoice|notes|benchmark';

const sizes = [256, 4096, 65536, 1048576];
const samples: Sample[] = [];
for (const bytes of sizes) {
  const plaintext = 'a'.repeat(bytes);
  const envelope = vault.encrypt('field', plaintext, context);
  samples.push({
    name: 'seal',
    bytes,
    iterations: iterationsFor(bytes),
    run: () => {
      vault.encrypt('field', plaintext, context);
    },
  });
  samples.push({
    name: 'open',
    bytes,
    iterations: iterationsFor(bytes),
    run: () => {
      vault.decrypt(envelope, 'field', context);
    },
  });
}

let derivationVersion = 0;
samples.push({
  name: 'derive-key',
  bytes: 0,
  iterations: 500,
  run: () => {
    derivationVersion += 1;
    // A fresh vault has an empty cache, so each keyCheck derives a new key.
    createKeyVault({ rootKey, activeVersions: { field: 1, blind_index: 1 } }).keyCheck(
      'field',
      derivationVersion,
    );
  },
});

samples.push({
  name: 'blind-index',
  bytes: 32,
  iterations: 5000,
  run: () => {
    computeBlindIndex(vault, { companyId, field: 'email', value: 'alice@example.com' });
  },
});

start(async () => {
  write(
    `encryption:benchmark node=${process.version} platform=${process.platform} arch=${process.arch} cpus=${String(cpus().length)}`,
  );
  for (const sample of samples) {
    const durations = time(sample.iterations, sample.run);
    const median = percentile(durations, 0.5);
    const p95 = percentile(durations, 0.95);
    const size = sample.bytes === 0 ? 'n/a' : String(sample.bytes);
    const throughput =
      sample.bytes > 0 && median > 0
        ? ` mib_per_s=${(sample.bytes / (1024 * 1024) / (median / 1000)).toFixed(1)}`
        : '';
    write(
      `benchmark ${sample.name} bytes=${size} iterations=${String(sample.iterations)} median_ms=${median.toFixed(4)} p95_ms=${p95.toFixed(4)}${throughput}`,
    );
  }
  write('encryption:benchmark DONE');
});
