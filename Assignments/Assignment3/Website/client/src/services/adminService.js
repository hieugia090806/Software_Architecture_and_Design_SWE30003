// Assignments\Assignment3\Website\client\src\services\adminService.js

export { fetchEntity, createEntity } from './api';
import { fetchEntity, createEntity } from './api';

/**
 * Generates a unique registration ID in the format:
 * ROLE(3)-BRANCH(3)-6DIGIT (e.g., DRV-HCM-882194, ADM-DAD-401928)
 */
export function generateUniqueUserCode(role, branchId, branches = []) {
    const rolePrefixes = {
        DRIVER: 'DRV',
        CUSTOMER: 'CST',
        DISPATCHER: 'DSP',
        BRANCH_MANAGER: 'MGR',
        ACCOUNTANT: 'ACC',
        SYSTEM_ADMIN: 'ADM'
    };
    const roleCode = rolePrefixes[role] || 'USR';

    const branch = branches.find(b => Number(b.id) === Number(branchId));
    let branchCode = 'GEN';
    if (branch && branch.branch_code) {
        branchCode = branch.branch_code
            .replace('LIC-', '')
            .replace('-HUB', '')
            .substring(0, 3)
            .toUpperCase();
    }

    const random6Digits = Math.floor(100000 + Math.random() * 900000);

    return `${roleCode}-${branchCode}-${random6Digits}`;
}

/**
 * Loads composite data needed for the admin console using standard REST endpoints.
 */
export async function loadAdminData() {
    try {
        const [branches, vehicleTypes, vehicles, drivers, customers] = await Promise.all([
            fetchEntity('branches'),
            fetchEntity('vehicle_types'),
            fetchEntity('vehicles'),
            fetchEntity('drivers'),
            fetchEntity('customers')
        ]);

        return {
            branches: branches || [],
            vehicleTypes: vehicleTypes || [],
            vehicles: vehicles || [],
            drivers: drivers || [],
            customers: customers || []
        };
    } catch (err) {
        console.error('Failed to load admin data:', err);
        throw err;
    }
}