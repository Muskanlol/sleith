import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api/client';
import { createPortal } from 'react-dom';
import { useAuth } from '../context/AuthContext';

let toastId = 0;

function ToastContainer({ toasts, removeToast }) {
  return createPortal(
    <div className="fixed top-6 right-6 flex flex-col gap-2 w-80" style={{ zIndex: 9999 }}>
      {toasts.map((t) => (
        <div
          key={t.id}
          className="flex items-start gap-3 px-4 py-3 rounded-xl border shadow-xl text-sm"
          style={{
            background:   t.type === 'success' ? 'rgba(34,197,94,0.1)'  : 'rgba(239,68,68,0.1)',
            borderColor:  t.type === 'success' ? 'rgba(34,197,94,0.3)'  : 'rgba(239,68,68,0.3)',
            color:        t.type === 'success' ? '#4ade80'               : '#f87171',
            backdropFilter: 'blur(8px)',
          }}
        >
          <span className="flex-1">{t.message}</span>
          <button onClick={() => removeToast(t.id)} className="opacity-60 hover:opacity-100 transition">✕</button>
        </div>
      ))}
    </div>,
    document.body
  );
}

function AppointmentForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const { user } = useAuth();
  const isReadOnly = user?.role === 'STAFF';

  const [toasts, setToasts] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(isEdit);
  const [loadingRefs, setLoadingRefs] = useState(true);

  const [customers, setCustomers] = useState([]);
  const [services, setServices] = useState([]);
  const [serviceStaff, setServiceStaff] = useState([]);
  const [loadingServiceStaff, setLoadingServiceStaff] = useState(false);

  const [form, setForm] = useState({
    customer: '',
    service: '',
    staff: '',
    appointment_date: '',
    start_time: '',
    end_time: '',
    status: 'PENDING',
    notes: '',
  });

  const showToast = useCallback((message, type = 'success') => {
    const tid = ++toastId;
    setToasts((prev) => [...prev, { id: tid, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== tid)), 3500);
  }, []);

  const removeToast = (tid) => setToasts((prev) => prev.filter((t) => t.id !== tid));

  useEffect(() => {
    setLoadingRefs(true);
    Promise.all([
      api.get('/admin/customers/'),
      api.get('/admin/services/'),
    ])
      .then(([cRes, sRes]) => {
        const normalize = (res) => (Array.isArray(res.data) ? res.data : res.data.results || []);
        setCustomers(normalize(cRes));
        setServices(normalize(sRes));
      })
      .catch((err) => {
        setCustomers([]);
        setServices([]);
        showToast(
          err.response?.data?.detail || 'Failed to load customers and services',
          'error'
        );
      })
      .finally(() => setLoadingRefs(false));
  }, [showToast]);

  useEffect(() => {
    if (!form.service) {
      setServiceStaff([]);
      return;
    }
    setLoadingServiceStaff(true);
    api.get(`/services/${form.service}/staff/`)
      .then((res) => setServiceStaff(Array.isArray(res.data) ? res.data : []))
      .catch(() => {
        setServiceStaff([]);
        showToast('Failed to load staff for selected service', 'error');
      })
      .finally(() => setLoadingServiceStaff(false));
  }, [form.service, showToast]);

  useEffect(() => {
    if (!isEdit) return;
    setLoading(true);
    api.get(`/admin/appointments/${id}/`)
      .then((res) => {
        const data = res.data;
        const firstService = data.services?.[0]?.service || '';
        setForm({
          customer: data.customer?.id || data.customer || '',
          service: firstService,
          staff: data.staff?.id || data.staff || '',
          appointment_date: data.appointment_date || '',
          start_time: data.start_time || '',
          end_time: data.end_time || '',
          status: data.status || 'PENDING',
          notes: data.notes || '',
        });
      })
      .catch(() => showToast('Failed to load appointment', 'error'))
      .finally(() => setLoading(false));
  }, [id, isEdit, showToast]);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleServiceChange = (e) => {
    const newService = e.target.value;
    const selected = services.find((s) => String(s.id) === String(newService));
    setForm((prev) => {
      let end_time = prev.end_time;
      if (selected?.duration_minutes && prev.start_time) {
        end_time = addMinutes(prev.start_time, selected.duration_minutes);
      }
      return { ...prev, service: newService, staff: '', end_time };
    });
  };

  const handleStartTimeChange = (e) => {
    const newStart = e.target.value;
    const selected = services.find((s) => String(s.id) === String(form.service));
    setForm((prev) => ({
      ...prev,
      start_time: newStart,
      end_time: selected?.duration_minutes ? addMinutes(newStart, selected.duration_minutes) : prev.end_time,
    }));
  };

  const addMinutes = (time, minutes) => {
    if (!time) return '';
    const [h, m] = time.split(':').map(Number);
    const total = h * 60 + m + minutes;
    const hh = String(Math.floor((total % 1440) / 60)).padStart(2, '0');
    const mm = String(total % 60).padStart(2, '0');
    return `${hh}:${mm}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isReadOnly) return;

    if (!form.customer || !form.service || !form.staff || !form.appointment_date || !form.start_time || !form.end_time) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    const payload = {
      customer: form.customer,
      staff: form.staff,
      appointment_date: form.appointment_date,
      start_time: form.start_time,
      end_time: form.end_time,
      status: form.status,
      notes: form.notes,
      services: [form.service],
    };

    setSubmitting(true);
    try {
      if (isEdit) {
        await api.patch(`/admin/appointments/${id}/`, payload);
        showToast('Appointment updated successfully');
      } else {
        await api.post('/admin/appointments/', payload);
        showToast('Appointment created successfully');
      }
      navigate('/admin/appointments');
    } catch (error) {
      console.log('Error:', error.response?.data);
      const data = error.response?.data;
      const message = data?.staff?.[0] || data?.end_time?.[0] || data?.detail || `Failed to ${isEdit ? 'update' : 'create'} appointment`;
      showToast(message, 'error');
      setSubmitting(false);
    }
  };

  if (loading || loadingRefs) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-text-secondary">Loading...</div>
      </div>
    );
  }

  return (
    <div>
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/admin/appointments')} className="text-text-secondary hover:text-text-primary transition">← Back</button>
        <h3 className="text-text-primary text-xl font-semibold">
          {isReadOnly ? 'View Appointment' : isEdit ? 'Edit Appointment' : 'New Appointment'}
        </h3>
      </div>

      <form onSubmit={handleSubmit} className="bg-card-bg border border-card-border rounded-xl p-6 space-y-4 max-w-2xl">
        <fieldset disabled={isReadOnly} className={isReadOnly ? 'opacity-70' : ''}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-text-secondary mb-1">Customer *</label>
              <select name="customer" value={form.customer} onChange={handleChange} required
                className="w-full bg-hover-bg border border-card-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent">
                <option value="">Select customer</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>{c.full_name || c.name || c.email || c.id}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-text-secondary mb-1">Service *</label>
              <select name="service" value={form.service} onChange={handleServiceChange} required
                className="w-full bg-hover-bg border border-card-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent">
                <option value="">Select service</option>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-text-secondary mb-1">Staff *</label>
              <select
                name="staff"
                value={form.staff}
                onChange={handleChange}
                required
                disabled={isReadOnly || !form.service || loadingServiceStaff}
                className="w-full bg-hover-bg border border-card-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent disabled:opacity-50"
              >
                <option value="">
                  {!form.service
                    ? 'Select a service first'
                    : loadingServiceStaff
                    ? 'Loading staff...'
                    : serviceStaff.length === 0
                    ? 'No staff assigned to this service'
                    : 'Select staff'}
                </option>
                {serviceStaff.map((s) => (
                  <option key={s.id} value={s.id}>{s.user_name || s.name || s.user?.name || s.user?.email || s.id}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-text-secondary mb-1">Date *</label>
              <input type="date" name="appointment_date" value={form.appointment_date} onChange={handleChange} required
                className="w-full bg-hover-bg border border-card-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent" />
            </div>

            <div>
              <label className="block text-sm text-text-secondary mb-1">Start Time *</label>
              <input type="time" name="start_time" value={form.start_time} onChange={handleStartTimeChange} required
                className="w-full bg-hover-bg border border-card-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent" />
            </div>

            <div>
              <label className="block text-sm text-text-secondary mb-1">End Time *</label>
              <input type="time" name="end_time" value={form.end_time} onChange={handleChange} required
                className="w-full bg-hover-bg border border-card-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent" />
              <p className="text-xs text-text-secondary mt-1">Auto-filled from service duration — adjust if needed.</p>
            </div>

            {isEdit && (
              <div>
                <label className="block text-sm text-text-secondary mb-1">Status</label>
                <select name="status" value={form.status} onChange={handleChange}
                  className="w-full bg-hover-bg border border-card-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent">
                  <option value="PENDING">Pending</option>
                  <option value="CONFIRMED">Confirmed</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                  <option value="RESCHEDULED">Rescheduled</option>
                </select>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm text-text-secondary mb-1">Notes</label>
            <textarea name="notes" value={form.notes} onChange={handleChange} rows={3}
              className="w-full bg-hover-bg border border-card-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent" />
          </div>
        </fieldset>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={() => navigate('/admin/appointments')}
            className="px-4 py-2 rounded-lg border border-card-border text-text-primary hover:bg-hover-bg transition">
            {isReadOnly ? 'Back' : 'Cancel'}
          </button>
          {!isReadOnly && (
            <button type="submit" disabled={submitting}
              className="px-4 py-2 rounded-lg bg-accent text-sidebar-text font-semibold hover:bg-accent-hover transition disabled:opacity-50">
              {submitting ? (isEdit ? 'Updating...' : 'Creating...') : (isEdit ? 'Update Appointment' : 'Create Appointment')}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

export default AppointmentForm;