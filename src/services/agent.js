const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function detectLanguage(text) {
  if (!text) return 'fr';
  const frenchWords = ['bonjour', 'merci', 'voiture', 'véhicule', 'prix', 'intéressé', 'question'];
  const lowerText = text.toLowerCase();
  const frenchCount = frenchWords.filter(w => lowerText.includes(w)).length;
  return frenchCount > 0 ? 'fr' : 'en';
}

async function generateLeadResponse(lead, advisor, dealership) {
  const language = detectLanguage(lead.notes || lead.message || '');
  const lang = language === 'fr' ? 'français' : 'anglais';

  const prompt = `Tu es un conseiller aux ventes professionnel et chaleureux chez ${dealership.name}.
Tu dois rédiger une réponse personnalisée à un nouveau lead en ${lang}.

INFORMATIONS DU LEAD :
- Nom : ${lead.first_name || ''} ${lead.last_name || ''}
- Source : ${lead.source || 'Site web'}
- Véhicule d'intérêt : ${lead.vehicle_make || ''} ${lead.vehicle_model || ''} ${lead.vehicle_year || ''}
- Message du client : ${lead.notes || lead.message || 'Aucun message'}
- Type : ${lead.type === 'used' ? 'Véhicule usagé' : 'Véhicule neuf Hyundai'}

RÈGLES IMPORTANTES :
- Réponse chaleureuse, professionnelle, jamais agressive
- Mentionner le véhicule d'intérêt si disponible
- Proposer un rendez-vous ou un appel
- Longueur : 3-5 phrases maximum
- NE PAS inclure de signature formelle, elle sera ajoutée automatiquement

Rédige uniquement le corps du message, sans objet d'email.`;

  const response = await client.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 500,
    messages: [{ role: 'user', content: prompt }]
  });

  return { body: response.content[0].text, language };
}

async function generateWalkoutResponse(lead, advisor, dealership) {
  const language = detectLanguage(lead.notes || '');
  const lang = language === 'fr' ? 'français' : 'anglais';

  const prompt = `Tu es un conseiller aux ventes professionnel et empathique chez ${dealership.name}.
Un client a visité la concession aujourd'hui mais est reparti sans acheter (walkout).
Tu dois rédiger un message de suivi chaleureux en ${lang}.

INFORMATIONS DU CLIENT :
- Nom : ${lead.first_name || ''} ${lead.last_name || ''}
- Véhicule d'intérêt : ${lead.vehicle_make || ''} ${lead.vehicle_model || ''} ${lead.vehicle_year || ''}
- Notes : ${lead.notes || 'Aucune note'}

RÈGLES IMPORTANTES :
- Ton chaleureux et compréhensif, jamais de pression
- Rappeler qu'on est disponible pour répondre aux questions
- Court et respectueux (3-4 phrases maximum)
- NE PAS inclure de signature formelle, elle sera ajoutée automatiquement

Rédige uniquement le corps du message.`;

  const response = await client.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 400,
    messages: [{ role: 'user', content: prompt }]
  });

  return { body: response.content[0].text, language };
}

async function generateFollowupResponse(lead, advisor, dealership, followupDay) {
  const language = detectLanguage(lead.notes || '');
  const lang = language === 'fr' ? 'français' : 'anglais';

  const prompt = `Tu es un conseiller aux ventes chez ${dealership.name}.
Tu fais un suivi auprès d'un client qui n'a pas encore répondu. C'est le suivi jour ${followupDay}.

INFORMATIONS :
- Nom : ${lead.first_name || ''} ${lead.last_name || ''}
- Véhicule d'intérêt : ${lead.vehicle_make || ''} ${lead.vehicle_model || ''} ${lead.vehicle_year || ''}
- Jour de suivi : ${followupDay}

RÈGLES :
- Ton : ${followupDay === 7 ? 'dernier message, respectueux et sans pression' : 'amical et utile'}
- Jamais agressif ou insistant
- 2-3 phrases maximum
- NE PAS inclure de signature

Rédige uniquement le corps du message en ${lang}.`;

  const response = await client.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 300,
    messages: [{ role: 'user', content: prompt }]
  });

  return { body: response.content[0].text, language };
}

module.exports = { detectLanguage, generateLeadResponse, generateWalkoutResponse, generateFollowupResponse };
