import React, { useState, useEffect } from 'react';
import { fetchEnriched, createEntity, updateEntity } from '../services/api';

export default function DriverPage() {
    const [trips, setTrips] = useState([]);
    const [selectedTrip, setSelectedTrip] = useState(null);

    // Incident Form States
    const [incidentType, setIncidentType] = useState('ENGINE_FAILURE');
    const [breakdownLocation, setBreakdownLocation] = useState('');
    const [incidentDescription, setIncidentDescription] = useState('');
    const [hasDamage, setHasDamage] = useState(false);
    const [damageDesc, setDamageDesc] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => { 
        loadTrips(); 
    }, []);

    async function loadTrips() {
        try {
            const data = await fetchEnriched('trips');
            // Load active trips or trips pending driver actions
            const active = (data || []).filter(t => t.status === 'IN_TRANSIT' || t.status === 'PENDING_COMPLETION_APPROVAL');
            setTrips(active);
        } catch (err) {
            console.error('Error fetching driver trips:', err);
        }
    }

    async function handleReportIncident(e) {
        e.preventDefault();
        if (!selectedTrip) return;

        setIsSubmitting(true);
        try {
            // 1. Log detailed incident entry
            await createEntity('trip_incidents', {
                trip_id: selectedTrip.id,
                incident_type: incidentType,
                breakdown_location: breakdownLocation || 'Unspecified Location',
                description: incidentDescription,
                has_damage: hasDamage,
                damage_description: hasDamage ? damageDesc : 'None',
                action_taken: 'Reported by Driver via App - Awaiting Dispatch Approval',
                reported_at: new Date().toISOString()
            });

            // 2. Dispatch system alert for Dispatcher/Manager approval
            await createEntity('alerts', {
                vehicle_id: selectedTrip.vehicle_id,
                trip_id: selectedTrip.id,
                alert_type: incidentType,
                description: `INCIDENT REPORTED at ${breakdownLocation || 'Unknown Loc'}: ${incidentType}. Details: ${incidentDescription || 'N/A'}. Damage: ${hasDamage ? damageDesc : 'No'}`,
                created_at: new Date().toISOString()
            });

            // 3. Mark trip status for dispatcher action (e.g. Cancel/Reroute from breakdown location)
            await updateEntity('trips', selectedTrip.id, {
                ...selectedTrip,
                status: 'INCIDENT_REPORTED'
            });

            alert('Incident report submitted successfully. Dispatcher has been notified to process rerouting/approval.');
            
            // Reset form fields
            setBreakdownLocation('');
            setIncidentDescription('');
            setDamageDesc('');
            setHasDamage(false);
            setSelectedTrip(null);
            loadTrips();
        } catch (err) {
            alert(`Failed to submit incident report: ${err.message}`);
        } finally {
            setIsSubmitting(false);
        }
    }

    async function handleRequestCompletion() {
        if (!selectedTrip) return;

        setIsSubmitting(true);
        try {
            // 1. Update Trip Status -> COMPLETED with concurrency control (lock_version)
            await updateEntity('trips', selectedTrip.id, {
                ...selectedTrip,
                status: 'COMPLETED',
                lock_version: (selectedTrip.lock_version || 1) + 1
            });

            // 2. Update Order Status -> DELIVERED (Makes order billable in CustomerPage)
            if (selectedTrip.order_id) {
                await updateEntity('orders', selectedTrip.order_id, {
                    status: 'DELIVERED'
                });
            }

            // 3. Generate structured Invoice matching schema requirements
            await createEntity('invoices', {
                order_id: selectedTrip.order_id,
                trip_id: selectedTrip.id,
                base_tariff: 3000,
                distance_surcharge: 1100,
                surge_multiplier: 1.0,
                total_amount: 4100,
                payment_status: 'UNPAID',
                issued_at: new Date().toISOString()
            });

            alert(`Trip #${selectedTrip.id} completed and invoice generated successfully!`);
            setSelectedTrip(null);
            loadTrips();
        } catch (err) {
            alert(`Completion request failed: ${err.message}`);
        } finally {
            setIsSubmitting(false);
        }
    }

    const cardStyle = {
        background: '#ffffff',
        borderRadius: '10px',
        padding: '24px',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        border: '1px solid #e5e7eb'
    };

    return (
        <div style={{ maxWidth: '1150px', margin: '0 auto', padding: '32px 24px', fontFamily: 'Inter, system-ui, sans-serif', color: '#111827' }}>
            {/* Header */}
            <div style={{ marginBottom: '28px' }}>
                <h2 style={{ fontSize: '26px', fontWeight: '700', color: '#0f172a', margin: '0 0 6px 0' }}>
                    Driver Operations Interface
                </h2>
                <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>
                    Manage active delivery runs, report breakdown incidents for dispatcher review, and process trip completions.
                </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '24px' }}>
                {/* Active Trips Selection */}
                <div style={cardStyle}>
                    <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#334155', margin: '0 0 16px 0', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
                        Assigned Active Runs
                    </h3>
                    
                    {trips.length === 0 ? (
                        <div style={{ color: '#94a3b8', fontSize: '13px', textAlign: 'center', padding: '24px 0' }}>
                            No active trips currently assigned.
                        </div>
                    ) : (
                        trips.map(trip => {
                            const isSelected = selectedTrip?.id === trip.id;
                            return (
                                <div 
                                    key={trip.id}
                                    onClick={() => setSelectedTrip(trip)}
                                    style={{
                                        border: isSelected ? '2px solid #2563eb' : '1px solid #e2e8f0',
                                        background: isSelected ? '#eff6ff' : '#f8fafc',
                                        padding: '14px',
                                        borderRadius: '8px',
                                        marginBottom: '12px',
                                        cursor: 'pointer',
                                        transition: 'all 0.15s ease-in-out'
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                        <span style={{ fontWeight: '700', fontSize: '15px', color: '#0f172a' }}>Trip #{trip.id}</span>
                                        <span style={{ 
                                            background: trip.status === 'PENDING_COMPLETION_APPROVAL' ? '#fef3c7' : '#dcfce7', 
                                            color: trip.status === 'PENDING_COMPLETION_APPROVAL' ? '#b45309' : '#15803d', 
                                            padding: '2px 8px', 
                                            borderRadius: '4px', 
                                            fontSize: '11px', 
                                            fontWeight: '700' 
                                        }}>
                                            {trip.status === 'PENDING_COMPLETION_APPROVAL' ? 'AWAITING APPROVAL' : 'IN TRANSIT'}
                                        </span>
                                    </div>
                                    <div style={{ fontSize: '13px', color: '#475569' }}>Order Reference: #{trip.order_id}</div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Main Operations Console */}
                <div style={cardStyle}>
                    {selectedTrip ? (
                        <div>
                            {/* Trip Console Header & Completion Action */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid #e2e8f0' }}>
                                <div>
                                    <h3 style={{ margin: '0 0 4px 0', fontSize: '20px', fontWeight: '700', color: '#0f172a' }}>
                                        Active Console — Trip #{selectedTrip.id}
                                    </h3>
                                    <span style={{ fontSize: '13px', color: '#64748b' }}>Order #{selectedTrip.order_id} | Vehicle ID #{selectedTrip.vehicle_id}</span>
                                </div>

                                <button 
                                    onClick={handleRequestCompletion}
                                    disabled={isSubmitting}
                                    style={{ 
                                        background: '#16a34a', 
                                        color: '#ffffff', 
                                        border: 'none', 
                                        padding: '10px 18px', 
                                        borderRadius: '6px', 
                                        fontWeight: '600', 
                                        fontSize: '14px',
                                        cursor: 'pointer',
                                        transition: 'background 0.2s'
                                    }}
                                >
                                    Complete Trip & Issue Invoice
                                </button>
                            </div>

                            {/* Emergency & Incident Reporting Form */}
                            <form onSubmit={handleReportIncident} style={{ background: '#fff1f2', padding: '20px', borderRadius: '8px', border: '1px solid #fecdd3' }}>
                                <h4 style={{ margin: '0 0 6px 0', color: '#9f1239', fontSize: '16px', fontWeight: '700' }}>
                                    Report Emergency or Breakdown Incident
                                </h4>
                                <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#be123c' }}>
                                    Submitting an incident notifies dispatchers to initiate approval, order cancellation, or new leg dispatching.
                                </p>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                                    {/* Incident Type Dropdown */}
                                    <div>
                                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#881337', marginBottom: '6px' }}>
                                            Incident Type:
                                        </label>
                                        <select 
                                            value={incidentType} 
                                            onChange={e => setIncidentType(e.target.value)} 
                                            style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #fda4af', background: '#fff', fontSize: '13px', color: '#0f172a' }}
                                        >
                                            <option value="ENGINE_FAILURE">Engine / Mechanical Failure</option>
                                            <option value="ACCIDENT">Accident / Collision</option>
                                            <option value="FLAT_TIRE">Flat Tire / Wheel Damage</option>
                                            <option value="CARGO_DAMAGE">Cargo Damage / Spill</option>
                                            <option value="BRAKE_FAILURE">Brake System Failure</option>
                                            <option value="VEHICLE_OVERHEATING">Engine Overheating</option>
                                            <option value="TRAFFIC_BLOCKADE">Severe Road Blockade / Closure</option>
                                            <option value="MEDICAL_EMERGENCY">Driver Medical Emergency</option>
                                            <option value="SEVERE_WEATHER">Severe Weather Invalidation</option>
                                        </select>
                                    </div>

                                    {/* Breakdown Location */}
                                    <div>
                                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#881337', marginBottom: '6px' }}>
                                            Breakdown Location / City:
                                        </label>
                                        <input 
                                            type="text"
                                            placeholder="e.g. Da Nang, KM 45 Highway" 
                                            value={breakdownLocation} 
                                            onChange={e => setBreakdownLocation(e.target.value)} 
                                            style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #fda4af', background: '#fff', fontSize: '13px', color: '#0f172a', boxSizing: 'border-box' }}
                                            required 
                                        />
                                    </div>
                                </div>

                                {/* Incident Description */}
                                <div style={{ marginBottom: '16px' }}>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#881337', marginBottom: '6px' }}>
                                        Detailed Incident Description:
                                    </label>
                                    <textarea 
                                        placeholder="Describe what happened and current status (e.g., vehicle stopped at Da Nang, requires towing and new leg created to Hanoi)..." 
                                        value={incidentDescription} 
                                        onChange={e => setIncidentDescription(e.target.value)} 
                                        style={{ width: '100%', height: '70px', padding: '10px 12px', borderRadius: '6px', border: '1px solid #fda4af', background: '#fff', fontSize: '13px', color: '#0f172a', boxSizing: 'border-box' }}
                                        required
                                    />
                                </div>

                                {/* Damage Checkbox */}
                                <div style={{ marginBottom: '16px' }}>
                                    <label style={{ fontSize: '13px', color: '#881337', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <input 
                                            type="checkbox" 
                                            checked={hasDamage} 
                                            onChange={e => setHasDamage(e.target.checked)} 
                                            style={{ width: '16px', height: '16px', accentColor: '#e11d48' }}
                                        />
                                        Physical Vehicle or Cargo Damage Occurred
                                    </label>
                                </div>

                                {/* Conditional Damage Description */}
                                {hasDamage && (
                                    <div style={{ marginBottom: '16px' }}>
                                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#881337', marginBottom: '6px' }}>
                                            Damage Particulars:
                                        </label>
                                        <textarea 
                                            placeholder="Specify extent of vehicle/cargo damage..." 
                                            value={damageDesc} 
                                            onChange={e => setDamageDesc(e.target.value)} 
                                            style={{ width: '100%', height: '60px', padding: '10px 12px', borderRadius: '6px', border: '1px solid #fda4af', background: '#fff', fontSize: '13px', color: '#0f172a', boxSizing: 'border-box' }}
                                        />
                                    </div>
                                )}

                                <button 
                                    type="submit" 
                                    disabled={isSubmitting}
                                    style={{ 
                                        background: '#e11d48', 
                                        color: '#ffffff', 
                                        border: 'none', 
                                        padding: '10px 18px', 
                                        borderRadius: '6px', 
                                        fontWeight: '600', 
                                        fontSize: '13px',
                                        cursor: 'pointer' 
                                    }}
                                >
                                    Submit Incident Report for Dispatch Approval
                                </button>
                            </form>
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '48px 24px', color: '#94a3b8', border: '2px dashed #e2e8f0', borderRadius: '8px' }}>
                            Select an active run from the left panel to manage trip actions or report incidents.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}