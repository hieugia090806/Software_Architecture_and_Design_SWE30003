import React, { useState, useEffect } from 'react';
import { fetchEntity, fetchEnriched, createEntity, updateEntity } from '../services/api';

export default function DispatcherPage() {
    const [approvedOrders, setApprovedOrders] = useState([]);
    const [branches, setBranches] = useState([]);
    const [vehicles, setVehicles] = useState([]);
    const [drivers, setDrivers] = useState([]);
    const [activeTrips, setActiveTrips] = useState([]);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [loading, setLoading] = useState(true);

    // Filter states (Defaulting to 'Ho Chi Minh' if available by name or ID search)
    const [selectedBranchId, setSelectedBranchId] = useState('ALL');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [abortConfirmId, setAbortConfirmId] = useState(null);

    // New Order Request Form State
    const [newOrder, setNewOrder] = useState({
        origin_branch_id: '',
        destination_branch_id: '',
        cargo_description: '',
        total_weight_kg: '500', // Default slider starting value
        vehicle_id: '',
        driver_id: '',
        customer_id: 1
    });
    const [submittingOrder, setSubmittingOrder] = useState(false);

    useEffect(() => { 
        loadData(); 
    }, []);

    async function loadData() {
        setLoading(true);
        try {
            const [ordersData, vehiclesData, driversData, tripsData, branchList] = await Promise.all([
                fetchEntity('orders'),
                fetchEntity('vehicles'),
                fetchEnriched('drivers'),
                fetchEnriched('trips'),
                fetchEntity('branches')
            ]);

            const fetchedBranches = branchList || [];
            setBranches(fetchedBranches);
            setVehicles(vehiclesData || []);
            setDrivers(driversData || []);

            // 1. Find Ho Chi Minh branch by default
            const hcmBranch = fetchedBranches.find(b => 
                (b.branch_name || b.name || b.location_city || '').toLowerCase().includes('ho chi minh') ||
                (b.branch_name || b.name || b.location_city || '').toLowerCase().includes('hcm')
            );

            const defaultBranchId = hcmBranch 
                ? (hcmBranch.id ?? hcmBranch.branch_id) 
                : (fetchedBranches[0]?.id ?? fetchedBranches[0]?.branch_id ?? 'ALL');

            setSelectedBranchId(defaultBranchId);

            // 2. Set default branch selections for new order form (Origin matches selected Branch Location)
            if (fetchedBranches.length > 0) {
                const destBranch = fetchedBranches.find(b => (b.id ?? b.branch_id) !== Number(defaultBranchId)) || fetchedBranches[0];
                setNewOrder(prev => ({
                    ...prev,
                    origin_branch_id: defaultBranchId,
                    destination_branch_id: destBranch?.id || destBranch?.branch_id || ''
                }));
            }

            // Read from orders.json and filter strictly for READY_FOR_DISPATCH
            const readyToDispatch = (ordersData || []).filter(order => order.status === 'READY_FOR_DISPATCH');
            setApprovedOrders(readyToDispatch);
            setActiveTrips(tripsData || []);
        } catch (err) {
            console.error('Error loading dispatcher data:', err);
        } finally {
            setLoading(false);
        }
    }

    // Handler when user changes the main Branch Location selector at top
    const handleBranchLocationChange = (newBranchId) => {
        setSelectedBranchId(newBranchId);
        // Automatically sync Origin Branch to match selected location
        if (newBranchId !== 'ALL') {
            setNewOrder(prev => ({
                ...prev,
                origin_branch_id: newBranchId
            }));
        }
    };

    const getBranchName = (branchId) => {
        if (!branchId || branchId === 'ALL') return 'All Locations';
        const found = branches.find(b => (b.id ?? b.branch_id) === Number(branchId));
        if (!found) return `Branch #${branchId}`;
        return found.branch_name || found.name || found.location_city || `Branch #${branchId}`;
    };

    const getVehiclePlate = (vehicleId) => {
        if (!vehicleId) return 'Unassigned';
        const found = vehicles.find(v => (v.id ?? v.vehicle_id) === Number(vehicleId));
        return found ? (found.license_plate || `Vehicle #${vehicleId}`) : `Vehicle #${vehicleId}`;
    };

    const getDriverName = (driverId) => {
        if (!driverId) return 'Unassigned';
        const found = drivers.find(d => (d.id ?? d.user_id ?? d.driver_id) === Number(driverId));
        return found ? (found.username || found.full_name || `Driver #${driverId}`) : `Driver #${driverId}`;
    };

    // Form Submission (Write to requests.json instead of orders.json)
    async function handleCreateOrderRequest(e) {
        e.preventDefault();
        if (!newOrder.origin_branch_id || !newOrder.destination_branch_id || !newOrder.cargo_description) {
            alert('Please fill in all required order fields.');
            return;
        }

        setSubmittingOrder(true);
        try {
            const originName = getBranchName(newOrder.origin_branch_id);
            const destName = getBranchName(newOrder.destination_branch_id);

            const payload = {
                customer_id: Number(newOrder.customer_id) || 1,
                origin_branch_id: Number(newOrder.origin_branch_id),
                destination_branch_id: Number(newOrder.destination_branch_id),
                cargo_description: newOrder.cargo_description,
                total_weight_kg: parseFloat(newOrder.total_weight_kg) || 0,
                vehicle_id: newOrder.vehicle_id ? Number(newOrder.vehicle_id) : null,
                driver_id: newOrder.driver_id ? Number(newOrder.driver_id) : null
            };

            await createEntity('requests', {
                target_entity: 'orders',
                title: `Transfer Order Request: ${originName} → ${destName}`,
                status: 'PENDING',
                payload: payload,
                created_at: new Date().toISOString()
            });

            alert('Transfer order submitted to Approvals Queue!');
            
            // Reset description/weight fields
            setNewOrder(prev => ({ ...prev, cargo_description: '', total_weight_kg: '500' }));
            loadData();
        } catch (err) {
            alert(`Failed to submit request: ${err.message}`);
        } finally {
            setSubmittingOrder(false);
        }
    }

    // Dispatching an Order
    async function handleDispatch(orderToDispatch) {
        const order = orderToDispatch || selectedOrder;
        if (!order) return;

        const vehicleId = order.vehicle_id || 1;
        const driverId = order.driver_id || 1;
        const vehicleObj = vehicles.find(v => (v.id ?? v.vehicle_id) === Number(vehicleId));
        const driverObj = drivers.find(d => (d.id ?? d.user_id ?? d.driver_id) === Number(driverId));

        try {
            await createEntity('trips', {
                order_id: order.id,
                coordinator_id: 2,
                vehicle_id: Number(vehicleId),
                vehicle_type_id: vehicleObj ? vehicleObj.vehicle_type_id : 1,
                driver_id: Number(driverId),
                branch_id: order.origin_branch_id || 1,
                rescue_trip_id: null,
                status: 'IN_TRANSIT',
                distance_km: 120.00,
                calculated_fuel_cost: 1500.00,
                lock_version: 1,
                started_at: new Date().toISOString(),
                completed_at: null
            });

            await updateEntity('orders', order.id, { 
                ...order, 
                customer_id: order.customer_id || 1,
                status: 'IN_TRANSIT' 
            });

            if (vehicleObj) {
                await updateEntity('vehicles', vehicleId, { ...vehicleObj, status: 'EN_ROUTE' });
            } else {
                await updateEntity('vehicles', vehicleId, { status: 'EN_ROUTE' });
            }

            if (driverObj) {
                await updateEntity('drivers', driverId, { ...driverObj, status: 'ON_TRIP' });
            } else {
                await updateEntity('drivers', driverId, { status: 'ON_TRIP' });
            }

            alert(`Order #${order.id} authorized! Journey started.`);
            setSelectedOrder(null);
            loadData();
        } catch (err) {
            alert(`Dispatch failed: ${err.message}`);
        }
    }

    async function handleAbortTrip(trip) {
        try {
            await updateEntity('trips', trip.id, { 
                ...trip, 
                status: 'ABORTED', 
                completed_at: new Date().toISOString() 
            });

            if (trip.order_id) {
                const targetOrder = approvedOrders.find(o => o.id === trip.order_id) || {};
                await updateEntity('orders', trip.order_id, { 
                    ...targetOrder, 
                    status: 'ABORTED' 
                });
            }

            if (trip.vehicle_id) {
                const targetVehicle = vehicles.find(v => (v.id ?? v.vehicle_id) === Number(trip.vehicle_id)) || {};
                await updateEntity('vehicles', trip.vehicle_id, { ...targetVehicle, status: 'AVAILABLE' });
            }

            if (trip.driver_id) {
                const targetDriver = drivers.find(d => (d.id ?? d.user_id ?? d.driver_id) === Number(trip.driver_id)) || {};
                await updateEntity('drivers', driverId, { ...targetDriver, status: 'AVAILABLE' });
            }

            alert(`Trip #${trip.id} has been aborted.`);
            setAbortConfirmId(null);
            loadData();
        } catch (err) {
            alert(`Failed to abort trip: ${err.message}`);
        }
    }

    // Branch location filtering logic
    const filteredApprovedOrders = approvedOrders.filter(o => {
        if (selectedBranchId === 'ALL') return true;
        const branchIdNum = Number(selectedBranchId);
        return Number(o.origin_branch_id) === branchIdNum || Number(o.destination_branch_id) === branchIdNum;
    });

    const filteredTrips = activeTrips.filter(t => {
        const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;
        if (selectedBranchId === 'ALL') return matchesStatus;
        const branchIdNum = Number(selectedBranchId);
        const matchesBranch = Number(t.branch_id || t.order?.origin_branch_id) === branchIdNum || Number(t.order?.destination_branch_id) === branchIdNum;
        return matchesStatus && matchesBranch;
    });

    const getStatusBadge = (status) => {
        switch (status) {
            case 'COMPLETED':
                return { bg: '#dcfce7', text: '#15803d' };
            case 'IN_TRANSIT':
                return { bg: '#fef3c7', text: '#b45309' };
            case 'ABORTED':
                return { bg: '#fee2e2', text: '#b91c1c' };
            default:
                return { bg: '#f1f5f9', text: '#475569' };
        }
    };

    const cardStyle = {
        background: '#ffffff',
        borderRadius: '12px',
        padding: '24px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        border: '1px solid #e5e7eb'
    };

    const inputStyle = {
        width: '100%',
        padding: '8px 12px',
        borderRadius: '6px',
        border: '1px solid #d1d5db',
        fontSize: '14px',
        boxSizing: 'border-box'
    };

    return (
        <div style={{ maxWidth: '1350px', margin: '0 auto', padding: '32px 24px', fontFamily: 'Inter, system-ui, sans-serif' }}>
            {/* Header with Branch Dropdown Selector */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                    <h2 style={{ fontSize: '28px', fontWeight: '700', color: '#111827', margin: '0 0 6px 0' }}>Dispatcher Operations Center</h2>
                    <p style={{ color: '#6b7280', margin: 0 }}>Review pre-assigned transfer orders, authorize dispatch, and monitor active fleet trips.</p>
                </div>

                {/* Branch Location Dropdown (Defaulting to Ho Chi Minh) */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#f8fafc', padding: '10px 16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                    <label style={{ fontSize: '14px', fontWeight: '600', color: '#334155' }}>Branch Location:</label>
                    <select 
                        value={selectedBranchId} 
                        onChange={(e) => handleBranchLocationChange(e.target.value)}
                        style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', fontWeight: '600', background: '#ffffff', color: '#0f172a', cursor: 'pointer' }}
                    >
                        <option value="ALL">All Branch Locations</option>
                        {branches.map(b => (
                            <option key={b.id ?? b.branch_id} value={b.id ?? b.branch_id}>
                                {b.branch_name || b.name || b.location_city || `Branch #${b.id ?? b.branch_id}`}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {loading ? (
                <div style={{ color: '#6b7280', textAlign: 'center', padding: '40px' }}>Loading fleet state...</div>
            ) : (
                <>
                    {/* New Order Request Form Card */}
                    <div style={{ ...cardStyle, marginBottom: '32px', background: '#f8fafc', borderLeft: '4px solid #2563eb' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', margin: '0 0 6px 0' }}>Request New Transfer Order</h3>
                        <p style={{ fontSize: '13px', color: '#6b7280', margin: '0 0 18px 0' }}>
                            Submit a new order request moving cargo between branches. Submitted orders enter the <strong>Approvals Queue</strong>.
                        </p>

                        <form onSubmit={handleCreateOrderRequest} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#4b5563', marginBottom: '4px' }}>Origin Branch *</label>
                                <select 
                                    value={newOrder.origin_branch_id} 
                                    onChange={(e) => setNewOrder({ ...newOrder, origin_branch_id: e.target.value })}
                                    style={inputStyle}
                                    required
                                >
                                    {branches.map(b => (
                                        <option key={b.id ?? b.branch_id} value={b.id ?? b.branch_id}>
                                            {b.branch_name || b.name || `Branch #${b.id ?? b.branch_id}`}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#4b5563', marginBottom: '4px' }}>Destination Branch *</label>
                                <select 
                                    value={newOrder.destination_branch_id} 
                                    onChange={(e) => setNewOrder({ ...newOrder, destination_branch_id: e.target.value })}
                                    style={inputStyle}
                                    required
                                >
                                    {branches.map(b => (
                                        <option key={b.id ?? b.branch_id} value={b.id ?? b.branch_id}>
                                            {b.branch_name || b.name || `Branch #${b.id ?? b.branch_id}`}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#4b5563', marginBottom: '4px' }}>Cargo Description *</label>
                                <input 
                                    type="text" 
                                    placeholder="e.g. Medical Supplies, Auto Parts" 
                                    value={newOrder.cargo_description} 
                                    onChange={(e) => setNewOrder({ ...newOrder, cargo_description: e.target.value })}
                                    style={inputStyle}
                                    required
                                />
                            </div>

                            {/* Total Weight Slider Input */}
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                    <label style={{ fontSize: '12px', fontWeight: '600', color: '#4b5563' }}>Total Weight (kg)</label>
                                    <span style={{ fontSize: '13px', fontWeight: '700', color: '#2563eb' }}>
                                        {newOrder.total_weight_kg || 0} kg
                                    </span>
                                </div>
                                <input 
                                    type="range" 
                                    min="0"
                                    max="5000"
                                    step="50"
                                    value={newOrder.total_weight_kg || 0} 
                                    onChange={(e) => setNewOrder({ ...newOrder, total_weight_kg: e.target.value })}
                                    style={{ width: '100%', cursor: 'pointer', accentColor: '#2563eb', marginTop: '6px' }}
                                />
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#9ca3af', marginTop: '2px' }}>
                                    <span>0 kg</span>
                                    <span>2,500 kg</span>
                                    <span>5,000 kg</span>
                                </div>
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#4b5563', marginBottom: '4px' }}>Pre-assign Vehicle</label>
                                <select 
                                    value={newOrder.vehicle_id} 
                                    onChange={(e) => setNewOrder({ ...newOrder, vehicle_id: e.target.value })}
                                    style={inputStyle}
                                >
                                    <option value="">Unassigned</option>
                                    {vehicles.map(v => (
                                        <option key={v.id ?? v.vehicle_id} value={v.id ?? v.vehicle_id}>
                                            {v.license_plate || `Vehicle #${v.id ?? v.vehicle_id}`}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#4b5563', marginBottom: '4px' }}>Pre-assign Driver</label>
                                <select 
                                    value={newOrder.driver_id} 
                                    onChange={(e) => setNewOrder({ ...newOrder, driver_id: e.target.value })}
                                    style={inputStyle}
                                >
                                    <option value="">Unassigned</option>
                                    {drivers.map(d => (
                                        <option key={d.id ?? d.user_id ?? d.driver_id} value={d.id ?? d.user_id ?? d.driver_id}>
                                            {d.username || d.full_name || `Driver #${d.id ?? d.user_id ?? d.driver_id}`}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                                <button 
                                    type="submit" 
                                    disabled={submittingOrder}
                                    style={{
                                        background: '#2563eb',
                                        color: '#ffffff',
                                        padding: '10px 20px',
                                        border: 'none',
                                        borderRadius: '6px',
                                        fontWeight: '600',
                                        fontSize: '14px',
                                        cursor: submittingOrder ? 'not-allowed' : 'pointer',
                                        opacity: submittingOrder ? 0.7 : 1
                                    }}
                                >
                                    {submittingOrder ? 'Submitting Request...' : '+ Submit Order Request for Approval'}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Order Queue & Confirmation Terminal */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
                        {/* Order Intake Queue */}
                        <div style={cardStyle}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', margin: 0 }}>Approved Orders Ready for Dispatch</h3>
                                <span style={{ background: '#eff6ff', color: '#2563eb', padding: '4px 10px', borderRadius: '9999px', fontSize: '12px', fontWeight: '600' }}>
                                    {filteredApprovedOrders.length} Ready
                                </span>
                            </div>

                            {filteredApprovedOrders.length === 0 ? (
                                <p style={{ color: '#9ca3af', fontSize: '14px', margin: 0 }}>No orders currently awaiting dispatch for this branch.</p>
                            ) : (
                                filteredApprovedOrders.map(order => (
                                    <div 
                                        key={order.id} 
                                        onClick={() => setSelectedOrder(order)}
                                        style={{
                                            border: selectedOrder?.id === order.id ? '2px solid #2563eb' : '1px solid #e5e7eb',
                                            background: selectedOrder?.id === order.id ? '#f0f6ff' : '#fafafa',
                                            padding: '16px',
                                            borderRadius: '8px',
                                            marginBottom: '12px',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                            <span style={{ fontWeight: '700', color: '#111827' }}>Order #{order.id}</span>
                                            <span style={{ fontSize: '12px', background: '#dcfce7', color: '#15803d', padding: '2px 8px', borderRadius: '4px', fontWeight: '600' }}>
                                                {order.status}
                                            </span>
                                        </div>
                                        <div style={{ fontSize: '14px', color: '#374151', marginBottom: '4px' }}>
                                            <strong>Route:</strong> {getBranchName(order.origin_branch_id)} &rarr; {getBranchName(order.destination_branch_id)}
                                        </div>
                                        <div style={{ fontSize: '13px', color: '#6b7280' }}>
                                            Cargo: {order.cargo_description || 'N/A'} ({order.total_weight_kg || 0} kg)
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Dispatch Confirmation Card */}
                        <div style={cardStyle}>
                            <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', margin: '0 0 16px 0' }}>Dispatch Confirmation Terminal</h3>
                            {selectedOrder ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                        <h4 style={{ margin: '0 0 12px 0', fontSize: '15px', color: '#0f172a' }}>Pre-Assigned Order #{selectedOrder.id} Details</h4>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '13px', color: '#334155' }}>
                                            <div><strong>Assigned Vehicle:</strong> {getVehiclePlate(selectedOrder.vehicle_id)}</div>
                                            <div><strong>Assigned Driver:</strong> {getDriverName(selectedOrder.driver_id)}</div>
                                            <div><strong>Origin Hub:</strong> {getBranchName(selectedOrder.origin_branch_id)}</div>
                                            <div><strong>Destination Hub:</strong> {getBranchName(selectedOrder.destination_branch_id)}</div>
                                            <div style={{ gridColumn: 'span 2' }}><strong>Payload:</strong> {selectedOrder.cargo_description} ({selectedOrder.total_weight_kg} kg)</div>
                                        </div>
                                    </div>

                                    <button 
                                        onClick={() => handleDispatch(selectedOrder)}
                                        style={{
                                            background: '#2563eb',
                                            color: '#ffffff',
                                            padding: '12px',
                                            border: 'none',
                                            borderRadius: '8px',
                                            fontWeight: '600',
                                            fontSize: '15px',
                                            cursor: 'pointer',
                                            marginTop: '8px'
                                        }}
                                    >
                                        Authorize & Dispatch Order #{selectedOrder.id}
                                    </button>
                                </div>
                            ) : (
                                <div style={{ textAlign: 'center', padding: '40px 20px', color: '#9ca3af', border: '2px dashed #e5e7eb', borderRadius: '8px' }}>
                                    Select an order from the queue to view pre-assigned assignments and authorize dispatch.
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Active Trips Monitor Table */}
                    <div style={cardStyle}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                            <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', margin: 0 }}>Fleet Active Trips Monitor</h3>
                            
                            {/* Status Filter Bar */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <label style={{ fontSize: '13px', fontWeight: '600', color: '#4b5563' }}>Filter Status:</label>
                                <select 
                                    value={statusFilter} 
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '13px', background: '#fff', fontWeight: '500' }}
                                >
                                    <option value="ALL">All Statuses</option>
                                    <option value="IN_TRANSIT">In Transit</option>
                                    <option value="COMPLETED">Completed</option>
                                    <option value="ABORTED">Aborted</option>
                                </select>
                            </div>
                        </div>

                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                                <thead>
                                    <tr style={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb', color: '#4b5563' }}>
                                        <th style={{ padding: '10px 12px' }}>Trip ID</th>
                                        <th style={{ padding: '10px 12px' }}>Order ID</th>
                                        <th style={{ padding: '10px 12px' }}>Status</th>
                                        <th style={{ padding: '10px 12px' }}>Vehicle Plate</th>
                                        <th style={{ padding: '10px 12px' }}>Driver</th>
                                        <th style={{ padding: '10px 12px' }}>Origin Hub</th>
                                        <th style={{ padding: '10px 12px' }}>Destination Hub</th>
                                        <th style={{ padding: '10px 12px' }}>Distance</th>
                                        <th style={{ padding: '10px 12px' }}>Fuel Cost</th>
                                        <th style={{ padding: '10px 12px' }}>Started At</th>
                                        <th style={{ padding: '10px 12px' }}>Version</th>
                                        <th style={{ padding: '10px 12px', textAlign: 'center' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredTrips.length === 0 ? (
                                        <tr>
                                            <td colSpan="12" style={{ textAlign: 'center', padding: '24px', color: '#9ca3af' }}>
                                                No trips matching selected branch and status filter "{statusFilter}".
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredTrips.map(t => {
                                            const badge = getStatusBadge(t.status);
                                            return (
                                                <tr key={t.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                                    <td style={{ padding: '12px', fontWeight: '700', color: '#111827' }}>#{t.id}</td>
                                                    <td style={{ padding: '12px' }}>#{t.order_id}</td>
                                                    <td style={{ padding: '12px' }}>
                                                        <span style={{
                                                            background: badge.bg,
                                                            color: badge.text,
                                                            padding: '4px 10px',
                                                            borderRadius: '9999px',
                                                            fontSize: '11px',
                                                            fontWeight: '700'
                                                        }}>
                                                            {t.status}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '12px' }}>{t.vehicle?.license_plate || getVehiclePlate(t.vehicle_id)}</td>
                                                    <td style={{ padding: '12px' }}>{t.driver?.username || getDriverName(t.driver_id)}</td>
                                                    <td style={{ padding: '12px' }}>{getBranchName(t.branch_id || t.order?.origin_branch_id)}</td>
                                                    <td style={{ padding: '12px' }}>{getBranchName(t.order?.destination_branch_id)}</td>
                                                    <td style={{ padding: '12px' }}>{t.distance_km ? `${t.distance_km} km` : 'N/A'}</td>
                                                    <td style={{ padding: '12px' }}>{t.calculated_fuel_cost ? `$${t.calculated_fuel_cost}` : 'N/A'}</td>
                                                    <td style={{ padding: '12px', color: '#6b7280', fontSize: '12px' }}>
                                                        {t.started_at ? new Date(t.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                                                    </td>
                                                    <td style={{ padding: '12px', color: '#6b7280' }}>v{t.lock_version || 1}</td>
                                                    <td style={{ padding: '12px', textAlign: 'center' }}>
                                                        {t.status === 'IN_TRANSIT' && (
                                                            abortConfirmId === t.id ? (
                                                                <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                                                                    <button 
                                                                        onClick={() => handleAbortTrip(t)} 
                                                                        style={{ background: '#dc2626', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}
                                                                    >
                                                                        Confirm
                                                                    </button>
                                                                    <button 
                                                                        onClick={() => setAbortConfirmId(null)} 
                                                                        style={{ background: '#9ca3af', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}
                                                                    >
                                                                        Cancel
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <button 
                                                                    onClick={() => setAbortConfirmId(t.id)} 
                                                                    style={{ background: '#fee2e2', color: '#b91c1c', border: '1px solid #fca5a5', padding: '4px 10px', borderRadius: '4px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
                                                                >
                                                                    Abort Trip
                                                                </button>
                                                            )
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}