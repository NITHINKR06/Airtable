const axios = require('axios');

const AIRTABLE_API_BASE = 'https://api.airtable.com/v0';
const AIRTABLE_META_API = 'https://api.airtable.com/v0/meta';
const AIRTABLE_OAUTH_URL = 'https://airtable.com/oauth2/v1';

// Supported Airtable field types
const SUPPORTED_FIELD_TYPES = [
    'singleLineText',
    'multilineText',
    'singleSelect',
    'multipleSelects',
    'multipleAttachments'
];

/**
 * Create an axios instance with authorization header
 */
function createAirtableClient(accessToken) {
    return axios.create({
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        }
    });
}

/**
 * Exchange authorization code for access token
 */
async function exchangeCodeForToken(code, codeVerifier) {
    const params = new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: process.env.AIRTABLE_REDIRECT_URI,
        client_id: process.env.AIRTABLE_CLIENT_ID,
        code_verifier: codeVerifier
    });

    const credentials = Buffer.from(
        `${process.env.AIRTABLE_CLIENT_ID}:${process.env.AIRTABLE_CLIENT_SECRET}`
    ).toString('base64');

    const response = await axios.post(`${AIRTABLE_OAUTH_URL}/token`, params.toString(), {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${credentials}`
        }
    });

    return response.data;
}

/**
 * Refresh an expired access token
 */
async function refreshAccessToken(refreshToken) {
    const params = new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: process.env.AIRTABLE_CLIENT_ID
    });

    const credentials = Buffer.from(
        `${process.env.AIRTABLE_CLIENT_ID}:${process.env.AIRTABLE_CLIENT_SECRET}`
    ).toString('base64');

    const response = await axios.post(`${AIRTABLE_OAUTH_URL}/token`, params.toString(), {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${credentials}`
        }
    });

    return response.data;
}

/**
 * Get current user info from Airtable
 */
async function getCurrentUser(accessToken) {
    const client = createAirtableClient(accessToken);
    const response = await client.get(`${AIRTABLE_META_API}/whoami`);
    return response.data;
}

/**
 * Get all bases for the authenticated user
 */
async function getBases(accessToken) {
    const client = createAirtableClient(accessToken);
    const response = await client.get(`${AIRTABLE_META_API}/bases`);
    return response.data.bases || [];
}

/**
 * Get schema for a specific base (includes tables and fields)
 */
async function getBaseSchema(accessToken, baseId) {
    const client = createAirtableClient(accessToken);
    const response = await client.get(`${AIRTABLE_META_API}/bases/${baseId}/tables`);
    return response.data.tables || [];
}

/**
 * Get fields for a specific table, filtering to supported types only
 */
async function getTableFields(accessToken, baseId, tableId) {
    const tables = await getBaseSchema(accessToken, baseId);
    const table = tables.find(t => t.id === tableId);

    if (!table) {
        throw new Error(`Table ${tableId} not found in base ${baseId}`);
    }

    // Filter to only supported field types
    const supportedFields = table.fields.filter(field =>
        SUPPORTED_FIELD_TYPES.includes(field.type)
    );

    // Add options for select fields
    return supportedFields.map(field => ({
        id: field.id,
        name: field.name,
        type: field.type,
        options: field.options?.choices?.map(choice => choice.name) || []
    }));
}

/**
 * Create a new record in an Airtable table
 */
async function createRecord(accessToken, baseId, tableId, fields) {
    const client = createAirtableClient(accessToken);
    const response = await client.post(
        `${AIRTABLE_API_BASE}/${baseId}/${tableId}`,
        { fields }
    );
    return response.data;
}

/**
 * Update an existing record in an Airtable table
 */
async function updateRecord(accessToken, baseId, tableId, recordId, fields) {
    const client = createAirtableClient(accessToken);
    const response = await client.patch(
        `${AIRTABLE_API_BASE}/${baseId}/${tableId}/${recordId}`,
        { fields }
    );
    return response.data;
}

/**
 * Get a specific record from an Airtable table
 */
async function getRecord(accessToken, baseId, tableId, recordId) {
    const client = createAirtableClient(accessToken);
    const response = await client.get(
        `${AIRTABLE_API_BASE}/${baseId}/${tableId}/${recordId}`
    );
    return response.data;
}

/**
 * Create a webhook for a base
 */
async function createWebhook(accessToken, baseId, notificationUrl, tableId) {
    const client = createAirtableClient(accessToken);

    const specification = {
        options: {
            filters: {
                dataTypes: ['tableData'],
                recordChangeScope: tableId
            }
        }
    };

    const response = await client.post(
        `${AIRTABLE_API_BASE}/bases/${baseId}/webhooks`,
        {
            notificationUrl,
            specification
        }
    );
    return response.data;
}

/**
 * List webhooks for a base
 */
async function listWebhooks(accessToken, baseId) {
    const client = createAirtableClient(accessToken);
    const response = await client.get(`${AIRTABLE_API_BASE}/bases/${baseId}/webhooks`);
    return response.data.webhooks || [];
}

/**
 * Delete a webhook
 */
async function deleteWebhook(accessToken, baseId, webhookId) {
    const client = createAirtableClient(accessToken);
    await client.delete(`${AIRTABLE_API_BASE}/bases/${baseId}/webhooks/${webhookId}`);
}

/**
 * Get webhook payloads (cursor-based pagination)
 */
async function getWebhookPayloads(accessToken, baseId, webhookId, cursor) {
    const client = createAirtableClient(accessToken);
    const url = cursor
        ? `${AIRTABLE_API_BASE}/bases/${baseId}/webhooks/${webhookId}/payloads?cursor=${cursor}`
        : `${AIRTABLE_API_BASE}/bases/${baseId}/webhooks/${webhookId}/payloads`;

    const response = await client.get(url);
    return response.data;
}

module.exports = {
    SUPPORTED_FIELD_TYPES,
    exchangeCodeForToken,
    refreshAccessToken,
    getCurrentUser,
    getBases,
    getBaseSchema,
    getTableFields,
    createRecord,
    updateRecord,
    getRecord,
    createWebhook,
    listWebhooks,
    deleteWebhook,
    getWebhookPayloads
};
