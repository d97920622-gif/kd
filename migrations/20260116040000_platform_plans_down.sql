-- path: migrations/20260116040000_platform_plans_down.sql
--
-- Rollback for the plan catalog. plan_features references plans; the second
-- half of the sub-step (subscriptions, entitlements, coupons,
-- coupon_redemptions) references plans and is reverted first because it
-- carries the later timestamp. No CASCADE.

DROP TABLE IF EXISTS feature_flags;

DROP TABLE IF EXISTS plan_features;

DROP TABLE IF EXISTS plans;
