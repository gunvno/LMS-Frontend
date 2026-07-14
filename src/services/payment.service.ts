import { api, toQuery, wrap } from "@/lib/api-client";
import type { Invoice, PageData, Payment } from "@/lib/types";

export const paymentService = {
  createCoursePayment: (courseId: string) =>
    api.post<Payment>("/billing/api/v1/course-payments", wrap({ courseId })),

  getMyPayments: (params: Record<string, unknown> = {}) =>
    api.get<PageData<Payment> | Payment[]>(
      `/billing/api/v1/payments/me?${toQuery({ page: 0, size: 20, ...params })}`
    ),

  getMyPaymentHistory: (params: Record<string, unknown> = {}) =>
    api.get<PageData<Payment> | Payment[]>(
      `/billing/api/v1/payments/history/me?${toQuery({ page: 0, size: 20, ...params })}`
    ),

  getMyInvoice: (invoiceCode: string) =>
    api.get<Invoice>(`/billing/api/v1/invoices/${invoiceCode}`),

  getMyInvoices: (params: Record<string, unknown> = {}) =>
    api.get<PageData<Invoice> | Invoice[]>(
      `/billing/api/v1/invoices/me?${toQuery({ page: 0, size: 20, ...params })}`
    ),

  getPayment: (id: string) =>
    api.get<Payment>(`/billing/api/v1/payments/${id}`),

  getPaymentByPayosOrderCode: (orderCode: string | number) =>
    api.get<Payment>(`/billing/api/v1/payments/orders/${orderCode}`),

  syncPaymentByPayosOrderCode: (orderCode: string | number) =>
    api.post<Payment>(`/billing/api/v1/payments/orders/${orderCode}/sync`),

  cancelPaymentByPayosOrderCode: (orderCode: string | number) =>
    api.post<Payment>(`/billing/api/v1/payments/orders/${orderCode}/cancel`),
};
