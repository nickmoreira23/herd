import type { PerkFormState } from "./perk-detail-client";

export interface PerkPreset {
  name: string;
  icon: string;
  description: string;
  category: string;
  defaults: Partial<PerkFormState>;
}

export const PERK_PRESETS: PerkPreset[] = [
  // Shipping & Delivery
  {
    name: "Free Shipping",
    icon: "Truck",
    description: "Free standard shipping on all orders.",
    category: "Shipping & Delivery",
    defaults: {
      name: "Free Shipping",
      icon: "Truck",
      description: "Free standard shipping on all orders.",
      tags: "shipping, delivery",
    },
  },
  {
    name: "Priority Shipping",
    icon: "Zap",
    description: "Expedited shipping at no extra cost.",
    category: "Shipping & Delivery",
    defaults: {
      name: "Priority Shipping",
      icon: "Zap",
      description: "Expedited shipping at no extra cost.",
      tags: "shipping, priority, delivery",
    },
  },

  // Discounts & Credits
  {
    name: "Member Discount",
    icon: "Percent",
    description: "Exclusive percentage discount on all products.",
    category: "Discounts & Credits",
    defaults: {
      name: "Member Discount",
      icon: "Percent",
      description: "Exclusive percentage discount on all products.",
      tags: "discount, savings",
      hasSubConfig: true,
      subConfigLabel: "Discount (%)",
      subConfigType: "number",
    },
  },
  {
    name: "Monthly Credits",
    icon: "CreditCard",
    description: "Store credits applied to your account each month.",
    category: "Discounts & Credits",
    defaults: {
      name: "Monthly Credits",
      icon: "CreditCard",
      description: "Store credits applied to your account each month.",
      tags: "credits, monthly, savings",
      hasSubConfig: true,
      subConfigLabel: "Amount ($)",
      subConfigType: "number",
    },
  },
  {
    name: "Birthday Reward",
    icon: "Cake",
    description: "Special reward or discount during your birthday month.",
    category: "Discounts & Credits",
    defaults: {
      name: "Birthday Reward",
      icon: "Cake",
      description: "Special reward or discount during your birthday month.",
      tags: "birthday, reward, special",
    },
  },

  // Access & Exclusivity
  {
    name: "Early Access",
    icon: "Clock",
    description: "Get first access to new product launches before anyone else.",
    category: "Access & Exclusivity",
    defaults: {
      name: "Early Access",
      icon: "Clock",
      description: "Get first access to new product launches before anyone else.",
      tags: "access, early, exclusive",
    },
  },
  {
    name: "Exclusive Products",
    icon: "Lock",
    description: "Access to members-only products not available to the public.",
    category: "Access & Exclusivity",
    defaults: {
      name: "Exclusive Products",
      icon: "Lock",
      description: "Access to members-only products not available to the public.",
      tags: "exclusive, products, members-only",
    },
  },
  {
    name: "VIP Events",
    icon: "Star",
    description: "Invitation to exclusive VIP events and experiences.",
    category: "Access & Exclusivity",
    defaults: {
      name: "VIP Events",
      icon: "Star",
      description: "Invitation to exclusive VIP events and experiences.",
      tags: "vip, events, exclusive",
    },
  },

  // Support & Service
  {
    name: "Priority Support",
    icon: "Headphones",
    description: "Jump the queue with dedicated priority customer support.",
    category: "Support & Service",
    defaults: {
      name: "Priority Support",
      icon: "Headphones",
      description: "Jump the queue with dedicated priority customer support.",
      tags: "support, priority, service",
    },
  },
  {
    name: "Free Returns",
    icon: "RotateCcw",
    description: "Hassle-free returns at no cost.",
    category: "Support & Service",
    defaults: {
      name: "Free Returns",
      icon: "RotateCcw",
      description: "Hassle-free returns at no cost.",
      tags: "returns, free, service",
    },
  },
  {
    name: "Extended Warranty",
    icon: "Shield",
    description: "Extended warranty coverage on all purchases.",
    category: "Support & Service",
    defaults: {
      name: "Extended Warranty",
      icon: "Shield",
      description: "Extended warranty coverage on all purchases.",
      tags: "warranty, protection, service",
    },
  },

  // Rewards & Points
  {
    name: "Bonus Points",
    icon: "Trophy",
    description: "Earn extra reward points on every purchase.",
    category: "Rewards & Points",
    defaults: {
      name: "Bonus Points",
      icon: "Trophy",
      description: "Earn extra reward points on every purchase.",
      tags: "points, rewards, bonus",
      hasSubConfig: true,
      subConfigLabel: "Multiplier (x)",
      subConfigType: "number",
    },
  },
  {
    name: "Referral Bonus",
    icon: "UserPlus",
    description: "Earn rewards when you refer friends to join.",
    category: "Rewards & Points",
    defaults: {
      name: "Referral Bonus",
      icon: "UserPlus",
      description: "Earn rewards when you refer friends to join.",
      tags: "referral, bonus, rewards",
    },
  },

  // Gifts & Samples
  {
    name: "Welcome Gift",
    icon: "Gift",
    description: "Receive a complimentary gift when you join.",
    category: "Gifts & Samples",
    defaults: {
      name: "Welcome Gift",
      icon: "Gift",
      description: "Receive a complimentary gift when you join.",
      tags: "gift, welcome, onboarding",
    },
  },
  {
    name: "Free Samples",
    icon: "Package",
    description: "Complimentary product samples included with orders.",
    category: "Gifts & Samples",
    defaults: {
      name: "Free Samples",
      icon: "Package",
      description: "Complimentary product samples included with orders.",
      tags: "samples, free, products",
    },
  },
];

export const PERK_CATEGORIES = [...new Set(PERK_PRESETS.map((p) => p.category))];
