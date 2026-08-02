import React, { useState, useEffect } from 'react';
import { fetchEnriched, fetchEntity, createEntity, updateEntity } from '../services/api';

// Reusable UI styles
const cardStyle = {
    background: '#ffffff',
    borderRadius: '12px',
    padding: '24px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
};

const inputStyle = {
    padding: '10px 14px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    fontSize: '14px',
    width: '100%',
    boxSizing: 'border-box',
    outline: 'none',
    transition: 'border-color 0.2s'
};

const badgeStyle = (type) => {
    const isSuccess = type === 'PAID' || type === 'COMPLETED' || type === 'SUCCESSFUL';
    return {
        background: isSuccess ? '#dcfce7' : '#fee2e2',
        color: isSuccess ? '#15803d' : '#b91c1c',
        padding: '4px 10px',
        borderRadius: '20px',
        fontSize: '12px',
        fontWeight: '700',
        display: 'inline-block'
    };
};

export default function CustomerPage() {
    const [customers, setCustomers] = useState([]);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [orders, setOrders] = useState([]);
    const [invoices, setInvoices] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [activeTab, setActiveTab] = useState('invoices'); // 'invoices' | 'create' | 'ledger'

    // Billing Form State
    const [selectedOrderId, setSelectedOrderId] = useState('');
    const [baseTariff, setBaseTariff] = useState(3000);
    const [distanceSurcharge, setDistanceSurcharge] = useState(1100);
    const [surgeMultiplier, setSurgeMultiplier] = useState(1.0);
    const [paymentMethod, setPaymentMethod] = useState('CORPORATE_CARD');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => { loadData(); }, []);

    async function loadData() {
        try {
            const [custData, invData, ordersData, txData] = await Promise.all([
                fetchEnriched('customers').catch(() => []),
                fetchEnriched('invoices').catch(() => []),
                fetchEnriched('orders').catch(() => []),
                fetchEntity('payment_transactions').catch(() => [])
            ]);

            const fallbackCustomer = { id: 1, company_name: 'Global Freight Logistics Ltd.', contact_email: 'billing@globalfreight.com' };
            const finalCustomers = custData?.length > 0 ? custData : [fallbackCustomer];

            setCustomers(finalCustomers);
            setInvoices(invData || []);
            setOrders(ordersData || []);
            setTransactions(txData || []);

            if (!selectedCustomer) setSelectedCustomer(finalCustomers[0]);
        } catch (err) {
            console.error('Error loading billing portal data:', err);
        }
    }

    // Filter relevant orders and invoices
    const customerOrders = orders.filter(o => {
        const orderCustomerId = o.customer_id || o.customer?.id;
        const matchesCustomer = !orderCustomerId || Number(orderCustomerId) === Number(selectedCustomer?.id);
        const isBillableStatus = !o.status || ['IN_TRANSIT', 'DISPATCHED', 'PENDING', 'COMPLETED', 'DELIVERED'].includes(o.status.toUpperCase());
        return matchesCustomer && isBillableStatus;
    });

    const customerInvoices = invoices.filter(inv => {
        const invCustomerId = inv.customer_id || inv.customer?.id;
        return !invCustomerId || Number(invCustomerId) === Number(selectedCustomer?.id);
    });

    // Auto-populate reasonable initial tariff rates on selection
    function handleOrderSelect(e) {
        const orderId = e.target.value;
        setSelectedOrderId(orderId);

        const targetOrder = customerOrders.find(o => String(o.id) === String(orderId));
        if (targetOrder) {
            const weight = Number(targetOrder.total_weight_kg) || 2000;
            // Realistic base & weight calculation
            setBaseTariff(3000);
            setDistanceSurcharge(Math.round(weight * 0.5));
            setSurgeMultiplier(1.0);
        }
    }

    // Live Calculations
    const subtotal = (Number(baseTariff) || 0) + (Number(distanceSurcharge) || 0);
    const calculatedTotal = subtotal * (Number(surgeMultiplier) || 1);
    const taxAmount = Math.round(calculatedTotal * 0.08);
    const grandTotal = Math.round(calculatedTotal + taxAmount);

    async function handleGenerateInvoice(e) {
        e.preventDefault();
        if (!selectedOrderId) return alert('Please select an order to bill.');

        setIsSubmitting(true);
        try {
            const relatedOrder = orders.find(o => String(o.id) === String(selectedOrderId));

            await createEntity('invoices', {
                order_id: Number(selectedOrderId),
                customer_id: selectedCustomer?.id || relatedOrder?.customer_id || 1,
                trip_id: relatedOrder?.trip_id || null,
                base_tariff: Number(baseTariff),
                distance_surcharge: Number(distanceSurcharge),
                surge_multiplier: Number(surgeMultiplier),
                total_amount: grandTotal,
                payment_status: 'UNPAID',
                status: 'UNPAID',
                issued_at: new Date().toISOString()
            });

            alert(`Invoice generated successfully! Total: $${grandTotal.toLocaleString()}`);
            setSelectedOrderId('');
            setActiveTab('invoices');
            loadData();
        } catch (err) {
            alert(`Failed to issue invoice: ${err.message}`);
        } finally {
            setIsSubmitting(false);
        }
    }

    async function handlePayInvoice(invoice) {
        setIsSubmitting(true);
        const txnRef = `TXN-${Math.floor(100000 + Math.random() * 900000)}`;

        try {
            const total = invoice.total_amount ?? invoice.amount ?? grandTotal;

            // 1. Log Payment Transaction Record
            await createEntity('payment_transactions', {
                invoice_id: invoice.id,
                transaction_reference: txnRef,
                amount_paid: total,
                payment_method: paymentMethod,
                transaction_status: 'SUCCESSFUL',
                processed_at: new Date().toISOString()
            });

            // 2. Update Invoice to PAID
            await updateEntity('invoices', invoice.id, {
                ...invoice,
                payment_status: 'PAID',
                status: 'PAID'
            });

            alert(`Payment confirmed! Transaction Ref: ${txnRef}`);
            loadData();
        } catch (err) {
            alert(`Payment failed: ${err.message}`);
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 16px', fontFamily: 'Inter, system-ui, sans-serif', color: '#0f172a' }}>
            
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
                <div>
                    <h2 style={{ fontSize: '26px', fontWeight: '800', margin: '0 0 6px 0', letterSpacing: '-0.5px' }}>Customer Billing Portal</h2>
                    <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>Review invoices, manage freight tariffs, and complete payment settlements.</p>
                </div>
                <div>
                    <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '4px' }}>Active Account</label>
                    <select 
                        value={selectedCustomer?.id || 1} 
                        onChange={e => setSelectedCustomer(customers.find(c => Number(c.id) === Number(e.target.value)))}
                        style={{ ...inputStyle, background: '#f8fafc', fontWeight: '600', cursor: 'pointer' }}
                    >
                        {customers.map(c => (
                            <option key={c.id} value={c.id}>{c.company_name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div style={{ display: 'flex', gap: '8px', borderBottom: '2px solid #e2e8f0', marginBottom: '24px' }}>
                {[
                    { id: 'invoices', label: `Invoices (${customerInvoices.length})` },
                    { id: 'create', label: 'Create Tariff Invoice' },
                    { id: 'ledger', label: `Audit Ledger (${transactions.length})` }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        style={{
                            padding: '10px 18px',
                            border: 'none',
                            background: 'none',
                            fontSize: '14px',
                            fontWeight: activeTab === tab.id ? '700' : '500',
                            color: activeTab === tab.id ? '#0284c7' : '#64748b',
                            borderBottom: activeTab === tab.id ? '3px solid #0284c7' : '3px solid transparent',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease-in-out'
                        }}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* TAB 1: INVOICES & PAYMENT */}
            {activeTab === 'invoices' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
                    {customerInvoices.length === 0 ? (
                        <div style={{ ...cardStyle, gridColumn: '1 / -1', textAlign: 'center', color: '#94a3b8', padding: '48px' }}>
                            No active invoices found for this account.
                        </div>
                    ) : (
                        customerInvoices.map(inv => {
                            const isPaid = (inv.payment_status || inv.status) === 'PAID';
                            const base = inv.base_tariff ?? 3000;
                            const surcharge = inv.distance_surcharge ?? 1100;
                            const surge = inv.surge_multiplier ?? 1.0;
                            const total = inv.total_amount ?? inv.amount ?? 4100;

                            return (
                                <div key={inv.id} style={cardStyle}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                        <span style={{ fontWeight: '800', fontSize: '16px' }}>Invoice #{inv.id}</span>
                                        <span style={badgeStyle(isPaid ? 'PAID' : 'UNPAID')}>
                                            {isPaid ? 'PAID' : 'UNPAID'}
                                        </span>
                                    </div>

                                    <div style={{ fontSize: '13px', color: '#64748b', display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span>Order Reference:</span>
                                            <strong style={{ color: '#334155' }}>Order #{inv.order_id}</strong>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span>Base Rate:</span>
                                            <span>${base.toLocaleString()}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span>Distance Surcharge:</span>
                                            <span>${surcharge.toLocaleString()}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span>Surge Rate:</span>
                                            <span>{surge}x</span>
                                        </div>
                                    </div>

                                    <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '12px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>Total Due:</span>
                                        <span style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a' }}>${total.toLocaleString()}</span>
                                    </div>

                                    {!isPaid && (
                                        <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                            <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', display: 'block', marginBottom: '6px' }}>SELECT PAYMENT METHOD</label>
                                            <select 
                                                value={paymentMethod} 
                                                onChange={e => setPaymentMethod(e.target.value)} 
                                                style={{ ...inputStyle, marginBottom: '10px', fontSize: '12px' }}
                                            >
                                                <option value="CORPORATE_CARD">Corporate Credit Card</option>
                                                <option value="BANK_WIRE">Direct Wire Transfer</option>
                                                <option value="FLEET_CREDIT">Fleet Line of Credit</option>
                                            </select>
                                            <button 
                                                onClick={() => handlePayInvoice(inv)} 
                                                disabled={isSubmitting} 
                                                style={{ width: '100%', background: '#16a34a', color: '#fff', border: 'none', padding: '10px', borderRadius: '6px', fontWeight: '700', cursor: 'pointer' }}
                                            >
                                                {isSubmitting ? 'Processing...' : 'Pay Invoice Now'}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            )}

            {/* TAB 2: INVOICE GENERATOR */}
            {activeTab === 'create' && (
                <div style={{ maxWidth: '600px', margin: '0 auto', ...cardStyle }}>
                    <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px' }}>Compute & Issue Tariff Invoice</h3>
                    
                    <form onSubmit={handleGenerateInvoice} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div>
                            <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '6px' }}>Select Order to Bill:</label>
                            <select value={selectedOrderId} onChange={handleOrderSelect} style={inputStyle} required>
                                <option value="">-- Choose Order --</option>
                                {customerOrders.map(o => (
                                    <option key={o.id} value={o.id}>
                                        Order #{o.id} - {o.cargo_description || 'General Shipment'} ({o.status || 'IN_TRANSIT'})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <div>
                                <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '6px' }}>Base Tariff ($):</label>
                                <input type="number" value={baseTariff} onChange={e => setBaseTariff(e.target.value)} style={inputStyle} required />
                            </div>
                            <div>
                                <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '6px' }}>Distance Surcharge ($):</label>
                                <input type="number" value={distanceSurcharge} onChange={e => setDistanceSurcharge(e.target.value)} style={inputStyle} required />
                            </div>
                        </div>

                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>Surge Multiplier:</label>
                                <span style={{ fontSize: '13px', fontWeight: '700', color: '#0284c7' }}>{surgeMultiplier}x</span>
                            </div>
                            <input 
                                type="range" 
                                min="1.0" 
                                max="2.5" 
                                step="0.1" 
                                value={surgeMultiplier} 
                                onChange={e => setSurgeMultiplier(e.target.value)} 
                                style={{ width: '100%', accentColor: '#0284c7' }} 
                            />
                        </div>

                        {/* Calculation Summary */}
                        <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                                <span>Subtotal:</span>
                                <span>${subtotal.toLocaleString()}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                                <span>Tax (8% VAT):</span>
                                <span>${taxAmount.toLocaleString()}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '800', borderTop: '1px solid #cbd5e1', paddingTop: '8px', fontSize: '15px' }}>
                                <span>Calculated Grand Total:</span>
                                <span style={{ color: '#0284c7' }}>${grandTotal.toLocaleString()}</span>
                            </div>
                        </div>

                        <button 
                            type="submit" 
                            disabled={isSubmitting || !selectedOrderId} 
                            style={{ 
                                background: isSubmitting || !selectedOrderId ? '#94a3b8' : '#0284c7', 
                                color: '#fff', 
                                border: 'none', 
                                padding: '12px', 
                                borderRadius: '8px', 
                                fontWeight: '700', 
                                cursor: isSubmitting || !selectedOrderId ? 'not-allowed' : 'pointer' 
                            }}
                        >
                            Issue Official Invoice
                        </button>
                    </form>
                </div>
            )}

            {/* TAB 3: TRANSACTION HISTORY */}
            {activeTab === 'ledger' && (
                <div style={cardStyle}>
                    <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px' }}>Settlement & Audit Ledger History</h3>
                    
                    {transactions.length === 0 ? (
                        <p style={{ color: '#94a3b8', fontSize: '13px', textAlign: 'center' }}>No recorded transaction settlements yet.</p>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                                <thead>
                                    <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#475569' }}>
                                        <th style={{ padding: '12px' }}>Txn Reference</th>
                                        <th style={{ padding: '12px' }}>Invoice ID</th>
                                        <th style={{ padding: '12px' }}>Amount Paid</th>
                                        <th style={{ padding: '12px' }}>Payment Method</th>
                                        <th style={{ padding: '12px' }}>Status</th>
                                        <th style={{ padding: '12px' }}>Timestamp</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {transactions.map((tx, idx) => (
                                        <tr key={tx.id || idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                            <td style={{ padding: '12px', fontWeight: '700', fontFamily: 'monospace', color: '#0284c7' }}>
                                                {tx.transaction_reference || `TXN-${tx.id}`}
                                            </td>
                                            <td style={{ padding: '12px' }}>Invoice #{tx.invoice_id}</td>
                                            <td style={{ padding: '12px', fontWeight: '700', color: '#15803d' }}>
                                                ${(tx.amount_paid || 0).toLocaleString()}
                                            </td>
                                            <td style={{ padding: '12px' }}>{(tx.payment_method || 'GATEWAY').replace('_', ' ')}</td>
                                            <td style={{ padding: '12px' }}>
                                                <span style={badgeStyle('SUCCESSFUL')}>
                                                    {tx.transaction_status || 'SUCCESSFUL'}
                                                </span>
                                            </td>
                                            <td style={{ padding: '12px', color: '#64748b', fontSize: '12px' }}>
                                                {tx.processed_at ? new Date(tx.processed_at).toLocaleString() : 'Recent'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

        </div>
    );
}