import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { packagesApi } from "../api/packages.api";
import { useAuth } from "../context/AuthContext";

const PACKAGE_TYPE_LABEL = {
  CLASSIC: "Classic",
  PREMIUM: "Premium",
  EXCLUSIVE: "Exclusive",
};

function Packages() {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [togglingId, setTogglingId] = useState(null);
  const navigate = useNavigate();
  const { can } = useAuth();

  const fetchPackages = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await packagesApi.getAll();
      setPackages(data);
    } catch (err) {
      setError("Failed to load packages");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPackages();
  }, []);

  const handleToggleActive = async (pkg) => {
    const confirmMsg = pkg.is_active
      ? `Deactivate "${pkg.name}"? Customers won't be able to purchase it.`
      : `Reactivate "${pkg.name}"?`;
    if (!window.confirm(confirmMsg)) return;

    setTogglingId(pkg.id);
    try {
      const { data } = await packagesApi.deactivate(pkg.id);
      setPackages((prev) =>
        prev.map((p) => (p.id === pkg.id ? { ...p, is_active: data.is_active } : p))
      );
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to update status");
    } finally {
      setTogglingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-text-secondary">Loading packages...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-card-bg border border-danger/20 rounded-lg p-8 text-center">
        <p className="text-danger mb-4">{error}</p>
        <button
          onClick={fetchPackages}
          className="px-4 py-2 bg-hover-bg border border-card-border rounded-lg text-text-primary text-sm hover:border-accent transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-text-primary text-xl font-semibold">All Packages</h3>
        {can("packages.create") && (
          <button
            onClick={() => navigate("/admin/packages/new")}
            className="bg-accent text-sidebar-text px-4 py-2 rounded-lg font-semibold hover:bg-accent-hover transition"
          >
            + Add Package
          </button>
        )}
      </div>

      <div className="bg-card-bg border border-card-border rounded-xl overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-hover-bg border-b border-card-border">
            <tr>
              <th className="px-6 py-4 text-sm font-medium text-text-secondary">ID</th>
              <th className="px-6 py-4 text-sm font-medium text-text-secondary">Name</th>
              <th className="px-6 py-4 text-sm font-medium text-text-secondary">Type</th>
              <th className="px-6 py-4 text-sm font-medium text-text-secondary">Price</th>
              <th className="px-6 py-4 text-sm font-medium text-text-secondary">Validity</th>
              <th className="px-6 py-4 text-sm font-medium text-text-secondary">Status</th>
              <th className="px-6 py-4 text-sm font-medium text-text-secondary">Actions</th>
            </tr>
          </thead>
          <tbody>
            {packages.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-text-secondary text-sm">
                  No packages found.
                </td>
              </tr>
            ) : (
              packages.map((pkg) => (
                <tr
                  key={pkg.id}
                  className="border-b border-card-border hover:bg-hover-bg/50 transition"
                >
                  <td className="px-6 py-4 text-sm font-medium text-text-primary">
                    #{pkg.id}
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-sm font-medium text-text-primary">{pkg.name}</p>
                      <p className="text-xs text-text-secondary mt-0.5">
                        {pkg.description || "No description"}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs bg-hover-bg text-text-secondary px-2 py-1 rounded-full">
                      {PACKAGE_TYPE_LABEL[pkg.package_type] || pkg.package_type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-accent">
                    ₹{pkg.price}
                  </td>
                  <td className="px-6 py-4 text-sm text-text-secondary">
                    {pkg.validity_days} days
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold border ${
                        pkg.is_active
                          ? "bg-green-500/10 text-green-400 border-green-500/20"
                          : "bg-red-500/10 text-red-400 border-red-500/20"
                      }`}
                    >
                      {pkg.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-3">
                      {can("packages.update") && (
                        <button
                          onClick={() => navigate(`/admin/packages/${pkg.id}/edit`)}
                          className="text-xs text-text-secondary hover:text-text-primary transition"
                        >
                          Edit
                        </button>
                      )}
                      {can("packages.deactivate") && (
                        <button
                          onClick={() => handleToggleActive(pkg)}
                          disabled={togglingId === pkg.id}
                          className={`text-xs transition disabled:opacity-50 ${
                            pkg.is_active
                              ? "text-danger hover:text-red-600"
                              : "text-green-600 hover:text-green-500"
                          }`}
                        >
                          {togglingId === pkg.id
                            ? "..."
                            : pkg.is_active
                            ? "Deactivate"
                            : "Activate"}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Packages;