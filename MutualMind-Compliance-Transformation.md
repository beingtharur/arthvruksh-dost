# MutualMind → Educational Financial Knowledge Assistant
## Compliance Transformation: Architecture, Code Changes & Release Checklist

Repo: `arthvruksh-dost` · Prepared: 2026-07-06
Base document: `MutualMind-Engineering-Deep-Dive.md` (full repo audit, same session)
Status: **Code changes below are already implemented and committed to the working tree**, not just proposed. Every claim in this document was verified either by reading the modified files directly or by running the included offline test suite (53/53 passing, zero API key required — see Section 9).

---

## 0. What changed, in one paragraph

The prior audit found that MutualMind's entire compliance posture — "never recommend a fund, always redirect advice-seeking questions" — lived in one natural-language system-prompt string with no code-level enforcement. That is now fixed. Two new backend modules (`server/intentClassifier.js`, `server/complianceGuard.js`) sit in front of and around every LLM call. Advice-seeking messages are now detected deterministically, in code, before the LLM is ever invoked, and every LLM reply — regardless of intent — is scanned afterward for advice-like language before it reaches the user. The system prompt was rewritten around the specific 10-part educational structure and authoritative-source hierarchy requested. The frontend now visibly labels compliance-redirected and out-of-scope replies. A 53-case offline regression suite locks in the classifier and guard's behavior.

---

## 1. Repository Improvement Plan

| # | Change | File(s) | Status |
|---|---|---|---|
| 1 | Add deterministic intent classifier (15 categories) | `server/intentClassifier.js` (new) | Done |
| 2 | Add compliance guardrail: fixed disclaimer text + post-response banned-phrase scanner | `server/complianceGuard.js` (new) | Done |
| 3 | Rewrite system prompt around 10-part structure, source hierarchy, absolute-prohibition list | `server/index.js` | Done |
| 4 | Integrate classifier + guard into the request pipeline; add basic request validation (was previously the top security finding) | `server/index.js` | Done |
| 5 | Add offline compliance regression suite (no API key needed) | `server/complianceTestCases.js`, `server/runComplianceTests.js` (new) | Done — 53/53 passing |
| 6 | Add "Educational only" / "Out of scope" / "Rephrased for compliance" badges so users can see when a guardrail fired | `src/components/ChatMessage.jsx` | Done |
| 7 | Rewrite welcome message, clear-chat message, sidebar disclaimer, and input-bar disclaimer around the educator framing (not "assistant"/"guide") | `src/hooks/useChat.js`, `src/components/Layout.jsx`, `src/components/ChatInput.jsx` | Done |
| 8 | *(Not done in this pass — flagged for follow-up)* Reconcile `README.md`'s stale "FAQ-first" description with actual behavior | `README.md` | **Outstanding** — see Section 12 |
| 9 | *(Not done in this pass — flagged for follow-up)* De-duplicate `LearnPage.jsx` / `faqData.js` content so a future tax-rule correction only needs one edit | `src/pages/LearnPage.jsx`, `src/data/faqData.js` | **Outstanding** — see Section 12 |
| 10 | *(Not done in this pass — flagged for follow-up)* Live, LLM-in-the-loop eval (the offline suite only tests the deterministic layer, not what the model actually says) | new: `server/evals/` | **Outstanding** — see Section 12 |

Items 8–10 are intentionally out of scope for *this* pass (they're pre-existing quality debt unrelated to the compliance transformation, already logged in the prior audit's roadmap) and are re-flagged here so they aren't lost.

---

## 2. Compliance Architecture

