// server/complianceTestCases.js
//
// Offline regression fixtures for the compliance layer. These test the
// deterministic parts of the system (intent classifier + banned-phrase
// guard) WITHOUT requiring an AI_PROVIDER API key — they run in CI or
// locally with zero external calls.
//
// A separate, LLM-in-the-loop eval (documented in the deliverable report,
// not runnable offline) is still needed to check that the model's actual
// generated text follows the system prompt — this file only covers the
// code-level guarantees that do not depend on model behavior.

import { INTENTS } from './intentClassifier.js'
import { COMPLIANCE_DISCLAIMER } from './complianceGuard.js'

export const INTENT_TEST_CASES = [
  // --- Compliant / educational — must NOT trigger compliance redirect ---
  { input: 'What is SIP?', expectIntent: INTENTS.DEFINITION, expectTrigger: false },
  { input: 'How does STP work?', expectIntent: INTENTS.DEFINITION, expectTrigger: false },
  { input: 'Difference between SIP and STP?', expectIntent: INTENTS.COMPARISON, expectTrigger: false },
  { input: 'What is NAV?', expectIntent: INTENTS.DEFINITION, expectTrigger: false },
  { input: 'How is XIRR calculated?', expectIntent: INTENTS.CALCULATION, expectTrigger: false },
  { input: 'How are mutual funds taxed?', expectIntent: INTENTS.TAX, expectTrigger: false },
  { input: 'Difference between direct and regular plans?', expectIntent: INTENTS.COMPARISON, expectTrigger: false },
  { input: 'Difference between debt and equity?', expectIntent: INTENTS.COMPARISON, expectTrigger: false },
  { input: 'Difference between small cap and flexi cap?', expectIntent: INTENTS.COMPARISON, expectTrigger: false },
  { input: 'What is market capitalization?', expectIntent: INTENTS.DEFINITION, expectTrigger: false },
  { input: 'Explain CAGR.', expectIntent: INTENTS.DEFINITION, expectTrigger: false },
  { input: 'Explain Sharpe Ratio.', expectIntent: INTENTS.DEFINITION, expectTrigger: false },
  { input: 'Explain standard deviation.', expectIntent: INTENTS.DEFINITION, expectTrigger: false },
  { input: 'What is SEBI\'s role in regulating mutual funds?', expectIntent: INTENTS.REGULATION, expectTrigger: false },
  { input: 'When was SEBI (Mutual Funds) Regulations introduced?', expectIntent: INTENTS.REGULATION, expectTrigger: false },
  { input: 'Hi', expectIntent: INTENTS.GREETING, expectTrigger: false },
  { input: 'Good morning', expectIntent: INTENTS.GREETING, expectTrigger: false },
  { input: 'What is the weather today?', expectIntent: INTENTS.OUT_OF_SCOPE, expectTrigger: false },
  { input: 'Should I get health insurance?', expectIntent: INTENTS.OUT_OF_SCOPE, expectTrigger: false },

  // --- Advice-seeking — MUST trigger the deterministic compliance response ---
  { input: 'Which mutual fund should I buy?', expectIntent: INTENTS.FUND_RECOMMENDATION, expectTrigger: true },
  { input: 'What is the best mutual fund for me?', expectIntent: INTENTS.FUND_RECOMMENDATION, expectTrigger: true },
  { input: 'Best ELSS fund?', expectIntent: INTENTS.FUND_RECOMMENDATION, expectTrigger: true },
  { input: 'Best small cap fund right now?', expectIntent: INTENTS.FUND_RECOMMENDATION, expectTrigger: true },
  { input: 'Top 10 funds to invest in 2026?', expectIntent: INTENTS.FUND_RECOMMENDATION, expectTrigger: true },
  { input: 'Which is better, HDFC Flexicap or SBI Bluechip?', expectIntent: INTENTS.FUND_RECOMMENDATION, expectTrigger: true },
  { input: 'Which one is safe to invest in?', expectIntent: INTENTS.FUND_RECOMMENDATION, expectTrigger: true },
  { input: 'Where should I invest my money?', expectIntent: INTENTS.INVESTMENT_RECOMMENDATION, expectTrigger: true },
  { input: 'Should I invest in equity now?', expectIntent: INTENTS.INVESTMENT_RECOMMENDATION, expectTrigger: true },
  { input: 'How much should I invest every month?', expectIntent: INTENTS.INVESTMENT_RECOMMENDATION, expectTrigger: true },
  { input: 'Suggest a good SIP for retirement.', expectIntent: INTENTS.INVESTMENT_RECOMMENDATION, expectTrigger: true },
  { input: 'Can you recommend an investment for my child\'s education?', expectIntent: INTENTS.INVESTMENT_RECOMMENDATION, expectTrigger: true },
  { input: 'What should my asset allocation be?', expectIntent: INTENTS.INVESTMENT_RECOMMENDATION, expectTrigger: true },
  { input: 'Please review my portfolio.', expectIntent: INTENTS.PORTFOLIO_REVIEW, expectTrigger: true },
  { input: 'Is my portfolio okay? I have 5 mutual funds.', expectIntent: INTENTS.PORTFOLIO_REVIEW, expectTrigger: true },
  { input: 'What is my risk profile?', expectIntent: INTENTS.RISK_PROFILING, expectTrigger: true },
  { input: 'Am I an aggressive investor?', expectIntent: INTENTS.RISK_PROFILING, expectTrigger: true },
  { input: 'What should I do with my money?', expectIntent: INTENTS.INVESTMENT_RECOMMENDATION, expectTrigger: true },
  { input: 'Can you give me some advice?', expectIntent: INTENTS.ADVICE_SEEKING, expectTrigger: true },

  // --- Regression cases from a live production transcript (2026-07-06):
  //     these two phrasings slipped past the original classifier entirely
  //     and only avoided giving advice because Gemini itself declined —
  //     the deterministic layer must catch them independent of model behavior. ---
  { input: 'What are the best funds of 2026', expectIntent: INTENTS.FUND_RECOMMENDATION, expectTrigger: true },
  { input: 'Alright Small Cap 5 funds', expectIntent: INTENTS.FUND_RECOMMENDATION, expectTrigger: true },
  { input: 'Give me 5 good funds', expectIntent: INTENTS.FUND_RECOMMENDATION, expectTrigger: true },
  { input: 'List some large cap funds', expectIntent: INTENTS.FUND_RECOMMENDATION, expectTrigger: true },
  { input: 'Name a few schemes I can consider', expectIntent: INTENTS.FUND_RECOMMENDATION, expectTrigger: true },
  { input: 'Show me top funds in this category', expectIntent: INTENTS.FUND_RECOMMENDATION, expectTrigger: true },
  { input: 'Should I continue holding HDFC Flexicap?', expectIntent: INTENTS.INVESTMENT_RECOMMENDATION, expectTrigger: true },

  // --- Named-fund HISTORICAL performance — allowed through (not a
  //     compliance trigger), since this is backward-looking factual data,
  //     not a recommendation, ranking, or prediction. ---
  { input: 'What was HDFC Flexicap\'s return last year?', expectIntent: INTENTS.FUND_HISTORICAL_DATA, expectTrigger: false },
  { input: 'How did SBI Bluechip perform in 2023?', expectIntent: INTENTS.FUND_HISTORICAL_DATA, expectTrigger: false },
  { input: 'What has been the CAGR of Parag Parikh Flexi Cap since inception?', expectIntent: INTENTS.FUND_HISTORICAL_DATA, expectTrigger: false },
  { input: 'NAV history of Axis Bluechip fund', expectIntent: INTENTS.FUND_HISTORICAL_DATA, expectTrigger: false },

  // --- Same named funds, but with ranking/selection/prediction language —
  //     must STILL be blocked even though they mention "performance" too. ---
  { input: 'Is HDFC Flexicap better than SBI Bluechip based on past performance?', expectIntent: INTENTS.FUND_RECOMMENDATION, expectTrigger: true },
  { input: 'Will Axis Bluechip perform well next year?', expectIntent: INTENTS.FUND_RECOMMENDATION, expectTrigger: true },
  { input: 'Should I invest in HDFC Flexicap given its past returns?', expectIntent: INTENTS.FUND_RECOMMENDATION, expectTrigger: true },

  // --- Edge cases: concept question phrased similarly to advice language,
  //     must NOT falsely trigger ---
  { input: 'What is asset allocation?', expectIntent: INTENTS.DEFINITION, expectTrigger: false },
  { input: 'What factors are generally considered while comparing mutual fund categories?', expectIntent: INTENTS.COMPARISON, expectTrigger: false },
  { input: 'How is risk measured in mutual funds?', expectIntent: INTENTS.DEFINITION, expectTrigger: false },
  { input: 'What does expense ratio mean?', expectIntent: INTENTS.DEFINITION, expectTrigger: false },
  { input: 'What are the categories of debt funds?', expectIntent: INTENTS.DEFINITION, expectTrigger: false },
]

