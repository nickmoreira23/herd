-- Cosmetic alignment of constraint names + equivalent metadata to Prisma's canonical DDL.
-- Refs: Roles & Permissions Fase 2, drift pre-flight.
-- Content: FK renames only (same columns / refs / ON DELETE), plus VARCHAR->TEXT on
-- organization_invitations.token, @updatedAt DROP DEFAULT (managed in app), and the
-- webhook_dedup.expires_at default expression. No ADD/DROP COLUMN, no table create/drop,
-- no FK semantic change. The tenant FK + parent_org index are preserved (now declared in
-- schema.prisma). Renames are metadata-only in Postgres; safe within the migration tx.

-- DropForeignKey
ALTER TABLE "audit_logs" DROP CONSTRAINT "audit_logs_actor_fkey";

-- DropForeignKey
ALTER TABLE "audit_logs" DROP CONSTRAINT "audit_logs_tenant_fkey";

-- DropForeignKey
ALTER TABLE "billing_customers" DROP CONSTRAINT "billing_customers_member_connection_fkey";

-- DropForeignKey
ALTER TABLE "billing_customers" DROP CONSTRAINT "billing_customers_provider_fkey";

-- DropForeignKey
ALTER TABLE "billing_customers" DROP CONSTRAINT "billing_customers_tenant_fkey";

-- DropForeignKey
ALTER TABLE "billing_events" DROP CONSTRAINT "billing_events_provider_fkey";

-- DropForeignKey
ALTER TABLE "billing_events" DROP CONSTRAINT "billing_events_tenant_fkey";

-- DropForeignKey
ALTER TABLE "charge_line_items" DROP CONSTRAINT "charge_line_items_charge_fkey";

-- DropForeignKey
ALTER TABLE "charge_line_items" DROP CONSTRAINT "charge_line_items_subscription_fkey";

-- DropForeignKey
ALTER TABLE "charge_line_items" DROP CONSTRAINT "charge_line_items_tenant_fkey";

-- DropForeignKey
ALTER TABLE "charges" DROP CONSTRAINT "charges_customer_fkey";

-- DropForeignKey
ALTER TABLE "charges" DROP CONSTRAINT "charges_payment_method_fkey";

-- DropForeignKey
ALTER TABLE "charges" DROP CONSTRAINT "charges_provider_fkey";

-- DropForeignKey
ALTER TABLE "charges" DROP CONSTRAINT "charges_tenant_fkey";

-- DropForeignKey
ALTER TABLE "dunning_attempts" DROP CONSTRAINT "dunning_attempts_charge_fkey";

-- DropForeignKey
ALTER TABLE "dunning_attempts" DROP CONSTRAINT "dunning_attempts_provider_fkey";

-- DropForeignKey
ALTER TABLE "dunning_attempts" DROP CONSTRAINT "dunning_attempts_tenant_fkey";

-- DropForeignKey
ALTER TABLE "invoices" DROP CONSTRAINT "invoices_charge_fkey";

-- DropForeignKey
ALTER TABLE "invoices" DROP CONSTRAINT "invoices_provider_fkey";

-- DropForeignKey
ALTER TABLE "invoices" DROP CONSTRAINT "invoices_tenant_fkey";

-- DropForeignKey
ALTER TABLE "membership_roles" DROP CONSTRAINT "membership_roles_member_id_fkey";

-- DropForeignKey
ALTER TABLE "organization_invitations" DROP CONSTRAINT "organization_invitations_created_by_id_fkey";

-- DropForeignKey
ALTER TABLE "organization_invitations" DROP CONSTRAINT "organization_invitations_organization_id_fkey";

-- DropForeignKey
ALTER TABLE "organization_members" DROP CONSTRAINT "organization_members_network_profile_id_fkey";

-- DropForeignKey
ALTER TABLE "organization_members" DROP CONSTRAINT "organization_members_organization_id_fkey";

-- DropForeignKey
ALTER TABLE "payment_methods" DROP CONSTRAINT "payment_methods_customer_fkey";

-- DropForeignKey
ALTER TABLE "payment_methods" DROP CONSTRAINT "payment_methods_provider_fkey";

-- DropForeignKey
ALTER TABLE "payment_methods" DROP CONSTRAINT "payment_methods_tenant_fkey";

-- DropForeignKey
ALTER TABLE "payment_providers" DROP CONSTRAINT "payment_providers_tenant_fkey";

-- DropForeignKey
ALTER TABLE "portal_sessions" DROP CONSTRAINT "portal_sessions_customer_fkey";