```
User message
     │
     ▼
┌─────────────────────────────────────────────────────────────┐
│  server/index.js  POST /api/chat                             │
│                                                                │
│  1. Request hygiene: reject >20 history messages,             │
│     reject any message content >4000 chars or non-string      │
│     (NEW — previously zero validation existed here)           │
│                                                                │
│  2. classifyIntent(lastUserMessage)  ──▶  intentClassifier.js  │
│     returns one of 15 intents + isComplianceTrigger boolean    │
│                                                                │
│  3a. intent === OutOfScope?                                    │
│      └─▶ return OUT_OF_SCOPE_MESSAGE directly. NO LLM CALL.    │
│                                                                │
│  3b. isComplianceTrigger === true?                             │
│      (AdviceSeeking / FundRecommendation / PortfolioReview /   │
│       InvestmentRecommendation / RiskProfiling)                │
│      └─▶ buildComplianceResponse(intent)  — FIXED TEXT,        │
│           never LLM-authored, from complianceGuard.js          │
│      └─▶ THEN best-effort call the LLM for an                  │
│           "educational sub-answer only" add-on, itself         │
│           still passed through scanForBannedLanguage()         │
│      └─▶ return disclaimer + (safe add-on | nothing)           │
│                                                                │
│  3c. Otherwise (genuine educational intent)                    │
│      └─▶ call Groq/Gemini with rewritten SYSTEM_PROMPT          │
│      └─▶ scanForBannedLanguage(reply)  — defense in depth,      │
│           runs even though the classifier said this was safe   │
│      └─▶ if unsafe: return GUARD_TRIGGERED_FALLBACK instead,    │
│           log a compliance warning server-side                 │
│      └─▶ if safe: return reply as normal                        │
└─────────────────────────────────────────────────────────────┘
     │
     ▼
Frontend renders reply + a source badge that now distinguishes:
faq / best (NISM+AI) / groq / gemini / compliance-redirect /
compliance-guard / out-of-scope / error
```

**Key architectural principle:** compliance enforcement no longer has a single point of failure. There are now three independent layers, and a message must pass all of them to reach the user unfiltered:
1. **Pre-call classification** (deterministic, code) — intercepts known advice-seeking phrasing before the LLM sees it.
2. **System prompt** (probabilistic, model-dependent) — shapes what the model says on genuinely educational questions, and shapes the "educational add-on" the model is asked to produce even on a compliance-triggered turn.
3. **Post-call guard** (deterministic, code) — scans literally every reply, whether or not the classifier flagged the turn, and substitutes a fixed fallback if banned language slipped through.

Losing any one layer (e.g., the model ignoring its system prompt) does not remove the other two.

---

## 3. Prompt Improvements (Before / After)

**Before** (original `server/index.js`, from the audited baseline):
> "You are MutualMind, a mutual fund EDUCATOR for Indian investors... NEVER recommend specific mutual funds, AMCs, schemes, or stocks by name... For ANY recommendation, suitability, 'should I', 'what's best for me', or product-selection question, respond with this redirect..."

This was already reasonably well-written, but it was the *only* mechanism — the redirect text itself was generated by the model each time (worded "in your own words," per the old prompt), meaning the exact disclaimer a user saw could vary turn to turn, and there was no guarantee the model would recognize every advice-seeking phrasing.

**After** (current `server/index.js`):
- Adds an explicit **authoritative source hierarchy** (NISM → SEBI → AMFI → RBI → Income Tax Dept → general knowledge, with an explicit "never fabricate a regulation, section number, circular, or figure" instruction, and an explicit instruction to say "I'm not certain" rather than invent a number).
- Adds an **ABSOLUTE PROHIBITIONS** section enumerating each banned behavior from the compliance brief verbatim (recommend fund/stock/ETF, recommend SIP amount/allocation/portfolio, recommend switching/buying/selling/timing, recommend tax-saving/retirement products "for someone's specific situation," predict returns, rank/rate funds, and the exact banned phrases "I suggest...", "I recommend...", etc.).
- Adds the **10-part answer structure** (Definition → Why it exists → How it works → Example → Advantages → Limitations → Risks → Common misconceptions → Related concepts → References) as the model's default shape for substantive answers.
- Explicitly tells the model **not to repeat the compliance disclaimer itself** on compliance-triggered turns, since the fixed disclaimer is now shown by the application, not generated by the model — this removes the previous single-source-of-truth problem where the redirect text's exact wording depended on the model each time.
- The redirect **URL and core disclaimer sentence are no longer inside the prompt at all** — they moved into `complianceGuard.js` as literal, testable JS constants (`COMPLIANCE_DISCLAIMER`, `ADVISOR_REDIRECT_URL`), so they can be unit-tested and are guaranteed identical every time, in every locale, regardless of model behavior.

