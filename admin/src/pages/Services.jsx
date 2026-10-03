import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { servicesApi } from "../api/services.api";
import { useAuth } from "../context/AuthContext";
import PageHeader from "../components/common/PageHeader";
import FilterBar from "../components/common/FilterBar";
import DataTable from "../components/common/DataTable";
import StatusBadge from "../components/common/StatusBadge";

function Services() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState(""); // NEW
  const [togglingId, setTogglingId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1); // NEW
  const itemsPerPage = 10; // NEW

  const navigate = useNavigate();
  const { can } = useAuth();

  const fetchServices = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await servicesApi.getAll();
      setServices(data);
    } catch (err) {
      setError("Failed to load services");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const filteredServices = useMemo(() => {
    let result = [...services];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (s) =>
          s.name?.toLowerCase().includes(query) ||
          s.category_name?.toLowerCase().includes(query) ||
          s.description?.toLowerCase().includes(query)
      );
    }

    if (statusFilter) {
      const isActive = statusFilter === "active";
      result = result.filter((s) => s.is_active === isActive);
    }

    if (categoryFilter) {
      result = result.filter((s) => String(s.category_name) === String(categoryFilter));
    }

    return result;
  }, [services, searchQuery, statusFilter, categoryFilter]);

  const paginatedServices = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredServices.slice(start, start + itemsPerPage);
  }, [filteredServices, currentPage]);

  const totalPages = Math.max(1, Math.ceil(filteredServices.length / itemsPerPage));

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const handleToggleActive = async (service) => {
    const confirmMsg = service.is_active
      ? `Deactivate "${service.name}"? It will no longer be bookable.`
      : `Reactivate "${service.name}"?`;
    if (!window.confirm(confirmMsg)) return;

    setTogglingId(service.id);
    try {
      const { data } = await servicesApi.deactivate(service.id);
      setServices((prev) =>
        prev.map((s) => (s.id === service.id ? { ...s, is_active: data.is_active } : s))
      );
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to update status");
    } finally {
      setTogglingId(null);
    }
  };

  const columns = [
    { key: "id", label: "ID" },
    {
      key: "image",
      label: "",
      render: (_, item) =>
        item.image_url ? (
          <img src={item.image_url} alt="" className="h-10 w-10 rounded-lg object-cover border border-card-border" />
        ) : (
          <div className="h-10 w-10 rounded-lg bg-hover-bg border border-card-border" />
        ),
    },
    {
      key: "name",
      label: "Service Name",
      render: (value, item) => (
        <div>
          <p className="text-sm font-medium text-text-primary">{value}</p>
          <p className="text-xs text-text-secondary mt-0.5">
            {item.description || "No description"}
          </p>
        </div>
      ),
    },
    {
      key: "category",
      label: "Category",
      render: (_, item) => (
        <span className="text-xs bg-hover-bg text-text-secondary px-2 py-1 rounded-full">
          {item.category_name || "Uncategorized"}
        </span>
      ),
    },
    {
      key: "price",
      label: "Price",
      type: "currency",
      render: (value) => <span className="text-sm font-medium text-accent">₹{value}</span>,
    },
    {
      key: "duration",
      label: "Duration",
      render: (_, item) => (
        <span className="text-sm text-text-secondary">
          {item.duration_minutes ? `${item.duration_minutes} min` : "-"}
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (_, item) => <StatusBadge status={item.is_active ? "ACTIVE" : "INACTIVE"} />,
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <PageHeader
          title="Services"
          description="Manage salon services and offerings"
        />

        <div className="flex items-center gap-3">
          {can("services.create") && (
            <button
              onClick={() => navigate("/admin/services/categories")}
              className="px-4 py-2 bg-hover-bg border border-card-border rounded-lg text-text-primary text-sm hover:border-accent transition-colors"
            >
              Manage Categories
            </button>
          )}
          {can("services.create") && (
            <button
              onClick={() => navigate("/admin/services/new")}
              className="px-4 py-2 bg-accent text-sidebar-text rounded-lg text-sm font-semibold shadow-sm shadow-accent/30 hover:bg-accent-hover transition-colors"
            >
              + Add Service
            </button>
          )}
        </div>
      </div>

      <FilterBar
        searchPlaceholder="Search by name, category..."
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
          {
            key: "category",
            value: categoryFilter,
            options: [
              { value: "", label: "All Categories" },
              ...Array.from(new Set(services.map((s) => s.category_name))).map((c) => ({
                value: c,
                label: c || "Uncategorized",
              })),
            ],
          },
        ]}
        onFilterChange={(key, value) => {
          if (key === "status") setStatusFilter(value);
          if (key === "category") setCategoryFilter(value);
          setCurrentPage(1); 
        }}
      />

      <DataTable
        columns={columns}
        data={paginatedServices}
        keyExtractor={(item) => item.id}
        loading={loading}
        error={error}
        onRetry={fetchServices}
        emptyTitle="No services found"
        emptyMessage="Try adjusting your search or filters."
        actions={(item) => (
          <div className="flex gap-3">
            {can("services.update") && (
              <button
                onClick={() => navigate(`/admin/services/${item.id}/edit`)}
                className="text-xs text-text-secondary hover:text-text-primary transition"
              >
                Edit
              </button>
            )}
            {can("services.deactivate") && (
              <button
                onClick={() => handleToggleActive(item)}
                disabled={togglingId === item.id}
                className={`text-xs transition disabled:opacity-50 ${
                  item.is_active
                    ? "text-danger hover:text-red-600"
                    : "text-green-600 hover:text-green-500"
                }`}
              >
                {togglingId === item.id
                  ? "..."
                  : item.is_active
                  ? "Deactivate"
                  : "Activate"}
              </button>
            )}
          </div>
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

export default Services;
