export interface Restaurant {
  id: string;
  companyName: string;
  contactPerson: string | null;
  mobile: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  countryId: string | null;
  stateId: string | null;
  cityId: string | null;
  zipCode: string | null;
  frontImage: string | null;
  website: string | null;
  isOpen: boolean;
  openingTime: string | null;
  closingTime: string | null;
  acceptOrders: boolean;
}

/** One row of the flat menu list returned by GET /menu-customer/:tenantId. */
export interface MenuCategoryItem {
  id: string;
  /** Menu category id. null means uncategorized — there is no separate categories endpoint to resolve a label from. */
  parentId: string | null;
  name: string;
  price: number;
  filePath: string | null;
  description: string | null;
}

export interface RestaurantMenuTenant {
  companyName: string;
  mobile: string | null;
  email: string | null;
  contactPerson: string | null;
  address: string | null;
}

export interface RestaurantMenuResponse {
  Tenant: RestaurantMenuTenant;
  menu: MenuCategoryItem[];
}
