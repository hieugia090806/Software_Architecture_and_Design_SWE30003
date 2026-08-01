import React, { useState, useEffect } from 'react';
import { fetchEnriched, createEntity, updateEntity } from '../services/api';

export default function CustomerPage() {
    const [customers, setCustomers] = useState([]);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [invoices, setInvoices] = useState([]);
    const [selectedOrderId, setSelectedOrderId] = useState('');
    const [baseTariff, setBaseTariff] = useState('500000');
    const [distanceSurcharge, setDistanceSurcharge] = useState('1200000');
    const [surgeMultiplier, setSurgeMultiplier] = useState('1.1');

    useEffect(() => { loadData(); }, []);

    async function loadData() {
        try {
            const custData = await fetchEnriched('customers');
            const invData = await fetchEnriched('invoices');
            setCustomers(custData);
            setInvoices(invData);
            if (custData.length > 0 && !selectedCustomer) {
                setSelectedCustomer(custData[0]);
            }
        } catch (err) {
            console.error('Error loading customer portal:', err);
        }
    }

    async function handleGenerateInvoice(e) {
        e.preventDefault();
        if (!selectedOrderId) return;

        const base = parseFloat(baseTariff);
        const dist = parseFloat(distanceSurcharge);
        const surge = parseFloat(surgeMultiplier);
        const calculatedTotal = (base + dist) * surge;

        try {
            await createEntity('invoices', {
                order_id: Number(selectedOrderId),
                base_tariff: base,
                distance_surcharge: dist,
                surge_multiplier: surge,
                total_amount: calculatedTotal,
                payment_status: 'UNPAID',
                issued_at: new Date().toISOString()
            });
            alert(`Invoice computed successfully! Total: $${calculatedTotal.toLocaleString()}`);
            loadData();
        } catch (err) {
            alert(`Invoice generation failed: ${err.message}`);
        }
    }

    async function handlePayInvoice(invoice) {
        try {
            await createEntity('payment_transactions', {
                invoice_id: invoice.id,
                transaction_reference: `TXN-${Date.now()}`,
                amount_paid: invoice.total_amount,
                transaction_status: 'SIMULATED_SUCCESS',
                processed_at: new Date().toISOString()
            });

            await updateEntity('invoices', invoice.id, { payment_status: 'PAID' });
            alert(`Payment transaction approved for Invoice #${invoice.id}!`);
            loadData();
        } catch (err) {
            alert(`Payment failed: ${err.message}`);
        }
    }

    const cardStyle = {
        background: '#ffffff',
        borderRadius: '12px',
        padding: '24px',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
        border: '1px solid #e5e7eb'
    };

    const inputStyle = {
        padding: '10px 12px',
        borderRadius: '6px',
        border: '1px solid #d1d5db',
        fontSize: '14px',
        width: '100%'
    };

    return (
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '32px 24px', fontFamily: 'Inter, system-ui, sans-serif' }}>
            <div style={{ marginBottom: '28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 style={{ fontSize: '28px', fontWeight: '700', color: '#111827', margin: '0 0 6px 0' }}>💳 Billing & Customer Tracking Portal</h2>
                    <p style={{ color: '#6b7280', margin: 0 }}>Track active client shipments, process calculated tariff invoices, and settle account balances.</p>
                </div>

                <div>
                    <select 
                        value={selectedCustomer?.id || ''} 
                        onChange={e => setSelectedCustomer(customers.find(c => c.id === Number(e.target.value)))}
                        style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', fontWeight: '600' }}
                    >
                        {customers.map(c => (
                            <option key={c.id} value={c.id}>{c.company_name} ({c.contact_email})</option>
                        ))}
                    </select>
                </div>
            </div>

            {selectedCustomer && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                    {/* Customer Orders */}
                    <div style={cardStyle}>
                        <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', marginBottom: '16px' }}>📦 Client Cargo Orders</h3>
                        {selectedCustomer.orders?.length === 0 ? (
                            <p style={{ color: '#9ca3af' }}>No orders found.</p>
                        ) : (
                            selectedCustomer.orders?.map(order => (
                                <div key={order.id} style={{ border: '1px solid #e5e7eb', padding: '16px', borderRadius: '8px', marginBottom: '12px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                        <span style={{ fontWeight: '700' }}>Order #{order.id}</span>
                                        <span style={{ background: '#e0e7ff', color: '#3730a3', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: '600' }}>{order.status}</span>
                                    </div>
                                    <div style={{ fontSize: '14px', color: '#4b5563' }}>Destination: {order.destination_address}</div>
                                    <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>Cargo: {order.cargo_weight_kg} kg | {order.cargo_volume_m3} m³</div>
                                </div>
                            ))
                        )}

                        <hr style={{ margin: '24px 0', border: 'none', borderTop: '1px solid #e5e7eb' }} />

                        <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>🧮 Compute Dynamic Tariff Invoice</h4>
                        <form onSubmit={handleGenerateInvoice} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <select value={selectedOrderId} onChange={e => setSelectedOrderId(e.target.value)} style={inputStyle} required>
                                <option value="">-- Choose Order to Bill --</option>
                                {selectedCustomer.orders?.map(o => <option key={o.id} value={o.id}>Order #{o.id}</option>)}
                            </select>
                            <input placeholder="Base Tariff ($)" value={baseTariff} onChange={e => setBaseTariff(e.target.value)} style={inputStyle} required />
                            <input placeholder="Distance Surcharge ($)" value={distanceSurcharge} onChange={e => setDistanceSurcharge(e.target.value)} style={inputStyle} required />
                            <input placeholder="Surge Multiplier (e.g., 1.1)" value={surgeMultiplier} onChange={e => setSurgeMultiplier(e.target.value)} style={inputStyle} required />
                            <button type="submit" style={{ background: '#0284c7', color: '#fff', border: 'none', padding: '10px', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}>
                                Calculate Total & Issue Invoice
                            </button>
                        </form>
                    </div>

                    {/* Customer Invoices */}
                    <div style={cardStyle}>
                        <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', marginBottom: '16px' }}>🧾 Ledger Invoices & Gateway</h3>
                        {invoices.filter(inv => inv.customer?.id === selectedCustomer.id).length === 0 ? (
                            <p style={{ color: '#9ca3af' }}>No invoices billed to this account yet.</p>
                        ) : (
                            invoices.filter(inv => inv.customer?.id === selectedCustomer.id).map(inv => (
                                <div key={inv.id} style={{ border: '1px solid #e5e7eb', padding: '16px', borderRadius: '8px', marginBottom: '12px', background: '#fafafa' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                        <span style={{ fontWeight: '700' }}>Invoice #{inv.id} (Order #{inv.order_id})</span>
                                        <span style={{
                                            background: inv.payment_status === 'PAID' ? '#dcfce7' : '#fee2e2',
                                            color: inv.payment_status === 'PAID' ? '#15803d' : '#b91c1c',
                                            padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: '600'
                                        }}>
                                            {inv.payment_status}
                                        </span>
                                    </div>
                                    <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px' }}>
                                        Base: ${inv.base_tariff} | Surcharge: ${inv.distance_surcharge} | Surge: {inv.surge_multiplier}x
                                    </div>
                                    <div style={{ fontSize: '20px', fontWeight: '700', color: '#0f172a', marginBottom: '12px' }}>
                                        ${inv.total_amount?.toLocaleString()}
                                    </div>

                                    {inv.payment_status !== 'PAID' && (
                                        <button 
                                            onClick={() => handlePayInvoice(inv)}
                                            style={{ background: '#16a34a', color: '#ffffff', border: 'none', padding: '8px 14px', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}
                                        >
                                            💳 Pay Invoice (Simulate Gateway)
                                        </button>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}