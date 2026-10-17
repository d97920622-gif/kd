-- path: migrations/20260116040100_platform_billing_down.sql
--
-- Rollback for the subscription, entitlement and coupon storage. Reverse
-- dependency order: coupon_redemptions references coupons and subscriptions;
-- entitlements reference subscriptions. No CASCADE.

DROP TABLE IF EXISTS coupon_redemptions;

DROP TABLE IF EXISTS entitlements;

DROP TABLE IF EXISTS coupons;

DROP TABLE IF EXISTS subscriptions;
