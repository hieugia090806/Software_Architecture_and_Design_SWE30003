// Assignments\Assignment3\Website\client\src\services\adminFormService.js

import { createEntity, generateUniqueUserCode, fetchEntity } from './adminService';

export const INITIAL_FORM_STATES = {
    branch: { 
        city_prefix: '', 
        branch_name: '', 
        location_city: '', 
        address: '', 
        service_radius_km: 50 
    },
    vtype: { 
        type_name: '', 
        max_payload_kg: 5000, 
        volumetric_limit_m3: 20, 
        base_fuel_rate: 1.5 
    },
    vehicle: { 
        branch_id: '', 
        vehicle_type_id: '', 
        is_cold_chain: false, 
        min_temp_c: -18, 
        max_temp_c: -10, 
        trips_since_maintenance: 0, 
        maintenance_status: 'OK' 
    },
    user: { 
        full_name: '', 
        username: '', 
        role: 'BRANCH_MANAGER', // Default role (ADMIN removed)
        branch_id: '', 
        license_number: '',
        company_name: '', 
        billing_address: '', 
        email: '',
        phone: ''
    }
};

// Available operational roles (ADMIN is unique system-wide and excluded from options)
export const USER_ROLE_OPTIONS = [
    { value: 'BRANCH_MANAGER', label: 'Branch Manager' },
    { value: 'DISPATCHER', label: 'Dispatcher' },
    { value: 'DRIVER', label: 'Driver' },
    { value: 'CUSTOMER', label: 'Customer' }
];

export const TABS = [
    { key: 'branch', label: 'Branch Hubs' },
    { key: 'vtype', label: 'Specifications' },
    { key: 'vehicle', label: 'Vehicle Assets' },
    { key: 'user', label: 'User & Access Control' }
];

// Helper to auto-generate realistic VN License Plates based on Branch Hub Prefix
function generateAutoLicensePlate(branchId, branches = []) {
    const branch = branches.find(b => String(b.id) === String(branchId));
    let prefix = '51C'; // Default Ho Chi Minh prefix
    
    if (branch && branch.branch_code) {
        if (branch.branch_code.includes('DAD') || branch.branch_code.includes('DAN')) prefix = '43C';
        else if (branch.branch_code.includes('HAN')) prefix = '29C';
    }

    const randomNum5 = Math.floor(10000 + Math.random() * 90000).toString();
    return `${prefix}-${randomNum5.substring(0, 3)}.${randomNum5.substring(3)}`;
}

export async function processFormSubmission(tab, formData, contextData) {
    const { branches = [] } = contextData || {};

    switch (tab) {
        case 'branch': {
            const code = `LIC-${formData.city_prefix.substring(0, 3).toUpperCase()}-HUB`;
            const payload = {
                branch_code: code,
                branch_name: formData.branch_name,
                location_city: formData.location_city,
                address: formData.address,
                service_radius_km: Number(formData.service_radius_km)
            };

            await createEntity('requests', {
                target_entity: 'branches',
                payload,
                description: `New Branch Hub Request: ${formData.branch_name}`,
                status: 'PENDING',
                created_at: new Date().toISOString()
            });

            return `Submitted branch registration request for ${formData.branch_name} (${code}) for approval.`;
        }

        case 'vtype': {
            const payload = {
                ...formData,
                max_payload_kg: Number(formData.max_payload_kg),
                volumetric_limit_m3: Number(formData.volumetric_limit_m3),
                base_fuel_rate: Number(formData.base_fuel_rate)
            };

            await createEntity('requests', {
                target_entity: 'vehicle_types',
                payload,
                description: `New Vehicle Spec Request: ${formData.type_name}`,
                status: 'PENDING',
                created_at: new Date().toISOString()
            });

            return `Submitted specification request for ${formData.type_name} for approval.`;
        }

        case 'vehicle': {
            if (!formData.branch_id) {
                throw new Error('Please select a assigned Branch Hub for this vehicle.');
            }

            // Auto-generate vehicle license plate
            const autoPlate = generateAutoLicensePlate(formData.branch_id, branches);

            const payload = {
                license_plate: autoPlate,
                branch_id: Number(formData.branch_id),
                vehicle_type_id: Number(formData.vehicle_type_id),
                status: 'AVAILABLE',
                is_cold_chain: formData.is_cold_chain,
                min_temp_c: formData.is_cold_chain ? Number(formData.min_temp_c) : null,
                max_temp_c: formData.is_cold_chain ? Number(formData.max_temp_c) : null,
                trips_since_maintenance: Number(formData.trips_since_maintenance),
                maintenance_status: formData.maintenance_status
            };

            await createEntity('requests', {
                target_entity: 'vehicles',
                payload,
                description: `New Vehicle Asset Request: ${autoPlate}`,
                status: 'PENDING',
                created_at: new Date().toISOString()
            });

            return `Submitted vehicle asset request (${autoPlate}) for approval.`;
        }

        case 'user': {
            const { role, branch_id, company_name, billing_address, email, phone, license_number } = formData;
            const username = formData.username || formData.full_name;

            if (role === 'ADMIN') {
                throw new Error('System rules restrict creating additional ADMIN accounts. Only 1 Global Admin is permitted.');
            }

            // Enforce: Each branch can only have 1 Branch Manager
            if (role === 'BRANCH_MANAGER') {
                if (!branch_id) {
                    throw new Error('Branch Manager must be assigned to a specific Branch Hub.');
                }

                const existingUsers = await fetchEntity('users');
                const hasExistingManager = existingUsers.some(
                    u => u.role === 'BRANCH_MANAGER' && Number(u.branch_id) === Number(branch_id)
                );

                if (hasExistingManager) {
                    throw new Error(`Branch Hub #${branch_id} already has an assigned Branch Manager. Only 1 manager per branch is allowed.`);
                }
            }

            const registrationCode = generateUniqueUserCode(role, branch_id, branches);
            let payload = {};
            let targetEntity = 'users';

            if (role === 'DRIVER') {
                targetEntity = 'drivers';
                payload = {
                    username,
                    full_name: formData.full_name || username,
                    branch_id: branch_id ? Number(branch_id) : null,
                    license_number: license_number || registrationCode,
                    active_service_hours: 0,
                    status: 'AVAILABLE',
                    trips: []
                };
            } else if (role === 'CUSTOMER') {
                targetEntity = 'customers';
                payload = {
                    username,
                    company_name: company_name || username,
                    contact_name: formData.full_name || username,
                    email,
                    phone,
                    billing_address
                };
            } else {
                payload = {
                    username,
                    full_name: formData.full_name || username,
                    role,
                    registration_code: registrationCode,
                    branch_id: branch_id ? Number(branch_id) : null
                };
            }

            await createEntity('requests', {
                target_entity: targetEntity,
                payload,
                description: `New ${role} Registration Request: ${username} [${registrationCode}]`,
                status: 'PENDING',
                created_at: new Date().toISOString()
            });

            return `Submitted ${role} registration request for ${username} [${registrationCode}] for approval.`;
        }

        default:
            throw new Error(`Unknown form submission type: ${tab}`);
    }
}