// server/runComplianceTests.js
//
// Offline test runner — no API key, no network calls. Run with:
//   node server/runComplianceTests.js
// Exits non-zero if any case fails, so it can gate a release in CI.

import { classifyIntent } from './intentClassifier.js'
import { scanForBannedLanguage } from './complianceGuard.js'
import { INTENT_TEST_CASES, BANNED_PHRASE_TEST_CASES } from './complianceTestCases.js'

let pass = 0
let fail = 0

console.log('\n=== Intent classification tests ===')
for (const tc of INTENT_TEST_CASES) {
  const result = classifyIntent(tc.input)
  const ok = result.intent === tc.expectIntent && result.isComplianceTrigger === tc.expectTrigger
  if (ok) {
    pass++
  } else {
    fail++
    console.log(`FAIL  "${tc.input}"`)
    console.log(`      expected intent=${tc.expectIntent} trigger=${tc.expectTrigger}`)
    console.log(`      got      intent=${result.intent} trigger=${result.isComplianceTrigger} (matched: ${result.matched})`)
  }
}

console.log('\n=== Banned-phrase guard tests ===')
for (const tc of BANNED_PHRASE_TEST_CASES) {
  const result = scanForBannedLanguage(tc.text)
  const ok = result.safe === tc.expectSafe
  if (ok) {
    pass++
  } else {
    fail++
    console.log(`FAIL  "${tc.text}"`)
    console.log(`      expected safe=${tc.expectSafe}, got safe=${result.safe} (matched: ${result.matched})`)
  }
}

console.log(`\n${pass} passed, ${fail} failed (${pass + fail} total)\n`)
process.exit(fail > 0 ? 1 : 0)
