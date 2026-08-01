import React, { useState, useEffect } from 'react';
import { fetchEntity, createEntity } from '../services/api';

export default function AdminPage() {
    const [subTab, setSubTab] = useState('branch');

    const [branches, setBranches] = useState([]);
    const [vehicleTypes, setVehicleTypes] = useState([]);
    const [vehicles, setVehicles] = useState([]);
    const [drivers, setDrivers] = useState([]);

    // Forms
    const [branchForm, setBranchForm] = useState({ city_prefix: '', branch_name: '', location_city: '' });
    const [typeForm, setTypeForm] = useState({ type_name: '', max_payload_kg: 5000, volumetric_limit_m3: 20, base_fuel_rate: 1.5 });
    const [newDriverForm, setNewDriverForm] = useState({ username: '', branch_id: '' });
    const [vehicleForm, setVehicleForm] = useState({ license_plate: '', branch_id: '', vehicle_type_id: '', status: 'AVAILABLE' });
    const [orderForm, setOrderForm] = useState({ origin_branch_id: '', destination_branch_id: '', vehicle_id: '', driver_id: '', cargo_description: '', total_weight_kg: 1000 });

    const [message, setMessage] = useState('');

    useEffect(() => { loadAllData(); }, []);

    async function loadAllData() {
        try {
            setBranches(await fetchEntity('branches'));
            setVehicleTypes(await fetchEntity('vehicle_types'));
            setVehicles(await fetchEntity('vehicles'));
            setDrivers(await fetchEntity('drivers'));
        } catch (err) {
            console.error('Error loading admin data:', err);
        }
    }

    const triggerNotification = (msg) => {
        setMessage(msg);
        setTimeout(() => setMessage(''), 4000);
    };

    // Helper: Auto-generates license string like LIC-HCM-58219 based on selected branch
    const generateLicenseNumber = (branchId) => {
        const selectedBranch = branches.find(b => String(b.id) === String(branchId));
        let cityTag = 'HUB';
        if (selectedBranch) {
            // Extract city code from location or branch code (e.g., HCM, DAN, HAN)
            cityTag = selectedBranch.location_city ? selectedBranch.location_city.substring(0, 3).toUpperCase() : 'HUB';
        }
        const randomDigits = Math.floor(10000 + Math.random() * 90000);
        return `LIC-${cityTag}-${randomDigits}`;
    };

    async function submitRequest(entityType, payload, title) {
        try {
            await createEntity('requests', {
                entity_type: entityType,
                payload: payload,
                title: title,
                status: 'PENDING',
                requested_at: new Date().toISOString()
            });
            triggerNotification(`Request for "${title}" submitted to Approvals Queue.`);
        } catch (err) {
            console.error('Submission error:', err);
        }
    }

    const handleBranchSubmit = async (e) => {
        e.preventDefault();
        const formattedCode = `LIC-${branchForm.city_prefix.substring(0, 3).toUpperCase()}-HUB`;
        await submitRequest('branches', {
            branch_code: formattedCode,
            branch_name: branchForm.branch_name,
            location_city: branchForm.location_city
        }, `New Branch: ${formattedCode}`);
        setBranchForm({ city_prefix: '', branch_name: '', location_city: '' });
    };

    const handleTypeSubmit = async (e) => {
        e.preventDefault();
        await submitRequest('vehicle_types', {
            type_name: typeForm.type_name,
            max_payload_kg: parseFloat(typeForm.max_payload_kg),
            volumetric_limit_m3: parseFloat(typeForm.volumetric_limit_m3),
            base_fuel_rate: parseFloat(typeForm.base_fuel_rate)
        }, `New Class: ${typeForm.type_name}`);
        setTypeForm({ type_name: '', max_payload_kg: 5000, volumetric_limit_m3: 20, base_fuel_rate: 1.5 });
    };

    const handleNewDriverSubmit = async (e) => {
        e.preventDefault();
        const autoLicense = generateLicenseNumber(newDriverForm.branch_id);
        
        await submitRequest('new_driver', {
            username: newDriverForm.username,
            password_hash: '$2b$10$e83/hash_driver_default',
            role: 'DRIVER',
            branch_id: Number(newDriverForm.branch_id),
            license_number: autoLicense,
            active_service_hours: 0,
            status: 'AVAILABLE'
        }, `New Driver: ${newDriverForm.username} (${autoLicense})`);
        
        setNewDriverForm({ username: '', branch_id: '' });
    };

    const handleVehicleSubmit = async (e) => {
        e.preventDefault();
        await submitRequest('vehicles', {
            license_plate: vehicleForm.license_plate,
            branch_id: Number(vehicleForm.branch_id),
            vehicle_type_id: Number(vehicleForm.vehicle_type_id),
            status: 'AVAILABLE'
        }, `Vehicle Asset: ${vehicleForm.license_plate}`);
        setVehicleForm({ license_plate: '', branch_id: '', vehicle_type_id: '', status: 'AVAILABLE' });
    };

    const handleOrderSubmit = async (e) => {
        e.preventDefault();
        const origin = branches.find(b => b.id === Number(orderForm.origin_branch_id))?.branch_name || 'Origin';
        const dest = branches.find(b => b.id === Number(orderForm.destination_branch_id))?.branch_name || 'Destination';

        await submitRequest('orders', {
            origin_branch_id: Number(orderForm.origin_branch_id),
            destination_branch_id: Number(orderForm.destination_branch_id),
            vehicle_id: Number(orderForm.vehicle_id),
            driver_id: Number(orderForm.driver_id),
            cargo_description: orderForm.cargo_description,
            total_weight_kg: Number(orderForm.total_weight_kg),
            status: 'PENDING_DISPATCH'
        }, `Hub Transfer Order: ${origin} -> ${dest}`);
        setOrderForm({ origin_branch_id: '', destination_branch_id: '', vehicle_id: '', driver_id: '', cargo_description: '', total_weight_kg: 1000 });
    };

    // Styling Definitions
    const cardStyle = { background: '#ffffff', borderRadius: '12px', padding: '28px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #e5e7eb' };
    const labelStyle = { fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '4px', display: 'block' };
    const inputStyle = { padding: '10px 12px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px', width: '100%', boxSizing: 'border-box' };
    const btnStyle = { background: '#2563eb', color: '#ffffff', padding: '12px 20px', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', marginTop: '8px' };

    const subNavBtn = (key) => ({
        padding: '10px 16px',
        border: 'none',
        background: subTab === key ? '#2563eb' : '#f1f5f9',
        color: subTab === key ? '#ffffff' : '#475569',
        fontWeight: '600',
        borderRadius: '6px',
        cursor: 'pointer'
    });

    return (
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 24px', fontFamily: 'Inter, system-ui, sans-serif' }}>
            <div style={{ marginBottom: '24px' }}>
                <h2 style={{ fontSize: '26px', fontWeight: '700', color: '#111827', margin: '0 0 6px 0' }}>Fleet Infrastructure Management</h2>
                <p style={{ color: '#6b7280', margin: 0 }}>Register hub branches, vehicle classifications, driver profiles, vehicle assets, and inter-hub transfer orders.</p>
            </div>

            {message && (
                <div style={{ padding: '12px 16px', background: '#dcfce7', border: '1px solid #86efac', color: '#166534', borderRadius: '8px', marginBottom: '20px', fontWeight: '600' }}>
                    {message}
                </div>
            )}

            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', background: '#ffffff', padding: '8px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <button onClick={() => setSubTab('branch')} style={subNavBtn('branch')}>Regional Branch</button>
                <button onClick={() => setSubTab('vtype')} style={subNavBtn('vtype')}>Vehicle Specifications</button>
                <button onClick={() => setSubTab('new_driver')} style={subNavBtn('new_driver')}>Add New Driver</button>
                <button onClick={() => setSubTab('vehicle')} style={subNavBtn('vehicle')}>Vehicle Assets</button>
                <button onClick={() => setSubTab('pending_order')} style={subNavBtn('pending_order')}>Create Pending Order</button>
            </div>

            <div style={cardStyle}>
                {/* 1. Branch Sub-Tab */}
                {subTab === 'branch' && (
                    <form onSubmit={handleBranchSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <h3 style={{ margin: '0 0 8px 0', color: '#1e293b' }}>Register Regional Branch</h3>
                        <div>
                            <label style={labelStyle}>City Location Prefix (3-Letter Code)</label>
                            <input style={inputStyle} value={branchForm.city_prefix} onChange={e => setBranchForm({ ...branchForm, city_prefix: e.target.value })} maxLength={3} placeholder="HCM, DAN, HAN" required />
                            <span style={{ fontSize: '12px', color: '#64748b', marginTop: '4px', display: 'block' }}>
                                Generates code in standard format: {branchForm.city_prefix ? `LIC-${branchForm.city_prefix.toUpperCase()}-HUB` : 'LIC-[CODE]-HUB'}
                            </span>
                        </div>
                        <div>
                            <label style={labelStyle}>Full Branch Name</label>
                            <input style={inputStyle} value={branchForm.branch_name} onChange={e => setBranchForm({ ...branchForm, branch_name: e.target.value })} required />
                        </div>
                        <div>
                            <label style={labelStyle}>Station City Location</label>
                            <input style={inputStyle} value={branchForm.location_city} onChange={e => setBranchForm({ ...branchForm, location_city: e.target.value })} required />
                        </div>
                        <button type="submit" style={btnStyle}>Submit Branch Registration Request</button>
                    </form>
                )}

                {/* 2. Vehicle Specification Sub-Tab */}
                {subTab === 'vtype' && (
                    <form onSubmit={handleTypeSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <h3 style={{ margin: '0 0 8px 0', color: '#1e293b' }}>Register Vehicle Classification Specification</h3>
                        <div>
                            <label style={labelStyle}>Vehicle Specification Title</label>
                            <input style={inputStyle} value={typeForm.type_name} onChange={e => setTypeForm({ ...typeForm, type_name: e.target.value })} required />
                        </div>
                        
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <label style={labelStyle}>Maximum Weight Capacity</label>
                                <span style={{ fontSize: '13px', fontWeight: '700', color: '#2563eb' }}>{typeForm.max_payload_kg} kg</span>
                            </div>
                            <input type="range" min="500" max="25000" step="250" value={typeForm.max_payload_kg} onChange={e => setTypeForm({ ...typeForm, max_payload_kg: e.target.value })} style={{ width: '100%', cursor: 'pointer' }} />
                        </div>

                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <label style={labelStyle}>Volumetric Limits</label>
                                <span style={{ fontSize: '13px', fontWeight: '700', color: '#2563eb' }}>{typeForm.volumetric_limit_m3} m³</span>
                            </div>
                            <input type="range" min="5" max="100" step="1" value={typeForm.volumetric_limit_m3} onChange={e => setTypeForm({ ...typeForm, volumetric_limit_m3: e.target.value })} style={{ width: '100%', cursor: 'pointer' }} />
                        </div>

                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <label style={labelStyle}>Standard Operational Fuel Rate</label>
                                <span style={{ fontSize: '13px', fontWeight: '700', color: '#2563eb' }}>${typeForm.base_fuel_rate} / km</span>
                            </div>
                            <input type="range" min="0.5" max="10.0" step="0.1" value={typeForm.base_fuel_rate} onChange={e => setTypeForm({ ...typeForm, base_fuel_rate: e.target.value })} style={{ width: '100%', cursor: 'pointer' }} />
                        </div>

                        <button type="submit" style={btnStyle}>Submit Specification Request</button>
                    </form>
                )}

                {/* 3. New Driver Sub-Tab */}
                {subTab === 'new_driver' && (
                    <form onSubmit={handleNewDriverSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <h3 style={{ margin: '0 0 8px 0', color: '#1e293b' }}>Register New Driver Account</h3>
                        <div>
                            <label style={labelStyle}>Driver Full Name / Username</label>
                            <input style={inputStyle} value={newDriverForm.username} onChange={e => setNewDriverForm({ ...newDriverForm, username: e.target.value })} required />
                        </div>
                        <div>
                            <label style={labelStyle}>Assigned Operating Hub Branch</label>
                            <select style={inputStyle} value={newDriverForm.branch_id} onChange={e => setNewDriverForm({ ...newDriverForm, branch_id: e.target.value })} required>
                                <option value="">-- Select Hub Branch --</option>
                                {branches.map(b => (
                                    <option key={b.id} value={b.id}>{b.branch_name} ({b.branch_code})</option>
                                ))}
                            </select>
                            {newDriverForm.branch_id && (
                                <span style={{ fontSize: '12px', color: '#16a34a', marginTop: '6px', display: 'block', fontWeight: '600' }}>
                                    License number will be auto-generated for this hub branch.
                                </span>
                            )}
                        </div>
                        <button type="submit" style={{ ...btnStyle, background: '#16a34a' }}>Submit Driver Registration</button>
                    </form>
                )}

                {/* 4. Vehicle Asset Sub-Tab */}
                {subTab === 'vehicle' && (
                    <form onSubmit={handleVehicleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <h3 style={{ margin: '0 0 8px 0', color: '#1e293b' }}>Register New Vehicle Asset</h3>
                        <div>
                            <label style={labelStyle}>Vehicle Plate Registration Number</label>
                            <input style={inputStyle} value={vehicleForm.license_plate} onChange={e => setVehicleForm({ ...vehicleForm, license_plate: e.target.value })} required />
                        </div>
                        <div>
                            <label style={labelStyle}>Stationed Operating Hub Branch</label>
                            <select style={inputStyle} value={vehicleForm.branch_id} onChange={e => setVehicleForm({ ...vehicleForm, branch_id: e.target.value })} required>
                                <option value="">-- Select Hub Branch --</option>
                                {branches.map(b => (
                                    <option key={b.id} value={b.id}>{b.branch_name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label style={labelStyle}>Vehicle Classification Specification</label>
                            <select style={inputStyle} value={vehicleForm.vehicle_type_id} onChange={e => setVehicleForm({ ...vehicleForm, vehicle_type_id: e.target.value })} required>
                                <option value="">-- Select Specification --</option>
                                {vehicleTypes.map(vt => (
                                    <option key={vt.id} value={vt.id}>{vt.type_name}</option>
                                ))}
                            </select>
                        </div>
                        <button type="submit" style={{ ...btnStyle, background: '#16a34a' }}>Submit Vehicle Asset Request</button>
                    </form>
                )}

                {/* 5. Pending Order Sub-Tab */}
                {subTab === 'pending_order' && (
                    <form onSubmit={handleOrderSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <h3 style={{ margin: '0 0 8px 0', color: '#1e293b' }}>Create Inter-Branch Transfer Order</h3>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <div>
                                <label style={labelStyle}>Origin Hub Branch</label>
                                <select style={inputStyle} value={orderForm.origin_branch_id} onChange={e => setOrderForm({ ...orderForm, origin_branch_id: e.target.value })} required>
                                    <option value="">-- Choose Origin Hub --</option>
                                    {branches.map(b => (
                                        <option key={b.id} value={b.id}>{b.branch_name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label style={labelStyle}>Destination Hub Branch</label>
                                <select style={inputStyle} value={orderForm.destination_branch_id} onChange={e => setOrderForm({ ...orderForm, destination_branch_id: e.target.value })} required>
                                    <option value="">-- Choose Destination Hub --</option>
                                    {branches.filter(b => String(b.id) !== String(orderForm.origin_branch_id)).map(b => (
                                        <option key={b.id} value={b.id}>{b.branch_name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <div>
                                <label style={labelStyle}>Assigned Vehicle Asset</label>
                                <select style={inputStyle} value={orderForm.vehicle_id} onChange={e => setOrderForm({ ...orderForm, vehicle_id: e.target.value })} required>
                                    <option value="">-- Choose Available Vehicle --</option>
                                    {vehicles.map(v => (
                                        <option key={v.id} value={v.id}>{v.license_plate} (ID #{v.id})</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label style={labelStyle}>Assigned Driver</label>
                                <select style={inputStyle} value={orderForm.driver_id} onChange={e => setOrderForm({ ...orderForm, driver_id: e.target.value })} required>
                                    <option value="">-- Choose Driver --</option>
                                    {drivers.map(d => (
                                        <option key={d.id} value={d.id}>Driver #{d.id} - License: {d.license_number}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label style={labelStyle}>Cargo Description</label>
                            <input style={inputStyle} value={orderForm.cargo_description} onChange={e => setOrderForm({ ...orderForm, cargo_description: e.target.value })} required />
                        </div>

                        <div>
                            <label style={labelStyle}>Total Cargo Mass (Kilograms)</label>
                            <input type="number" style={inputStyle} value={orderForm.total_weight_kg} onChange={e => setOrderForm({ ...orderForm, total_weight_kg: e.target.value })} required />
                        </div>

                        <button type="submit" style={{ ...btnStyle, background: '#0284c7' }}>Submit Transfer Order Request</button>
                    </form>
                )}
            </div>
        </div>
    );
}