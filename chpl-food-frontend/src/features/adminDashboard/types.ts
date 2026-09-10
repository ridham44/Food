export interface AdminDashboardSummary {
  totalTenants: number;
  pendingTenants: number;
  approvedTenants: number;
  rejectedTenants: number;
  totalCustomers: number;
  todayOrders: number;
  todayOrdersChangePct: number;
  todayRevenue: number;
  todayRevenueChangePct: number;
  totalRevenue: number;
}
