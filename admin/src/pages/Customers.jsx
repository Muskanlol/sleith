import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { customersApi } from "../api/customers.api";
import { useAuth } from "../context/AuthContext";
import PageHeader from "../components/common/PageHeader";
import FilterBar from "../components/common/FilterBar";
import DataTable from "../components/common/DataTable";
import StatusBadge from "../components/common/StatusBadge";

function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1); // NEW
  const itemsPerPage = 10; // NEW

  const navigate = useNavigate();
  const { can } = useAuth();

  const fetchCustomers = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await customersApi.getAll();
      setCustomers(data);
    } catch (err) {
      setError("Failed to load customers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const filteredCustomers = useMemo(() => {
    let result = [...customers];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.full_name?.toLowerCase().includes(query) ||
          c.email?.toLowerCase().includes(query) ||
          c.phone?.includes(query)
      );
    }

    if (statusFilter) {
      const isActive = statusFilter === "active";
      result = result.filter((c) => c.is_active === isActive);
    }

    return result;
  }, [customers, searchQuery, statusFilter]);

  const paginatedCustomers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredCustomers.slice(start, start + itemsPerPage);
  }, [filteredCustomers, currentPage]);

  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);

  const columns = [
    { key: "name", label: "Name", accessor: "full_name" },
    { key: "email", label: "Email" },
    { key: "phone", label: "Phone" },
    {
      key: "status",
      label: "Status",
      render: (_, item) => (
        <StatusBadge status={item.is_active ? "ACTIVE" : "INACTIVE"} />
      ),
    },
    {
      key: "academy",
      label: "Student",
      render: (_, item) =>
        item.is_academy_student ? (
          <span className="inline-flex px-2 py-1 rounded text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
            Student
          </span>
        ) : (
          <span className="text-text-secondary text-xs">—</span>
        ),
    },
    {
      key: "joined",
      label: "Joined",
      type: "date",
      accessor: "date_joined",
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <PageHeader
          title="Customers"
          description="Manage customer records and activity"
        />

        {can("customers.create") && (
          <button
            onClick={() => navigate("/admin/customers/new")}
            className="px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
            style={{ background: 'var(--accent)', color: '#0a0a0a' }}
          >
            + Add Customer
          </button>
        )}
      </div>

      <FilterBar
        searchPlaceholder="Search by name, email, or phone..."
        onSearch={(v) => { setSearchQuery(v); setCurrentPage(1); }}
        filters={[
          {
            key: "status",
            value: statusFilter,
            options: [
              { value: "", label: "All Status" },
              { value: "active", label: "Active" },
              { value: "inactive", label: "Inactive" },
            ],
          },
        ]}
        onFilterChange={(key, value) => {
          if (key === "status") setStatusFilter(value);
          setCurrentPage(1); 
        }}
      />

      <DataTable
        columns={columns}
        data={paginatedCustomers}
        keyExtractor={(item) => item.id}
        loading={loading}
        error={error}
        onRetry={fetchCustomers}
        emptyTitle="No customers found"
        emptyMessage="Try adjusting your search or filters."
        actions={(item) => (
          <button
            onClick={() => navigate(`/admin/customers/${item.id}`)}
            className="text-accent hover:text-accent-hover hover:underline text-sm font-medium"
          >
            View
          </button>
        )}
      />

      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-4">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => p - 1)}
            className="px-3 py-1 text-sm border rounded disabled:opacity-50"
          >
            Prev
          </button>
          <span className="text-sm">
            Page {currentPage} of {totalPages}
          </span>
          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => p + 1)}
            className="px-3 py-1 text-sm border rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

export default Customers;
