// path: scripts/encryption/rotation-rehearsal.ts
/**
 * encryption:rotation:rehearse -- run the key rotation path in memory.
 *
 * It uses a random root key that exists only for the run, and no database. It
 * proves the rules a rotation depends on, so a regression fails here before a
 * deploy:
 *
 *   - the root key is accepted only as 32 random bytes in canonical base64;
 *   - values written under version 1 open under version 2 and re-encrypt to it,
 *     and a second pass changes nothing;
 *   - a tampered ciphertext, a wrong context, a wrong purpose and a forged
 *     version header all fail to open;
 *   - the key check differs by version and purpose, and matches under one root;
 *   - the blind index is stable, scoped by company and field, and versioned;
 *   - rotation falls due at the interval (inclusive), and annual cadence is allowed;
 *   - re-encryption batches cover every row once;
 *   - a log line for an envelope shows the header and never the body.
 *
 * Exit 1 when any case fails. Key material and plaintext are never printed.
 */
import { randomBytes, randomUUID } from 'node:crypto';

import { ENCRYPTION_CONFIG } from '../../config/encryption';
import { computeBlindIndex, parseBlindIndex } from '../../lib/encryption/blind-index';
import {
  needsReencryption,
  reencryptEnvelope,
  rotationBatches,
  rotationStatus,
} from '../../lib/encryption/key-rotation';
import { createKeyVault } from '../../lib/encryption/key-vault';
import { describeEnvelope } from '../../lib/encryption/pii-redaction';
import { decodeRootKey } from '../../lib/encryption/root-key';

import { start, write } from './_shared';

const DAY_MS = 86_400_000;
const BASE64_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

interface RehearsalCase {
  readonly name: string;
  readonly run: () => void;
}