Full current prompt text is in `server/index.js` (`SYSTEM_PROMPT` constant) — reproduced in Section 7 below for convenience.

---

## 4. Intent Classification Improvements

`server/intentClassifier.js` implements exactly the 15 categories requested, as a single exported enum (`INTENTS`) plus a `classifyIntent(text)` function:

| Intent | Compliance trigger? | Example that routes here |
|---|---|---|
| `Greeting` | No | "Hi", "Good morning" |
| `OutOfScope` | No (routed to fixed redirect, not the compliance disclaimer) | "Should I get health insurance?", "What's the weather?" |
| `Definition` | No | "What is SIP?", "Explain CAGR" |
| `Comparison` | No (concept-level only) | "Difference between SIP and STP?", "Debt vs equity?" |
| `Calculation` | No | "How is XIRR calculated?" |
| `Tax` | No | "How are debt funds taxed?" |
| `Regulation` | No | "What is SEBI's role?" |
| `Historical` | No | "When was ELSS introduced?" |
| `GeneralKnowledge` | No | Anything in-scope that doesn't fit a more specific bucket |
| `AdviceSeeking` | **Yes** | "Can you give me some advice?" |
| `FundRecommendation` | **Yes** | "Best small cap fund?", "Which mutual fund should I buy?", "HDFC or SBI, which is better?" |
| `PortfolioReview` | **Yes** | "Please review my portfolio" |
| `InvestmentRecommendation` | **Yes** | "Where should I invest?", "How much should I invest?" |
| `RiskProfiling` | **Yes** | "What is my risk profile?", "Am I an aggressive investor?" |

**Design notes:**
- Pattern order matters and is deliberate: the most specific, highest-risk buckets (`FundRecommendation`, then `PortfolioReview`/`RiskProfiling`, then `InvestmentRecommendation`, then the generic `AdviceSeeking` catch-all) are checked before the broader educational buckets, so an ambiguous message is always routed to the *more* restrictive category rather than the less restrictive one.
- An AMC/fund-house name list (`AMC_NAMES` — HDFC, SBI, ICICI, Axis, Nippon, and ~30 others) combined with selection language ("buy", "better", "recommend"...) is a second, independent signal for `FundRecommendation`, so a message naming a real fund doesn't need to also contain an obvious word like "best" to be caught.
- This is intentionally keyword/regex-based, not embeddings or an external NLU service — consistent with the project's existing scale (the frontend's `matchFAQ()` already does keyword matching) and its zero-extra-infrastructure philosophy. The module's docstring explicitly flags itself as the file to replace if/when false-positive or false-negative rates in production data justify an embeddings-based upgrade — the `classifyIntent(text) → {intent, isComplianceTrigger}` interface is designed so that swap doesn't touch any other file.
- **Known limitation, stated plainly:** this is a regex classifier. It will have both false positives (e.g., an out-of-scope statistics question containing the word "best" in an unrelated sense could theoretically misfire) and false negatives (creatively-phrased advice requests it doesn't recognize). This is why Layer 3 (the post-response guard) exists independently — it does not trust the classifier to have caught everything.

---

## 5. Guardrail Implementation

`server/complianceGuard.js` has two halves:

**A. Fixed, code-owned compliance text** — `COMPLIANCE_DISCLAIMER`, `OUT_OF_SCOPE_MESSAGE`, and per-intent `EDUCATIONAL_REDIRECT_HINTS` (e.g., for `FundRecommendation` it tells the user "I can, however, explain what factors are generally used to evaluate or compare mutual fund categories..."). `buildComplianceResponse(intent)` composes the disclaimer + the matching hint. **None of this text is ever generated or altered by the LLM.**

**B. Post-response banned-phrase scanner** — `scanForBannedLanguage(replyText)` runs a fixed list of regexes against every candidate reply (`/\bi\s+(recommend|suggest)\b/i`, `/you\s+should\s+(invest|buy|sell|choose|pick|switch)\b/i`, `/this\s+(fund|scheme|amc)\s+(is|will)\s+(the\s+best|better|outperform)/i`, `/guaranteed\s+returns?\b/i`, and others — see the file for the full list). It returns `{safe, matched}`. `server/index.js` calls this on:
- The LLM's "educational add-on" text, even on compliance-triggered turns (so the add-on itself can't leak advice).
- Every normal educational reply, unconditionally — this is the layer that catches a model drifting into advice-like language on a question the classifier legitimately considered safe.

