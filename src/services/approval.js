const { ADVISORS } = require('../config/advisors');
const { getDealershipBySource } = require('../config/dealerships');
const { sendApprovalEmail } = require('./email');
const { sendAdvisorSMS } = require('./sms');

const pendingApprovals = new Map();
let currentAdvisorIndex = 0;

function generateToken() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function getNextAdvisor() {
  const advisor = ADVISORS[currentAdvisorIndex];
  currentAdvisorIndex = (currentAdvisorIndex + 1) % ADVISORS.length;
  return advisor;
}

async function startApprovalProcess(lead, generatedMessage, leadType = 'new_lead') {
  const dealership = getDealershipBySource(lead.source);
  const advisor = getNextAdvisor();
  const token = generateToken();
  const advisorIndex = ADVISORS.indexOf(advisor);

  console.log(`🔄 Lead assigné à ${advisor.name} (token: ${token})`);

  pendingApprovals.set(token, {
    lead,
    advisor,
    dealership,
    message: generatedMessage,
    leadType,
    createdAt: Date.now(),
    advisorIndex,
    originalAdvisorIndex: advisorIndex,
    approved: false,
    timer: null
  });

  await sendApprovalEmail({ advisor, lead, dealership, generatedMessage, approvalToken: token, leadType });
  await sendAdvisorSMS(advisor, lead, dealership, token);

  const timer = setTimeout(() => escalateToNextAdvisor(token), 5 * 60 * 1000);
  pendingApprovals.get(token).timer = timer;

  return token;
}

async function escalateToNextAdvisor(token) {
  const pending = pendingApprovals.get(token);
  if (!pending || pending.approved) return;

  const nextIndex = (pending.advisorIndex + 1) % ADVISORS.length;

  if (nextIndex === pending.originalAdvisorIndex) {
    console.log(`⚠️ Aucun conseiller n'a répondu pour le token ${token}`);
    pendingApprovals.delete(token);
    return;
  }

  const nextAdvisor = ADVISORS[nextIndex];
  console.log(`⏰ Timeout — escalade vers ${nextAdvisor.name}`);

  pending.advisor = nextAdvisor;
  pending.advisorIndex = nextIndex;

  await sendApprovalEmail({ advisor: nextAdvisor, lead: pending.lead, dealership: pending.dealership, generatedMessage: pending.message, approvalToken: token, leadType: pending.leadType });
  await sendAdvisorSMS(nextAdvisor, pending.lead, pending.dealership, token);

  const timer = setTimeout(() => escalateToNextAdvisor(token), 5 * 60 * 1000);
  pending.timer = timer;
}

function approveAndGet(token) {
  const pending = pendingApprovals.get(token);
  if (!pending || pending.approved) return null;
  if (pending.timer) clearTimeout(pending.timer);
  pending.approved = true;
  pendingApprovals.delete(token);
  return pending;
}

function updateMessage(token, newMessage) {
  const pending = pendingApprovals.get(token);
  if (!pending) return false;
  pending.message = newMessage;
  return true;
}

function getPending(token) {
  return pendingApprovals.get(token) || null;
}

module.exports = { startApprovalProcess, approveAndGet, updateMessage, getPending };
