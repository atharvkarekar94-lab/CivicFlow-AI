/**
 * Routing Agent
 * Maps identified issue categories to the appropriate municipal department.
 */

const DEPARTMENT_MAP = {
  'Garbage Collection': {
    department: 'Sanitation',
    reasoning: 'Routed to Sanitation Department responsible for solid waste management and urban cleanliness.'
  },
  'Water Supply': {
    department: 'Water Supply',
    reasoning: 'Routed to Water Supply Department handling municipal pipelines, pressure, and potable water distribution.'
  },
  'Road Damage': {
    department: 'Roads & Infrastructure',
    reasoning: 'Routed to Roads & Infrastructure Department governing street repairs, paving, and structural maintenance.'
  },
  'Streetlight Issue': {
    department: 'Street Lighting',
    reasoning: 'Routed to Street Lighting Department managing municipal light poles, fixtures, and night visibility.'
  },
  'Drainage Issue': {
    department: 'Drainage',
    reasoning: 'Routed to Drainage & Sewerage Department handling storm drains, sewage lines, and flood mitigation.'
  },
  'Electrical Issue': {
    department: 'Electrical',
    reasoning: 'Routed to Electrical Department maintaining high voltage lines, transformers, and public power grid safety.'
  },
  'Public Health': {
    department: 'Public Health',
    reasoning: 'Routed to Public Health Department managing disease control, vector prevention, and emergency sanitation.'
  },
  'Unknown': {
    department: 'General Administration',
    reasoning: 'Routed to General Administration for triage, verification, and manual department assignment.'
  }
};

async function routeComplaint(category) {
  const match = DEPARTMENT_MAP[category] || DEPARTMENT_MAP['Unknown'];
  return {
    department: match.department,
    reasoning: match.reasoning
  };
}

module.exports = { routeComplaint, DEPARTMENT_MAP };
