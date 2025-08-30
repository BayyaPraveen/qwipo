import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { fetchCustomer, createAddress, deleteAddress, updateAddress, fetchOrdersForCustomer, fetchPaymentsForCustomer } from '../api';
import type { Customer, Address, Order, Payment } from '../types';
import AddressForm from '../components/AddressForm';
import Spinner from '../components/Spinner';
import { logError } from '../utils/logger';

export default function CustomerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'details'|'addresses'|'orders'|'payments'>('details');
  const [adding, setAdding] = useState(false);
  const [editingAddr, setEditingAddr] = useState<Address | null>(null);

  async function load() {
    if (!id) return;
    setLoading(true);
    try {
      const res = await fetchCustomer(Number(id));
      setCustomer(res.customer);
      setAddresses(res.addresses ?? []);
      const ord = await fetchOrdersForCustomer(Number(id));
      const pay = await fetchPaymentsForCustomer(Number(id));
      setOrders(ord);
      setPayments(pay);
    } catch (err: any) {
      logError(err, { where: 'CustomerDetail.load', id });
      alert('Failed to load customer: ' + (err.message || 'Unknown'));
      navigate('/customers');
    } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [id]);

  async function handleAddAddress(data: Partial<Address>) {
    if (!id) return;
    try {
      await createAddress(Number(id), data);
      await load();
      setAdding(false);
      alert('Address added');
    } catch (err: any) {
      logError(err, { where: 'CustomerDetail.addAddress', id, data });
      alert('Failed to add address: ' + (err.message || 'Unknown'));
    }
  }

  async function handleDeleteAddress(addrId: number) {
    if (!confirm('Delete address?')) return;
    try {
      await deleteAddress(addrId);
      await load();
      alert('Address deleted');
    } catch (err: any) {
      logError(err, { where: 'CustomerDetail.deleteAddress', addrId });
      alert('Delete failed: ' + (err.message || 'Unknown'));
    }
  }

  async function handleEditAddress(addr: Address) {
    setEditingAddr(addr);
  }

  async function handleSaveEditedAddress(data: Partial<Address>) {
    if (!editingAddr) return;
    try {
      await updateAddress(editingAddr.id, data);
      setEditingAddr(null);
      await load();
      alert('Address updated');
    } catch (err: any) {
      logError(err, { where: 'CustomerDetail.updateAddress', id: editingAddr?.id, data });
      alert('Update failed: ' + (err.message || 'Unknown'));
    }
  }

  if (loading || !customer) return <div style={{textAlign:'center', padding:24}}><Spinner/></div>;

  return (
    <div>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <h2>{customer.first_name} {customer.last_name}</h2>
        <div>
          <Link to={`/customers/${customer.id}/edit`} className="btn small">Edit</Link>
        </div>
      </div>

      <div className="card" style={{marginTop:12}}>
        <div><strong>Phone:</strong> {customer.phone}</div>
        <div className="muted">Email: {customer.email ?? '—'}</div>
        <div className="muted">City: {customer.city ?? '—'}</div>
        <div className="muted">Only one address: {customer.only_one_address ? 'Yes' : 'No'}</div>
      </div>

      <nav style={{marginTop:12, display:'flex', gap:8}}>
        <button className={`btn small ${activeTab==='details' ? '' : 'secondary'}`} onClick={() => setActiveTab('details')}>Details</button>
        <button className={`btn small ${activeTab==='addresses' ? '' : 'secondary'}`} onClick={() => setActiveTab('addresses')}>Addresses ({addresses.length})</button>
        <button className={`btn small ${activeTab==='orders' ? '' : 'secondary'}`} onClick={() => setActiveTab('orders')}>Orders ({orders.length})</button>
        <button className={`btn small ${activeTab==='payments' ? '' : 'secondary'}`} onClick={() => setActiveTab('payments')}>Payments ({payments.length})</button>
      </nav>

      <div style={{marginTop:12}}>
        {activeTab === 'details' && (
          <div className="card">
            <h3>Personal Details</h3>
            <div><strong>First name:</strong> {customer.first_name}</div>
            <div><strong>Last name:</strong> {customer.last_name}</div>
          </div>
        )}

        {activeTab === 'addresses' && (
          <div>
            <div style={{display:'grid', gap:8}}>
              {addresses.map(a => (
                <div key={a.id} className="address-card">
                  <div>
                    <div style={{fontWeight:600}}>{a.line1} {a.line2 ? `, ${a.line2}` : ''}</div>
                    <div className="muted">{a.city}, {a.state} {a.pincode}</div>
                    <div className="muted">{a.country}</div>
                    {a.is_primary ? <div style={{color:'var(--success)', fontSize:12, marginTop:6}}>Primary</div> : null}
                  </div>
                  <div style={{display:'flex', gap:8}}>
                    <button className="btn small ghost" onClick={() => handleEditAddress(a)}>Edit</button>
                    <button className="btn small ghost" onClick={() => handleDeleteAddress(a.id)}>Delete</button>
                  </div>
                </div>
              ))}
            </div>

            {!adding ? (
              <div style={{marginTop:8}}>
                <button className="btn ghost" onClick={() => setAdding(true)}>Add address</button>
              </div>
            ) : (
              <div style={{marginTop:8}}>
                <AddressForm onSubmit={handleAddAddress} onCancel={() => setAdding(false)} />
              </div>
            )}

            {editingAddr && (
              <div style={{marginTop:8}}>
                <h4>Edit address</h4>
                <AddressForm initial={editingAddr} onSubmit={handleSaveEditedAddress} onCancel={() => setEditingAddr(null)} />
              </div>
            )}
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="card">
            <h3>Orders</h3>
            {orders.length === 0 ? <div className="muted">No orders found</div> : (
              <ul>
                {orders.map(o => <li key={o.id}>{o.id} — {o.status} — ₹{o.total} — {o.created_at}</li>)}
              </ul>
            )}
          </div>
        )}

        {activeTab === 'payments' && (
          <div className="card">
            <h3>Payments</h3>
            {payments.length === 0 ? <div className="muted">No payments found</div> : (
              <ul>
                {payments.map(p => <li key={p.id}>{p.id} — ₹{p.amount} — {p.method} — {p.created_at}</li>)}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
