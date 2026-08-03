import React, { useState } from 'react';
import AdminPage from './pages/AdminPage';
import DispatcherPage from './pages/DispatcherPage';
import DriverPage from './pages/DriverPage';
import CustomerPage from './pages/CustomerPage';
import ApprovalsPage from './pages/ApprovalsPage';

export default function App() {
    const [activeTab, setActiveTab] = useState('admin');

    const navBtnStyle = (tabKey) => ({
        padding: '10px 18px',
        background: activeTab === tabKey ? '#2563eb' : 'transparent',
        color: activeTab === tabKey ? '#ffffff' : '#94a3b8',
        border: 'none',
        borderRadius: '8px',
        fontWeight: '600',
        fontSize: '14px',
        cursor: 'pointer',
        transition: 'all 0.2s ease'
    });

    return (
        <div style={{ background: '#f8fafc', minHeight: '100vh', color: '#0f172a' }}>
            <header style={{ background: '#0f172a', borderBottom: '1px solid #1e293b', padding: '16px 32px' }}>
                <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h1 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#f8fafc' }}>SmartFM Control System</h1>
                        <span style={{ fontSize: '12px', color: '#64748b' }}>Fleet Operations & Billing Engine</span>
                    </div>

                    <nav style={{ display: 'flex', gap: '6px', background: '#1e293b', padding: '4px', borderRadius: '10px' }}>
                        <button onClick={() => setActiveTab('admin')} style={navBtnStyle('admin')}>
                            Fleet Admin
                        </button>
                        <button onClick={() => setActiveTab('dispatcher')} style={navBtnStyle('dispatcher')}>
                            Dispatch Operations
                        </button>
                        <button onClick={() => setActiveTab('driver')} style={navBtnStyle('driver')}>
                            Driver Terminal
                        </button>
                        <button onClick={() => setActiveTab('customer')} style={navBtnStyle('customer')}>
                            Billing & Customer
                        </button>
                        <button onClick={() => setActiveTab('approvals')} style={navBtnStyle('approvals')}>
                            Approvals
                        </button>
                    </nav>
                </div>
            </header>

            <main>
                {activeTab === 'admin' && <AdminPage />}
                {activeTab === 'dispatcher' && <DispatcherPage />}
                {activeTab === 'driver' && <DriverPage />}
                {activeTab === 'customer' && <CustomerPage />}
                {activeTab === 'approvals' && <ApprovalsPage />}
            </main>
        </div>
    );
}