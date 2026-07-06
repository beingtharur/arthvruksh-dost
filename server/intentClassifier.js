// server/intentClassifier.js
//
// Deterministic intent classification for ArthVruksh Dost.
//
// WHY THIS EXISTS:
// Before this module, the ONLY thing standing between a user and an advice-like
// reply was a natural-language system prompt telling the LLM "don't recommend
// funds." That is probabilistic enforcement — the model can misunderstand,
// be jailbroken, or simply drift. This classifier runs BEFORE the LLM is ever
// called, on the server, so that compliance-triggering intents can be
// intercepted with a deterministic, code-guaranteed response rather than
// hoping the model refuses correctly every time.
//
// This is intentionally keyword/pattern-based (no embeddings, no ML model,
// no external classifier API) to match the project's existing scale and
// stay dependency-free — consistent with how src/data/faqData.js already
// does keyword-based FAQ matching on the frontend. If the false-positive/
// false-negative rate becomes a problem in production, this is the file to
// replace with an embeddings-based or LLM-based classifier — the interface
// (classifyIntent(text) -> {intent, isComplianceTrigger, ...}) is designed
// to make that swap isolated to this one file.

export const INTENTS = Object.freeze({
  GREETING: 'Greeting',
  OUT_OF_SCOPE: 'OutOfScope',
  ADVICE_SEEKING: 'AdviceSeeking',
  FUND_RECOMMENDATION: 'FundRecommendation',
  PORTFOLIO_REVIEW: 'PortfolioReview',
  INVESTMENT_RECOMMENDATION: 'InvestmentRecommendation',
  RISK_PROFILING: 'RiskProfiling',
  DEFINITION: 'Definition',
  COMPARISON: 'Comparison',
  CALCULATION: 'Calculation',
  TAX: 'Tax',
  REGULATION: 'Regulation',
  HISTORICAL: 'Historical',
  GENERAL_KNOWLEDGE: 'GeneralKnowledge',
  EDUCATIONAL: 'Educational', // fallback bucket for in-scope content that doesn't fit a more specific bucket
})

// Intents that MUST trigger the deterministic compliance response
// (see complianceGuard.js) instead of being answered freely.
export const COMPLIANCE_TRIGGER_INTENTS = new Set([
  INTENTS.ADVICE_SEEKING,
  INTENTS.FUND_RECOMMENDATION,
  INTENTS.PORTFOLIO_REVIEW,
  INTENTS.INVESTMENT_RECOMMENDATION,
  INTENTS.RISK_PROFILING,
])

// A non-exhaustive but broad list of AMC/fund-house names in India. Presence
// of one of these alongside comparison/selection language is a strong signal
// of "which specific fund should I pick" rather than a generic concept
// question, even if the message doesn't contain an obvious keyword like
// "best".
const AMC_NAMES = [
  'hdfc', 'sbi', 'icici', 'axis', 'nippon', 'uti', 'kotak', 'franklin',
  'dsp', 'motilal oswal', 'parag parikh', 'ppfas', 'quant', 'mirae',
  'tata', 'aditya birla', 'birla sun life', 'canara robeco', 'pgim',
  'edelweiss', 'bandhan', 'idfc', 'invesco', 'sundaram', 'lic mf',
  'baroda bnp', 'union mf', 'iti mf', 'groww', 'navi', 'trust mf',
  'whiteoak', 'bajaj finserv', 'zerodha', 'samco', 'helios', 'shriram',
  'jm financial', 'taurus', '360 one',
]

function containsAmcName(q) {
  return AMC_NAMES.some((name) => q.includes(name))
}

// --- Pattern groups -------------------------------------------------------

const GREETING_RE = /^\s*(hi|hello|hey|namaste|good\s?morning|good\s?afternoon|good\s?evening|yo|hola)[\s!.,]*$/i

const OUT_OF_SCOPE_RE = [
  /\b(health\s?insurance|life\s?insurance|term\s?insurance|car\s?insurance)\b/i,
  /\b(real\s?estate|property|home\s?loan|personal\s?loan|car\s?loan)\b/i,
  /\b(crypto|bitcoin|ethereum|nft)\b/i,
  /\b(credit\s?card|emi\s+on\s+card)\b/i,
  /\b(weather|movie|recipe|cricket\s+score|sports\s+score)\b/i,
]

