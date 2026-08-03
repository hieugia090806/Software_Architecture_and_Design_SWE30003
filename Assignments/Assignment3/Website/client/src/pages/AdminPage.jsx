// Assignments\Assignment3\Website\client\src\pages\AdminPage.jsx

import React, { useState, useEffect } from 'react';
import { fetchEntity } from '../services/api';
import { processFormSubmission, INITIAL_FORM_STATES, TABS, USER_ROLE_OPTIONS } from '../services/adminFormService';

export default function AdminPage() {
    const [activeTab, setActiveTab] = useState('branch');
    const [formData, setFormData] = useState(INITIAL_FORM_STATES.branch);
    const [branches, setBranches] = useState([]);
    const [vehicleTypes, setVehicleTypes] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [invoices, setInvoices] = useState([]);
    const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        loadContextData();
    }, []);

    async function loadContextData() {
        try {
            const [bData, vData, cData, iData] = await Promise.all([
                fetchEntity('branches'),
                fetchEntity('vehicle_types'),
                fetchEntity('customers'),
                fetchEntity('invoices')
            ]);
            setBranches(bData || []);
            setVehicleTypes(vData || []);
            setCustomers(cData || []);
            setInvoices(iData || []);
        } catch (err) {
            console.error('Error loading admin context data:', err);
        }
    }

    const handleTabChange = (tabKey) => {
        setActiveTab(tabKey);
        setFormData(INITIAL_FORM_STATES[tabKey]);
        setStatusMsg({ type: '', text: '' });
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setStatusMsg({ type: '', text: '' });

        try {
            const message = await processFormSubmission(activeTab, formData, { branches });
            setStatusMsg({ type: 'success', text: message });
            setFormData(INITIAL_FORM_STATES[activeTab]);
        } catch (err) {
            setStatusMsg({ type: 'error', text: err.message || 'Submission failed.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 24px', fontFamily: 'Inter, system-ui, sans-serif' }}>
            
            {/* Active Admin System Header */}
            <div style={{ background: '#0f172a', color: '#ffffff', padding: '20px 24px', borderRadius: '12px', marginBottom: '28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <span style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '1px', background: '#3b82f6', color: '#ffffff', padding: '3px 8px', borderRadius: '4px' }}>
                        ACTIVE ACCOUNT
                    </span>
                    <h3 style={{ margin: '6px 0 2px 0', fontSize: '18px', fontWeight: '600' }}>Admin Console (admin_user)</h3>
                    <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8' }}>Role: GLOBAL ADMIN | System Scope: All Regional Hubs</p>
                </div>
                <div style={{ textAlign: 'right', fontSize: '12px', color: '#cbd5e1' }}>
                    <div><strong>Tariff Invoices:</strong> {invoices.length} Registered</div>
                    <div><strong>Active Customers:</strong> {customers.length} Accounts</div>
                </div>
            </div>

            {/* Admin Management Section */}
            <div style={{ marginBottom: '24px' }}>
                <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#111827', margin: '0 0 6px 0' }}>Infrastructure & User Management</h2>
                <p style={{ color: '#6b7280', margin: 0 }}>Register regional hubs, vehicle specifications, assets, and role-constrained users for approval.</p>
            </div>

            {/* Navigation Tabs */}
            <div style={{ display: 'flex', borderBottom: '2px solid #e2e8f0', marginBottom: '24px' }}>
                {TABS.map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => handleTabChange(tab.key)}
                        style={{
                            padding: '12px 20px',
                            border: 'none',
                            background: 'none',
                            fontSize: '14px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            color: activeTab === tab.key ? '#2563eb' : '#64748b',
                            borderBottom: activeTab === tab.key ? '3px solid #2563eb' : '3px solid transparent',
                            marginBottom: '-2px'
                        }}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Status Feedback Message */}
            {statusMsg.text && (
                <div style={{
                    padding: '12px 16px',
                    borderRadius: '8px',
                    marginBottom: '20px',
                    fontSize: '14px',
                    background: statusMsg.type === 'success' ? '#dcfce7' : '#fee2e2',
                    color: statusMsg.type === 'success' ? '#15803d' : '#b91c1c',
                    border: `1px solid ${statusMsg.type === 'success' ? '#bbf7d0' : '#fca5a5'}`
                }}>
                    {statusMsg.text}
                </div>
            )}

            {/* Form Rendering */}
            <form onSubmit={handleSubmit} style={{ background: '#ffffff', border: '1px solid #e2e8f0', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                {activeTab === 'branch' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>City Prefix Code (3 letters)</label>
                            <input type="text" name="city_prefix" maxLength={3} value={formData.city_prefix} onChange={handleInputChange} required placeholder="e.g. HCM, DAD, HAN" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Branch Hub Name</label>
                            <input type="text" name="branch_name" value={formData.branch_name} onChange={handleInputChange} required placeholder="e.g. Tan Binh Gateway Hub" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Location City</label>
                            <input type="text" name="location_city" value={formData.location_city} onChange={handleInputChange} required placeholder="e.g. Ho Chi Minh City" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Service Radius (km)</label>
                            <input type="number" name="service_radius_km" value={formData.service_radius_km} onChange={handleInputChange} required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                        </div>
                        <div style={{ gridColumn: 'span 2' }}>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Hub Address</label>
                            <input type="text" name="address" value={formData.address} onChange={handleInputChange} required placeholder="e.g. 102 Truong Chinh, Tan Binh District" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                        </div>
                    </div>
                )}

                {activeTab === 'vtype' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Specification / Type Name</label>
                            <input type="text" name="type_name" value={formData.type_name} onChange={handleInputChange} required placeholder="e.g. 15-Ton Refrigerated Hauler" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Max Payload (kg)</label>
                            <input type="number" name="max_payload_kg" value={formData.max_payload_kg} onChange={handleInputChange} required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Volumetric Limit (m³)</label>
                            <input type="number" name="volumetric_limit_m3" value={formData.volumetric_limit_m3} onChange={handleInputChange} required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Base Fuel Rate (L/km)</label>
                            <input type="number" step="0.1" name="base_fuel_rate" value={formData.base_fuel_rate} onChange={handleInputChange} required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                        </div>
                    </div>
                )}

                {activeTab === 'vehicle' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Assigned Branch Hub</label>
                            <select name="branch_id" value={formData.branch_id} onChange={handleInputChange} required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                                <option value="">Select Branch Hub...</option>
                                {branches.map(b => (
                                    <option key={b.id} value={b.id}>{b.branch_name} ({b.location_city})</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Vehicle Specification Type</label>
                            <select name="vehicle_type_id" value={formData.vehicle_type_id} onChange={handleInputChange} required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                                <option value="">Select Vehicle Specification...</option>
                                {vehicleTypes.map(vt => (
                                    <option key={vt.id} value={vt.id}>{vt.type_name} ({vt.max_payload_kg} kg)</option>
                                ))}
                            </select>
                        </div>
                        <div style={{ gridColumn: 'span 2', padding: '12px', background: '#f8fafc', borderRadius: '6px', border: '1px dashed #cbd5e1' }}>
                            <span style={{ fontSize: '12px', color: '#64748b' }}>
                                ℹ️ <strong>License Plate Number:</strong> Auto-generated based on the assigned branch prefix upon submitting for approval.
                            </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <input type="checkbox" id="is_cold_chain" name="is_cold_chain" checked={formData.is_cold_chain} onChange={handleInputChange} />
                            <label htmlFor="is_cold_chain" style={{ fontSize: '13px', fontWeight: '600' }}>Requires Cold-Chain Monitoring</label>
                        </div>
                    </div>
                )}

                {activeTab === 'user' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Full Name</label>
                            <input type="text" name="full_name" value={formData.full_name} onChange={handleInputChange} required placeholder="e.g. jamal musiala" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Username</label>
                            <input type="text" name="username" value={formData.username} onChange={handleInputChange} required placeholder="e.g. yanmal" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>System Role</label>
                            <select name="role" value={formData.role} onChange={handleInputChange} required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                                {USER_ROLE_OPTIONS.map(role => (
                                    <option key={role.value} value={role.value}>{role.label}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Assigned Branch Hub</label>
                            <select name="branch_id" value={formData.branch_id} onChange={handleInputChange} required={formData.role === 'BRANCH_MANAGER'} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                                <option value="">Select Branch (if applicable)...</option>
                                {branches.map(b => (
                                    <option key={b.id} value={b.id}>{b.branch_name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                )}

                <div style={{ marginTop: '24px', textAlign: 'right' }}>
                    <button type="submit" disabled={isSubmitting} style={{ background: '#2563eb', color: '#ffffff', padding: '10px 24px', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', opacity: isSubmitting ? 0.7 : 1 }}>
                        {isSubmitting ? 'Submitting...' : 'Submit Request for Approval'}
                    </button>
                </div>
            </form>

            {/* Audit & Global Customer/Tariff Section */}
            <div style={{ marginTop: '40px', background: '#ffffff', border: '1px solid #e2e8f0', padding: '24px', borderRadius: '12px' }}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600', color: '#0f172a' }}>Global Freight Tariff Invoices & Customer Accounts</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <div>
                        <h4 style={{ fontSize: '14px', color: '#475569', marginBottom: '10px' }}>Active Customers ({customers.length})</h4>
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                            {customers.map(c => (
                                <li key={c.id} style={{ padding: '8px 12px', background: '#f8fafc', borderRadius: '6px', marginBottom: '8px', fontSize: '13px', border: '1px solid #f1f5f9' }}>
                                    <strong>{c.company_name || c.contact_name}</strong> — {c.email || 'Contact on file'}
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div>
                        <h4 style={{ fontSize: '14px', color: '#475569', marginBottom: '10px' }}>Tariff Invoices ({invoices.length})</h4>
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                            {invoices.map(inv => (
                                <li key={inv.id} style={{ padding: '8px 12px', background: '#f8fafc', borderRadius: '6px', marginBottom: '8px', fontSize: '13px', border: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between' }}>
                                    <span>Invoice #{inv.id} (Order #{inv.order_id})</span>
                                    <strong>${inv.total_amount || 0} USD</strong>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>

        </div>
    );
}