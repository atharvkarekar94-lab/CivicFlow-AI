/**
 * Priority Agent
 * Evaluates complaint severity based on public safety impact, urgency, and duration.
 */

async function calculatePriority(description, category) {
  const text = description.toLowerCase();

  // CRITICAL Priority indicators
  const criticalKeywords = [
    'no water supply', 'area', 'entire society', 'flooding', 'sparking',
    'live wire', 'collapsed', 'danger', 'hazard', 'epidemic', 'emergency',
    'hospital', 'school entrance', 'transformer explosion', 'toxic'
  ];

  const isCriticalText = criticalKeywords.some(kw => text.includes(kw));
  if (isCriticalText || (category === 'Water Supply' && text.includes('no water')) || (category === 'Electrical Issue' && (text.includes('wire') || text.includes('danger')))) {
    return {
      priority: 'CRITICAL',
      reasoning: 'High public safety hazard or widespread service disruption impacting multiple citizens.'
    };
  }

  // HIGH Priority indicators
  const highKeywords = [
    'three days', 'multiple days', 'week', 'major pothole', 'blocked',
    'overflowing', 'leakage', 'darkness', 'dangerous location', 'stinking'
  ];
  const isHighText = highKeywords.some(kw => text.includes(kw));
  if (isHighText || ['Garbage Collection', 'Water Supply', 'Road Damage', 'Drainage Issue'].includes(category)) {
    return {
      priority: 'HIGH',
      reasoning: 'Significant civic inconvenience or potential escalation risk if left unresolved.'
    };
  }

  // MEDIUM Priority default for specific issues
  if (['Streetlight Issue', 'Electrical Issue', 'Public Health'].includes(category)) {
    return {
      priority: 'MEDIUM',
      reasoning: 'Standard municipal maintenance issue with moderate local impact.'
    };
  }

  // LOW Priority fallback
  return {
    priority: 'LOW',
    reasoning: 'Minor non-urgent request or general inquiry.'
  };
}

module.exports = { calculatePriority };
