/**
 * Understanding Agent
 * Analyzes citizen input, extracts key contextual metadata, cleans text,
 * and identifies sentiment or potential urgency flags.
 */

async function analyzeComplaint(description) {
  const cleanedText = description ? description.trim() : '';
  const lowerText = cleanedText.toLowerCase();

  // Basic sentiment & urgency detection
  const urgentKeywords = ['danger', 'emergency', 'collapsed', 'burst', 'electric shock', 'hazard', 'severe', 'hospital'];
  const isUrgentFlag = urgentKeywords.some(kw => lowerText.includes(kw));

  const wordCount = cleanedText.split(/\s+/).length;

  return {
    originalText: description,
    cleanedText,
    wordCount,
    isUrgentFlag,
    summary: cleanedText.length > 80 ? cleanedText.substring(0, 77) + '...' : cleanedText,
    processedAt: new Date().toISOString()
  };
}

module.exports = { analyzeComplaint };
