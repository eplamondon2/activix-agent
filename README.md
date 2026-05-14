# Agent IA — Hyundai St-Raymond & Auto Fiset

Agent automatisé de suivi de leads et walkouts connecté à Activix CRM.

## Fonctionnalités
- Réception des webhooks Activix (nouveaux leads, walkouts, changements de statut)
- Génération automatique de réponses personnalisées par Claude IA
- Détection automatique de la langue (français/anglais)
- Multi-concession : Hyundai St-Raymond & Auto Fiset
- Rotation automatique des conseillers (round robin, 5 min par conseiller)
- Approbation en 1 clic par email ou modification du message
- Envoi email + SMS via Twilio

## Installation

### 1. Cloner et installer
```bash
git clone https://github.com/votre-repo/activix-agent
cd activix-agent
npm install
```

### 2. Variables d'environnement
Copier `.env.example` vers `.env` et remplir les valeurs :
```bash
cp .env.example .env
```

Variables requises :
- `ANTHROPIC_API_KEY` — Clé API Anthropic (console.anthropic.com)
- `TWILIO_ACCOUNT_SID` — Depuis votre dashboard Twilio
- `TWILIO_AUTH_TOKEN` — Depuis votre dashboard Twilio
- `TWILIO_PHONE_NUMBER` — +13433372234
- `SMTP_HOST` / `SMTP_USER` / `SMTP_PASS` — Config email autofiset.com
- `BASE_URL` — URL Railway de votre app
- `WEBHOOK_SECRET` — Token secret partagé avec Activix

### 3. Déployer sur Railway
```bash
git add .
git commit -m "Initial deploy"
git push origin main
```
Railway détecte automatiquement et déploie.

### 4. Configurer le webhook dans Activix
URL à donner à votre gestionnaire Activix :
```
https://votre-app.railway.app/webhook/activix
```
Avec le header : `x-webhook-token: votre_secret`

## Structure
```
src/
├── index.js              # Serveur Express + routes
├── config/
│   ├── advisors.js       # Liste des 6 conseillers
│   └── dealerships.js    # Config Hyundai & Auto Fiset
└── services/
    ├── agent.js          # Génération IA (Claude)
    ├── approval.js       # Rotation + approbation
    ├── email.js          # Envoi emails
    ├── sms.js            # Envoi SMS Twilio
    └── webhook.js        # Traitement webhooks Activix
```

## Routes
- `POST /webhook/activix` — Reçoit les événements Activix
- `GET /approve/:token` — Conseiller approuve la réponse
- `GET /edit/:token` — Conseiller modifie la réponse
- `POST /edit/:token` — Soumet la réponse modifiée
- `GET /health` — Vérification du service