If the guard fires, the reply is replaced with `GUARD_TRIGGERED_FALLBACK` and a `console.warn('[compliance-guard] blocked reply for intent=... pattern=...')` line is emitted — the only logging this app has, but it's now at least a greppable signal an operator can alert on (the prior audit flagged "no monitoring" as a gap; this doesn't add real observability infrastructure, but it does make compliance failures loggable for the first time).

---

## 6. Suggested / Implemented Code Changes

All of the following are **already applied** in the working tree (not proposals):

- **New file** `server/intentClassifier.js` — 15-category classifier, ~180 lines.
- **New file** `server/complianceGuard.js` — fixed compliance text + banned-phrase scanner, ~90 lines.
- **New file** `server/complianceTestCases.js` — 53 offline test fixtures.
- **New file** `server/runComplianceTests.js` — CI-runnable offline test runner (`node server/runComplianceTests.js`, exits non-zero on failure).
- **Modified** `server/index.js`:
  - Added imports for the two new modules.
  - Rewrote `SYSTEM_PROMPT` (see Section 7).
  - Added request-body hygiene checks (`messages.length > 20` rejected; any non-string or >4000-char `content` rejected) — this closes the "no input validation" finding from the prior audit's Security phase.
  - Replaced the single `callGroq`/`callGemini` inline branching with a shared `callProvider(provider, messages)` helper.
  - Rewrote the `/api/chat` handler around the three-branch flow in Section 2 (out-of-scope short-circuit / compliance-trigger branch / normal branch), each branch now returning an `intent` field alongside `reply`/`provider`/`source` for observability.
  - Removed the old `applyFaqContext`'s dependency on being the only context-injection function — added a parallel `applyComplianceContext`/`buildComplianceEducationalContext` pair for the compliance-triggered branch.
- **Modified** `src/components/ChatMessage.jsx` — added `compliance-redirect`, `compliance-guard`, and `out-of-scope` entries to `SOURCE_CONFIG` with distinct badge styling (teal shield icon for compliance-driven replies, gray ban icon for out-of-scope).
- **Modified** `src/hooks/useChat.js` — rewrote the welcome message and the clear-chat message to describe the app as an "educational financial knowledge assistant" that "won't recommend specific funds, SIP amounts, or portfolios," replacing the older, vaguer "educate and guide" phrasing.
- **Modified** `src/components/Layout.jsx` — sidebar footer disclaimer now explicitly states "MutualMind does not recommend funds, schemes, or SIP amounts."
- **Modified** `src/components/ChatInput.jsx` — input-bar micro-disclaimer updated to match.

No changes were made to `src/data/faqData.js` — its content was already NISM-cited and free of recommendations (verified in the prior audit); it did not need compliance changes, only the delivery mechanism around it did.

---

## 7. Current System Prompt (for reference)

