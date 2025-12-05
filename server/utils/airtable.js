const axios = require('axios');

const AIRTABLE_API_BASE = 'https://api.airtable.com/v0';

/**
 * Get Airtable API client with access token
 */
function getAirtableClient(accessToken) {
  return axios.create({
    baseURL: AIRTABLE_API_BASE,
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  });
}

/**
 * Get all bases for a user
 */
async function getBases(accessToken) {
  const client = getAirtableClient(accessToken);
  const response = await client.get('/meta/bases');
  return response.data.bases;
}

/**
 * Get all tables in a base
 */
async function getTables(accessToken, baseId) {
  const client = getAirtableClient(accessToken);
  const response = await client.get(`/meta/bases/${baseId}/tables`);
  return response.data.tables;
}

/**
 * Get all fields in a table
 */
async function getFields(accessToken, baseId, tableId) {
  const client = getAirtableClient(accessToken);
  const response = await client.get(`/meta/bases/${baseId}/tables/${tableId}`);
  return response.data.fields;
}

/**
 * Map Airtable field type to our supported types
 */
function mapFieldType(airtableType) {
  const typeMap = {
    'singleLineText': 'singleLineText',
    'multilineText': 'multilineText',
    'singleSelect': 'singleSelect',
    'multipleSelects': 'multipleSelects',
    'multipleAttachments': 'multipleAttachments'
  };
  
  return typeMap[airtableType] || null;
}

/**
 * Check if field type is supported
 */
function isSupportedFieldType(airtableType) {
  return mapFieldType(airtableType) !== null;
}

/**
 * Create a record in Airtable
 */
async function createRecord(accessToken, baseId, tableId, fields) {
  const client = getAirtableClient(accessToken);
  const response = await client.post(`/${baseId}/${tableId}`, {
    fields: fields
  });
  return response.data;
}

/**
 * Update a record in Airtable
 */
async function updateRecord(accessToken, baseId, tableId, recordId, fields) {
  const client = getAirtableClient(accessToken);
  const response = await client.patch(`/${baseId}/${tableId}/${recordId}`, {
    fields: fields
  });
  return response.data;
}

/**
 * Get user info from Airtable
 */
async function getUserInfo(accessToken) {
  const client = getAirtableClient(accessToken);
  const response = await client.get('/meta/whoami');
  return response.data;
}

module.exports = {
  getBases,
  getTables,
  getFields,
  mapFieldType,
  isSupportedFieldType,
  createRecord,
  updateRecord,
  getUserInfo
};

