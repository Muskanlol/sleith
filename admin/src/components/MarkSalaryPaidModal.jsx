import { createPortal } from 'react-dom';

export default function MarkSalaryPaidModal({ salary, onClose, onConfirm, saving }) {
  return createPortal(
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4" onClick={onClose}>
      <div className="bg-card-bg border border-card-border rounded-xl p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
        <h4 className="text-white text-lg font-semibold mb-2">Mark Salary as Paid?</h4>
        <p className="text-text-secondary text-sm mb-5">
          ₹{salary.amount} for {salary.employee_name} ({new Date(salary.month).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}) will be marked as paid today.
        </p>
        <div className="flex gap-3 justify-end">
          <button onClick={onClose} disabled={saving} className="px-4 py-2 text-sm text-text-secondary hover:text-white transition disabled:opacity-40">
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={saving}
            className="px-4 py-2 text-sm bg-green-500/20 text-green-400 hover:bg-green-500/30 rounded-lg disabled:opacity-40 transition"
          >
            {saving ? 'Saving...' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}