function expect(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function expectThrows(action: () => unknown, message: string): void {
  let threw = false;
  try {
    action();
  } catch {
    threw = true;
  }
  expect(threw, message);
}

const rootKey = randomBytes(ENCRYPTION_CONFIG.rootKeyBytes);
const vaultV1 = createKeyVault({ rootKey, activeVersions: { field: 1, blind_index: 1 } });
const vaultV2 = createKeyVault({ rootKey, activeVersions: { field: 2, blind_index: 1 } });
const vaultBlindV2 = createKeyVault({ rootKey, activeVersions: { field: 2, blind_index: 2 } });
const companyId = randomUUID();
const otherCompanyId = randomUUID();
const samples = Array.from(
  { length: 50 },
  (_, row) => `Sample value ${String(row)} with an accent \u00e9`,
);
const contextFor = (row: number): string => `kd.field|invoice|email|${String(row)}`;

const cases: RehearsalCase[] = [
  {
    name: 'root key is accepted only as 32 random bytes in canonical base64',
    run: () => {
      const valid = randomBytes(32).toString('base64');
      expect(decodeRootKey(valid) !== null, 'a 32-byte base64 key was refused');
      expect(
        decodeRootKey(randomBytes(31).toString('base64')) === null,
        'a 31-byte key was accepted',
      );
      expect(decodeRootKey('correct horse battery staple') === null, 'a passphrase was accepted');
      expect(decodeRootKey('') === null, 'an empty key was accepted');
      // Flip a padding bit of the last data character: the same bytes, a different
      // spelling. The canonical re-encode check must refuse it.
      const index = BASE64_ALPHABET.indexOf(valid.charAt(42));
      const altered = valid.slice(0, 42) + BASE64_ALPHABET.charAt(index ^ 1) + valid.slice(43);
      expect(decodeRootKey(altered) === null, 'a non-canonical spelling of a key was accepted');
    },
  },
  {
    name: 'values written under version 1 open under version 2 and re-encrypt to it',
    run: () => {
      const stored = samples.map((plain, row) => vaultV1.encrypt('field', plain, contextFor(row)));
      stored.forEach((envelope, row) => {
        expect(vaultV1.keyVersionOf(envelope) === 1, 'a version 1 write did not name version 1');
        expect(
          vaultV2.decrypt(envelope, 'field', contextFor(row)) === samples[row],
          'a version 1 value did not open under the rotated vault',
        );
        expect(needsReencryption(vaultV2, envelope, 'field'), 'a version 1 value was not flagged');
      });
      const once = stored.map((envelope, row) =>
        reencryptEnvelope(vaultV2, envelope, 'field', contextFor(row)),
      );
      once.forEach((result, row) => {
        expect(result.changed, 'a version 1 value was not re-encrypted');
        expect(
          vaultV2.keyVersionOf(result.envelope) === 2,
          'a re-encrypted value is not version 2',
        );
        expect(
          vaultV2.decrypt(result.envelope, 'field', contextFor(row)) === samples[row],
          'a re-encrypted value changed its plaintext',
        );
      });
      const twice = once.map((result, row) =>
        reencryptEnvelope(vaultV2, result.envelope, 'field', contextFor(row)),
      );
      expect(
        twice.every((result, row) => !result.changed && result.envelope === once[row]?.envelope),
        'a second re-encryption pass changed values',
      );
    },
  },
  {
    name: 'tampering, a wrong context, a wrong purpose and a forged version all fail to open',
    run: () => {
      const envelope = vaultV2.encrypt('field', 'secret value', contextFor(1));
      const parts = envelope.split('.');
      const ciphertext = parts[6] ?? '';
      expect(ciphertext.length > 0, 'the test envelope has no ciphertext');
      const tampered = [
        ...parts.slice(0, 6),
        `${ciphertext.charAt(0) === 'A' ? 'B' : 'A'}${ciphertext.slice(1)}`,
      ];
      expectThrows(
        () => vaultV2.decrypt(tampered.join('.'), 'field', contextFor(1)),
        'a tampered value opened',
      );
      expectThrows(
        () => vaultV2.decrypt(envelope, 'field', contextFor(2)),
        'a value opened under another context',
      );
      expectThrows(
        () => vaultV2.decrypt(envelope, 'blind_index', contextFor(1)),
        'a value opened under another purpose',
      );
      const forged = [...parts.slice(0, 3), '1', ...parts.slice(4)];
      expectThrows(
        () => vaultV2.decrypt(forged.join('.'), 'field', contextFor(1)),
        'a forged version header opened',
      );
      expectThrows(
        () =>
          vaultV2.encrypt(
            'field',
            'x'.repeat(ENCRYPTION_CONFIG.maxPlaintextBytes + 1),
            contextFor(1),
          ),
        'a plaintext above the field limit was accepted',
      );
      expectThrows(
        () => vaultV2.encrypt('field', 'x', 'c'.repeat(ENCRYPTION_CONFIG.maxContextLength + 1)),
        'a context above the length limit was accepted',
      );
    },
  },
  {
    name: 'key checks differ by version and purpose and match under one root',
    run: () => {
      expect(
        vaultV1.keyCheck('field', 1) === vaultV2.keyCheck('field', 1),
        'the same version under one root gave different key checks',
      );
      expect(
        vaultV1.keyCheck('field', 1) !== vaultV2.keyCheck('field', 2),
        'two versions gave the same key check',
      );
      expect(
        vaultV1.keyCheck('field', 1) !== vaultV1.keyCheck('blind_index', 1),
        'two purposes gave the same key check',
      );
      expectThrows(
        () => vaultV1.mac('field', 1, 'message'),
        'the MAC was available to the field purpose',
      );
    },
  },
  {
    name: 'blind index is stable, scoped by company and field, and carries its version',
    run: () => {
      const input = { companyId, field: 'email', value: '  Alice@Example.com ' };
      const token = computeBlindIndex(vaultV1, input);
      const same = computeBlindIndex(vaultV1, { ...input, value: 'alice@example.com' });
      expect(token === same, 'the same value in another form gave a different token');
      expect(
        token !== computeBlindIndex(vaultV1, { ...input, companyId: otherCompanyId }),
        'the same value in another company gave the same token',
      );
      expect(
        token !== computeBlindIndex(vaultV1, { ...input, field: 'contact_email' }),
        'the same value in another field gave the same token',
      );
      expect(parseBlindIndex(token)?.keyVersion === 1, 'the token does not carry version 1');
      expectThrows(
        () => computeBlindIndex(vaultV1, { ...input, value: '   ' }),
        'an empty value produced a token',
      );
      const rotated = computeBlindIndex(vaultBlindV2, input);
      expect(
        parseBlindIndex(rotated)?.keyVersion === 2,
        'a rotated token does not carry version 2',
      );
      expect(
        parseBlindIndex(rotated)?.digest !== parseBlindIndex(token)?.digest,
        'a rotated blind index kept the old digest',
      );
    },
  },
  {
    name: 'rotation falls due at the interval, inclusive, and annual cadence is allowed',
    run: () => {
      const now = new Date('2026-10-18T00:00:00Z');
      const days = (count: number): Date => new Date(now.getTime() - count * DAY_MS);
      const interval = ENCRYPTION_CONFIG.rotationIntervalDays;
      const atBoundary = rotationStatus(
        { purpose: 'field', keyVersion: 1, activatedAt: days(interval) },
        now,
      );
      expect(
        atBoundary.due && atBoundary.daysRemaining === 0,
        'rotation was not due at the interval',
      );
      const beforeBoundary = rotationStatus(
        { purpose: 'field', keyVersion: 1, activatedAt: days(interval - 1) },
        now,
      );
      expect(!beforeBoundary.due && beforeBoundary.daysRemaining === 1, 'rotation was due early');
      const annual = rotationStatus(
        { purpose: 'field', keyVersion: 1, activatedAt: days(interval) },
        now,
        365,
      );
      expect(!annual.due, 'an annual interval fell due at 90 days');
      expectThrows(
        () => rotationStatus({ purpose: 'field', keyVersion: 1, activatedAt: days(1) }, now, 0),
        'an interval of 0 days was accepted',
      );
      expectThrows(
        () => rotationStatus({ purpose: 'field', keyVersion: 1, activatedAt: days(1) }, now, 400),
        'an interval above 365 days was accepted',
      );
    },
  },
  {
    name: 're-encryption batches cover every row exactly once',
    run: () => {
      expect(rotationBatches(0).length === 0, 'an empty table produced batches');
      const batches = rotationBatches(1234);
      const covered = batches.reduce((sum, [, limit]) => sum + limit, 0);
      expect(covered === 1234, 'the batches do not cover the rows');
      batches.forEach(([offset, limit], index) => {
        expect(limit <= ENCRYPTION_CONFIG.rotationBatchSize, 'a batch is larger than the limit');
        expect(
          offset === index * ENCRYPTION_CONFIG.rotationBatchSize,
          'a batch offset is not contiguous',
        );
      });
    },
  },
  {
    name: 'an envelope in a log shows its header and never its body',
    run: () => {
      const envelope = vaultV2.encrypt('field', 'private value', contextFor(3));
      const described = describeEnvelope(envelope);
      expect(described === 'kdenc.v1.field.2.[REDACTED]', 'the envelope header was not described');
      const body = envelope.split('.').slice(4).join('.');
      expect(!described.includes(body), 'the envelope body appeared in the description');
      expect(describeEnvelope('plain text') === '[REDACTED]', 'a non-envelope was not masked');
    },
  },
];

start(async () => {
  let failures = 0;
  for (const rehearsal of cases) {
    try {
      rehearsal.run();
      write(`PASS ${rehearsal.name}`);
    } catch (error) {
      failures += 1;
      const message = error instanceof Error ? error.message : String(error);
      write(`FAIL ${rehearsal.name}: ${message}`);
    }
  }
  if (failures > 0) {
    process.stderr.write(
      `encryption:rotation:rehearse FAIL (${String(failures)} of ${String(cases.length)} cases)\n`,
    );
    process.exitCode = 1;
    return;
  }
  write(
    `encryption:rotation:rehearse PASS (${String(cases.length)} cases, in memory, no database)`,
  );
});
