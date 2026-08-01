const API_BASE_URL = 'http://localhost:5000/api';

// Enriched API Queries
export async function fetchEnriched(entity) {
    const res = await fetch(`${API_BASE_URL}/enriched/${entity}`);
    if (!res.ok) throw new Error(`Failed to fetch enriched ${entity}`);
    return res.json();
}

// Standard REST CRUD Operations
export async function fetchEntity(table) {
    const res = await fetch(`${API_BASE_URL}/${table}`);
    if (!res.ok) throw new Error(`Failed to fetch ${table}`);
    return res.json();
}

export async function createEntity(table, data) {
    const res = await fetch(`${API_BASE_URL}/${table}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(`Failed to create record in ${table}`);
    return res.json();
}

export async function updateEntity(table, id, data) {
    const res = await fetch(`${API_BASE_URL}/${table}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(`Failed to update record in ${table}`);
    return res.json();
}

export async function deleteEntity(table, id) {
    const res = await fetch(`${API_BASE_URL}/${table}/${id}`, {
        method: 'DELETE',
    });
    if (!res.ok) throw new Error(`Failed to delete record in ${table}`);
    return res.json();
}