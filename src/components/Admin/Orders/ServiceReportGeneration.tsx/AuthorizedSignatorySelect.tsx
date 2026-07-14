import React, { useEffect, useState } from 'react';
import { getAllAuthorizedSignatories } from '../../../../api/index';

export type AuthorizedSignatoryOption = {
  _id: string;
  name: string;
  signature: string;
};

type Props = {
  value?: string;
  onChange: (selected: AuthorizedSignatoryOption | null) => void;
  className?: string;
  required?: boolean;
  label?: string;
};

const AuthorizedSignatorySelect: React.FC<Props> = ({
  value = '',
  onChange,
  className = '',
  required = false,
  label = 'Authorized Signatory',
}) => {
  const [options, setOptions] = useState<AuthorizedSignatoryOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await getAllAuthorizedSignatories();
        const list = Array.isArray(res?.data) ? res.data : [];
        if (!cancelled) {
          setOptions(
            list.map((item: any) => ({
              _id: String(item._id),
              name: String(item.name || ''),
              signature: String(item.signature || ''),
            }))
          );
        }
      } catch (err: any) {
        if (!cancelled) setError(err?.message || 'Failed to load signatories');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const selected = options.find((o) => o._id === value) || null;

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required ? <span className="text-red-500"> *</span> : null}
      </label>
      <select
        className="w-full border rounded-md px-3 py-2 bg-white"
        value={value || ''}
        disabled={loading}
        required={required}
        onChange={(e) => {
          const id = e.target.value;
          onChange(options.find((o) => o._id === id) || null);
        }}
      >
        <option value="">{loading ? 'Loading...' : 'Select authorized signatory'}</option>
        {options.map((opt) => (
          <option key={opt._id} value={opt._id}>
            {opt.name}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      {selected?.signature && (
        <div className="mt-2">
          <img
            src={selected.signature}
            alt={selected.name}
            className="h-16 max-w-[200px] object-contain rounded border border-gray-200 bg-white p-1"
          />
        </div>
      )}
    </div>
  );
};

export default AuthorizedSignatorySelect;
