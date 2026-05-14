// Liste des conseillers - rotation identique pour les deux concessions
const ADVISORS = [
  {
    id: 1,
    name: 'Étienne Godin',
    email: 'egodin@hyundaistraymond.ca',
    phone: '+14182084793'
  },
  {
    id: 2,
    name: 'Charles Boivin',
    email: 'charles.boivin@hyundaistraymond.ca',
    phone: '+14189520436'
  },
  {
    id: 3,
    name: 'Mathieu Dumont',
    email: 'mdumont@hyundaistraymond.ca',
    phone: '+15819804489'
  },
  {
    id: 4,
    name: 'Axel Castor',
    email: 'axel.castor@hyundaistraymond.ca',
    phone: '+14189982433'
  },
  {
    id: 5,
    name: 'Nicolas Rivard',
    email: 'nrivard@hyundaistraymond.ca',
    phone: '+14185596602'
  },
  {
    id: 6,
    name: 'Alexandre Ouellette',
    email: 'aouellette@hyundaistraymond.ca',
    phone: '+14189339422'
  }
];

// Index du prochain conseiller (persiste en mémoire, Railway redémarre proprement)
let currentAdvisorIndex = 0;

// Retourne le prochain conseiller dans la rotation
function getNextAdvisor() {
  const advisor = ADVISORS[currentAdvisorIndex];
  currentAdvisorIndex = (currentAdvisorIndex + 1) % ADVISORS.length;
  return advisor;
}

// Retourne un conseiller par son ID
function getAdvisorById(id) {
  return ADVISORS.find(a => a.id === id) || null;
}

module.exports = { ADVISORS, getNextAdvisor, getAdvisorById };
