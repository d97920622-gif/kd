// path: docs/PLAN/chat-prompts/CHAT_07.md
# CHAT 07 OF 16 -- Storage Abstraction, File Security, File Records

Open a NEW chat and paste everything between the marker lines.
Prerequisite: Step 2 complete (runs after step 6 in the order).

=== BEGIN PASTE ===
You are continuing the KD SOLUTION IT platform build. This is CHAT 7 OF 16.
Step 7: Storage abstraction with Google Drive primary and Supabase Storage
fallback, file security pipeline and file records.

READ FIRST: 1. MASTER_PROMPT.md Rule 3 (data storage policy), security layer 7
(file upload security) and layer 8. 2. FEATURE_LIST.md Part 9 sections E, N
and O, Part 11 section B. 3. docs/PLAN/05_ADDITIONAL_REQUIREMENTS_SPEC.md
section A8 (file storage). 4. docs/PLAN/00_MASTER_EXECUTION_PLAN.md (your
migration window is 20260401000000 to 20260401999999). 5. docs/PLAN/
02_CONVENTIONS_AND_GUARDRAILS.md. 6. docs/PLAN/03_FILE_OWNERSHIP_MATRIX.md.
7. docs/PLAN/04_DEFINITION_OF_DONE_AND_GATES.md (step 7 gates).
8. docs/PLAN/08_SUBSTEP_CHECKLISTS.md section "STEP 07".
9. docs/handoffs/CHAT_06_COMPLETED.md.

SCOPE FOR THIS CHAT:
- 7.1 files table with storage_provider, company integration flags, provider
  capabilities, content hash, key version, retention metadata.
- 7.2 Adapter base and Google Drive adapter: service account OAuth2, per-tenant
  folder structure /tenants/{company_id}/{category}/, resumable upload,
  quota monitoring, retry on rate limit.
- 7.3 Supabase Storage adapter, runtime provider resolver per company,
  automatic failover when the preferred provider is unavailable, provider
  health checks.
- 7.4 Encryption pipeline: AES-256-GCM before upload, per-tenant key
  derivation, key version tagging, envelope format, decryption service,
  zero-knowledge notes documented.
- 7.5 Upload pipeline: magic byte verification, extension and MIME
  cross-check, per-type size limits (image 5MB, PDF 10MB, KYC 5MB), zip bomb
  and polyglot detection, EXIF and GPS stripping, image re-encode, SVG
  sanitization or rasterization, PDF JavaScript removal, Office macro removal,
  ClamAV hook, quarantine, per-tenant quota, upload rate limit, chunking with
  resume, client and server hash comparison, content hash duplicate detection.
- 7.6 Download pipeline: short-lived signed URLs (one hour), watermarking with
  tenant id on exports, access audit, download rate limit, hotlink prevention.
- 7.7 Lifecycle: retention policy enforcement, archival, deletion and restore,
  legal hold, trash view.
- 7.8 Provider migration tool: plan, move, verify checksum, switch provider
  pointer, audit entry, resume after failure, dry-run mode.
- 7.9 Module integration and media: invoice attachments, KYC documents,
  branding assets, payslips, dispute evidence, exports; AVIF and WebP
  derivatives, thumbnails, srcset support.
- 7.10 Admin surfaces: owner usage view, super_admin quarantine console,
  migration console, usage reports.

NON-NEGOTIABLE RULES: English and ASCII only; USD only where money appears;
no test files; no TODO, FIXME, "Coming Soon" or placeholders; no `any`; no
console.log; path comment on every file; Zod on client and server; sanitize
every filename and path, reject traversal, reject null bytes; RLS default-deny
on every table including files; audit entry for upload, download of sensitive
files, delete, restore, quarantine, provider switch and migration; secrets
(service account JSON, keys) encrypted with AES-256-GCM and never logged; no
direct Drive or Storage SDK calls outside the adapters; Zero Trust and Zero
Tolerance.

EXECUTION LOOP per sub-step: implement, migrate, run `npm run verify`, commit
as `<type>(step-07/S.S): <summary>`, update
`docs/handoffs/CHAT_07_PROGRESS.md`.

STEP 7 GATES: no file leaves the system unencrypted (assertion script);
provider failover proven by disabling the preferred provider in a controlled
run; provider migration round-trip verified with checksums; no PII in stored
filenames; every file row records storage_provider.

COMMIT AND PUSH POLICY: commit and push only to the branch this session is
already on. Never create, rename or switch branches.

END OF CHAT, MANDATORY: write docs/handoffs/CHAT_07_COMPLETED.md with scope,
sub-steps, files, migrations, env vars, decisions, evidence and the next
starting point.

RESUME INSTRUCTION: read docs/handoffs/CHAT_07_PROGRESS.md, continue from the
first unchecked sub-step, never re-implement an existing passing file.
=== END PASTE ===
