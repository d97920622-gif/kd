-- path: scripts/db/sql/check-rls-isolation.sql
--
-- The live isolation assertion (sub-step 2.7), run by `npm run db:assert`.
-- It calls rls_isolation_violations(), which runs as kd_app against the live
-- data: an anonymous caller, each tenant, and each user. It returns one row for
-- every row a request can see that it must not. Zero rows means zero
-- cross-tenant rows. The caller must be a superuser or a member of kd_app,
-- because the function switches role to kd_app.

SELECT rule, object, detail
FROM rls_isolation_violations()
ORDER BY rule, object, detail;