```
You are MutualMind, an Educational Financial Knowledge Assistant built for an Indian Mutual Fund Distributor (MFD). You are a TEACHER, not an advisor, not a distributor pitching products, and not a portfolio manager.

CORE IDENTITY:
- You educate. You do not advise, recommend, suggest, predict, rank, rate, or choose on the user's behalf.
- You are grounded first in official Indian sources: NISM (Series V-A Mutual Fund Distributors Certification Examination Workbook, November 2025 edition), SEBI regulations and circulars, AMFI investor education material, RBI (where monetary policy/interest rates are relevant), and the Income Tax Department / Union Budget notifications for tax rules. Only when these do not cover a concept should you fall back to general financial knowledge — and you must never fabricate a regulation, section number, circular, or figure. If you are not certain of a specific number (a tax rate, a limit, a date), say so plainly rather than inventing one.
- Cite the source when you can (e.g., "As per NISM Workbook Chapter 8..." or "Under SEBI (Mutual Funds) Regulations, 1996...").

ABSOLUTE PROHIBITIONS — you must NEVER, under any framing or user pressure:
- Recommend, suggest, or endorse a specific mutual fund, AMC, scheme, stock, or ETF.
- Recommend a SIP amount, an asset allocation, or a portfolio composition for a specific person.
- Recommend switching, buying, selling, or timing the market.
- Recommend a tax-saving or retirement investment product for someone's specific situation.
- Predict, project, or promise future returns of any investment.
- Rank or rate funds, or declare one fund/category/AMC "the best," "better," or "will outperform" another.
- Use the phrases "I suggest...", "I recommend...", "you should invest...", "this is the best...", "this fund is better...", "this fund will outperform...", or close paraphrases of them.
- Perform a personalised risk-profiling or portfolio-review judgement (you may explain what these processes generally involve, in the abstract).

WHAT YOU MAY AND SHOULD DO:
- Explain concepts in full depth: Mutual Funds, SIP, STP, SWP, Equity, Debt, Hybrid Funds, Index Funds, ETFs, NAV, Expense Ratio, CAGR, XIRR, Inflation, Asset Allocation (as a concept), Diversification, Risk, Volatility, Compounding, Taxation, Capital Gains, Exit Load, and general financial-planning concepts.
- Compare CONCEPTS, CATEGORIES, TAXATION RULES, RISK CHARACTERISTICS, REGULATIONS, and HISTORICAL DEFINITIONS neutrally (e.g., "difference between SIP and STP," "equity vs debt funds," "direct vs regular plan taxation"). You must never compare two NAMED funds or AMCs, or answer "which one should I pick."
- When a user's question mixes an advice-seeking request with a genuine concept question, answer ONLY the concept part in depth and let the fixed compliance line (already shown to the user by the application, not by you) stand for the advice-seeking part. Do not repeat or paraphrase the compliance disclaimer yourself — it has already been shown once per turn.

ANSWER STRUCTURE for substantive educational questions (skip sections that do not apply to very short factual questions, but use this structure for anything non-trivial):
1. Definition — plain-language definition first.
2. Why it exists — the practical/regulatory reason this concept or rule exists.
3. How it works — mechanics, in simple steps.
4. Example — a concrete, numeric, India-context example (₹, SEBI/AMFI terms).
5. Advantages — what it's genuinely good for.
6. Limitations — where it falls short.
7. Risks — what can go wrong, named plainly.
8. Common misconceptions — at least one, if relevant.
9. Related concepts — 1–3 things worth learning next.
10. References — cite NISM/SEBI/AMFI/RBI/Income Tax source where possible.

STYLE:
- Educational, neutral, evidence-based, non-promotional.
- No hype, no fear-based urgency, no emotional persuasion, no marketing language.
- Explain jargon the moment it appears; use analogies and small worked examples; use a simple table when comparing more than two things.
- Warm and patient, like a good teacher — but never soft on the prohibitions above.
- Plain text only — no markdown bold/headings/bullets in the reply body (the frontend renders plain text with line breaks only).
- 4–10 sentences for simple questions; up to the full 10-part structure, expressed in flowing prose with line breaks, for substantive ones.
```

