const { generateLeadResponse, generateWalkoutResponse } = require('./agent');
const { startApprovalProcess } = require('./approval');
const { getDealershipBySource } = require('../config/dealerships');

async function handleActivixWebhook(payload) {
  console.log('📥 Webhook reçu:', JSON.stringify(payload, null, 2));
  const eventType = payload.event_type || payload.type || payload.action;

  switch (eventType) {
    case 'lead.created':
    case 'new_lead':
      await handleNewLead(payload);
      break;
    case 'lead.updated':
    case 'lead.status_changed':
      await handleLeadUpdate(payload);
      break;
    case 'lead.walkout':
    case 'walkout':
      await handleWalkout(payload);
      break;
    default:
      console.log(`⚠️ Événement non géré : ${eventType}`);
  }
}

async function handleNewLead(payload) {
  const lead = extractLeadData(payload);
  console.log(`🆕 Nouveau lead : ${lead.first_name} ${lead.last_name}`);
  try {
    const dealership = getDealershipBySource(lead.source);
    const { body: generatedMessage } = await generateLeadResponse(lead, {}, dealership);
    await startApprovalProcess(lead, generatedMessage, 'new_lead');
  } catch (error) {
    console.error('❌ Erreur handleNewLead:', error);
  }
}

async function handleLeadUpdate(payload) {
  const lead = extractLeadData(payload);
  const newStatus = payload.status || payload.lead?.status;
  if (newStatus === 'walkout' || newStatus === 'lost') {
    await handleWalkout(payload);
  }
}

async function handleWalkout(payload) {
  const lead = extractLeadData(payload);
  console.log(`🚶 Walkout : ${lead.first_name} ${lead.last_name}`);
  try {
    const dealership = getDealershipBySource(lead.source);
    const { body: generatedMessage } = await generateWalkoutResponse(lead, {}, dealership);
    await startApprovalProcess(lead, generatedMessage, 'walkout');
  } catch (error) {
    console.error('❌ Erreur handleWalkout:', error);
  }
}

function extractLeadData(payload) {
  const lead = payload.lead || payload.data || payload;
  return {
    id: lead.id || payload.lead_id,
    first_name: lead.first_name || lead.firstname || '',
    last_name: lead.last_name || lead.lastname || '',
    email: lead.email || lead.email_address || '',
    phone: lead.phone || lead.phone_number || lead.cell_phone || '',
    source: lead.source || lead.lead_source || payload.source || '',
    status: lead.status || '',
    notes: lead.notes || lead.message || lead.comment || '',
    vehicle_make: lead.vehicle?.make || lead.make || '',
    vehicle_model: lead.vehicle?.model || lead.model || '',
    vehicle_year: lead.vehicle?.year || lead.year || '',
    type: lead.type || 'new'
  };
}

module.exports = { handleActivixWebhook };
