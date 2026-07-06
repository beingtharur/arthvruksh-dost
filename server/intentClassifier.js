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
  // A named fund/AMC + backward-looking performance language ("what was
  // HDFC Flexicap's return last year"), with NO ranking, selection, hold/
  // sell, or prediction language present. Allowed through to the AI
  // normally (not a compliance trigger) — but the system prompt requires a
  // "past performance is not indicative of future returns" caveat and
  // forbids treating the historical figure as a reason to act.
  FUND_HISTORICAL_DATA: 'FundHistoricalData',
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

// A question about fund CATEGORIES/TYPES (e.g. "types of debt funds",
// "categories of equity funds") is unambiguously educational — SEBI's own
// classification scheme is exactly what src/data/faqData.js's equity-funds/
// debt-funds/hybrid-funds FAQs cover. Checked FIRST, before any recommendation
// pattern, so it can never be shadowed by an incidental "best"/"good"/digit
// elsewhere in the same sentence. Requires "of" right after the type/category
// word specifically so "top funds in this category" (a real pick request
// referencing a category conversationally) does NOT get swept in here —
// only the canonical "types of X" / "categories of X" phrasing does.
const CATEGORY_QUESTION_RE = /\b(types?|categor(?:y|ies)|kinds?|classes?)\s+of\b.{0,30}\bfunds?\b/i

// EXPLICIT recommendation/selection intent only. Per product direction:
// ArthVruksh Dost should NOT restrict general ranking/listing questions
// ("best funds", "top 10 funds", "give me 5 good funds", "list some large
// cap funds") — those now flow through to Gemini normally, same as any other
// educational question, guided by the system prompt to stay factual and
// never push a specific scheme. The compliance branch is reserved for
// messages that clearly ask the system itself to pick/choose/recommend.
const FUND_RECOMMENDATION_RE = [
  // "which fund/scheme/amc/sip should/shall/do I buy/choose/pick/invest/go with"
  /\bwhich\s+(mutual\s+fund|fund|scheme|amc|sip)\b.{0,20}\b(should|shall|do|can)\s+i\s+(buy|choose|pick|invest|go\s+with|select|opt\s+for)\b/i,
  /\bwhich\s+(one|fund|scheme)\b.{0,20}\b(should|shall)\s+i\s+(choose|pick|buy|go\s+with|select)\b/i,
  // Explicit "recommend/suggest ... a fund/scheme/amc/stock/etf" — the exact
  // words the product brief calls out.
  /\b(recommend|suggest)\s+(me\s+)?(a|an|some)?\s*(good\s+)?(fund|scheme|amc|stock|etf)\b/i,
]

// Two or more SPECIFIC, NAMED funds/AMCs + comparison-for-selection language
// ("X vs Y, which is better") — this is a direct "help me choose between
// these two real products" ask, functionally a recommendation request even
// without the literal word "recommend". Kept restricted; distinct from
// asking about fund CATEGORIES or a single named fund's historical data.
function mentionsMultipleAmcNames(text) {
  return AMC_NAMES.filter((name) => text.includes(name)).length >= 2
}
const TWO_FUND_SELECTION_RE = /\b(better|best|vs\.?|versus|which\s+is|which\s+one|compare)\b/i

const PORTFOLIO_REVIEW_RE = [
  /\breview\s+my\s+(portfolio|investments?|funds?)\b/i,
  /\b(check|analyze|analyse|evaluate)\s+my\s+(portfolio|investments?|funds?)\b/i,
  /\bis\s+my\s+portfolio\s+(good|fine|ok|okay|balanced)\b/i,
  /\bmy\s+portfolio\s+(has|contains|consists)\b/i,
  /\bhow\s+is\s+my\s+(portfolio|investment)\b/i,
]