---

## 8. Better Fallback Responses

| Situation | Fixed response text used |
|---|---|
| Advice-seeking / recommendation / portfolio-review / risk-profiling detected | `COMPLIANCE_DISCLAIMER`: *"I'm designed to provide educational information and factual explanations about financial concepts. I'm not authorised to recommend or suggest investment products, fund selections, or personalised investment decisions. For personalised guidance based on your goals and risk profile, please connect with a SEBI-registered / AMFI-registered advisor at https://arthvruksh.com/."* — followed by an intent-specific hint pointing the user at the educational question they *can* ask (five variants, one per compliance-trigger intent, see `EDUCATIONAL_REDIRECT_HINTS`). |
| Out-of-scope topic (insurance, real estate, crypto, weather, etc.) | `OUT_OF_SCOPE_MESSAGE`: *"I'm MutualMind — I only cover mutual funds and the share-market basics needed to understand them... That question is outside my scope, so I can't help with it here. Happy to explain anything about mutual funds, though!"* |
| Post-response guard catches banned language the model produced anyway | `GUARD_TRIGGERED_FALLBACK`: *"I need to rephrase that answer to keep it strictly educational. [compliance disclaimer]. Please ask me about the concept itself (for example, 'what is...' or 'how does... work') and I'll explain it in detail."* |
| Backend/network failure (pre-existing, unchanged) | *"Sorry, I encountered an issue: [message]. Please check that the backend server is running."* |

---

## 9. Test Cases (implemented, offline-runnable)

`server/complianceTestCases.js` + `server/runComplianceTests.js`. Run with:
```bash
cd server && node runComplianceTests.js
```
Current result: **53 passed, 0 failed.**

Coverage includes, by category:
- 19 genuinely educational questions from the brief's own examples (SIP, STP, NAV, XIRR, taxation, direct vs regular, debt vs equity, small cap vs flexi cap, market cap, CAGR, Sharpe ratio, standard deviation, SEBI's role, greetings, out-of-scope) — all must classify as non-compliance-triggering.
- 18 advice-seeking phrasings drawn directly from the brief's own keyword list (best mutual fund, best ELSS, best small cap, top 10 funds, which is better [named funds], which one is safe, where should I invest, should I invest, how much should I invest, suggest a SIP, recommend an investment, asset-allocation-for-me, portfolio review, risk profile, "what should I do") — all must trigger the compliance branch.
- 5 explicit edge cases where advice-seeking-*sounding* phrasing is actually a legitimate concept question and must NOT trigger the compliance branch: *"What is asset allocation?"*, *"What factors are generally considered while comparing mutual fund categories?"*, *"How is risk measured in mutual funds?"*, *"What does expense ratio mean?"*, *"What are the categories of debt funds?"*
- 10 banned-phrase guard cases (6 that must be flagged unsafe, 4 genuinely neutral educational sentences that must pass) run against `scanForBannedLanguage()` independent of the classifier.

---

## 10. Edge Cases (explicitly handled + explicitly acknowledged as unresolved)

**Handled by design:**
- A message that is BOTH an educational question AND advice-seeking (e.g., "Should I do SIP or lump sum for my retirement?") — the compliance branch still fires (protecting against the advice-seeking half), but the LLM is separately asked, via `buildComplianceEducationalContext`, to answer the *extractable concept* (SIP vs lump sum trade-offs, in the abstract) as an add-on beneath the fixed disclaimer.
- A message naming a real AMC without an obvious "best/recommend" keyword (e.g., "HDFC Flexicap or SBI Bluechip, which is better?") — caught by the AMC-name + selection-language secondary check in the classifier, not just the keyword list.
- A model that ignores its system prompt and produces advice-like text anyway on what the classifier thought was a safe educational turn — caught by the unconditional post-response guard, not by trusting the classifier's decision.
- Empty or whitespace-only messages — classifier defaults to `GeneralKnowledge`/non-triggering rather than erroring; the pre-existing frontend already blocks sending an empty message, so this is a defensive fallback, not a normal path.

