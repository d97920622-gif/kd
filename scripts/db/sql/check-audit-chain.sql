-- path: scripts/db/sql/check-audit-chain.sql
--
-- The hash chain assertion (sub-step 2.8), run by `npm run db:assert`. It calls
-- audit_verify_chain(), which recomputes every row's hash from its content,
-- checks the sequence and the link to the row before, and recomputes every
-- Merkle root. It reads the ledger, not the migration files, so a row changed
-- or removed by any route is found here.
--
-- The query returns one row per violation and no row when the chain verifies:
--   rule    the rule that was broken (sequence_gap, chain_link_broken,
--           hash_mismatch, chain_truncated, merkle_leaf_count_mismatch,
--           merkle_root_mismatch)
--   object  the ledger row or the Merkle root the violation is about
--   detail  what was found, in one sentence
--
-- Signatures are not checked here. The signing key is not in the database, so
-- signature verification is a separate command: `npm run db:audit:verify`.

SELECT rule, object, detail
FROM audit_verify_chain()
ORDER BY object, rule;
