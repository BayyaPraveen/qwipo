import React, { useState } from 'react';
import type { Address } from '../types';

type Props = {
  initial?: Partial<Address>;
  onSubmit: (data: Partial<Address>) => Promise<void>;
  onCancel?: () => void;
};

export default function AddressForm({ initial = {}, onSubmit, onCancel }: Props) {
  const [form, setForm] = useState<Partial<Address>>({
    line1: '',
    line2: '',
    city: '',
    state: '',
    pincode: '',
    country: '',
    is_primary: 0,
    ...initial,
  });
  const [loading, setLoading] = useState(false);

  function update<K extends keyof Address>(k: K, v: Address[K] | undefined) {
    setForm(s => ({ ...s, [k]: v }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.line1 || !form.city) return alert('Please enter line1 and city');
    setLoading(true);
    try {
      await onSubmit(form);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="card">
      <div style={{display:'grid', gap:10}}>
        <div>
          <label>Line 1*</label>
          <input className="input" value={form.line1 ?? ''} onChange={e => update('line1', e.target.value)} />
        </div>

        <div>
          <label>Line 2</label>
          <input className="input" value={form.line2 ?? ''} onChange={e => update('line2', e.target.value)} />
        </div>

        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8}}>
          <input className="input" placeholder="City" value={form.city ?? ''} onChange={e => update('city', e.target.value)} />
          <input className="input" placeholder="State" value={form.state ?? ''} onChange={e => update('state', e.target.value)} />
          <input className="input" placeholder="Pincode" value={form.pincode ?? ''} onChange={e => update('pincode', e.target.value)} />
        </div>

        <div>
          <label>
            <input type="checkbox" checked={!!form.is_primary} onChange={e => update('is_primary', e.target.checked ? 1 : 0)} />
            <span style={{marginLeft:8}}>Primary</span>
          </label>
        </div>

        <div style={{display:'flex', gap:8}}>
          <button className="btn" type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save'}</button>
          {onCancel && <button type="button" className="btn secondary" onClick={onCancel}>Cancel</button>}
        </div>
      </div>
    </form>
  );
}