// Tests for the conversation-context escalation rule (shouldEscalateFollowUp
// in complianceGuard.js) — a short, vague follow-up right after a
// compliance-redirect turn should also be escalated, even though the
// classifier alone finds nothing specific in the follow-up message itself.
export const ESCALATION_TEST_CASES = [
  {
    description: 'short vague follow-up right after a compliance-redirect turn — must escalate',
    currentIntent: 'GeneralKnowledge',
    lastUserMessage: 'list them',
    previousMessage: { role: 'assistant', content: `${COMPLIANCE_DISCLAIMER}\n\nSome hint text.` },
    expectEscalate: true,
  },
  {
    description: 'follow-up after a NORMAL (non-compliance) reply — must NOT escalate',
    currentIntent: 'GeneralKnowledge',
    lastUserMessage: 'list them',
    previousMessage: { role: 'assistant', content: 'NAV is the true worth of one unit of a mutual fund scheme...' },
    expectEscalate: false,
  },
  {
    description: 'classifier already found something specific — must NOT escalate (no need to)',
    currentIntent: 'Definition',
    lastUserMessage: 'What is NAV?',
    previousMessage: { role: 'assistant', content: COMPLIANCE_DISCLAIMER },
    expectEscalate: false,
  },
  {
    description: 'long follow-up after compliance-redirect — must NOT escalate (long enough to be a real new question)',
    currentIntent: 'GeneralKnowledge',
    lastUserMessage: 'okay separately can you walk me through how expense ratio is calculated and disclosed by AMCs',
    previousMessage: { role: 'assistant', content: COMPLIANCE_DISCLAIMER },
    expectEscalate: false,
  },
]

// Text snippets a model might plausibly generate — used to test the
// post-response banned-phrase guard independent of the classifier.
export const BANNED_PHRASE_TEST_CASES = [
  { text: 'I recommend investing in a large cap fund for stability.', expectSafe: false },
  { text: 'You should buy this fund because it has a strong track record.', expectSafe: false },
  { text: 'This fund is the best option for your goals.', expectSafe: false },
  { text: 'This scheme will outperform its peers next year.', expectSafe: false },
  { text: 'My recommendation would be to switch to equity now.', expectSafe: false },
  { text: 'Guaranteed returns of 15% are possible with this scheme.', expectSafe: false },
  { text: 'A mutual fund pools money from investors and is managed by an AMC.', expectSafe: true },
  { text: 'SIP allows you to invest a fixed amount at regular intervals.', expectSafe: true },
  { text: 'Equity funds are generally considered higher risk than debt funds over short horizons.', expectSafe: true },
  { text: 'Expense ratio is the annual fee charged by the fund house, deducted from NAV daily.', expectSafe: true },
]
