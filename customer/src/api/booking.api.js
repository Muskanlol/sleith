import api from './client'

export const bookingApi = {
  getServices: () => api.get('/services/'),
  getServiceStaff: (id) => api.get(`/services/${id}/staff/`),
  getStaffAvailability: (id) => api.get(`/staff/${id}/availability/`),
  createAppointment: (payload) => api.post('/appointments/create/', payload),
  getMyAppointments: () => api.get('/appointments/'),
  getAppointment: (id) => api.get(`/appointments/${id}/`),
  cancelAppointment: (id) => api.post(`/appointments/${id}/cancel/`),
  rescheduleAppointment: (id, payload) => api.post(`/appointments/${id}/reschedule/`, payload),
  createReview: (payload) => api.post('/reviews/', payload),
  updateReview: (id, payload) => api.patch(`/reviews/${id}/`, payload),
  getMyPackages: () => api.get('/my-packages/'),
  getMyPackageUsage: (id) => api.get(`/my-packages/${id}/usage/`),
  getMyFees: () => api.get('/academy/my-fees/'),
  createPaymentOrder: (payload) => api.post('/payments/create-order/', payload),
  verifyPayment: (payload) => api.post('/payments/verify/', payload),
}

export function loadRazorpay() {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) return resolve(window.Razorpay)
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => resolve(window.Razorpay)
    script.onerror = () => reject(new Error('Failed to load Razorpay SDK'))
    document.body.appendChild(script)
  })
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export function generateSlots(availability, date, durationMinutes) {
  if (!date || !availability?.length || !durationMinutes) return []

  const dayName = DAY_NAMES[date.getDay()]
  const dayAvail = availability.find((a) => a.day === dayName)
  if (!dayAvail) return []

  const [sh, sm] = dayAvail.start_time.split(':').map(Number)
  const [eh, em] = dayAvail.end_time.split(':').map(Number)

  const slots = []
  let cur = sh * 60 + sm
  const end = eh * 60 + em

  while (cur + durationMinutes <= end) {
    const s = { h: Math.floor(cur / 60), m: cur % 60 }
    const e = { h: Math.floor((cur + durationMinutes) / 60), m: (cur + durationMinutes) % 60 }
    const pad = (n) => String(n).padStart(2, '0')
    slots.push({
      start_time: `${pad(s.h)}:${pad(s.m)}`,
      end_time: `${pad(e.h)}:${pad(e.m)}`,
      label: `${pad(s.h)}:${pad(s.m)}`,
    })
    cur += durationMinutes
  }
  return slots
}
