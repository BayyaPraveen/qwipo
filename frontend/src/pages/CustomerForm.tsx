import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createCustomer, fetchCustomer, updateCustomer } from '../api';
import type { Customer } from '../types';
import { logError } from '../utils/logger';

type Props = { editMode?: boolean };

export default function CustomerForm({ editMode = false }: Props) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState<Partial<Customer>>({
    first_name: '',
    last_name: '',
    phone: '',
    email: '',
    city: '',
    state: '',
    pincode: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editMode && id) {
      (async () => {
        setLoading(true);
        try {
          const res = await fetchCustomer(Number(id));
          setForm(res.customer);
        } catch (err: any) {
          logError(err, { where: 'CustomerForm.load', id });
          alert('Failed to load customer: ' + (err.message || 'Unknown'));
          navigate('/customers');
        } finally { setLoading(false); }
      })();
    }
  }, [editMode, id]);

  function update<K extends keyof Customer>(k: K, v: any) {
    setForm(s => ({ ...s, [k]: v }));
  }

  function validate() {
    if (!form.first_name || !form.last_name) return 'First and last name are required';
    if (!form.phone) return 'Phone number is required';
    if (!/^[0-9]{10}$/.test(form.phone ?? '')) return 'Phone must be 10 digits';
    if (form.pincode && !/^[0-9]{4,6}$/.test(form.pincode)) return 'Invalid pincode';
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) return 'Invalid email';
    return null;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const v = validate();
    if (v) { alert(v); return; }
    setLoading(true);
    try {
      if (editMode && id) {
        await updateCustomer(Number(id), form);
        alert('Customer updated');
        navigate(`/customers/${id}`);
      } else {
        const res = await createCustomer(form);
        alert('Customer created');
        const newId = res.id ?? res?.data?.id;
        if (newId) navigate(`/customers/${newId}`);
        else navigate('/customers');
      }
    } catch (err: any) {
      logError(err, { where: 'CustomerForm.submit', payload: form });
      if (err.payload && Array.isArray(err.payload.errors)) {
        const messages = err.payload.errors.map((x: any) => `${x.param}: ${x.msg}`).join('\n');
        alert('Validation errors:\n' + messages);
      } else if (err.payload && err.payload.message) {
        alert('Save failed: ' + err.payload.message);
      } else {
        alert('Save failed: ' + (err.message || JSON.stringify(err)));
      }
    } finally { setLoading(false); }
  }

  return (
    <div>
      <h2>{editMode ? 'Edit' : 'Create New'} Customer</h2>
      <form className="card" onSubmit={submit}>
        <div className="form-grid">
          <div>
            <label>First name*</label>
            <input className="input" required value={form.first_name ?? ''} onChange={e => update('first_name', e.target.value)} />
          </div>
          <div>
            <label>Last name*</label>
            <input className="input" required value={form.last_name ?? ''} onChange={e => update('last_name', e.target.value)} />
          </div>
          <div>
            <label>Phone*</label>
            <input className="input" required placeholder="10 digits" value={form.phone ?? ''} onChange={e => update('phone', e.target.value)} />
          </div>
          <div>
            <label>Email</label>
            <input className="input" value={form.email ?? ''} onChange={e => update('email', e.target.value)} />
          </div>
          <div>
            <label>City*</label>
            <input className="input" value={form.city ?? ''} onChange={e => update('city', e.target.value)} />
          </div>
          <div>
            <label>State*</label>
            <input className="input" value={form.state ?? ''} onChange={e => update('state', e.target.value)} />
          </div>
          <div>
            <label>Pin code*</label>
            <input className="input" value={form.pincode ?? ''} onChange={e => update('pincode', e.target.value)} />
          </div>
        </div>

        <div style={{marginTop:12, display:'flex', gap:8}}>
          <button className="btn" type="submit">{loading ? 'Saving...' : 'Save'}</button>
          <button type="button" className="btn secondary" onClick={() => navigate('/customers')}>Cancel</button>
        </div>
      </form>
    </div>
  );
}