const INVESTMENT_RECOMMENDATION_RE = [
  /\bwhere\s+should\s+i\s+invest\b/i,
  /\bshould\s+i\s+(invest|buy|sell|switch|redeem|exit|hold|continue)\b/i,
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

// Generic EXPLICIT advice-seeking language. Deliberately does NOT include a
// bare "which is better" anymore — that alone also matches plain concept
// comparisons the system prompt explicitly allows ("which is better, SIP or
// lump sum?"). Named-fund "which is better" is still caught by
// TWO_FUND_SELECTION_RE above; this stays narrow to the literal explicit words.
const ADVICE_SEEKING_RE = [
  /\b(suggest|recommend|advice|advise)\b/i,
  /\bwhat\s+should\s+i\s+do\b/i,
  /\bguide\s+me\b/i,
]

// Forward-looking / predictive language — checked WITH a named AMC before
// the historical-performance allowance below, so "will Axis Bluechip
// perform well next year" is blocked as a prediction, not waved through as
// history just because it also contains the word "perform".
const PREDICTION_RE = [
  /\bwill\b.{0,40}\b(perform|outperform|beat|grow|do\s+well|give\s+(good|high)\s+returns?)\b/i,
  /\b(next\s+year|in\s+future|going\s+forward|going\s+ahead)\b.{0,40}\b(perform|outperform|beat|grow|returns?)\b/i,
  /\b(perform|outperform|beat|grow|returns?)\b.{0,40}\b(next\s+year|in\s+future|going\s+forward)\b/i,
]

// Backward-looking performance language about a named fund — "what was the
// return", "how did it perform", "NAV history", "since inception", a bare
// year like "in 2023". Deliberately does NOT include forward-looking words
// (will, next year, future, expect) — those stay in FUND_RECOMMENDATION /
// INVESTMENT_RECOMMENDATION territory via the checks that run before this one.
const HISTORICAL_PERFORMANCE_RE = /\b(returns?|perform\w*|nav|cagr|xirr|track\s+record|history|historical|since\s+inception|last\s+\d+\s+years?|past\s+\d+\s+years?|in\s+20\d{2})\b/i

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

  // Category/type questions are unambiguously educational — check this
  // BEFORE any compliance-trigger pattern so a coincidental "best"/"good"/
  // digit elsewhere in the same sentence can never shadow it. E.g. "What are
  // the best types of funds for tax saving?" should still explain that ELSS
  // is the relevant category, not get blocked because of the word "best".
  if (CATEGORY_QUESTION_RE.test(text)) {
    return { intent: INTENTS.DEFINITION, isComplianceTrigger: false, matched: 'category_question' }
  }

  // Highest-risk / most specific intents are checked first so a message
  // matching multiple patterns is routed to the most restrictive bucket.
  for (const re of FUND_RECOMMENDATION_RE) {
    if (re.test(text)) {
      return { intent: INTENTS.FUND_RECOMMENDATION, isComplianceTrigger: true, matched: re.source }
    }
  }

  // Two+ named funds/AMCs + comparison-for-selection language — "help me
  // choose between these two real products" (see TWO_FUND_SELECTION_RE above).
  if (mentionsMultipleAmcNames(text) && TWO_FUND_SELECTION_RE.test(text)) {
    return { intent: INTENTS.FUND_RECOMMENDATION, isComplianceTrigger: true, matched: 'two_named_funds+selection_language' }
  }

  // A SINGLE named fund/AMC + an explicit buy/invest/switch/recommend/suggest
  // action verb — narrower than before: a lone named fund with just "good"
  // or "better" (no explicit action verb) no longer blocks by itself, since
  // that alone isn't an explicit ask for a recommendation.
  if (containsAmcName(text) && /\b(buy|invest|switch|recommend|suggest)\b/i.test(text)) {
    return { intent: INTENTS.FUND_RECOMMENDATION, isComplianceTrigger: true, matched: 'amc_name+explicit_action_language' }
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

  if (containsAmcName(text) && PREDICTION_RE.some((re) => re.test(text))) {
    return { intent: INTENTS.FUND_RECOMMENDATION, isComplianceTrigger: true, matched: 'amc_name+prediction_language' }
  }

  // A named fund/AMC + backward-looking performance language, with NONE of
  // the recommendation/ranking/selection/hold-sell/prediction signals above
  // present (all of those were already checked and would have returned
  // first). This is the one deliberate "compliance trigger = false" path
  // that still names a specific fund — allowed through so users can look up
  // factual historical performance, not just abstract concepts.
  if (containsAmcName(text) && HISTORICAL_PERFORMANCE_RE.test(text)) {
    return { intent: INTENTS.FUND_HISTORICAL_DATA, isComplianceTrigger: false, matched: 'amc_name+historical_performance' }
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
