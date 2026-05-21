/**
 * Recharge API v2021-11 payload shapes.
 *
 * Reference: developer.rechargepayments.com/2021-11
 *
 * These interfaces describe the relevant subset of Recharge webhook
 * payloads consumed by `src/lib/mappers/recharge/`. Fields not used by
 * mappers are omitted from interfaces (full payload still preserved in
 * `provider_data` JSONB via mappers).
 */

export interface RechargeCustomerPayload {
  id: number;
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  hash?: string;
  status?: string;
  has_valid_payment_method?: boolean;
  external_customer_id?: { ecommerce?: string };
  created_at: string;
  updated_at: string;
}

export interface RechargeAddressPayload {
  address1?: string;
  address2?: string;
  city?: string;
  province?: string;
  zip?: string;
  country?: string;
  country_code?: string;
}

export interface RechargeSubscriptionPayload {
  id: number;
  customer_id: number;
  status: string; // "active" | "cancelled" | "expired"
  product_title?: string;
  variant_title?: string;
  shopify_product_id?: number;
  shopify_variant_id?: number;
  external_product_id?: { ecommerce?: string };
  external_variant_id?: { ecommerce?: string };
  quantity: number;
  price: string;
  presentment_currency?: string;
  order_interval_unit: string;
  order_interval_frequency: string;
  charge_interval_frequency: string;
  next_charge_scheduled_at?: string;
  cancelled_at?: string;
  cancellation_reason?: string;
  cancellation_reason_comments?: string;
  created_at: string;
  updated_at: string;
}

export interface RechargeChargeLineItemPayload {
  subscription_id?: number;
  purchase_item_id?: number;
  quantity: number;
  price: string;
  subtotal_price?: string;
  total_price?: string;
  title?: string;
  variant_title?: string;
  shopify_product_id?: number;
  shopify_variant_id?: number;
}

export interface RechargeChargePayload {
  id: number;
  customer: { id: number; email: string };
  status: string;
  total_price: string;
  subtotal_price?: string;
  total_tax?: string;
  total_discounts?: string;
  total_refunds?: string;
  currency: string;
  presentment_currency?: string;
  processor_name?: string;
  error_message?: string;
  error_type?: string;
  processed_at?: string;
  scheduled_at?: string;
  line_items: RechargeChargeLineItemPayload[];
  billing_address?: RechargeAddressPayload;
  shipping_address?: RechargeAddressPayload;
  created_at: string;
  updated_at: string;
}

export interface RechargeOrderPayload {
  id: number;
  customer_id: number;
  charge_id?: number;
  status: string;
  total_price: string;
  subtotal_price?: string;
  total_tax?: string;
  total_discounts?: string;
  currency: string;
  presentment_currency?: string;
  external_order_id?: { ecommerce?: string };
  external_order_number?: { ecommerce?: string };
  shipping_lines?: unknown[];
  line_items: RechargeChargeLineItemPayload[];
  billing_address?: RechargeAddressPayload;
  shipping_address?: RechargeAddressPayload;
  processed_at?: string;
  scheduled_at?: string;
  created_at: string;
  updated_at: string;
}

export interface RechargeRefundPayload {
  id: number;
  charge_id: number;
  amount: string;
  total_refund_amount?: string;
  reason?: string;
  processor_refund_id?: string;
  created_at: string;
  updated_at: string;
}

/** Discriminator for handler dispatch. */
export type RechargeWebhookTopic =
  | "customer/created" // skipped per Sub-etapa 10 decision
  | "customer/updated" // skipped per Sub-etapa 10 decision
  | "subscription/created"
  | "subscription/updated"
  | "subscription/cancelled"
  | "subscription/activated"
  | "charge/created"
  | "charge/paid"
  | "charge/succeeded" // fallback variant per Sub-etapa 10.0.2
  | "charge/failed"
  | "charge/refunded"
  | "order/created";
