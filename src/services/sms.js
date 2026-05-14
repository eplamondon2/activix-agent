const twilio = require('twilio');

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

async function sendAdvisorSMS(advisor, lead, dealership, approvalToken) {
  const baseUrl = process.env.BASE_URL;
  const approveUrl = `${baseUrl}/approve/${approvalToken}`;
  const clientName = `${lead.first_name || ''} ${lead.last_name || ''}`.trim() || 'Nouveau client';
  const vehicle = `${lead.vehicle_make || ''} ${lead.vehicle_model || ''}`.trim() || 'véhicule non spécifié';

  const message = `🚗 ${dealership.name}
Nouveau lead : ${clientName}
Véhicule : ${vehicle}
Source : ${lead.source || 'N/A'}

✅ Approuver : ${approveUrl}

⏳ 5 min pour répondre`;

  await client.messages.create({
    body: message,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: advisor.phone
  });

  console.log(`📱 SMS envoyé à ${advisor.name} (${advisor.phone})`);
}

async function sendClientSMS(lead, message) {
  if (!lead.phone) {
    console.log('⚠️ Pas de numéro pour ce lead');
    return;
  }
  const phone = formatPhone(lead.phone);
  if (!phone) {
    console.log(`⚠️ Numéro invalide : ${lead.phone}`);
    return;
  }
  await client.messages.create({
    body: message,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: phone
  });
  console.log(`📱 SMS envoyé au client : ${phone}`);
}

function formatPhone(phone) {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  return null;
}

module.exports = { sendAdvisorSMS, sendClientSMS };
