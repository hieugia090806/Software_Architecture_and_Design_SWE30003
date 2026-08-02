import React, { useState, useEffect } from 'react';
import { loadAdminData } from '../services/adminService';
import { INITIAL_FORM_STATES, TABS, processFormSubmission } from '../services/adminFormService';
import './AdminPage.css';

export default function AdminPage() {
    const [subTab, setSubTab] = useState('branch');
    const [dataset, setDataset] = useState({ branches: [], vehicleTypes: [], vehicles: [], drivers: [], customers: [] });
    const [forms, setForms] = useState(INITIAL_FORM_STATES);
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        loadAdminData().then(setDataset).catch(console.error);
    }, []);

    const handleChange = (field, value) => {
        setForms(prev => ({
            ...prev,
            [subTab]: { ...prev[subTab], [field]: value }
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const successMsg = await processFormSubmission(subTab, forms[subTab], dataset);
            setForms(prev => ({ ...prev, [subTab]: INITIAL_FORM_STATES[subTab] }));
            setMessage(successMsg);
            setTimeout(() => setMessage(''), 4000);
        } catch (err) {
            console.error('Error submitting admin request:', err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const f = forms[subTab];

    return (
        <div className="admin-container">
            <div className="admin-header">
                <h2>Fleet Infrastructure Management</h2>
                <p>Register regional hubs, vehicle specifications, fleet assets, and system user access.</p>
            </div>

            {message && <div className="admin-alert-success">{message}</div>}

            {/* Navigation Tabs */}
            <div className="admin-tabs">
                {TABS.map(tab => (
                    <button 
                        key={tab.key} 
                        type="button"
                        onClick={() => setSubTab(tab.key)} 
                        className={`tab-btn ${subTab === tab.key ? 'active' : ''}`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="admin-card">
                <form onSubmit={handleSubmit} className="admin-form">
                    
                    {/* 1. Branch Hub Tab */}
                    {subTab === 'branch' && (
                        <>
                            <h3>Register Regional Branch Hub</h3>
                            <div className="form-row-2col">
                                <div className="form-group">
                                    <label className="form-label">City Prefix Code (3-Letters)</label>
                                    <input className="form-input" value={f.city_prefix} onChange={e => handleChange('city_prefix', e.target.value)} maxLength={3} placeholder="HCM, DAN, HAN" required />
                                    <span className="form-hint">Format: {f.city_prefix ? `LIC-${f.city_prefix.toUpperCase()}-HUB` : 'LIC-[CODE]-HUB'}</span>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Full Branch Name</label>
                                    <input className="form-input" value={f.branch_name} onChange={e => handleChange('branch_name', e.target.value)} placeholder="e.g. Ho Chi Minh Central Hub" required />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Station City Location</label>
                                <input className="form-input" value={f.location_city} onChange={e => handleChange('location_city', e.target.value)} placeholder="e.g. Ho Chi Minh City" required />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Physical Address</label>
                                <input className="form-input" value={f.address} onChange={e => handleChange('address', e.target.value)} placeholder="123 Logistics Blvd, District 9" required />
                            </div>

                            <div className="form-group">
                                <div className="form-label-header">
                                    <label className="form-label">Service Radius (km)</label>
                                    <span className="form-value-highlight">{f.service_radius_km} km</span>
                                </div>
                                <input type="range" min="10" max="200" step="5" value={f.service_radius_km} onChange={e => handleChange('service_radius_km', e.target.value)} className="form-range" />
                            </div>

                            <button type="submit" disabled={isSubmitting} className="btn-submit">
                                {isSubmitting ? 'Submitting...' : 'Submit Branch Hub Registration'}
                            </button>
                        </>
                    )}

                    {/* 2. Vehicle Specification Tab */}
                    {subTab === 'vtype' && (
                        <>
                            <h3>Register Vehicle Classification Specification</h3>
                            <div className="form-group">
                                <label className="form-label">Specification Title</label>
                                <input className="form-input" value={f.type_name} onChange={e => handleChange('type_name', e.target.value)} placeholder="e.g. Refrigerated Container, Heavy Rigid Truck" required />
                            </div>
                            <div className="form-group">
                                <div className="form-label-header">
                                    <label className="form-label">Maximum Weight Capacity</label>
                                    <span className="form-value-highlight">{f.max_payload_kg} kg</span>
                                </div>
                                <input type="range" min="500" max="25000" step="250" value={f.max_payload_kg} onChange={e => handleChange('max_payload_kg', e.target.value)} className="form-range" />
                            </div>
                            <div className="form-group">
                                <div className="form-label-header">
                                    <label className="form-label">Volumetric Limit</label>
                                    <span className="form-value-highlight">{f.volumetric_limit_m3} m³</span>
                                </div>
                                <input type="range" min="5" max="100" step="1" value={f.volumetric_limit_m3} onChange={e => handleChange('volumetric_limit_m3', e.target.value)} className="form-range" />
                            </div>
                            <div className="form-group">
                                <div className="form-label-header">
                                    <label className="form-label">Base Fuel Rate ($/km)</label>
                                    <span className="form-value-highlight">${f.base_fuel_rate} / km</span>
                                </div>
                                <input type="range" min="0.5" max="10.0" step="0.1" value={f.base_fuel_rate} onChange={e => handleChange('base_fuel_rate', e.target.value)} className="form-range" />
                            </div>
                            <button type="submit" disabled={isSubmitting} className="btn-submit">
                                {isSubmitting ? 'Submitting...' : 'Submit Specification Request'}
                            </button>
                        </>
                    )}

                    {/* 3. Vehicle Asset Tab */}
                    {subTab === 'vehicle' && (
                        <>
                            <h3>Register Vehicle Asset</h3>
                            <div className="form-group">
                                <label className="form-label">License Plate Number</label>
                                <input className="form-input" value={f.license_plate} onChange={e => handleChange('license_plate', e.target.value)} placeholder="51D-998.23" required />
                            </div>

                            <div className="form-row-2col">
                                <div className="form-group">
                                    <label className="form-label">Assigned Hub Branch</label>
                                    <select className="form-input" value={f.branch_id} onChange={e => handleChange('branch_id', e.target.value)} required>
                                        <option value="">-- Select Hub Branch --</option>
                                        {dataset.branches.map(b => (
                                            <option key={b.id} value={b.id}>{b.branch_name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Vehicle Specification</label>
                                    <select className="form-input" value={f.vehicle_type_id} onChange={e => handleChange('vehicle_type_id', e.target.value)} required>
                                        <option value="">-- Select Specification --</option>
                                        {dataset.vehicleTypes.map(vt => (
                                            <option key={vt.id} value={vt.id}>{vt.type_name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Cold Chain Controls */}
                            <div className="form-group">
                                <label className="form-checkbox-label">
                                    <input 
                                        type="checkbox" 
                                        checked={f.is_cold_chain} 
                                        onChange={e => handleChange('is_cold_chain', e.target.checked)} 
                                    />
                                    <span>Equipped with Cold-Chain Refrigeration Unit</span>
                                </label>
                            </div>

                            {f.is_cold_chain && (
                                <div className="form-row-2col">
                                    <div className="form-group">
                                        <label className="form-label">Min Temperature (°C)</label>
                                        <input type="number" className="form-input" value={f.min_temp_c} onChange={e => handleChange('min_temp_c', e.target.value)} required />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Max Temperature (°C)</label>
                                        <input type="number" className="form-input" value={f.max_temp_c} onChange={e => handleChange('max_temp_c', e.target.value)} required />
                                    </div>
                                </div>
                            )}

                            <div className="form-row-2col">
                                <div className="form-group">
                                    <label className="form-label">Trips Completed Since Maintenance</label>
                                    <input type="number" className="form-input" value={f.trips_since_maintenance} onChange={e => handleChange('trips_since_maintenance', e.target.value)} min="0" required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Maintenance Status</label>
                                    <select className="form-input" value={f.maintenance_status} onChange={e => handleChange('maintenance_status', e.target.value)} required>
                                        <option value="OK">OK (Operational)</option>
                                        <option value="DUE_FOR_SERVICE">DUE_FOR_SERVICE</option>
                                    </select>
                                </div>
                            </div>

                            <button type="submit" disabled={isSubmitting} className="btn-submit green">
                                {isSubmitting ? 'Submitting...' : 'Submit Vehicle Asset Request'}
                            </button>
                        </>
                    )}

                    {/* 4. Unified User & Access Management Tab */}
                    {subTab === 'user' && (
                        <>
                            <h3>Register System User & Access Role</h3>
                            
                            <div className="form-row-2col">
                                <div className="form-group">
                                    <label className="form-label">Username / Full Name</label>
                                    <input className="form-input" value={f.username} onChange={e => handleChange('username', e.target.value)} placeholder="e.g. alex_driver or acme_corp" required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">System Role</label>
                                    <select className="form-input" value={f.role} onChange={e => handleChange('role', e.target.value)} required>
                                        <option value="DRIVER">DRIVER</option>
                                        <option value="CUSTOMER">CUSTOMER</option>
                                        <option value="DISPATCHER">DISPATCHER</option>
                                        <option value="BRANCH_MANAGER">BRANCH MANAGER</option>
                                        <option value="ACCOUNTANT">ACCOUNTANT</option>
                                        <option value="SYSTEM_ADMIN">SYSTEM ADMIN</option>
                                    </select>
                                </div>
                            </div>

                            {/* Dynamic Branch Dropdown for Drivers, Dispatchers, and Managers */}
                            {['DRIVER', 'DISPATCHER', 'BRANCH_MANAGER'].includes(f.role) && (
                                <div className="form-group">
                                    <label className="form-label">Assigned Hub Branch</label>
                                    <select className="form-input" value={f.branch_id} onChange={e => handleChange('branch_id', e.target.value)} required>
                                        <option value="">-- Select Hub Branch --</option>
                                        {dataset.branches.map(b => (
                                            <option key={b.id} value={b.id}>{b.branch_name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Additional Driver-Specific Fields */}
                            {f.role === 'DRIVER' && (
                                <div className="form-group">
                                    <label className="form-label">Driver License Number</label>
                                    <input className="form-input" value={f.license_number} onChange={e => handleChange('license_number', e.target.value)} placeholder="e.g. DL-88990011" required />
                                </div>
                            )}

                            {/* Additional Customer-Specific Fields */}
                            {f.role === 'CUSTOMER' && (
                                <div className="form-row-2col">
                                    <div className="form-group">
                                        <label className="form-label">Contact Email</label>
                                        <input type="email" className="form-input" value={f.email} onChange={e => handleChange('email', e.target.value)} placeholder="client@company.com" required />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Contact Phone</label>
                                        <input className="form-input" value={f.phone} onChange={e => handleChange('phone', e.target.value)} placeholder="+84 901 234 567" required />
                                    </div>
                                </div>
                            )}

                            <button type="submit" disabled={isSubmitting} className="btn-submit">
                                {isSubmitting ? 'Submitting...' : 'Submit User Registration Request'}
                            </button>
                        </>
                    )}

                </form>
            </div>
        </div>
    );
}