import client from './client';

export const paymentsApi = {
  getPayments: (params) => client.get('/admin/payments/', { params }),
  getPaymentById: (id) => client.get(`/admin/payments/${id}/`),
  updatePaymentStatus: (id, data) => client.patch(`/admin/payments/${id}/update/`, data),
};