-- DropForeignKey
ALTER TABLE "portal_sessions" DROP CONSTRAINT "portal_sessions_provider_fkey";

-- DropForeignKey
ALTER TABLE "portal_sessions" DROP CONSTRAINT "portal_sessions_tenant_fkey";

-- DropForeignKey
ALTER TABLE "refunds" DROP CONSTRAINT "refunds_charge_fkey";

-- DropForeignKey
ALTER TABLE "refunds" DROP CONSTRAINT "refunds_provider_fkey";

-- DropForeignKey
ALTER TABLE "refunds" DROP CONSTRAINT "refunds_tenant_fkey";

-- DropForeignKey
ALTER TABLE "subscriptions" DROP CONSTRAINT "subscriptions_customer_fkey";

-- DropForeignKey
ALTER TABLE "subscriptions" DROP CONSTRAINT "subscriptions_payment_method_fkey";

-- DropForeignKey
ALTER TABLE "subscriptions" DROP CONSTRAINT "subscriptions_provider_fkey";

-- DropForeignKey
ALTER TABLE "subscriptions" DROP CONSTRAINT "subscriptions_tenant_fkey";

-- DropForeignKey
ALTER TABLE "subscriptions" DROP CONSTRAINT "subscriptions_tier_fkey";

-- AlterTable
ALTER TABLE "organization_invitations" ALTER COLUMN "token" SET DATA TYPE TEXT,
ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "organization_location" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "organization_members" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "webhook_dedup" ALTER COLUMN "expires_at" SET DEFAULT (now() + INTERVAL '30 days');

-- AddForeignKey
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_network_profile_id_fkey" FOREIGN KEY ("network_profile_id") REFERENCES "network_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membership_roles" ADD CONSTRAINT "membership_roles_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "organization_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_invitations" ADD CONSTRAINT "organization_invitations_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_invitations" ADD CONSTRAINT "organization_invitations_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "network_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_providers" ADD CONSTRAINT "payment_providers_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "billing_customers" ADD CONSTRAINT "billing_customers_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "billing_customers" ADD CONSTRAINT "billing_customers_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "payment_providers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "billing_customers" ADD CONSTRAINT "billing_customers_member_connection_id_fkey" FOREIGN KEY ("member_connection_id") REFERENCES "member_connections"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_methods" ADD CONSTRAINT "payment_methods_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_methods" ADD CONSTRAINT "payment_methods_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "payment_providers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_methods" ADD CONSTRAINT "payment_methods_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "billing_customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "payment_providers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "billing_customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_payment_method_id_fkey" FOREIGN KEY ("payment_method_id") REFERENCES "payment_methods"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_tier_id_fkey" FOREIGN KEY ("tier_id") REFERENCES "SubscriptionTier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "charges" ADD CONSTRAINT "charges_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "charges" ADD CONSTRAINT "charges_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "payment_providers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "charges" ADD CONSTRAINT "charges_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "billing_customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "charges" ADD CONSTRAINT "charges_payment_method_id_fkey" FOREIGN KEY ("payment_method_id") REFERENCES "payment_methods"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "charge_line_items" ADD CONSTRAINT "charge_line_items_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "charge_line_items" ADD CONSTRAINT "charge_line_items_charge_id_fkey" FOREIGN KEY ("charge_id") REFERENCES "charges"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "charge_line_items" ADD CONSTRAINT "charge_line_items_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "payment_providers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_charge_id_fkey" FOREIGN KEY ("charge_id") REFERENCES "charges"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "payment_providers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_charge_id_fkey" FOREIGN KEY ("charge_id") REFERENCES "charges"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dunning_attempts" ADD CONSTRAINT "dunning_attempts_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dunning_attempts" ADD CONSTRAINT "dunning_attempts_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "payment_providers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dunning_attempts" ADD CONSTRAINT "dunning_attempts_charge_id_fkey" FOREIGN KEY ("charge_id") REFERENCES "charges"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portal_sessions" ADD CONSTRAINT "portal_sessions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portal_sessions" ADD CONSTRAINT "portal_sessions_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "payment_providers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portal_sessions" ADD CONSTRAINT "portal_sessions_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "billing_customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "billing_events" ADD CONSTRAINT "billing_events_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "billing_events" ADD CONSTRAINT "billing_events_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "payment_providers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_profile_id_fkey" FOREIGN KEY ("actor_profile_id") REFERENCES "network_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "departments_tenantId_slug_key" RENAME TO "departments_tenant_id_slug_key";
