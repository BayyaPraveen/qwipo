import React from 'react';
import { Routes, Route, Link, Navigate } from 'react-router-dom';
import CustomerList from './pages/CustomerList';
import CustomerForm from './pages/CustomerForm';
import CustomerDetail from './pages/CustomerDetail';
import './index.css';

export default function App() {
  return (
    <div className="app-container">
      <header className="header">
        <div className="header-inner">
          <div className="brand">Qwipo — Customer Manager</div>
          <nav className="nav">
            <Link to="/customers">Customers</Link>
            <Link to="/customers/new">Add</Link>
          </nav>
        </div>
      </header>

      <main className="main">
        <div className="container">
          <Routes>
            <Route path="/" element={<Navigate to="/customers" replace />} />
            <Route path="/customers" element={<CustomerList />} />
            <Route path="/customers/new" element={<CustomerForm />} />
            <Route path="/customers/:id/edit" element={<CustomerForm editMode />} />
            <Route path="/customers/:id" element={<CustomerDetail />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}
