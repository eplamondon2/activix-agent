require('dotenv').config();
const express = require('express');
const { handleActivixWebhook } = require('./services/webhook');
const { approveAndGet, updateMessage, getPending } = require('./services/approval');
const { sendClientEmail } = require('./services/email');
const { sendClientSMS } = require('./services/sms');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post('/webhook/activix', async (req, res) => {
  try {
    const token = req.headers['x-webhook-token'] || req.query.token;
    if (process.env.WEBHOOK_SECRET && token !== process.env.WEBHOOK_SECRET) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    res.status(200).json({ received: true });
    await handleActivixWebhook(req.body);
  } catch (error) {
    console.error('❌ Erreur webhook:', error);
  }
});

app.get('/approve/:token', async (req, res) => {
  const { token } = req.params;
  const pending = approveAndGet(token);
  if (!pending) {
    return res.send('<html><body style="font-family:Arial;text-align:center;padding:50px"><h2>⚠️ Lien expiré ou déjà utilisé.</h2></body></html>');
  }
  try {
    if (pending.lead.email) {
      await sendClientEmail({ lead: pending.lead, advisor: pending.advisor, dealership: pending.dealership, message: pending.message, language: 'fr' });
    }
    if (pending.leadType === 'walkout' && pending.lead.phone) {
      await sendClientSMS(pending.lead, pending.message);
    }
    res.send(`<html><body style="font-family:Arial;text-align:center;padding:50px"><h1 style="color:#28a745">✅ Message envoyé!</h1><p>${pending.lead.first_name} ${pending.lead.last_name} a reçu votre réponse.</p><p>Conseiller: ${pending.advisor.name}</p></body></html>`);
  } catch (error) {
    console.error('❌ Erreur approbation:', error);
    res.status(500).send('<h2>Erreur lors de l\'envoi.</h2>');
  }
});

app.get('/edit/:token', (req, res) => {
  const { token } = req.params;
  const pending = getPending(token);
  if (!pending) return res.send('<h2>Lien expiré.</h2>');
  res.send(`<html><head><meta charset="UTF-8"><style>body{font-family:Arial;max-width:600px;margin:40px auto;padding:20px}textarea{width:100%;height:200px;padding:10px;font-size:15px}button{background:#003087;color:white;padding:12px 25px;border:none;border-radius:5px;font-size:16px;cursor:pointer;margin-top:10px}.info{background:#f5f5f5;padding:15px;border-radius:5px;margin-bottom:20px}</style></head><body><h2>✏️ Modifier la réponse</h2><div class="info"><strong>Client:</strong> ${pending.lead.first_name} ${pending.lead.last_name}<br><strong>Email:</strong> ${pending.lead.email || 'N/A'}</div><form action="/edit/${token}" method="POST"><textarea name="message">${pending.message}</textarea><br><button type="submit">✅ Envoyer</button></form></body></html>`);
});

app.post('/edit/:token', async (req, res) => {
  const { token } = req.params;
  const { message } = req.body;
  updateMessage(token, message);
  const pending = approveAndGet(token);
  if (!pending) return res.send('<h2>Lien expiré.</h2>');
  try {
    if (pending.lead.email) {
      await sendClientEmail({ lead: pending.lead, advisor: pending.advisor, dealership: pending.dealership, message: pending.message, language: 'fr' });
    }
    res.send('<html><body style="font-family:Arial;text-align:center;padding:50px"><h1 style="color:#28a745">✅ Message modifié et envoyé!</h1></body></html>');
  } catch (error) {
    res.status(500).send('<h2>Erreur lors de l\'envoi.</h2>');
  }
});
app.get('/test', async (req, res) => {
  const testLead = {
    event_type: 'new_lead',
    lead: {
      id: 'TEST-001',
      first_name: 'Jean',
      last_name: 'Tremblay',
      email: req.query.email || 'test@test.com',
      phone: '4185551234',
      source: req.query.source || 'Site web',
      notes: 'Bonjour, je suis intéressé par un Hyundai Tucson 2024',
      vehicle: { make: 'Hyundai', model: 'Tucson', year: '2024' }
    }
  };

  try {
    res.send(`
      <html><body style="font-family:Arial;text-align:center;padding:50px">
        <h1 style="color:#28a745">✅ Test envoyé !</h1>
        <p>Un lead fictif <strong>Jean Tremblay</strong> a été créé.</p>
        <p>Le premier conseiller de la rotation devrait recevoir un email et un SMS dans quelques secondes.</p>
        <hr>
        <p>Tester Auto Fiset : <a href="/test?source=Auto Fiset">Cliquez ici</a></p>
        <p>Tester Hyundai : <a href="/test?source=Site web">Cliquez ici</a></p>
      </body></html>
    `);
    handleActivixWebhook(testLead).catch(err => console.error('Erreur test:', err));
      <html><body style="font-family:Arial;text-align:center;padding:50px">
        <h1 style="color:#28a745">✅ Test envoyé !</h1>
        <p>Un lead fictif <strong>Jean Tremblay</strong> a été créé.</p>
        <p>Le premier conseiller de la rotation devrait recevoir un email et un SMS dans quelques secondes.</p>
        <hr>
        <p>Tester Auto Fiset : <a href="/test?source=Auto Fiset">Cliquez ici</a></p>
        <p>Tester Hyundai : <a href="/test?source=Site web">Cliquez ici</a></p>
      </body></html>
    `);
  } catch (error) {
    res.status(500).send(`<h2>❌ Erreur : ${error.message}</h2>`);
  }
});
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'Activix Agent IA', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Agent IA démarré sur le port ${PORT}`);
  console.log(`📡 Webhook URL: ${process.env.BASE_URL}/webhook/activix`);
});
