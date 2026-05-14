const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransporter({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

async function sendApprovalEmail(params) {
  const { advisor, lead, dealership, generatedMessage, approvalToken, leadType } = params;
  const baseUrl = process.env.BASE_URL;
  const approveUrl = `${baseUrl}/approve/${approvalToken}`;
  const editUrl = `${baseUrl}/edit/${approvalToken}`;

  const subject = leadType === 'walkout'
    ? `🚗 Walkout - Suivi à approuver : ${lead.first_name} ${lead.last_name}`
    : `🆕 Nouveau lead - Réponse à approuver : ${lead.first_name} ${lead.last_name}`;

  const html = `
    <div style="font-family:Arial;max-width:600px;margin:0 auto;">
      <div style="background:#003087;color:white;padding:20px;border-radius:8px 8px 0 0;">
        <h2 style="margin:0;">⏳ Réponse à approuver — ${dealership.name}</h2>
        <p style="margin:5px 0 0 0;opacity:0.8;">Vous avez 5 minutes pour approuver, sinon passe au prochain conseiller</p>
      </div>
      <div style="background:#f5f5f5;padding:20px;">
        <h3>📋 Informations du ${leadType === 'walkout' ? 'client walkout' : 'lead'}</h3>
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="padding:5px;font-weight:bold;">Nom :</td><td>${lead.first_name || ''} ${lead.last_name || ''}</td></tr>
          <tr><td style="padding:5px;font-weight:bold;">Email :</td><td>${lead.email || 'Non disponible'}</td></tr>
          <tr><td style="padding:5px;font-weight:bold;">Téléphone :</td><td>${lead.phone || 'Non disponible'}</td></tr>
          <tr><td style="padding:5px;font-weight:bold;">Véhicule :</td><td>${lead.vehicle_make || ''} ${lead.vehicle_model || ''} ${lead.vehicle_year || ''}</td></tr>
          <tr><td style="padding:5px;font-weight:bold;">Source :</td><td>${lead.source || 'Non spécifiée'}</td></tr>
        </table>
      </div>
      <div style="background:white;padding:20px;border-left:4px solid #003087;">
        <h3>💬 Message généré par l'agent IA</h3>
        <div style="background:#f9f9f9;padding:15px;border-radius:5px;white-space:pre-line;">${generatedMessage}</div>
      </div>
      <div style="padding:20px;text-align:center;">
        <a href="${approveUrl}" style="background:#28a745;color:white;padding:15px 30px;text-decoration:none;border-radius:5px;font-size:16px;margin-right:10px;display:inline-block;">✅ Approuver et envoyer</a>
        <a href="${editUrl}" style="background:#ffc107;color:black;padding:15px 30px;text-decoration:none;border-radius:5px;font-size:16px;display:inline-block;">✏️ Modifier</a>
      </div>
      <div style="background:#f5f5f5;padding:15px;text-align:center;font-size:12px;color:#666;border-radius:0 0 8px 8px;">
        Sera envoyé à ${lead.email || 'N/A'} — Conseiller : ${advisor.name}
      </div>
    </div>`;

  await transporter.sendMail({
    from: `"${dealership.name} - Agent IA" <${process.env.SMTP_USER}>`,
    to: advisor.email,
    subject,
    html
  });
}

async function sendClientEmail(params) {
  const { lead, advisor, dealership, message, language } = params;
  const fromEmail = dealership.useAdvisorEmail ? advisor.email : dealership.email;
  const fromName = dealership.useAdvisorEmail ? `${advisor.name} - ${dealership.name}` : dealership.name;

  const subjects = {
    fr: `${dealership.name} — Nous avons bien reçu votre demande`,
    en: `${dealership.name} — We received your request`
  };

  const signature = dealership.signatures[language] || dealership.signatures.fr;
  const fullMessage = `${message}\n\n${signature}`;

  await transporter.sendMail({
    from: `"${fromName}" <${fromEmail}>`,
    to: lead.email,
    subject: subjects[language] || subjects.fr,
    text: fullMessage
  });

  console.log(`✅ Email envoyé à ${lead.email} par ${fromName}`);
}

module.exports = { sendApprovalEmail, sendClientEmail };
