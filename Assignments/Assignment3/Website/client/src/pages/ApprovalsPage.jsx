import React, { useState, useEffect } from 'react';
import { fetchEntity, createEntity, updateEntity, deleteEntity, fetchEnriched } from '../services/api';

export default function ApprovalsPage() {
    const [requests, setRequests] = useState([]);
    const [pendingTrips, setPendingTrips] = useState([]);

    useEffect(() => {
        loadRequests();
    }, []);

    async function loadRequests() {
        try {
            // Load standard pending requests table
            const data = await fetchEntity('requests');
            const pendingReqs = (data || []).filter(r => r.status === 'PENDING');
            setRequests(pendingReqs);

            // Load trips pending completion or incident approval directly
            const tripsData = await fetchEnriched('trips');
            const flaggedTrips = (tripsData || []).filter(
                t => t.status === 'PENDING_COMPLETION_APPROVAL' || t.status === 'INCIDENT_REPORTED'
            );
            setPendingTrips(flaggedTrips);
        } catch (err) {
            console.error('Error fetching approval items:', err);
        }
    }

    // --- Handlers for Standard Requests ---
    async function handleApproveRequest(req) {
        try {
            const targetType = req.target_entity || req.entity_type;

            if (targetType === 'new_driver') {
                const newUser = await createEntity('users', {
                    username: req.payload?.username,
                    password_hash: req.payload?.password_hash || '$2b$10$e83/hash_driver_default',
                    role: 'DRIVER',
                    created_at: new Date().toISOString()
                });

                await createEntity('drivers', {
                    user_id: newUser.id,
                    branch_id: Number(req.payload?.branch_id),
                    license_number: req.payload?.license_number,
                    active_service_hours: 0,
                    status: 'AVAILABLE'
                });
            } else if (targetType) {
                await createEntity(targetType, req.payload);
            }

            await updateEntity('requests', req.id, { ...req, status: 'APPROVED' });
            loadRequests();
        } catch (err) {
            console.error('Error approving request:', err);
        }
    }

    async function handleRejectRequest(reqId) {
        try {
            await deleteEntity('requests', reqId);
            loadRequests();
        } catch (err) {
            console.error('Error rejecting request:', err);
        }
    }

    // --- Handlers for Driver Terminal Actions ---
    async function handleApproveTripCompletion(trip) {
        try {
            await updateEntity('trips', trip.id, {
                ...trip,
                status: 'COMPLETED',
                completed_at: new Date().toISOString()
            });

            if (trip.vehicle_id) {
                await updateEntity('vehicles', trip.vehicle_id, { status: 'AVAILABLE' });
            }

            alert(`Trip #${trip.id} completion approved successfully!`);
            loadRequests();
        } catch (err) {
            alert(`Approval failed: ${err.message}`);
        }
    }

    async function handleApproveIncidentAndReRoute(trip) {
        try {
            await updateEntity('trips', trip.id, {
                ...trip,
                status: 'CANCELLED_BREAKDOWN'
            });

            if (trip.vehicle_id) {
                await updateEntity('vehicles', trip.vehicle_id, { status: 'MAINTENANCE' });
            }

            if (trip.order_id) {
                await updateEntity('orders', trip.order_id, { status: 'CANCELLED_IN_TRANSIT' });
            }

            alert(`Incident processed for Trip #${trip.id}. Original trip/order cancelled and vehicle flagged for maintenance.`);
            loadRequests();
        } catch (err) {
            alert(`Failed to process incident: ${err.message}`);
        }
    }

    async function handleRejectTripAction(trip, targetStatus = 'IN_TRANSIT') {
        try {
            await updateEntity('trips', trip.id, {
                ...trip,
                status: targetStatus
            });
            alert(`Trip #${trip.id} action request rejected and returned to ${targetStatus}.`);
            loadRequests();
        } catch (err) {
            alert(`Rejection failed: ${err.message}`);
        }
    }

    const getBadge = (type) => {
        const safeType = (type || 'REQUEST').toString().toUpperCase();

        switch (type) {
            case 'TRIP_COMPLETION':
                return { bg: '#dcfce7', text: '#15803d', label: 'TRIP COMPLETION REQUEST' };
            case 'TRIP_INCIDENT':
                return { bg: '#ffe4e6', text: '#be123c', label: 'BREAKDOWN / EMERGENCY INCIDENT' };
            case 'new_driver':
            case 'drivers':
                return { bg: '#dcfce7', text: '#15803d', label: 'NEW DRIVER REGISTRATION' };
            case 'customers':
                return { bg: '#e0f2fe', text: '#0369a1', label: 'CUSTOMER REGISTRATION' };
            case 'orders':
                return { bg: '#e0f2fe', text: '#0369a1', label: 'HUB TRANSFER ORDER' };
            case 'vehicles':
            case 'vehicle_types':
                return { bg: '#fef3c7', text: '#b45309', label: 'VEHICLE ASSET' };
            case 'branches':
                return { bg: '#f3e8ff', text: '#6b21a8', label: 'REGIONAL BRANCH' };
            default:
                return { bg: '#f1f5f9', text: '#475569', label: safeType };
        }
    };

    const renderPayloadDetails = (req) => {
        const p = req.payload || {};
        const entityType = req.target_entity || req.entity_type;

        switch (entityType) {
            case 'new_driver':
            case 'drivers':
                return (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '13px', color: '#334155' }}>
                        <div><strong>Driver Name:</strong> {p.username || p.full_name || 'N/A'}</div>
                        <div><strong>Auto License:</strong> {p.license_number || 'N/A'}</div>
                        <div><strong>Hub Branch ID:</strong> #{p.branch_id || 'N/A'}</div>
                        <div><strong>Initial Status:</strong> {p.status || 'AVAILABLE'}</div>
                    </div>
                );
            case 'customers':
                return (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '13px', color: '#334155' }}>
                        <div><strong>Customer / Company:</strong> {p.company_name || p.contact_name || 'N/A'}</div>
                        <div><strong>Username:</strong> {p.username || 'N/A'}</div>
                        <div><strong>Email:</strong> {p.email || 'N/A'}</div>
                        <div><strong>Phone:</strong> {p.phone || 'N/A'}</div>
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
            case 'vehicle_types':
                return (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '13px', color: '#334155' }}>
                        <div><strong>Spec Name:</strong> {p.type_name}</div>
                        <div><strong>Max Payload:</strong> {p.max_payload_kg} kg</div>
                        <div><strong>Volume Limit:</strong> {p.volumetric_limit_m3} m³</div>
                        <div><strong>Fuel Rate:</strong> {p.base_fuel_rate} L/km</div>
                    </div>
                );
            case 'branches':
                return (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '13px', color: '#334155' }}>
                        <div><strong>Branch Code:</strong> {p.branch_code}</div>
                        <div><strong>Name:</strong> {p.branch_name}</div>
                        <div><strong>City:</strong> {p.location_city}</div>
                        <div><strong>Radius:</strong> {p.service_radius_km} km</div>
                    </div>
                );
            default:
                return <pre style={{ fontSize: '12px', margin: 0 }}>{JSON.stringify(p, null, 2)}</pre>;
        }
    };

    const hasItems = requests.length > 0 || pendingTrips.length > 0;

    return (
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 24px', fontFamily: 'Inter, system-ui, sans-serif' }}>
            <div style={{ marginBottom: '24px' }}>
                <h2 style={{ fontSize: '26px', fontWeight: '700', color: '#111827', margin: '0 0 6px 0' }}>Administrative Approval Console</h2>
                <p style={{ color: '#6b7280', margin: 0 }}>Review, approve, or discard pending trip completions, breakdown incidents, and infrastructure additions.</p>
            </div>

            {!hasItems ? (
                <div style={{ background: '#ffffff', padding: '40px', borderRadius: '12px', border: '1px solid #e2e8f0', textAlign: 'center', color: '#64748b' }}>
                    No pending requests or driver approvals requiring attention at this time.
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    
                    {/* Render Flagged Driver Trips (Completions & Incidents) */}
                    {pendingTrips.map(trip => {
                        const isIncident = trip.status === 'INCIDENT_REPORTED';
                        const badge = getBadge(isIncident ? 'TRIP_INCIDENT' : 'TRIP_COMPLETION');

                        return (
                            <div key={`trip-${trip.id}`} style={{ background: '#ffffff', borderRadius: '12px', padding: '20px 24px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '20px' }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                                        <span style={{ fontSize: '11px', fontWeight: '700', padding: '4px 10px', borderRadius: '6px', background: badge.bg, color: badge.text, letterSpacing: '0.5px' }}>
                                            {badge.label}
                                        </span>
                                        <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#0f172a' }}>
                                            Trip Run #{trip.id} (Order #{trip.order_id})
                                        </h4>
                                    </div>

                                    <div style={{ background: isIncident ? '#fff1f2' : '#f8fafc', padding: '12px 16px', borderRadius: '8px', border: isIncident ? '1px solid #fecdd3' : '1px solid #f1f5f9' }}>
                                        {isIncident ? (
                                            <div style={{ fontSize: '13px', color: '#881337', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                <div><strong>Status:</strong> Breakdown / Emergency Reported by Driver</div>
                                                <div><strong>Vehicle ID:</strong> #{trip.vehicle_id}</div>
                                                <div><strong>Action Needed:</strong> Confirm breakdown to update vehicle state and process order re-routing.</div>
                                            </div>
                                        ) : (
                                            <div style={{ fontSize: '13px', color: '#334155', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                                <div><strong>Trip ID:</strong> #{trip.id}</div>
                                                <div><strong>Order Reference:</strong> #{trip.order_id}</div>
                                                <div><strong>Vehicle ID:</strong> #{trip.vehicle_id}</div>
                                                <div><strong>Driver Status:</strong> Completed Delivery Run</div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '10px', flexShrink: 0 }}>
                                    {isIncident ? (
                                        <>
                                            <button 
                                                onClick={() => handleApproveIncidentAndReRoute(trip)} 
                                                style={{ background: '#e11d48', color: '#ffffff', border: 'none', padding: '10px 18px', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}
                                            >
                                                Acknowledge & Cancel Trip
                                            </button>
                                            <button 
                                                onClick={() => handleRejectTripAction(trip)} 
                                                style={{ background: '#64748b', color: '#ffffff', border: 'none', padding: '10px 18px', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}
                                            >
                                                Dismiss Incident
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <button 
                                                onClick={() => handleApproveTripCompletion(trip)} 
                                                style={{ background: '#16a34a', color: '#ffffff', border: 'none', padding: '10px 18px', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}
                                            >
                                                Approve Finish
                                            </button>
                                            <button 
                                                onClick={() => handleRejectTripAction(trip)} 
                                                style={{ background: '#dc2626', color: '#ffffff', border: 'none', padding: '10px 18px', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}
                                            >
                                                Reject Finish
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        );
                    })}

                    {/* Render Standard System Requests */}
                    {requests.map(req => {
                        const targetType = req.target_entity || req.entity_type;
                        const titleText = req.description || req.title || 'Pending Request';
                        const badge = getBadge(targetType);

                        return (
                            <div key={`req-${req.id}`} style={{ background: '#ffffff', borderRadius: '12px', padding: '20px 24px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '20px' }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                                        <span style={{ fontSize: '11px', fontWeight: '700', padding: '4px 10px', borderRadius: '6px', background: badge.bg, color: badge.text, letterSpacing: '0.5px' }}>
                                            {badge.label}
                                        </span>
                                        <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#0f172a' }}>{titleText}</h4>
                                    </div>
                                    <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                                        {renderPayloadDetails(req)}
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '10px', flexShrink: 0 }}>
                                    <button onClick={() => handleApproveRequest(req)} style={{ background: '#16a34a', color: '#ffffff', border: 'none', padding: '10px 18px', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}>
                                        Approve
                                    </button>
                                    <button onClick={() => handleRejectRequest(req.id)} style={{ background: '#dc2626', color: '#ffffff', border: 'none', padding: '10px 18px', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}>
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