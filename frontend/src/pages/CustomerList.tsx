import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { fetchCustomers, deleteCustomer } from '../api';
import type { Customer } from '../types';
import Pagination from '../components/Pagination';
import Spinner from '../components/Spinner';
import { logError } from '../utils/logger';

function highlight(text: string, q: string) {
  if (!q) return text;
  const idx = text.toLowerCase().indexOf(q.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.substring(0, idx)}
      <strong style={{background:'#fffbcc'}}>{text.substring(idx, idx + q.length)}</strong>
      {text.substring(idx + q.length)}
    </>
  );
}

export default function CustomerList() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState('');
  const [city, setCity] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [pincode, setPincode] = useState('');
  const [sort, setSort] = useState('created_at');
  const [order, setOrder] = useState<'ASC'|'DESC'>('DESC');

  const loadingMoreRef = useRef(false);

  async function load(reset = true) {
    if (loading) return;
    setLoading(true);
    try {
      const params: any = { page, limit, sort, order };
      if (search) params.search = search;
      if (city) params.city = city;
      if (stateFilter) params.state = stateFilter;
      if (pincode) params.pincode = pincode;
      const res = await fetchCustomers(params);
      if (reset) setCustomers(res.data);
      else setCustomers(prev => [...prev, ...res.data]);
      setTotalPages(res.totalPages ?? 1);
    } catch (err: any) {
      logError(err, { where: 'CustomerList.load', page, search, city, stateFilter, pincode });
      alert('Failed to load customers: ' + (err.message || 'Unknown'));
    } finally { setLoading(false); loadingMoreRef.current = false; }
  }

  useEffect(() => { setPage(1); load(true); }, [sort, order]);

  useEffect(() => { load(page === 1); }, [page]);

  function clearFilters() {
    setSearch(''); setCity(''); setStateFilter(''); setPincode(''); setPage(1);
    load(true);
  }

  useEffect(() => {
    function onScroll() {
      if (loading || loadingMoreRef.current) return;
      if ((window.innerHeight + window.scrollY) >= (document.body.offsetHeight - 300)) {
        if (page < totalPages) {
          loadingMoreRef.current = true;
          setPage(p => p + 1);
        }
      }
    }
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, [page, totalPages, loading]);

  async function handleDelete(id: number) {
    if (!confirm('Delete this customer?')) return;
    try {
      const res = await deleteCustomer(id);
      alert(res.message || 'Deleted');
      setCustomers(c => c.filter(x => x.id !== id));
    } catch (err: any) {
      logError(err, { where: 'CustomerList.delete', id });
      alert('Delete failed: ' + (err.message || 'Unknown'));
    }
  }

  return (
    <div>
      <div style={{display:'flex', justifyContent:'space-between', marginBottom:12}}>
        <h2>Customers</h2>
        <Link to="/customers/new" className="btn small">Add Customer</Link>
      </div>

      <div className="card" style={{marginBottom:12}}>
        <div style={{display:'flex', gap:8, flexWrap:'wrap', marginBottom:8}}>
          <input className="input" placeholder="Search name/phone/email" value={search} onChange={e => setSearch(e.target.value)} />
          <input className="input" placeholder="City" value={city} onChange={e => setCity(e.target.value)} />
          <input className="input" placeholder="State" value={stateFilter} onChange={e => setStateFilter(e.target.value)} />
          <input className="input" placeholder="Pincode" value={pincode} onChange={e => setPincode(e.target.value)} />
          <select value={sort} onChange={e => setSort(e.target.value)} className="input" style={{width:160}}>
            <option value="created_at">Newest</option>
            <option value="first_name">First Name</option>
          </select>
          <select value={order} onChange={e => setOrder(e.target.value as 'ASC'|'DESC')} className="input" style={{width:120}}>
            <option value="DESC">Desc</option>
            <option value="ASC">Asc</option>
          </select>
          <button className="btn small" onClick={() => { setPage(1); load(true); }}>Apply</button>
          <button className="btn secondary small" onClick={clearFilters}>Clear Filters</button>
        </div>

        <div style={{overflowX:'auto'}}>
          <table className="table">
            <thead>
              <tr>
                <th>ID</th><th>Name</th><th>Phone</th><th>City</th><th>Addresses</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.map(c => (
                <tr key={c.id}>
                  <td>{String(c.id).includes(search) ? <mark>{c.id}</mark> : c.id}</td>
                  <td>{search ? highlight(`${c.first_name} ${c.last_name}`, search) : `${c.first_name} ${c.last_name}`}</td>
                  <td>{String(c.phone).includes(search) ? <mark>{c.phone}</mark> : c.phone}</td>
                  <td>{c.city}</td>
                  <td>{c.addresses_count ?? 0}</td>
                  <td>
                    <Link to={`/customers/${c.id}`} className="small">View</Link>
                    {' | '}
                    <Link to={`/customers/${c.id}/edit`} className="small">Edit</Link>
                    {' | '}
                    <button className="small" onClick={() => handleDelete(c.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {loading && <div style={{textAlign:'center', padding:12}}><Spinner/></div>}
        {!loading && page < totalPages && <div style={{textAlign:'center', marginTop:8}}><button className="btn" onClick={() => setPage(p => p + 1)}>Load more</button></div>}
      </div>
    </div>
  );
}