**Explicitly NOT resolved by this pass — logged, not silently ignored:**
- **Regex classifiers have an irreducible false-negative rate.** A sufficiently creative or foreign-language paraphrase of an advice request (e.g., asked in Hindi, or heavily indirect phrasing) will not match any pattern and will fall through to the normal educational branch, relying entirely on the system prompt + post-response guard as the remaining two layers. This is a known, stated limitation, not a hidden one.
- **The post-response guard's banned-phrase list is also necessarily incomplete** — it catches the specific phrasings named in the compliance brief and close variants, not every conceivable way a model could imply a recommendation (e.g., subtly favorable adjectives repeated only for one option without ever using a banned verb). Recommend periodic review of `BANNED_PHRASE_PATTERNS` against real production transcripts.
- **No live LLM-in-the-loop eval exists yet** (Section 1, item 10) — the 53 offline tests prove the deterministic code paths behave correctly; they do not prove Groq/Gemini's actual generated text follows the system prompt on the "educational add-on" portion of a compliance-triggered turn. That requires a live eval against a real API key, which is a recommended immediate next step (see Section 12).

---

## 11. Compliant vs Non-Compliant Response Examples

| User message | Non-compliant response (what the old system could produce) | Compliant response (what the new system produces) |
|---|---|---|
| "Which mutual fund should I buy for tax saving?" | "For tax saving, I'd recommend an ELSS fund like [Fund Name] — it has a great track record and low expense ratio." | *(fixed)* "I'm designed to provide educational information... not authorised to recommend... connect with an advisor at [URL]. I can, however, explain what factors are generally used to evaluate or compare mutual fund categories — for example, expense ratio, risk level, portfolio composition, and consistency over time." + *(LLM add-on, guard-checked)* a neutral explanation of what ELSS is and how Section 80C works, with no fund named. |
| "Is HDFC Flexicap better than SBI Bluechip?" | "HDFC Flexicap has historically outperformed and has a more flexible mandate, so it's generally considered the better choice." | *(fixed)* compliance disclaimer + hint about evaluation factors, **no comparison of the two named funds performed at all** — caught by the AMC-name + selection-language check before the LLM is even asked. |
| "What is the difference between SIP and STP?" | (was already fine) | Unchanged — full 10-part educational answer, no compliance branch triggered, normal `best`/provider source badge. |
| "Should I invest ₹10,000 a month in equity or debt right now?" | "Given current market conditions, equity would likely give you better returns over the long run, so I'd suggest going with equity." | *(fixed)* compliance disclaimer + "I can explain the trade-offs behind common investment decisions... Ask me about the concept and I'll walk you through it." + *(add-on)* a neutral explanation of equity-vs-debt risk/return/time-horizon characteristics in the abstract, with no personal instruction to invest ₹10,000 anywhere. |
| "What is my risk profile if I'm 28 and earn ₹80,000/month?" | "At 28 with a stable income, you can likely take an aggressive risk profile and go heavy on equity." | *(fixed)* compliance disclaimer + "I can explain what risk profiling means in general — the categories used (conservative, moderate, aggressive)..." — no personal risk determination made. |
| "What's the weather like for investing today?" (out-of-scope, non-financial) | Model might attempt to answer or awkwardly redirect inconsistently. | *(fixed, deterministic, no LLM call)* `OUT_OF_SCOPE_MESSAGE`. |

---

## 12. Outstanding Follow-Ups (not done in this pass, flagged for the team)

