export type CouponType = 'flat' | 'percent';

/** `GET /coupon/report` already renders these as human-readable strings. */
export type CouponPublicLabel = 'Yes' | 'No';
export type CouponActiveLabel = 'Active' | 'Inactive';

export interface CouponRedeemer {
  name: string;
  mobile: string;
}

/**
 * Raw shape as it comes back from `GET /coupon/report` / `GET /coupon/report/:id`.
 * MySQL DECIMAL columns are returned as strings even through normal Sequelize
 * queries, so every numeric field here is typed loosely and coerced with
 * `Number(...)` in couponsApi.ts before it reaches components.
 */
export interface CouponRaw {
  id: string;
  code: string;
  type: CouponType;
  value: string | number;
  maxUsage: string | number;
  totalRedeemed: string | number;
  remaining: string | number;
  minOrderAmount?: string | number | null;
  isPublic: CouponPublicLabel;
  isActive: CouponActiveLabel;
  validFrom: string;
  validTo: string;
  description?: string | null;
  users: CouponRedeemer[];
}

export interface Coupon {
  id: string;
  code: string;
  type: CouponType;
  value: number;
  maxUsage: number;
  totalRedeemed: number;
  remaining: number;
  minOrderAmount?: number;
  isPublic: CouponPublicLabel;
  isActive: CouponActiveLabel;
  validFrom: string;
  validTo: string;
  description?: string | null;
  users: CouponRedeemer[];
}

export interface CouponInput {
  code: string;
  type: CouponType;
  value: number;
  maxUsage: number;
  validFrom: string;
  validTo: string;
  isPublic?: boolean;
  description?: string;
  minOrderAmount?: number;
}

/** `PUT /coupon/:id` — the only mutable fields after creation. */
export interface CouponValidityInput {
  validTo?: string;
  isActive?: '0' | '1';
}
