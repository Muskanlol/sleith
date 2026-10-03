import client from './client';

export const salaryApi = {
  getByRole: (role) => client.get('/admin/salaries/', { params: { role } }),
  getByEmployee: (employeeId) => client.get('/admin/salaries/', { params: { employee_id: employeeId } }),
  markPaid: (id) => client.post(`/admin/salaries/${id}/mark-paid/`),
  create: (data) => client.post('/admin/salaries/', data),
  update: (id, data) => client.patch(`/admin/salaries/${id}/`, data),
  delete: (id) => client.delete(`/admin/salaries/${id}/`),
};