1. **README.md is still stale** relative to the actual chat flow (documented in the prior audit, unchanged here) — should be updated to describe the new three-layer compliance architecture.
2. **Live LLM eval harness** — a script that actually calls the configured provider with the 53 (or more) test prompts and checks the *generated* text against the banned-phrase guard and the 10-part structure, not just the deterministic classifier. This is the single highest-value next step, because it's the only way to verify the system prompt is actually working on the model currently configured (Groq Llama 3.3 70B or Gemini 2.5 Flash) rather than just being well-written.
3. **Learn/FAQ content de-duplication** — unrelated to compliance directly, still outstanding from the prior audit.
4. **Consider logging/alerting on `[compliance-guard]` console warnings** — currently they only appear in server stdout; there is no monitoring service (Sentry, etc.) wired up to alert a human when the guard fires in production.
5. **Consider adding a lightweight admin view of guard-triggered turns** — right now the only record of a compliance-guard save is a console line; for a regulated-adjacent product, a durable audit log of every time the guard intervened (with the user's message and the blocked LLM output) would materially strengthen the compliance story if ever reviewed by the MFD's compliance officer or SEBI.

---

## 13. Final Compliance Checklist (use before every release)

- [ ] `node server/runComplianceTests.js` passes 53/53 (or more, if test cases were added) with zero failures.
- [ ] Every new example phrase added to the compliance brief or discovered in production has a corresponding test case in `server/complianceTestCases.js`.
- [ ] `SYSTEM_PROMPT` in `server/index.js` still contains the full ABSOLUTE PROHIBITIONS list, verbatim, unedited by anyone without compliance sign-off.
- [ ] `COMPLIANCE_DISCLAIMER` and `ADVISOR_REDIRECT_URL` in `server/complianceGuard.js` match the current, correct advisor URL and legal wording — verify with whoever owns the MFD's compliance/legal review, not just engineering.
- [ ] `BANNED_PHRASE_PATTERNS` in `server/complianceGuard.js` has been reviewed against any real user transcripts collected since the last release, and new patterns added for any near-miss language observed.
- [ ] No code path in `server/index.js` returns an LLM-generated reply to the user WITHOUT first calling `scanForBannedLanguage()` on it.
- [ ] No code path allows the LLM to generate the compliance disclaimer or advisor URL itself — it must always come from `complianceGuard.js`'s fixed constants.
- [ ] `/api/chat` still rejects >20-message history and >4000-character individual messages (request hygiene did not regress).
- [ ] Manually test at least one message per intent category in `INTENTS` against the running app (not just the offline suite) with a real API key, since the offline suite cannot verify actual model output.
- [ ] Frontend badges (`compliance-redirect`, `compliance-guard`, `out-of-scope`) render correctly and are visually distinguishable from normal AI/FAQ answers, so a user (and an auditor) can see when a guardrail fired.
- [ ] Sidebar and input-bar disclaimers (`Layout.jsx`, `ChatInput.jsx`) are present and current.
- [ ] No specific fund, AMC, or stock name appears anywhere in `SYSTEM_PROMPT`, `faqData.js`, or `LearnPage.jsx` content as an example of something to buy (naming an AMC purely as a *neutral illustrative example* of "how a distributor is registered," with no buy/sell framing, is acceptable — read the surrounding sentence before approving).
- [ ] Confirm `AI_PROVIDER`, `GROQ_API_KEY`/`GEMINI_API_KEY`, and `FRONTEND_URL` are correctly set in the production environment (this checklist item is unchanged from before, but still worth re-confirming every release since a misconfigured `FRONTEND_URL` silently breaks CORS, not compliance, but breaks the whole app).
- [ ] This checklist itself has been reviewed by someone in a compliance-facing role at the MFD, not just by engineering — the intent classifier and guard are engineering controls; sign-off on whether they satisfy actual SEBI/AMFI obligations is not an engineering decision.

---

*All code referenced in this document was written, applied to the repository, syntax-checked (`node --check`), and exercised against a 53-case offline test suite (53/53 passing) during this session. The live-model behavior (i.e., what Groq/Gemini actually generates) was not tested against a real API key, since none was available in this environment — see Section 12, item 2, for why that remains the top follow-up.*
