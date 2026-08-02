// Assignments\Assignment3\Website\client\src\services\adminFormService.js

import { createEntity, generateUniqueUserCode } from './adminService';

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
        license_plate: '', 
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
        role: 'DRIVER', 
        branch_id: '', 
        license_number: '',
        company_name: '', 
        billing_address: '', 
        email: '',
        phone: ''
    }
};

export const TABS = [
    { key: 'branch', label: 'Branch Hubs' },
    { key: 'vtype', label: 'Specifications' },
    { key: 'vehicle', label: 'Vehicle Assets' },
    { key: 'user', label: 'User & Access Control' }
];

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
            const payload = {
                license_plate: formData.license_plate,
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
                description: `New Vehicle Asset Request: ${formData.license_plate}`,
                status: 'PENDING',
                created_at: new Date().toISOString()
            });

            return `Submitted vehicle asset request for ${formData.license_plate} for approval.`;
        }

        case 'user': {
            const username = formData.username || formData.full_name;
            const { role, branch_id, company_name, billing_address, email, phone, license_number } = formData;
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
                    company_name,
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