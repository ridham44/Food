export interface CartItem {
  /** Menu item id, or combo id when isCombo is true. Cart-local uniqueness key. */
  id: string;
  isCombo: boolean;
  name: string;
  price: number;
  image: string | null;
  quantity: number;
  specialInstruction?: string;
}
