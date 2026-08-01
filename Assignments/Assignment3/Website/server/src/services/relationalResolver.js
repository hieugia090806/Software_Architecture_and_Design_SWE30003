import * as db from './filePersistence.js';

/**
 * Resolves full Trip details with linked Order, Vehicle, Driver, and Telemetry
 */
export function getEnrichedTrips() {
    const trips = db.getAll('trips');
    const orders = db.getAll('orders');
    const vehicles = db.getAll('vehicles');
    const drivers = db.getAll('drivers');
    const users = db.getAll('users');
    const telemetry = db.getAll('tracking_telemetry');
    const incidents = db.getAll('trip_incidents');

    return trips.map(trip => {
        const order = orders.find(o => o.id === trip.order_id) || null;
        const vehicle = vehicles.find(v => v.id === trip.vehicle_id) || null;
        const driverRecord = drivers.find(d => d.id === trip.driver_id) || null;
        const driverUser = driverRecord ? users.find(u => u.id === driverRecord.user_id) : null;
        const latestTelemetry = telemetry
            .filter(t => t.trip_id === trip.id)
            .sort((a, b) => new Date(b.recorded_at) - new Date(a.recorded_at))[0] || null;
        const tripIncidents = incidents.filter(i => i.trip_id === trip.id);

        return {
            ...trip,
            order,
            vehicle,
            driver: driverRecord ? { ...driverRecord, username: driverUser?.username } : null,
            latest_telemetry: latestTelemetry,
            incidents: tripIncidents
        };
    });
}

/**
 * Resolves full Invoice details including Order and Customer information
 */
export function getEnrichedInvoices() {
    const invoices = db.getAll('invoices');
    const orders = db.getAll('orders');
    const customers = db.getAll('customers');
    const transactions = db.getAll('payment_transactions');

    return invoices.map(inv => {
        const order = orders.find(o => o.id === inv.order_id) || null;
        const customer = order ? customers.find(c => c.id === order.customer_id) : null;
        const paymentTx = transactions.find(t => t.invoice_id === inv.id) || null;

        return {
            ...inv,
            order,
            customer,
            transaction: paymentTx
        };
    });
}

/**
 * Resolves Customers with their Orders and Invoices
 */
export function getEnrichedCustomers() {
    const customers = db.getAll('customers');
    const orders = db.getAll('orders');
    const invoices = db.getAll('invoices');

    return customers.map(cust => {
        const custOrders = orders.filter(o => o.customer_id === cust.id);
        const custInvoices = invoices.filter(inv => custOrders.some(o => o.id === inv.order_id));

        return {
            ...cust,
            orders: custOrders,
            invoices: custInvoices
        };
    });
}

/**
 * Resolves Drivers with linked User and Trips
 */
export function getEnrichedDrivers() {
    const drivers = db.getAll('drivers');
    const users = db.getAll('users');
    const trips = db.getAll('trips');

    return drivers.map(driver => {
        const user = users.find(u => u.id === driver.user_id) || null;
        const driverTrips = trips.filter(t => t.driver_id === driver.id);

        return {
            ...driver,
            username: user?.username,
            trips: driverTrips
        };
    });
}
