import { useEffect, useState, useCallback, useRef } from 'react';
import api from '../api/client';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

const COLORS = {
  primary: '#a3e635',
  secondary: '#3b82f6',
  success: '#22c55e',
  warning: '#f59e0b',
  danger: '#ef4444',
  purple: '#a855f7',
  pink: '#ec4899',
  orange: '#f97316',
  teal: '#14b8a6',
  cyan: '#06b6d4',
  gray: '#6b7280',
};

const PIE_COLORS = [
  COLORS.success, COLORS.danger, COLORS.warning,
  COLORS.secondary, COLORS.purple, COLORS.orange,
  COLORS.teal, COLORS.pink, COLORS.cyan,
];

const PERIODS = [
  { value: 'all', label: 'All Time' },
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'year', label: 'This Year' },
];

const SALON_TABS = [
  { key: 'revenue', label: 'Revenue' },
  { key: 'appointments', label: 'Appointments' },
  { key: 'customers', label: 'Customers' },
  { key: 'services', label: 'Services' },
  { key: 'packages', label: 'Packages' },
];

const ACADEMY_TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'courses', label: 'Courses' },
  { key: 'batches', label: 'Batches' },
  { key: 'students', label: 'Students' },
  { key: 'applications', label: 'Applications' },
  { key: 'fees', label: 'Fees' },
  { key: 'attendance', label: 'Attendance' },
  { key: 'assessments', label: 'Assessments' },
  { key: 'certificates', label: 'Certificates' },
];

function StatCard({ title, value, subtitle, color = 'primary' }) {
  const colorMap = {
    primary: 'border-lime-500/30 bg-accent/5 dark:bg-lime-500/5',
    success: 'border-green-500/30 bg-green-500/5',
    danger: 'border-red-500/30 bg-red-500/5',
    warning: 'border-amber-500/30 bg-amber-500/5',
    secondary: 'border-blue-500/30 bg-blue-500/5',
    purple: 'border-purple-500/30 bg-purple-500/5',
    pink: 'border-pink-500/30 bg-pink-500/5',
    orange: 'border-orange-500/30 bg-orange-500/5',
    teal: 'border-teal-500/30 bg-teal-500/5',
    cyan: 'border-cyan-500/30 bg-cyan-500/5',
  };

  return (
    <div className={`border rounded-xl p-5 ${colorMap[color] || colorMap.primary}`}>
      <p className="text-sm text-text-secondary mb-1">{title}</p>
      <p className="text-2xl font-bold text-text-primary dark:text-white">{value}</p>
      {subtitle && <p className="text-xs text-text-secondary mt-1">{subtitle}</p>}
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-text-secondary">Loading report...</div>
    </div>
  );
}

