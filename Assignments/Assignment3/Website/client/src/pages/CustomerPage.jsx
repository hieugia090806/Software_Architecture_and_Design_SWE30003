import React, { useState, useEffect } from 'react';
import { fetchEnriched, fetchEntity, createEntity, updateEntity } from '../services/api';

// Shared Reusable Styles
const cardStyle = { background: '#fff', borderRadius: '10px', padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' };
const inputStyle = { padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', width: '100%', boxSizing: 'border-box' };
const flexBetween = { display: 'flex', justifyContent: 'space-between', alignItems: 'center' };

export default function CustomerPage() {
    const [customers, setCustomers] = useState([]);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [orders, setOrders] = useState([]);
    const [invoices, setInvoices] = useState([]);
    const [transactions, setTransactions] = useState([]);

    // Form State
    const [selectedOrderId, setSelectedOrderId] = useState('');
    const [baseTariff, setBaseTariff] = useState(500000);
    const [distanceSurcharge, setDistanceSurcharge] = useState(1200000);
    const [surgeMultiplier, setSurgeMultiplier] = useState(1.1);
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

    // Filter orders for selected customer (allows unassigned orders to show)
    const customerOrders = orders.filter(o => 
        !o.customer_id || o.customer_id === selectedCustomer?.id || o.customer?.id === selectedCustomer?.id
    );

    // Filter invoices for selected customer
    const customerInvoices = invoices.filter(inv => 
        !inv.customer_id || inv.customer_id === selectedCustomer?.id || inv.customer?.id === selectedCustomer?.id
    );

    // Live Math
    const calculatedSubtotal = (Number(baseTariff) || 0) + (Number(distanceSurcharge) || 0);
    const calculatedTotal = calculatedSubtotal * (Number(surgeMultiplier) || 1);
    const taxAmount = calculatedTotal * 0.08;
    const grandTotal = Math.round(calculatedTotal + taxAmount);

    async function handleGenerateInvoice(e) {
        e.preventDefault();
        if (!selectedOrderId) return alert('Please select an order to bill.');

        setIsSubmitting(true);
        try {
            await createEntity('invoices', {
                order_id: Number(selectedOrderId),
                customer_id: selectedCustomer?.id || 1,
                base_tariff: Number(baseTariff),
                distance_surcharge: Number(distanceSurcharge),
                surge_multiplier: Number(surgeMultiplier),
                total_amount: grandTotal,
                payment_status: 'UNPAID',
                issued_at: new Date().toISOString()
            });

            alert(`Invoice issued! Total: $${grandTotal.toLocaleString()}`);
            setSelectedOrderId('');
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
            await createEntity('payment_transactions', {
                invoice_id: invoice.id,
                transaction_reference: txnRef,
                amount_paid: invoice.total_amount,
                payment_method: paymentMethod,
                transaction_status: 'SUCCESSFUL',
                processed_at: new Date().toISOString()
            });

            await updateEntity('invoices', invoice.id, { ...invoice, payment_status: 'PAID' });

            alert(`Payment confirmed! Ref: ${txnRef}`);
            loadData();
        } catch (err) {
            alert(`Payment failed: ${err.message}`);
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div style={{ maxWidth: '1240px', margin: '0 auto', padding: '24px', fontFamily: 'Inter, system-ui, sans-serif', color: '#0f172a' }}>
            
            {/* Header */}
            <div style={{ ...flexBetween, marginBottom: '24px' }}>
                <div>
                    <h2 style={{ fontSize: '24px', fontWeight: '700', margin: '0 0 4px 0' }}>Enterprise Billing & Customer Settlement Portal</h2>
                    <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>Manage client shipments, dynamic tariffs, and transaction ledgers.</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>Client:</label>
                    <select 
                        value={selectedCustomer?.id || 1} 
                        onChange={e => setSelectedCustomer(customers.find(c => c.id === Number(e.target.value)))}
                        style={{ ...inputStyle, width: 'auto', fontWeight: '600' }}
                    >
                        {customers.map(c => (
                            <option key={c.id} value={c.id}>{c.company_name} ({c.contact_email || 'Active'})</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
                
                {/* Left Panel */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    
                    {/* Orders */}
                    <div style={cardStyle}>
                        <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#334155', textTransform: 'uppercase', marginBottom: '12px' }}>Client Cargo Orders</h3>
                        {customerOrders.length === 0 ? (
                            <p style={{ color: '#94a3b8', fontSize: '13px', textAlign: 'center' }}>No cargo orders found.</p>
                        ) : (
                            customerOrders.map(o => (
                                <div key={o.id} style={{ border: '1px solid #e2e8f0', padding: '12px', borderRadius: '6px', marginBottom: '8px', background: '#f8fafc' }}>
                                    <div style={{ ...flexBetween, marginBottom: '4px' }}>
                                        <span style={{ fontWeight: '700', fontSize: '14px' }}>Order #{o.id}</span>
                                        <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', fontWeight: '700' }}>
                                            {o.status || 'IN_TRANSIT'}
                                        </span>
                                    </div>
                                    <div style={{ fontSize: '13px', color: '#475569' }}><strong>Cargo:</strong> {o.cargo_description || 'General Cargo'}</div>
                                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                                        Weight: {o.total_weight_kg || 0} kg | Driver ID: #{o.driver_id || 'N/A'}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Calculator */}
                    <div style={cardStyle}>
                        <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#334155', textTransform: 'uppercase', marginBottom: '12px' }}>Compute Dynamic Tariff Invoice</h3>
                        <form onSubmit={handleGenerateInvoice} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div>
                                <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569' }}>Select Order:</label>
                                <select value={selectedOrderId} onChange={e => setSelectedOrderId(e.target.value)} style={inputStyle} required>
                                    <option value="">-- Choose Order to Bill --</option>
                                    {customerOrders.map(o => (
                                        <option key={o.id} value={o.id}>Order #{o.id} - {o.cargo_description || 'Shipment'}</option>
                                    ))}
                                </select>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                <div>
                                    <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569' }}>Base Tariff ($):</label>
                                    <input type="number" value={baseTariff} onChange={e => setBaseTariff(e.target.value)} style={inputStyle} required />
                                </div>
                                <div>
                                    <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569' }}>Distance Surcharge ($):</label>
                                    <input type="number" value={distanceSurcharge} onChange={e => setDistanceSurcharge(e.target.value)} style={inputStyle} required />
                                </div>
                            </div>

                            <div>
                                <div style={flexBetween}>
                                    <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569' }}>Surge Multiplier:</label>
                                    <span style={{ fontSize: '12px', fontWeight: '700', color: '#0284c7' }}>{surgeMultiplier}x</span>
                                </div>
                                <input type="range" min="1.0" max="2.5" step="0.05" value={surgeMultiplier} onChange={e => setSurgeMultiplier(e.target.value)} style={{ width: '100%', accentColor: '#0284c7' }} />
                            </div>

                            <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '13px' }}>
                                <div style={{ ...flexBetween, color: '#64748b' }}><span>Subtotal:</span><span>${calculatedSubtotal.toLocaleString()}</span></div>
                                <div style={{ ...flexBetween, color: '#64748b', margin: '4px 0' }}><span>Tax (8% VAT):</span><span>${taxAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span></div>
                                <div style={{ ...flexBetween, fontWeight: '700', borderTop: '1px solid #cbd5e1', paddingTop: '6px' }}>
                                    <span>Calculated Total:</span>
                                    <span style={{ color: '#0284c7' }}>${grandTotal.toLocaleString()}</span>
                                </div>
                            </div>

                            <button type="submit" disabled={isSubmitting} style={{ background: '#0284c7', color: '#fff', border: 'none', padding: '10px', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}>
                                Calculate Total & Issue Invoice
                            </button>
                        </form>
                    </div>
                </div>

                {/* Right Panel: Invoices */}
                <div style={cardStyle}>
                    <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#334155', textTransform: 'uppercase', marginBottom: '12px' }}>Ledger Invoices & Gateway</h3>
                    {customerInvoices.length === 0 ? (
                        <p style={{ color: '#94a3b8', fontSize: '13px', textAlign: 'center' }}>No invoices generated yet.</p>
                    ) : (
                        customerInvoices.map(inv => {
                            const isPaid = inv.payment_status === 'PAID';
                            return (
                                <div key={inv.id} style={{ border: '1px solid #e2e8f0', padding: '14px', borderRadius: '8px', marginBottom: '12px' }}>
                                    <div style={flexBetween}>
                                        <span style={{ fontWeight: '700', fontSize: '14px' }}>Invoice #{inv.id} <small style={{ fontWeight: '400', color: '#64748b' }}>(Order #{inv.order_id})</small></span>
                                        <span style={{ background: isPaid ? '#dcfce7' : '#fee2e2', color: isPaid ? '#15803d' : '#b91c1c', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '700' }}>
                                            {inv.payment_status || 'UNPAID'}
                                        </span>
                                    </div>
                                    <div style={{ fontSize: '12px', color: '#64748b', margin: '6px 0' }}>
                                        Base: ${inv.base_tariff || 0} | Surcharge: ${inv.distance_surcharge || 0} | Surge: {inv.surge_multiplier || 1}x
                                    </div>
                                    <div style={{ ...flexBetween, marginBottom: '10px' }}>
                                        <span style={{ fontSize: '12px', fontWeight: '600', color: '#475569' }}>Balance:</span>
                                        <span style={{ fontSize: '20px', fontWeight: '800' }}>${(inv.total_amount || 0).toLocaleString()}</span>
                                    </div>

                                    {!isPaid && (
                                        <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                                            <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} style={{ ...inputStyle, marginBottom: '8px' }}>
                                                <option value="CORPORATE_CARD">Corporate Credit Card</option>
                                                <option value="BANK_WIRE">Direct Wire Transfer</option>
                                                <option value="FLEET_CREDIT">Fleet Line of Credit</option>
                                            </select>
                                            <button onClick={() => handlePayInvoice(inv)} disabled={isSubmitting} style={{ width: '100%', background: '#16a34a', color: '#fff', border: 'none', padding: '8px', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}>
                                                Pay Invoice (Simulate Gateway)
                                            </button>
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Bottom Audit Table */}
            <div style={cardStyle}>
                <div style={{ ...flexBetween, marginBottom: '12px' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#334155', textTransform: 'uppercase', margin: 0 }}>Transaction Settlement History & Audit Ledger</h3>
                    <span style={{ fontSize: '12px', fontWeight: '600', color: '#0284c7', background: '#e0f2fe', padding: '2px 8px', borderRadius: '4px' }}>
                        {transactions.length} Verified Records
                    </span>
                </div>

                {transactions.length === 0 ? (
                    <p style={{ color: '#94a3b8', fontSize: '13px', textAlign: 'center' }}>No transaction logs recorded.</p>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                        <thead>
                            <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#475569' }}>
                                <th style={{ padding: '8px' }}>Txn Ref</th>
                                <th style={{ padding: '8px' }}>Invoice ID</th>
                                <th style={{ padding: '8px' }}>Amount Paid</th>
                                <th style={{ padding: '8px' }}>Method</th>
                                <th style={{ padding: '8px' }}>Status</th>
                                <th style={{ padding: '8px' }}>Timestamp</th>
                            </tr>
                        </thead>
                        <tbody>
                            {transactions.map((tx, idx) => (
                                <tr key={tx.id || idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                    <td style={{ padding: '8px', fontWeight: '700', fontFamily: 'monospace', color: '#0284c7' }}>{tx.transaction_reference || `TXN-${tx.id}`}</td>
                                    <td style={{ padding: '8px' }}>Invoice #{tx.invoice_id}</td>
                                    <td style={{ padding: '8px', fontWeight: '700', color: '#15803d' }}>${(tx.amount_paid || 0).toLocaleString()}</td>
                                    <td style={{ padding: '8px' }}>{(tx.payment_method || 'GATEWAY').replace('_', ' ')}</td>
                                    <td style={{ padding: '8px' }}>
                                        <span style={{ background: '#dcfce7', color: '#15803d', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', fontWeight: '700' }}>
                                            {tx.transaction_status || 'SUCCESSFUL'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '8px', color: '#64748b', fontSize: '12px' }}>
                                        {tx.processed_at ? new Date(tx.processed_at).toLocaleString() : 'Recent'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

        </div>
    );
}