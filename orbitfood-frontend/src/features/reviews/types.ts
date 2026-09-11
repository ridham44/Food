export interface MenuReviewInput {
  menuId: string;
  comboItemMenuId?: string;
  rating: number;
  review?: string;
}

export interface SubmitReviewsInput {
  orderId: string;
  reviews: MenuReviewInput[];
}

export interface SubmitReviewResultRow {
  menuId: string;
  comboItemMenuId?: string;
  status: string;
}

export interface SubmitReviewsResult {
  message: string;
  result: SubmitReviewResultRow[];
}