// Explicit selection / ranking / prediction language — the strongest,
// least ambiguous advice-seeking signals.
const FUND_RECOMMENDATION_RE = [
  /\bbest\s+(mutual\s?fund|elss|small\s?cap|mid\s?cap|large\s?cap|flexi\s?cap|multi\s?cap|index\s?fund|debt\s?fund|hybrid\s?fund|liquid\s?fund|scheme|amc)\b/i,
  /\btop\s*\d*\s*(funds?|schemes?|amcs?)\b/i,
  /\bwhich\s+(mutual\s+fund|fund|scheme|amc|sip)\b/i,
  /\bhighest\s+(return|cagr|growth)\b/i,
  /\bbest\s+perform(ing|ance)\b/i,
  /\bwhich\s+one\s+is\s+(safe|better|good)\b/i,
  /\b(rate|rank)\s+(this|these|the)?\s*fund/i,
  /\bwill\s+(this|it)\s+(fund|scheme)\s+(outperform|beat|do\s+well)\b/i,
  /\bis\s+[\w\s]{2,40}\s+fund\s+good\b/i,
]

const PORTFOLIO_REVIEW_RE = [
  /\breview\s+my\s+(portfolio|investments?|funds?)\b/i,
  /\b(check|analyze|analyse|evaluate)\s+my\s+(portfolio|investments?|funds?)\b/i,
  /\bis\s+my\s+portfolio\s+(good|fine|ok|okay|balanced)\b/i,
  /\bmy\s+portfolio\s+(has|contains|consists)\b/i,
  /\bhow\s+is\s+my\s+(portfolio|investment)\b/i,
]

const INVESTMENT_RECOMMENDATION_RE = [
  /\bwhere\s+should\s+i\s+invest\b/i,
  /\bshould\s+i\s+(invest|buy|sell|switch|redeem|exit)\b/i,
  /\bhow\s+much\s+should\s+i\s+invest\b/i,
  /\bwhich\s+sip\s+amount\b/i,
  /\bwhat\s+should\s+i\s+do\s+(with|about)\s+my\b/i,
  /\bsuggest\s+(a|an)?\s*(good\s+)?(fund|scheme|sip|investment|portfolio|allocation)\b/i,
  /\brecommend\s+(a|an)?\s*(good\s+)?(fund|scheme|sip|investment|portfolio|allocation|stock|etf)\b/i,
  /\bwhat\s+should\s+my\s+asset\s+allocation\s+be\b/i,
  /\btax[\s-]saving\s+investment\s+for\s+me\b/i,
  /\bretirement\s+investment\s+for\s+me\b/i,
  /\bwhen\s+should\s+i\s+(buy|sell|exit|redeem)\b/i, // market-timing requests
]

