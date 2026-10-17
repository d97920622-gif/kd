// path: docs/security/ENCRYPTION_KEY_ROTATION.md

# Encryption key rotation runbook

Owner: the platform team. Scope: the encryption core of sub-step 2.9
(`lib/encryption/`, `config/encryption.ts`, `encryption_key_versions`). Per-tenant
data keys are sub-step 2.10 and have their own runbook.

## 1. The keys

| Key               | Source                              | Rotates?                                |
| ----------------- | ----------------------------------- | --------------------------------------- |
| Root key          | `ENCRYPTION_KEY` in the environment | No. FEATURE_LIST item 3188.             |
| `field` version N | HKDF of the root, one per version   | Yes. A new version is a new derivation. |
| `blind_index` vN  | HKDF of the root, one per version   | Yes. Same mechanism.                    |

The root key is 32 random bytes in canonical base64 (44 characters with one
`=`). Generate it with `openssl rand -base64 32`. A passphrase is refused.
Derived keys use HKDF-SHA256 with the salt `kd.encryption.v1` and an info string
that names the purpose and version.

Every encrypted value is an envelope, `kdenc.v1.<purpose>.<version>.<iv>.<tag>.<ciphertext>`.
The version tag is in the clear, so any value can be opened after a rotation,
and an operator can count how many values still use an old version. This is
FEATURE_LIST item 3190. The associated data binds the header and the caller's
context, so a value moved to another row or column does not open.

Blind indexes are `v<version>:<64 hex>`. The version tag lets a rotation tell an
old token from a current one.

## 2. Why rotation is zero downtime

- New writes use the active version recorded in config
  (`ENCRYPTION_CONFIG.activeVersions`).
- Reads open any version the root derives. Nothing is deleted when a version
  retires, so an old value stays readable until it is re-encrypted.
- The database keeps one active row per purpose. Activation runs under a
  per-purpose advisory lock, so two rotations cannot both claim the next number.
- A re-encryption job runs in batches of `rotationBatchSize` (500) and each value
  is opened again before its new envelope is saved. A value that does not
  round-trip is kept as it was.

No request waits for a rotation. The only lock is the short advisory lock taken
during activation.

## 3. Bootstrap (first deploy only)

1. Generate the root key and store it in the deployment secret store as
   `ENCRYPTION_KEY`. Never commit it, never paste it into a ticket.
2. Run `npm run db:migrate`. This creates `encryption_key_versions` (sub-step 2.9).
3. Record version 1 for each purpose. The root key must be set in the same shell:

   ```
   npm run encryption:key:activate -- --purpose field --version 1 --reason "bootstrap field key"
   npm run encryption:key:activate -- --purpose blind_index --version 1 --reason "bootstrap blind index key"
   ```

4. Confirm the record matches the config and the root key:

   ```
   npm run encryption:ledger:check
   ```

`encryption:ledger:check` fails while a purpose has no recorded version. A first
deploy therefore cannot start encrypting values before the bootstrap is done.

## 4. Routine rotation

Run this when rotation is due (section 5) or when the root key's custodians
decide a new version is needed. It is the same for every purpose.

1. **Rehearse.** `npm run encryption:rotation:rehearse` must pass on the commit
   being deployed. It runs the rules in memory and touches no database.
2. **Activate the next version.** The number must be the current maximum plus
   one, or the database refuses it:

   ```
   npm run encryption:key:activate -- --purpose field --version 2 --reason "scheduled rotation"
   ```

   The database retires version 1 and records version 2 as active, in one
   transaction. Version 1 is kept, so its values still open.

3. **Deploy the same version.** Set `ENCRYPTION_CONFIG.activeVersions.field` to
   `2` in `config/encryption.ts` and release. Until this deploy, new writes still
   use version 1 and the ledger check fails on purpose. Do not skip the deploy.
4. **Check the ledger.** `npm run encryption:ledger:check` must pass against the
   release. It confirms one active version per purpose, that the config and the
   database agree, and that every key check matches the root key.
5. **Re-encrypt.** Each table that stores encrypted fields has a re-encryption
   job, added by the step that introduces the table. The job walks the rows in
   `rotationBatches()` ranges and calls `reencryptEnvelope()`, which returns a
   value unchanged when it already uses the active version. Re-running the job is
   safe.
6. **Confirm.** When the job has no value left on a retired version, the version
   can be archived. Archiving is a later decision and is not part of 2.9: no
   version is deleted by the current code.

A blind index is rotated the same way with `--purpose blind_index`. Its tokens
are recomputed from the plaintext, because a blind index cannot be re-encrypted
without the value. The job for that is part of the table's step.

## 5. Rotation cadence

`ENCRYPTION_CONFIG.rotationIntervalDays` is 90, from MASTER_PROMPT layer 4. The
interval is a whole number of days from 1 to 365. FEATURE_LIST item 3189 asks
for annual rotation, which the 365 bound supports. The value is an owner
decision recorded in the 2.9 evidence; until it is confirmed, the stricter 90
days applies.

`rotationStatus()` in `lib/encryption/key-rotation.ts` gives the due instant and
the whole days remaining for the active version. It is inclusive: at the due
instant the rotation is due.

## 6. Failure modes

| Symptom                                                                         | Meaning                                                                                          | Action                                                                                                 |
| ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------ |
| `ENCRYPTION_KEY is not set`                                                     | The environment has no root key.                                                                 | Set it from the secret store. Do not generate a new one, or every stored value is lost.                |
| `not 32 random bytes in canonical base64`                                       | The root key is malformed (a passphrase, a truncated value, or a value with a trailing space).   | Replace it with the value from the secret store. The message never shows the value.                    |
| `the next version for this purpose is N`                                        | Activation skipped or repeated a number.                                                         | Use the number the message names.                                                                      |
| `the database has version M active but config activates K`                      | The deploy and the activation are out of step.                                                   | Deploy the config that names M. An activation cannot be undone; a later activation only supersedes it. |
| `key check of version N does not match the environment root key`                | A different root key is deployed than the one activated.                                         | Stop the release. Restore the root key that was activated. Do not activate again.                      |
| `permission denied for function`                                                | The caller has no EXECUTE on activation (only `kd_app` has it).                                  | Run activation as a deployment role, not as the application role.                                      |
| `activation refused: the caller is neither a super_admin nor a deployment role` | `kd_app` without a super_admin session.                                                          | Same as above.                                                                                         |
| Decryption fails: `failed authentication`                                       | The value, its context or its purpose differs from when it was written, or the root key differs. | Check the caller passes the same context. A repeated failure on many values is an incident.            |

## 7. What is not covered

- **Root key rotation.** Not supported. Changing the root key would need every
  derived key re-derived and every value re-encrypted under a new root, and it
  has no procedure yet. FEATURE_LIST item 3188 says the root does not rotate.
- **Loss of the root key.** Every encrypted value becomes unreadable. Back up the
  root key in the secret store's own recovery process. The repository never holds it.
- **Rollback.** The down migration drops `encryption_key_versions`, and with it
  the record of which version is active. It is for a scratch database only. In
  production, roll forward with a new activation.
- **Database owner.** The activation function is SECURITY DEFINER and the table is
  forced under RLS, so the owner must hold BYPASSRLS, as the 2.7 and 2.8
  migrations already require.