function Reports() {
  const [section, setSection] = useState('salon');
  const [activeTab, setActiveTab] = useState('revenue');
  const [period, setPeriod] = useState('month');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const requestIdRef = useRef(0);

  const fetchReport = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError(null);

    try {
      let result = null;

      if (section === 'salon') {
        const res = await api.get(`/admin/reports/${activeTab}/?period=${period}`);
        result = res.data;
      } else {
        if (activeTab === 'overview') {
          const res = await api.get('/admin/academy/dashboard/');
          result = res.data;
        } else if (activeTab === 'courses') {
          const res = await api.get('/admin/academy/courses/');
          result = { courses: res.data.results || res.data };
        } else if (activeTab === 'batches') {
          const res = await api.get('/admin/academy/batches/');
          result = { batches: res.data.results || res.data };
        } else if (activeTab === 'students') {
          const res = await api.get('/admin/academy/students/');
          const enrolled = res.data.enrolled || [];
          const pending = res.data.pending_assignment || [];
          result = { enrolled, pending, total_students: enrolled.length + pending.length };
        } else if (activeTab === 'applications') {
          const res = await api.get('/admin/academy/applications/');
          const apps = res.data.results || res.data || [];
          const pending = apps.filter(a => a.status === 'PENDING').length;
          const approved = apps.filter(a => a.status === 'APPROVED').length;
          const rejected = apps.filter(a => a.status === 'REJECTED').length;
          result = { applications: apps, pending, approved, rejected, total: apps.length };
        } else if (activeTab === 'fees') {
          const res = await api.get('/admin/academy/fees/');
          const fees = res.data.results || res.data || [];
          const pendingFees = fees.filter(f => f.status === 'PENDING');
          const paidFees = fees.filter(f => f.status === 'PAID');
          const overdueFees = fees.filter(f => f.status === 'OVERDUE');
          const totalPending = pendingFees.reduce((sum, f) => sum + Number(f.amount), 0);
          const totalPaid = paidFees.reduce((sum, f) => sum + Number(f.amount), 0);
          const totalOverdue = overdueFees.reduce((sum, f) => sum + Number(f.amount), 0);
          result = { fees, pendingFees, paidFees, overdueFees, totalPending, totalPaid, totalOverdue, total: fees.length };
        } else if (activeTab === 'attendance') {
          const res = await api.get('/admin/academy/batches/');
          const batches = res.data.results || res.data || [];
          result = { batches };
        } else if (activeTab === 'assessments') {
          const res = await api.get('/admin/academy/assessments/');
          const assessments = res.data.results || res.data || [];
          const theory = assessments.filter(a => a.assessment_type === 'THEORY').length;
          const practical = assessments.filter(a => a.assessment_type === 'PRACTICAL').length;
          const final = assessments.filter(a => a.assessment_type === 'FINAL').length;
          result = { assessments, theory, practical, final, total: assessments.length };
        } else if (activeTab === 'certificates') {
          const res = await api.get('/admin/academy/certificates/');
          const certs = res.data.results || res.data || [];
          const draft = certs.filter(c => c.status === 'DRAFT').length;
          const issued = certs.filter(c => c.status === 'ISSUED').length;
          const verified = certs.filter(c => c.status === 'VERIFIED').length;
          const revoked = certs.filter(c => c.status === 'REVOKED').length;
          result = { certificates: certs, draft, issued, verified, revoked, total: certs.length };
        }
      }

      if (requestIdRef.current === requestId) {
        setData(result);
      }
    } catch (err) {
      if (requestIdRef.current === requestId) {
        setError(err.response?.data?.detail || 'Failed to load report');
      }
    } finally {
      if (requestIdRef.current === requestId) {
        setLoading(false);
      }
    }
  }, [section, activeTab, period]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  useEffect(() => {
    if (section === 'salon') {
      setActiveTab('revenue');
    } else {
      setActiveTab('overview');
    }
  }, [section]);

  const formatCurrency = (val) => {
    if (val === undefined || val === null) return '₹0';
    return `₹${Number(val).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
  };

  const renderSalonRevenue = () => {
    if (!data) return null;
    const daily = data.daily_breakdown || [];

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Revenue" value={formatCurrency(data.total_revenue)} color="primary" />
          <StatCard title="Net Revenue" value={formatCurrency(data.net_revenue)} subtitle={`After ${formatCurrency(data.refunded_amount)} refunded`} color="success" />
          <StatCard title="Package Revenue" value={formatCurrency(data.package_revenue)} color="secondary" />
          <StatCard title="Appointment Revenue" value={formatCurrency(data.appointment_revenue)} color="purple" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-card-bg border border-card-border rounded-xl p-5">
            <h4 className="text-text-primary dark:text-white font-medium mb-4">Revenue Trend</h4>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={daily}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="day" tickFormatter={formatDate} stroke="#6b7280" fontSize={12} />
                <YAxis stroke="#6b7280" fontSize={12} tickFormatter={(v) => `₹${v}`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                  labelStyle={{ color: '#9ca3af' }}
                  formatter={(value) => [formatCurrency(value), 'Revenue']}
                />
                <Line type="monotone" dataKey="amount" stroke={COLORS.primary} strokeWidth={2} dot={{ fill: COLORS.primary, r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-card-bg border border-card-border rounded-xl p-5">
            <h4 className="text-text-primary dark:text-white font-medium mb-4">Revenue Breakdown</h4>
            <div className="space-y-3">
              {[
                { label: 'Package Sales', value: data.package_revenue, color: COLORS.secondary },
                { label: 'Appointments', value: data.appointment_revenue, color: COLORS.purple },
                { label: 'Academy Fees', value: data.academy_revenue, color: COLORS.pink },
                { label: 'Refunded', value: data.refunded_amount, color: COLORS.danger },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-sm text-text-secondary">{item.label}</span>
                  </div>
                  <span className="text-sm font-medium text-text-primary dark:text-white">{formatCurrency(item.value)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderSalonAppointments = () => {
    if (!data) return null;
    const daily = data.daily_breakdown || [];
    const statusData = data.status_breakdown || [];

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <StatCard title="Total" value={data.total} color="primary" />
          <StatCard title="Completed" value={data.completed} color="success" />
          <StatCard title="Pending" value={data.pending} color="warning" />
          <StatCard title="Confirmed" value={data.confirmed} color="secondary" />
          <StatCard title="Cancelled" value={data.cancelled} color="danger" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-card-bg border border-card-border rounded-xl p-5">
            <h4 className="text-text-primary dark:text-white font-medium mb-4">Appointments Trend</h4>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={daily}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="appointment_date" tickFormatter={formatDate} stroke="#6b7280" fontSize={12} />
                <YAxis stroke="#6b7280" fontSize={12} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                  labelStyle={{ color: '#9ca3af' }}
                />
                <Bar dataKey="count" fill={COLORS.primary} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-card-bg border border-card-border rounded-xl p-5">
            <h4 className="text-text-primary dark:text-white font-medium mb-4">Status Distribution</h4>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    );
  };

  const renderSalonCustomers = () => {
    if (!data) return null;
    const daily = data.daily_new || [];

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Customers" value={data.total_customers} color="primary" />
          <StatCard title="New Customers" value={data.new_customers} color="success" />
          <StatCard title="Active" value={data.active_customers} color="secondary" />
          <StatCard title="Academy Students" value={data.academy_students} color="purple" />
        </div>

        <div className="bg-card-bg border border-card-border rounded-xl p-5">
          <h4 className="text-text-primary dark:text-white font-medium mb-4">New Customers Trend</h4>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={daily}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="day" tickFormatter={formatDate} stroke="#6b7280" fontSize={12} />
              <YAxis stroke="#6b7280" fontSize={12} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                labelStyle={{ color: '#9ca3af' }}
              />
              <Bar dataKey="count" fill={COLORS.secondary} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  const renderSalonServices = () => {
    if (!data) return null;
    const topServices = data.top_services || [];

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <StatCard title="Total Active Services" value={data.total_services} color="primary" />
          <StatCard title="Top Performer" value={topServices[0]?.name || '—'} subtitle={formatCurrency(topServices[0]?.revenue)} color="success" />
        </div>

        <div className="bg-card-bg border border-card-border rounded-xl overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-hover-bg border-b border-card-border">
              <tr>
                <th className="px-6 py-4 text-sm font-medium text-text-secondary">Rank</th>
                <th className="px-6 py-4 text-sm font-medium text-text-secondary">Service</th>
                <th className="px-6 py-4 text-sm font-medium text-text-secondary">Category</th>
                <th className="px-6 py-4 text-sm font-medium text-text-secondary text-right">Appointments</th>
                <th className="px-6 py-4 text-sm font-medium text-text-secondary text-right">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {topServices.map((s, idx) => (
                <tr key={s.id} className="border-b border-card-border hover:bg-hover-bg/50 transition">
                  <td className="px-6 py-4 text-sm text-text-primary dark:text-white font-medium">#{idx + 1}</td>
                  <td className="px-6 py-4 text-sm text-text-primary dark:text-white">{s.name}</td>
                  <td className="px-6 py-4 text-sm text-text-secondary">{s.category}</td>
                  <td className="px-6 py-4 text-sm text-text-primary dark:text-white text-right">{s.appointment_count}</td>
                  <td className="px-6 py-4 text-sm text-accent dark:text-lime-400 text-right font-medium">{formatCurrency(s.revenue)}</td>
                </tr>
              ))}
              {topServices.length === 0 && (
                <tr><td colSpan="5" className="px-6 py-10 text-center text-sm text-text-secondary">No data available</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderSalonPackages = () => {
    if (!data) return null;
    const breakdown = data.package_breakdown || [];

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard title="Total Sold (All Time)" value={data.total_sold} color="primary" />
          <StatCard title="Sold This Period" value={data.period_sold} color="success" />
          <StatCard title="Revenue" value={formatCurrency(data.revenue)} color="purple" />
        </div>

        <div className="bg-card-bg border border-card-border rounded-xl overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-hover-bg border-b border-card-border">
              <tr>
                <th className="px-6 py-4 text-sm font-medium text-text-secondary">Package</th>
                <th className="px-6 py-4 text-sm font-medium text-text-secondary">Type</th>
                <th className="px-6 py-4 text-sm font-medium text-text-secondary text-right">Price</th>
                <th className="px-6 py-4 text-sm font-medium text-text-secondary text-right">Sold</th>
              </tr>
            </thead>
            <tbody>
              {breakdown.map((p) => (
                <tr key={p.id} className="border-b border-card-border hover:bg-hover-bg/50 transition">
                  <td className="px-6 py-4 text-sm text-text-primary dark:text-white">{p.name}</td>
                  <td className="px-6 py-4 text-sm text-text-secondary">{p.type}</td>
                  <td className="px-6 py-4 text-sm text-text-primary dark:text-white text-right">{formatCurrency(p.price)}</td>
                  <td className="px-6 py-4 text-sm text-accent dark:text-lime-400 text-right font-medium">{p.sold_count}</td>
                </tr>
              ))}
              {breakdown.length === 0 && (
                <tr><td colSpan="4" className="px-6 py-10 text-center text-sm text-text-secondary">No data available</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderAcademyOverview = () => {
    if (!data) return null;

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard title="Total Courses" value={data.total_courses} color="primary" />
          <StatCard title="Active Batches" value={data.total_batches} color="secondary" />
          <StatCard title="Total Students" value={data.total_students} color="success" />
          <StatCard title="Total Applications" value={data.total_applications} color="warning" />
          <StatCard title="Pending Applications" value={data.pending_applications} color="danger" />
          <StatCard title="Approved Applications" value={data.approved_applications} color="purple" />
        </div>
      </div>
    );
  };

  const renderAcademyCourses = () => {
    if (!data) return null;
    const courses = data.courses || [];
    const activeCourses = courses.filter(c => c.is_active).length;
    const inactiveCourses = courses.filter(c => !c.is_active).length;

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard title="Total Courses" value={courses.length} color="primary" />
          <StatCard title="Active" value={activeCourses} color="success" />
          <StatCard title="Inactive" value={inactiveCourses} color="danger" />
        </div>

        <div className="bg-card-bg border border-card-border rounded-xl overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-hover-bg border-b border-card-border">
              <tr>
                <th className="px-6 py-4 text-sm font-medium text-text-secondary">Course</th>
                <th className="px-6 py-4 text-sm font-medium text-text-secondary">Duration</th>
                <th className="px-6 py-4 text-sm font-medium text-text-secondary text-right">Fee</th>
                <th className="px-6 py-4 text-sm font-medium text-text-secondary text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((c) => (
                <tr key={c.id} className="border-b border-card-border hover:bg-hover-bg/50 transition">
                  <td className="px-6 py-4 text-sm text-text-primary dark:text-white">{c.name}</td>
                  <td className="px-6 py-4 text-sm text-text-secondary">{c.duration_months} months</td>
                  <td className="px-6 py-4 text-sm text-text-primary dark:text-white text-right">{formatCurrency(c.fee)}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`text-xs px-2.5 py-1 rounded-full border ${c.is_active ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20' : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20'}`}>
                      {c.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              ))}
              {courses.length === 0 && (
                <tr><td colSpan="4" className="px-6 py-10 text-center text-sm text-text-secondary">No courses found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderAcademyBatches = () => {
    if (!data) return null;
    const batches = data.batches || [];
    const activeBatches = batches.filter(b => b.status === 'ACTIVE').length;
    const completedBatches = batches.filter(b => b.status === 'COMPLETED').length;
    const cancelledBatches = batches.filter(b => b.status === 'CANCELLED').length;

    const statusData = [
      { name: 'Active', value: activeBatches },
      { name: 'Completed', value: completedBatches },
      { name: 'Cancelled', value: cancelledBatches },
    ];

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard title="Total Batches" value={batches.length} color="primary" />
          <StatCard title="Active" value={activeBatches} color="success" />
          <StatCard title="Completed" value={completedBatches} color="secondary" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-card-bg border border-card-border rounded-xl p-5">
            <h4 className="text-text-primary dark:text-white font-medium mb-4">Batch Status Distribution</h4>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-card-bg border border-card-border rounded-xl overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-hover-bg border-b border-card-border">
                <tr>
                  <th className="px-4 py-3 text-sm font-medium text-text-secondary">Batch</th>
                  <th className="px-4 py-3 text-sm font-medium text-text-secondary">Course</th>
                  <th className="px-4 py-3 text-sm font-medium text-text-secondary text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {batches.slice(0, 8).map((b) => (
                  <tr key={b.id} className="border-b border-card-border hover:bg-hover-bg/50 transition">
                    <td className="px-4 py-3 text-sm text-text-primary dark:text-white">{b.name}</td>
                    <td className="px-4 py-3 text-sm text-text-secondary">{b.course_name}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${
                        b.status === 'ACTIVE' ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20' :
                        b.status === 'COMPLETED' ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20' :
                        'bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20'
                      }`}>
                        {b.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderAcademyStudents = () => {
    if (!data) return null;
    const enrolled = data.enrolled || [];
    const pending = data.pending || [];

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard title="Total Students" value={data.total_students} color="primary" />
          <StatCard title="Enrolled" value={enrolled.length} color="success" />
          <StatCard title="Pending Assignment" value={pending.length} color="warning" />
        </div>

        <div className="bg-card-bg border border-card-border rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-card-border">
            <h4 className="text-text-primary dark:text-white font-medium">Enrolled Students</h4>
          </div>
          <table className="w-full text-left">
            <thead className="bg-hover-bg border-b border-card-border">
              <tr>
                <th className="px-6 py-3 text-sm font-medium text-text-secondary">Student</th>
                <th className="px-6 py-3 text-sm font-medium text-text-secondary">Course</th>
                <th className="px-6 py-3 text-sm font-medium text-text-secondary">Batch</th>
                <th className="px-6 py-3 text-sm font-medium text-text-secondary text-right">Attendance</th>
              </tr>
            </thead>
            <tbody>
              {enrolled.slice(0, 10).map((s) => (
                <tr key={s.id} className="border-b border-card-border hover:bg-hover-bg/50 transition">
                  <td className="px-6 py-3 text-sm text-text-primary dark:text-white">{s.student_name}</td>
                  <td className="px-6 py-3 text-sm text-text-secondary">{s.course_name}</td>
                  <td className="px-6 py-3 text-sm text-text-secondary">{s.batch_name}</td>
                  <td className="px-6 py-3 text-sm text-right">
                    {s.attendance_percentage != null ? (
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${
                        s.attendance_percentage >= 75 ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20' :
                        s.attendance_percentage >= 40 ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-yellow-500/10 dark:text-yellow-400 dark:border-yellow-500/20' :
                        'bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20'
                      }`}>
                        {s.attendance_percentage}%
                      </span>
                    ) : (
                      <span className="text-text-secondary text-xs">—</span>
                    )}
                  </td>
                </tr>
              ))}
              {enrolled.length === 0 && (
                <tr><td colSpan="4" className="px-6 py-10 text-center text-sm text-text-secondary">No enrolled students</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderAcademyApplications = () => {
    if (!data) return null;
    const apps = data.applications || [];

    const statusData = [
      { name: 'Pending', value: data.pending },
      { name: 'Approved', value: data.approved },
      { name: 'Rejected', value: data.rejected },
    ];

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <StatCard title="Total Applications" value={data.total} color="primary" />
          <StatCard title="Pending" value={data.pending} color="warning" />
          <StatCard title="Approved" value={data.approved} color="success" />
          <StatCard title="Rejected" value={data.rejected} color="danger" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-card-bg border border-card-border rounded-xl p-5">
            <h4 className="text-text-primary dark:text-white font-medium mb-4">Application Status</h4>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-card-bg border border-card-border rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-card-border">
              <h4 className="text-text-primary dark:text-white font-medium">Recent Applications</h4>
            </div>
            <table className="w-full text-left">
              <thead className="bg-hover-bg border-b border-card-border">
                <tr>
                  <th className="px-4 py-3 text-sm font-medium text-text-secondary">Student</th>
                  <th className="px-4 py-3 text-sm font-medium text-text-secondary">Course</th>
                  <th className="px-4 py-3 text-sm font-medium text-text-secondary text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {apps.slice(0, 8).map((a) => (
                  <tr key={a.id} className="border-b border-card-border hover:bg-hover-bg/50 transition">
                    <td className="px-4 py-3 text-sm text-text-primary dark:text-white">{a.student_name}</td>
                    <td className="px-4 py-3 text-sm text-text-secondary">{a.course_name}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${
                        a.status === 'PENDING' ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-yellow-500/10 dark:text-yellow-400 dark:border-yellow-500/20' :
                        a.status === 'APPROVED' ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20' :
                        'bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20'
                      }`}>
                        {a.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderAcademyFees = () => {
    if (!data) return null;

    const feeStatusData = [
      { name: 'Paid', value: data.totalPaid },
      { name: 'Pending', value: data.totalPending },
      { name: 'Overdue', value: data.totalOverdue },
    ];

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <StatCard title="Total Records" value={data.total} color="primary" />
          <StatCard title="Total Paid" value={formatCurrency(data.totalPaid)} color="success" />
          <StatCard title="Total Pending" value={formatCurrency(data.totalPending)} color="warning" />
          <StatCard title="Total Overdue" value={formatCurrency(data.totalOverdue)} color="danger" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-card-bg border border-card-border rounded-xl p-5">
            <h4 className="text-text-primary dark:text-white font-medium mb-4">Fee Status Breakdown</h4>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={feeStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {feeStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                  formatter={(value) => [formatCurrency(value), 'Amount']}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-card-bg border border-card-border rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-card-border">
              <h4 className="text-text-primary dark:text-white font-medium">Recent Fee Records</h4>
            </div>
            <table className="w-full text-left">
              <thead className="bg-hover-bg border-b border-card-border">
                <tr>
                  <th className="px-4 py-3 text-sm font-medium text-text-secondary">Student</th>
                  <th className="px-4 py-3 text-sm font-medium text-text-secondary text-right">Amount</th>
                  <th className="px-4 py-3 text-sm font-medium text-text-secondary text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {(data.fees || []).slice(0, 8).map((f) => (
                  <tr key={f.id} className="border-b border-card-border hover:bg-hover-bg/50 transition">
                    <td className="px-4 py-3 text-sm text-text-primary dark:text-white">{f.student_name}</td>
                    <td className="px-4 py-3 text-sm text-text-primary dark:text-white text-right">{formatCurrency(f.amount)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${
                        f.status === 'PAID' ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20' :
                        f.status === 'PENDING' ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-yellow-500/10 dark:text-yellow-400 dark:border-yellow-500/20' :
                        'bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20'
                      }`}>
                        {f.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderAcademyAttendance = () => {
    if (!data) return null;
    const batches = data.batches || [];

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <StatCard title="Total Batches" value={batches.length} color="primary" />
          <StatCard title="Active Batches" value={batches.filter(b => b.status === 'ACTIVE').length} color="success" />
        </div>

        <div className="bg-card-bg border border-card-border rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-card-border">
            <h4 className="text-text-primary dark:text-white font-medium">Batch Attendance Overview</h4>
          </div>
          <table className="w-full text-left">
            <thead className="bg-hover-bg border-b border-card-border">
              <tr>
                <th className="px-6 py-3 text-sm font-medium text-text-secondary">Batch</th>
                <th className="px-6 py-3 text-sm font-medium text-text-secondary">Course</th>
                <th className="px-6 py-3 text-sm font-medium text-text-secondary text-right">Students</th>
                <th className="px-6 py-3 text-sm font-medium text-text-secondary text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {batches.map((b) => (
                <tr key={b.id} className="border-b border-card-border hover:bg-hover-bg/50 transition">
                  <td className="px-6 py-3 text-sm text-text-primary dark:text-white">{b.name}</td>
                  <td className="px-6 py-3 text-sm text-text-secondary">{b.course_name}</td>
                  <td className="px-6 py-3 text-sm text-text-primary dark:text-white text-right">{b.capacity}</td>
                  <td className="px-6 py-3 text-center">
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${
                      b.status === 'ACTIVE' ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20' :
                      b.status === 'COMPLETED' ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20' :
                      'bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20'
                    }`}>
                      {b.status}
                    </span>
                  </td>
                </tr>
              ))}
              {batches.length === 0 && (
                <tr><td colSpan="4" className="px-6 py-10 text-center text-sm text-text-secondary">No batches found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderAcademyAssessments = () => {
    if (!data) return null;
    const assessments = data.assessments || [];

    const typeData = [
      { name: 'Theory', value: data.theory },
      { name: 'Practical', value: data.practical },
      { name: 'Final', value: data.final },
    ];

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <StatCard title="Total Assessments" value={data.total} color="primary" />
          <StatCard title="Theory" value={data.theory} color="secondary" />
          <StatCard title="Practical" value={data.practical} color="purple" />
          <StatCard title="Final" value={data.final} color="orange" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-card-bg border border-card-border rounded-xl p-5">
            <h4 className="text-text-primary dark:text-white font-medium mb-4">Assessment Types</h4>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={typeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {typeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-card-bg border border-card-border rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-card-border">
              <h4 className="text-text-primary dark:text-white font-medium">Recent Assessments</h4>
            </div>
            <table className="w-full text-left">
              <thead className="bg-hover-bg border-b border-card-border">
                <tr>
                  <th className="px-4 py-3 text-sm font-medium text-text-secondary">Title</th>
                  <th className="px-4 py-3 text-sm font-medium text-text-secondary">Batch</th>
                  <th className="px-4 py-3 text-sm font-medium text-text-secondary text-center">Type</th>
                  <th className="px-4 py-3 text-sm font-medium text-text-secondary text-right">Max Marks</th>
                </tr>
              </thead>
              <tbody>
                {assessments.slice(0, 8).map((a) => (
                  <tr key={a.id} className="border-b border-card-border hover:bg-hover-bg/50 transition">
                    <td className="px-4 py-3 text-sm text-text-primary dark:text-white">{a.title}</td>
                    <td className="px-4 py-3 text-sm text-text-secondary">{a.batch_name}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${
                        a.assessment_type === 'THEORY' ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20' :
                        a.assessment_type === 'PRACTICAL' ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20' :
                        'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20'
                      }`}>
                        {a.assessment_type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-text-primary dark:text-white text-right">{a.max_marks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderAcademyCertificates = () => {
    if (!data) return null;
    const certs = data.certificates || [];

    const statusData = [
      { name: 'Draft', value: data.draft },
      { name: 'Issued', value: data.issued },
      { name: 'Verified', value: data.verified },
      { name: 'Revoked', value: data.revoked },
    ];

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <StatCard title="Total Certificates" value={data.total} color="primary" />
          <StatCard title="Issued" value={data.issued} color="secondary" />
          <StatCard title="Verified" value={data.verified} color="success" />
          <StatCard title="Revoked" value={data.revoked} color="danger" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-card-bg border border-card-border rounded-xl p-5">
            <h4 className="text-text-primary dark:text-white font-medium mb-4">Certificate Status</h4>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-card-bg border border-card-border rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-card-border">
              <h4 className="text-text-primary dark:text-white font-medium">Recent Certificates</h4>
            </div>
            <table className="w-full text-left">
              <thead className="bg-hover-bg border-b border-card-border">
                <tr>
                  <th className="px-4 py-3 text-sm font-medium text-text-secondary">Number</th>
                  <th className="px-4 py-3 text-sm font-medium text-text-secondary">Student</th>
                  <th className="px-4 py-3 text-sm font-medium text-text-secondary text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {certs.slice(0, 8).map((c) => (
                  <tr key={c.id} className="border-b border-card-border hover:bg-hover-bg/50 transition">
                    <td className="px-4 py-3 text-sm text-text-primary dark:text-white font-mono">{c.certificate_number}</td>
                    <td className="px-4 py-3 text-sm text-text-secondary">{c.student_name}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${
                        c.status === 'DRAFT' ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-yellow-500/10 dark:text-yellow-400 dark:border-yellow-500/20' :
                        c.status === 'ISSUED' ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20' :
                        c.status === 'VERIFIED' ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20' :
                        'bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20'
                      }`}>
                        {c.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderSalonContent = () => {
    if (loading) return <LoadingState />;
    if (error) return <div className="text-red-600 dark:text-red-400 text-center py-10">{error}</div>;
    if (!data) return null;

    switch (activeTab) {
      case 'revenue': return renderSalonRevenue();
      case 'appointments': return renderSalonAppointments();
      case 'customers': return renderSalonCustomers();
      case 'services': return renderSalonServices();
      case 'packages': return renderSalonPackages();
      default: return null;
    }
  };

  const renderAcademyContent = () => {
    if (loading) return <LoadingState />;
    if (error) return <div className="text-red-600 dark:text-red-400 text-center py-10">{error}</div>;
    if (!data) return null;

    switch (activeTab) {
      case 'overview': return renderAcademyOverview();
      case 'courses': return renderAcademyCourses();
      case 'batches': return renderAcademyBatches();
      case 'students': return renderAcademyStudents();
      case 'applications': return renderAcademyApplications();
      case 'fees': return renderAcademyFees();
      case 'attendance': return renderAcademyAttendance();
      case 'assessments': return renderAcademyAssessments();
      case 'certificates': return renderAcademyCertificates();
      default: return null;
    }
  };

  const currentTabs = section === 'salon' ? SALON_TABS : ACADEMY_TABS;


  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h3 className="text-text-primary dark:text-white text-xl font-semibold">Reports</h3>

        {section === 'salon' && (
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="bg-hover-bg border border-card-border rounded-lg px-3 py-2 text-sm text-text-primary dark:text-white focus:outline-none focus:border-accent"
          >
            {PERIODS.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        )}
      </div>

      <div className="flex gap-2 border-b border-card-border pb-1">
        <button
          onClick={() => setSection('salon')}
          className={`px-5 py-2 text-sm font-medium rounded-t-lg transition
            ${section === 'salon'
              ? 'text-accent dark:text-lime-400 border-b-2 border-accent dark:border-lime-400 bg-accent/5 dark:bg-lime-500/5'
              : 'text-text-secondary hover:text-text-primary dark:text-white hover:bg-hover-bg'}`}
        >
          Salon
        </button>
        <button
          onClick={() => setSection('academy')}
          className={`px-5 py-2 text-sm font-medium rounded-t-lg transition
            ${section === 'academy'
              ? 'text-accent dark:text-lime-400 border-b-2 border-accent dark:border-lime-400 bg-accent/5 dark:bg-lime-500/5'
              : 'text-text-secondary hover:text-text-primary dark:text-white hover:bg-hover-bg'}`}
        >
          Academy
        </button>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-card-border pb-1">
        {currentTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition
              ${activeTab === tab.key
                ? 'text-accent dark:text-lime-400 border-b-2 border-accent dark:border-lime-400 bg-accent/5 dark:bg-lime-500/5'
                : 'text-text-secondary hover:text-text-primary dark:text-white hover:bg-hover-bg'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {section === 'salon' ? renderSalonContent() : renderAcademyContent()}
    </div>
  );
}

export default Reports;

