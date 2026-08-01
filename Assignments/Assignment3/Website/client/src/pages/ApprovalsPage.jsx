import React, { useState, useEffect } from 'react';
import { fetchEntity, createEntity, updateEntity, deleteEntity } from '../services/api';

export default function ApprovalsPage() {
    const [requests, setRequests] = useState([]);

    useEffect(() => {
        loadRequests();
    }, []);

    async function loadRequests() {
        try {
            const data = await fetchEntity('requests');
            setRequests(data.filter(r => r.status === 'PENDING'));
        } catch (err) {
            console.error('Error fetching requests:', err);
        }
    }

    async function handleApprove(req) {
        try {
            if (req.entity_type === 'new_driver') {
                // 1. Create User entry matching users.json schema
                const newUser = await createEntity('users', {
                    username: req.payload.username,
                    password_hash: req.payload.password_hash || '$2b$10$e83/hash_driver_default',
                    role: 'DRIVER',
                    created_at: new Date().toISOString()
                });

                // 2. Create Driver entry strictly matching drivers.json schema
                await createEntity('drivers', {
                    user_id: newUser.id,
                    branch_id: Number(req.payload.branch_id),
                    license_number: req.payload.license_number,
                    active_service_hours: 0,
                    status: 'AVAILABLE'
                });
            } else {
                await createEntity(req.entity_type, req.payload);
            }

            // Update request record status
            await updateEntity('requests', req.id, { ...req, status: 'APPROVED' });
            loadRequests();
        } catch (err) {
            console.error('Error approving request:', err);
        }
    }

    async function handleReject(reqId) {
        try {
            await deleteEntity('requests', reqId);
            loadRequests();
        } catch (err) {
            console.error('Error rejecting request:', err);
        }
    }

    const getBadge = (type) => {
        switch (type) {
            case 'new_driver':
                return { bg: '#dcfce7', text: '#15803d', label: 'NEW DRIVER REGISTRATION' };
            case 'orders':
                return { bg: '#e0f2fe', text: '#0369a1', label: 'HUB TRANSFER ORDER' };
            case 'vehicles':
                return { bg: '#fef3c7', text: '#b45309', label: 'VEHICLE ASSET' };
            case 'branches':
                return { bg: '#f3e8ff', text: '#6b21a8', label: 'REGIONAL BRANCH' };
            case 'vehicle_types':
                return { bg: '#ffe4e6', text: '#be123c', label: 'VEHICLE SPECIFICATION' };
            default:
                return { bg: '#f1f5f9', text: '#475569', label: type.toUpperCase() };
        }
    };

    const renderPayloadDetails = (req) => {
        const p = req.payload;
        switch (req.entity_type) {
            case 'new_driver':
                return (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '13px', color: '#334155' }}>
                        <div><strong>Driver Name:</strong> {p.username}</div>
                        <div><strong>Auto License:</strong> {p.license_number}</div>
                        <div><strong>Hub Branch ID:</strong> #{p.branch_id}</div>
                        <div><strong>Initial Status:</strong> AVAILABLE</div>
                    </div>
                );
            case 'orders':
                return (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '13px', color: '#334155' }}>
                        <div><strong>Origin Hub ID:</strong> #{p.origin_branch_id}</div>
                        <div><strong>Destination Hub ID:</strong> #{p.destination_branch_id}</div>
                        <div><strong>Assigned Vehicle:</strong> ID #{p.vehicle_id}</div>
                        <div><strong>Assigned Driver:</strong> ID #{p.driver_id}</div>
                        <div style={{ gridColumn: 'span 2' }}><strong>Cargo Description:</strong> {p.cargo_description} ({p.total_weight_kg} kg)</div>
                    </div>
                );
            case 'vehicles':
                return (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '13px', color: '#334155' }}>
                        <div><strong>License Plate:</strong> {p.license_plate}</div>
                        <div><strong>Branch ID:</strong> #{p.branch_id}</div>
                        <div><strong>Specification ID:</strong> #{p.vehicle_type_id}</div>
                        <div><strong>Status:</strong> {p.status}</div>
                    </div>
                );
            case 'branches':
                return (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '13px', color: '#334155' }}>
                        <div><strong>Branch Code:</strong> {p.branch_code}</div>
                        <div><strong>Name:</strong> {p.branch_name}</div>
                        <div><strong>City Location:</strong> {p.location_city}</div>
                    </div>
                );
            case 'vehicle_types':
                return (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '13px', color: '#334155' }}>
                        <div><strong>Specification Title:</strong> {p.type_name}</div>
                        <div><strong>Max Payload:</strong> {p.max_payload_kg} kg</div>
                        <div><strong>Volumetric Limit:</strong> {p.volumetric_limit_m3} m³</div>
                        <div><strong>Base Fuel Rate:</strong> ${p.base_fuel_rate} / km</div>
                    </div>
                );
            default:
                return <pre style={{ fontSize: '12px', margin: 0 }}>{JSON.stringify(p, null, 2)}</pre>;
        }
    };

    return (
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 24px', fontFamily: 'Inter, system-ui, sans-serif' }}>
            <div style={{ marginBottom: '24px' }}>
                <h2 style={{ fontSize: '26px', fontWeight: '700', color: '#111827', margin: '0 0 6px 0' }}>Administrative Approval Console</h2>
                <p style={{ color: '#6b7280', margin: 0 }}>Review, approve, or discard pending infrastructure, transfer orders, and fleet asset additions.</p>
            </div>

            {requests.length === 0 ? (
                <div style={{ background: '#ffffff', padding: '40px', borderRadius: '12px', border: '1px solid #e2e8f0', textAlign: 'center', color: '#64748b' }}>
                    No pending requests requiring approval at this time.
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {requests.map(req => {
                        const badge = getBadge(req.entity_type);
                        return (
                            <div key={req.id} style={{ background: '#ffffff', borderRadius: '12px', padding: '20px 24px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '20px' }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                                        <span style={{ fontSize: '11px', fontWeight: '700', padding: '4px 10px', borderRadius: '6px', background: badge.bg, color: badge.text, letterSpacing: '0.5px' }}>
                                            {badge.label}
                                        </span>
                                        <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#0f172a' }}>{req.title}</h4>
                                    </div>
                                    <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                                        {renderPayloadDetails(req)}
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '10px', flexShrink: 0 }}>
                                    <button onClick={() => handleApprove(req)} style={{ background: '#16a34a', color: '#ffffff', border: 'none', padding: '10px 18px', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}>
                                        Approve
                                    </button>
                                    <button onClick={() => handleReject(req.id)} style={{ background: '#dc2626', color: '#ffffff', border: 'none', padding: '10px 18px', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}>
                                        Reject
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}