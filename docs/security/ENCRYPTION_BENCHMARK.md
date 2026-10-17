// path: docs/security/ENCRYPTION_BENCHMARK.md

# Encryption core benchmark

Sub-step 2.9 deliverable (`docs/PLAN/08_SUBSTEP_CHECKLISTS.md`: "benchmark doc").
The benchmark is `scripts/encryption/benchmark.ts`, run with
`npm run encryption:benchmark`. It is informational and is not a gate in
`npm run verify`, because timings depend on the machine.

## What it measures

- `seal` and `open`: `vault.encrypt` and `vault.decrypt` for one field, at 256
  bytes, 4 KiB, 64 KiB and 1 MiB (the field limit). Each is AES-256-GCM with a
  fresh 96-bit nonce, a 128-bit tag, and the envelope header and context as
  associated data. The envelope is parsed and re-encoded on each call.
- `derive-key`: one cold HKDF-SHA256 derivation, with a fresh vault so nothing is
  cached. The vault caches each derived key for the life of the process, so this
  cost is paid once per purpose and version.
- `blind-index`: one blind index token for a short email-like value, including
  the normalisation.

Each row gives the median and the 95th percentile of its iterations, in
milliseconds. Throughput is given for the sizes where it is meaningful.

## How to run it

```
npm run encryption:benchmark
```

It uses a random in-memory root key and touches no database. It takes a few
seconds on a laptop.

## Recorded run

Date: 2026-10-18. Environment: sandbox, Node v22.22.3, Linux x64, 2 CPUs. The
root key was random and in memory.

| Operation   | Bytes   | Iterations | Median (ms) | p95 (ms) | Throughput (MiB/s) |
| ----------- | ------- | ---------- | ----------- | -------- | ------------------ |
| seal        | 256     | 2000       | 0.0086      | 0.0169   | 28.4               |
| open        | 256     | 2000       | 0.0084      | 0.0179   | 29.2               |
| seal        | 4096    | 2000       | 0.0134      | 0.0315   | 291.8              |
| open        | 4096    | 2000       | 0.0158      | 0.0434   | 247.0              |
| seal        | 65536   | 500        | 0.0420      | 0.1467   | 1489.2             |
| open        | 65536   | 500        | 0.1320      | 0.1856   | 473.5              |
| seal        | 1048576 | 60         | 1.4277      | 3.5693   | 700.4              |
| open        | 1048576 | 60         | 2.3570      | 4.9803   | 424.3              |
| derive-key  | n/a     | 500        | 0.0113      | 0.0240   | n/a                |
| blind-index | 32      | 5000       | 0.0027      | 0.0034   | 11.5               |

## Reading the numbers

- A typical field (a name, an email, a bank reference) is a few hundred bytes.
  At that size one seal or open is under a tenth of a millisecond on this
  machine, so the cipher is not the cost of a request.
- The 1 MiB row is the worst case the field limit allows. A single megabyte
  field costs a few milliseconds, so large content should not be stored as an
  encrypted field.
- A cold derivation costs about 0.01 ms and is cached per vault, so it does not
  add to each request.
- The 95th percentile at small sizes is two to three times the median. The likely
  cause is scheduler noise on a shared 2-CPU sandbox. This run did not isolate it.

## What the benchmark does not show

- It is one machine and one run. A production capacity figure needs a run on
  the production instance class, and that run is not in this document.
- It measures the cipher and the envelope only. The database round trip, row
  locking and the audit trigger on each write are measured with the step that
  stores encrypted fields.
- No budget is set. A regression is judged against the recorded run on the same
  class of machine, not against an absolute number.