const RISK_PROFILING_RE = [
  /\bwhat('?s|\s+is)\s+my\s+risk\s+profile\b/i,
  /\bam\s+i\s+(an?\s+)?(aggressive|conservative|moderate)\s+investor\b/i,
  /\bhow\s+much\s+risk\s+should\s+i\s+take\b/i,
  /\bassess\s+my\s+risk\b/i,
  /\brisk\s+assessment\s+for\s+me\b/i,
]

// Generic advice-seeking language that doesn't fit a more specific bucket
// above (catch-all per the user's supplied keyword list).
const ADVICE_SEEKING_RE = [
  /\b(suggest|recommend|advice|advise)\b/i,
  /\bwhich\s+is\s+better\b/i,
  /\bwhat\s+should\s+i\s+do\b/i,
  /\bguide\s+me\b/i,
]

const COMPARISON_RE = /\b(difference between|compare|comparing|comparison|vs\.?|versus)\b/i
const CALCULATION_RE = /\b(calculate|calculation|calculated|formula)\b/i
const TAX_RE = /\btax(es|ed|ation|able)?\b|\bltcg\b|\bstcg\b|\b80c\b|\btds\b|\bidcw\b|\bcapital\s+gains?\b|\bindexation\b/i
const REGULATION_RE = /\b(sebi|amfi|nism|rbi|regulation|circular|kyc|regulator|compliance)\b/i
const HISTORICAL_RE = /\b(history|since when|when was|introduced in|originated|evolution of)\b/i
const DEFINITION_RE = /\b(what is|what are|define|meaning of|explain|what does|how is|how are|how does|how do)\b/i

// --- Classifier -------------------------------------------------------------

/**
 * Classify a single user message into one compliance/education intent.
 * @param {string} rawText
 * @returns {{intent: string, isComplianceTrigger: boolean, matched: string|null}}
 */
export function classifyIntent(rawText) {
  const text = (rawText || '').toLowerCase().trim()

  if (!text) {
    return { intent: INTENTS.GENERAL_KNOWLEDGE, isComplianceTrigger: false, matched: 'empty' }
  }

  if (GREETING_RE.test(text)) {
    return { intent: INTENTS.GREETING, isComplianceTrigger: false, matched: 'greeting' }
  }

  for (const re of OUT_OF_SCOPE_RE) {
    if (re.test(text)) {
      return { intent: INTENTS.OUT_OF_SCOPE, isComplianceTrigger: false, matched: re.source }
    }
  }

  // Highest-risk / most specific intents are checked first so a message
  // matching multiple patterns is routed to the most restrictive bucket.
  for (const re of FUND_RECOMMENDATION_RE) {
    if (re.test(text)) {
      return { intent: INTENTS.FUND_RECOMMENDATION, isComplianceTrigger: true, matched: re.source }
    }
  }

  if (containsAmcName(text) && /\b(buy|invest|switch|better|good|recommend|suggest)\b/i.test(text)) {
    return { intent: INTENTS.FUND_RECOMMENDATION, isComplianceTrigger: true, matched: 'amc_name+selection_language' }
  }

  for (const re of PORTFOLIO_REVIEW_RE) {
    if (re.test(text)) {
      return { intent: INTENTS.PORTFOLIO_REVIEW, isComplianceTrigger: true, matched: re.source }
    }
  }

  for (const re of RISK_PROFILING_RE) {
    if (re.test(text)) {
      return { intent: INTENTS.RISK_PROFILING, isComplianceTrigger: true, matched: re.source }
    }
  }

  for (const re of INVESTMENT_RECOMMENDATION_RE) {
    if (re.test(text)) {
      return { intent: INTENTS.INVESTMENT_RECOMMENDATION, isComplianceTrigger: true, matched: re.source }
    }
  }

  for (const re of ADVICE_SEEKING_RE) {
    if (re.test(text)) {
      return { intent: INTENTS.ADVICE_SEEKING, isComplianceTrigger: true, matched: re.source }
    }
  }

  // From here on, nothing compliance-triggering was found — classify the
  // educational sub-type for logging/analytics/prompt-tuning purposes.
  // NOTE: "compare" language for CONCEPTS (e.g. "difference between SIP and
  // STP") is intentionally allowed through as Comparison; comparison
  // language combined with fund/AMC names was already caught above.
  if (TAX_RE.test(text)) {
    return { intent: INTENTS.TAX, isComplianceTrigger: false, matched: 'tax' }
  }
  if (REGULATION_RE.test(text)) {
    return { intent: INTENTS.REGULATION, isComplianceTrigger: false, matched: 'regulation' }
  }
  if (HISTORICAL_RE.test(text)) {
    return { intent: INTENTS.HISTORICAL, isComplianceTrigger: false, matched: 'historical' }
  }
  if (CALCULATION_RE.test(text)) {
    return { intent: INTENTS.CALCULATION, isComplianceTrigger: false, matched: 'calculation' }
  }
  if (COMPARISON_RE.test(text)) {
    return { intent: INTENTS.COMPARISON, isComplianceTrigger: false, matched: 'comparison' }
  }
  if (DEFINITION_RE.test(text)) {
    return { intent: INTENTS.DEFINITION, isComplianceTrigger: false, matched: 'definition' }
  }

  return { intent: INTENTS.GENERAL_KNOWLEDGE, isComplianceTrigger: false, matched: null }
}
