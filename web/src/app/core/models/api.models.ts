export interface ApiResponse<T> {

  success: boolean;

  message?: string;

  data: T;

}



/** Spring Data Page JSON shape */

export interface Page<T> {

  content: T[];

  totalElements: number;

  totalPages: number;

  number: number;

  size: number;

  first: boolean;

  last: boolean;

  empty: boolean;

}



export interface User {

  id: string;

  email: string;

  fullName: string;

  role: string;

  authProvider: string;

  profilePictureUrl?: string;

  locale: string;

  theme: string;

  calendarSystem?: 'ethiopian' | 'gregorian';

  active?: boolean;

}



export type SubscriptionPlan = 'starter' | 'business' | 'pro';

export interface RegisterResponse {
  email: string;
  verificationRequired: boolean;
  message: string;
}

export interface AuthResponse {

  accessToken: string;

  refreshToken: string;

  expiresIn: number;

  user: User;

  businessId?: string;

  businessName?: string;

  subscriptionPlan?: SubscriptionPlan;

  subscriptionActive?: boolean;

}

export interface AdminAccount {
  userId: string;
  email: string;
  phone?: string;
  fullName: string;
  userActive: boolean;
  businessId?: string;
  businessName?: string;
  subscriptionPlan?: string;
  subscriptionActive?: boolean;
  supportNotes?: string;
  createdAt?: string;
}

export interface DashboardAnalytics {
  todayTransactionCount: number;
  weekTransactionCount: number;
  monthTransactionCount: number;
  monthProfitMargin: number;
  topPaymentMethod: string;
  topPaymentMethodTotal: number;
}

export interface CategoryStat {
  categoryName: string;
  type: 'INCOME' | 'EXPENSE';
  amount: number;
}

export interface PeriodComparison {
  previousMonthIncome: number;
  previousMonthExpenses: number;
  previousMonthProfit: number;
  incomeChangePercent: number;
  expenseChangePercent: number;
  profitChangePercent: number;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  read: boolean;
  type?: string;
  createdAt?: string;
  businessId?: string;
  referenceId?: string;
}

export interface Category {
  id: string;
  name: string;
  color?: string;
  icon?: string;
  isDefault?: boolean;
}

export interface DashboardSummary {

  todayIncome: number;

  todayExpenses: number;

  todayProfit: number;

  unpaidDebts: number;

  todayCollections: number;

  monthIncome: number;

  monthExpenses: number;

  monthCogs?: number;

  monthProfit: number;

  weeklyChart: ChartPoint[];

  paymentMethodBreakdown?: PaymentMethodStat[];

  analytics?: DashboardAnalytics;

  periodComparison?: PeriodComparison;

  topExpenseCategories?: CategoryStat[];

  topIncomeCategories?: CategoryStat[];

  netAfterDebts?: number;

  lowStockCount?: number;

}

export interface ReportAnalytics {
  transactionCount: number;
  incomeCount: number;
  expenseCount: number;
  incomeTotal: number;
  expenseTotal: number;
  profit: number;
  avgIncome: number;
  avgExpense: number;
  topPaymentMethod: string;
  topPaymentAmount: number;
  profitMarginPercent: number;
}

export interface PaymentMethodStat {
  method: string;
  income: number;
  expenses: number;
}



export interface ChartPoint {

  date: string;

  income: number;

  expenses: number;

}



export interface TransactionListSummary {
  incomeTotal: number;
  expenseTotal: number;
  incomeCount: number;
  expenseCount: number;
}

export interface Transaction {

  id: string;

  type: 'INCOME' | 'EXPENSE';

  amount: number;

  description?: string;

  paymentMethod?: string;

  transactionDate: string;

  categoryName?: string;

  productId?: string;

  productName?: string;

  productQuantity?: number;

  categoryId?: string;

  createdAt?: string;

  synced?: boolean;

}



export interface Debt {

  id: string;

  customerName: string;

  customerPhone?: string;

  totalAmount: number;

  paidAmount: number;

  remainingAmount: number;

  dueDate?: string;

  status: string;

  notes?: string;

}

export interface Repayment {
  id: string;
  debtId: string;
  customerName?: string;
  amount: number;
  paymentMethod?: string;
  notes?: string;
  repaymentDate: string;
}

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  notes?: string;
  amountOwed: number;
  activeDebtCount: number;
}

export interface CustomerHistory {
  id: string;
  name: string;
  phone?: string;
  totalOwed: number;
  debts: Debt[];
  repayments: Repayment[];
}

export interface Supplier {
  id: string;
  name: string;
  phone?: string;
  contactPerson?: string;
  notes?: string;
  amountOwed: number;
  activePayableCount: number;
}

export interface SupplierPayable {
  id: string;
  supplierId: string;
  supplierName: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  dueDate?: string;
  status: string;
  description?: string;
  notes?: string;
}

export interface SupplierPayment {
  id: string;
  payableId: string;
  supplierName?: string;
  amount: number;
  paymentMethod?: string;
  notes?: string;
  paymentDate: string;
}

export interface Product {
  id: string;
  name: string;
  sku?: string;
  quantityOnHand: number;
  quantitySold?: number;
  buyPrice?: number;
  sellPrice?: number;
  lowStockThreshold?: number;
  unit: string;
  active: boolean;
  lowStock: boolean;
}



export interface Business {

  id: string;

  name: string;

  businessType?: string;

  tinNumber?: string;

  address?: string;

  city?: string;

  currency?: string;

  logoUrl?: string;

  subscriptionPlan?: SubscriptionPlan;

  subscriptionActive?: boolean;

  supportNotes?: string;

}


