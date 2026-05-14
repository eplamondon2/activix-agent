require('dotenv').config();
const express = require('express');
const { handleActivixWebhook } = require('./services/webhook');
const { approveAndGet, updateMessage, getPending } = require('./services/approval');
const { sendClientEmail } = require('./services/email');
const { sendClientSMS } = require('./services/sms');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
      notes: 'Bonjour, je suis interesse par un Hyundai Tucson 2024',
      vehicle: { make: 'Hyundai', model: 'Tucson', year: '2024' }
    }
  };
  res.send('<html><body style="font-family:Arial;text-align:center;padding:50px"><h1 style="color:#28a745">Test envoye!</h1><p>Jean Tremblay a ete cree.</p><p>Le conseiller devrait recevoir un email et SMS dans quelques secondes.</p><hr><p><a href="/test?source=Auto Fiset">Tester Auto Fiset</a> | <a href="/test?source=Site web">Tester Hyundai</a></p></body></html>');
  handleActivixWebhook(testLead).catch(function(err) { console.error('Erreur test:', err); });
});

app.post('/webhook/activix', async (req, res) => {
  try {
    const token = req.headers['x-webhook-token'] || req.query.token;
    if (process.env.WEBHOOK_SECRET && token !== process.env.WEBHOOK_SECRET) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    res.status(200).json({ received: true });
    handleActivixWebhook(req.body).catch(function(err) { console.error('Erreur webhook:', err); });
  } catch (error) {
    console.error('Erreur webhook:', error);
  }
});

app.get('/approve/:token', async (req, res) => {
  const token = req.params.token;
  const pending = approveAndGet(token);
  if (!pending) {
    return res.send('<html><body style="font-family:Arial;text-align:center;padding:50px"><h2>Lien expire ou deja utilise.</h2></body></html>');
  }
  try {
    if (pending.lead.email) {
      await sendClientEmail({ lead: pending.lead, advisor: pending.advisor, dealership: pending.dealership, message: pending.message, language: 'fr' });
    }
    if (pending.leadType === 'walkout' && pending.lead.phone) {
      await sendClientSMS(pending.lead, pending.message);
    }
    res.send('<html><body style="font-family:Arial;text-align:center;padding:50px"><h1 style="color:#28a745">Message envoye!</h1></body></html>');
  } catch (error) {
    console.error('Erreur approbation:', error);
    res.status(500).send('<h2>Erreur lors de l envoi.</h2>');
  }
});

app.get('/edit/:token', function(req, res) {
  const token = req.params.token;
  const pending = getPending(token);
  if (!pending) return res.send('<h2>Lien expire.</h2>');
  res.send('<html><head><meta charset="UTF-8"><style>body{font-family:Arial;max-width:600px;margin:40px auto;padding:20px}textarea{width:100%;height:200px;padding:10px;font-size:15px}button{background:#003087;color:white;padding:12px 25px;border:none;border-radius:5px;font-size:16px;cursor:pointer;margin-top:10px}.info{background:#f5f5f5;padding:15px;border-radius:5px;margin-bottom:20px}</style></head><body><h2>Modifier la reponse</h2><div class="info"><strong>Client:</strong> ' + pending.lead.first_name + ' ' + pending.lead.last_name + '<br><strong>Email:</strong> ' + (pending.lead.email || 'N/A') + '</div><form action="/edit/' + token + '" method="POST"><textarea name="message">' + pending.message + '</textarea><br><button type="submit">Envoyer</button></form></body></html>');
});

app.post('/edit/:token', async function(req, res) {
  const token = req.params.token;
  const message = req.body.message;
  updateMessage(token, message);
  const pending = approveAndGet(token);
  if (!pending) return res.send('<h2>Lien expire.</h2>');
  try {
    if (pending.lead.email) {
      await sendClientEmail({ lead: pending.lead, advisor: pending.advisor, dealership: pending.dealership, message: pending.message, language: 'fr' });
    }
    res.send('<html><body style="font-family:Arial;text-align:center;padding:50px"><h1 style="color:#28a745">Message modifie et envoye!</h1></body></html>');
  } catch (error) {
    res.status(500).send('<h2>Erreur lors de l envoi.</h2>');
  }
});

app.get('/health', function(req, res) {
  res.json({ status: 'ok', service: 'Activix Agent IA', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, function() {
  console.log('Agent IA demarre sur le port ' + PORT);
  console.log('Webhook URL: ' + process.env.BASE_URL + '/webhook/activix');
});
