// SOURCE: NISM Series V-A Mutual Fund Distributors Certification Examination Workbook (November 2025)
// All answers are derived from the official NISM workbook for accuracy and compliance

export const SOURCE_INFO = {
  title: 'NISM Series V-A: Mutual Fund Distributors Certification Examination Workbook',
  version: 'November 2025',
  publisher: 'National Institute of Securities Markets (NISM)',
  website: 'www.nism.ac.in',
}

export const FAQ_DATA = [
  {
    id: 'what-is-mutual-fund',
    category: 'Basics',
    question: 'What is a mutual fund?',
    keywords: ['what is mutual fund', 'mutual fund means', 'define mutual fund', 'what are mutual funds'],
    answer: `A mutual fund is a professionally managed investment vehicle (constituted as a "trust") that mobilizes money from investors to invest in different markets and securities, in line with stated investment objectives.\n\nThrough a mutual fund, an investor gets access to equities, bonds, money market instruments and other securities — along with professional fund management from an Asset Management Company (AMC).\n\nKey point: An investor does not get a different product, but gets a different way of investing — with professional management, portfolio diversification, and a SEBI-regulated vehicle.\n\n(Source: NISM Workbook Ch.2)`,
    tag: 'FAQ',
  },
  {
    id: 'nav',
    category: 'Basics',
    question: 'How does NAV (Net Asset Value) work?',
    keywords: ['nav', 'net asset value', 'unit price', 'fund price', 'how nav calculated'],
    answer: `NAV is the true worth of one unit of a mutual fund scheme, calculated every business day.\n\nFormula: NAV = (Market Value of Investments − Liabilities − Expenses) ÷ Number of Units Outstanding\n\nKey facts from NISM:\n• Face value of each unit is ₹10 (for accounting purposes)\n• NAV changes daily due to Mark-to-Market (MTM) valuation\n• Higher TER (expenses) = lower NAV = lower investor returns\n• Example: Invest ₹10,000 at NAV ₹50 → 200 units. NAV rises to ₹65 → worth ₹13,000\n\nA higher NAV does NOT mean a fund is expensive — growth rate over time is what matters.\n\n(Source: NISM Workbook Ch.2 & Ch.7)`,
    tag: 'FAQ',
  },
  {
    id: 'sip',
    category: 'Basics',
    question: 'What is SIP (Systematic Investment Plan)?',
    keywords: ['sip', 'systematic investment', 'monthly invest', 'regular invest', 'how sip works'],
    answer: `SIP is investing a fixed amount at regular intervals — monthly, quarterly, etc. A key benefit is Rupee Cost Averaging.\n\nNISM example — ₹1,000/month SIP:\n• Month 1: NAV ₹10 → get 100 units\n• Month 2: NAV ₹12 → get 83.33 units (fewer when expensive)\n• Month 3: NAV ₹9 → get 111.11 units (more when cheap)\n\nYou automatically buy MORE when markets are down — averaging your cost below the simple average NAV.\n\nBenefits:\n• No need to time the market\n• Suits salaried investors with regular income\n• Can be automated via NACH/Standing Instructions\n• Can start from ₹500/month in most schemes\n\n(Source: NISM Workbook Ch.9.11.1)`,
    tag: 'FAQ',
  },
  {
    id: 'swp',
    category: 'Basics',
    question: 'What is SWP (Systematic Withdrawal Plan)?',
    keywords: ['swp', 'systematic withdrawal', 'regular withdrawal', 'monthly withdrawal'],
    answer: `SWP allows you to withdraw a fixed amount from your mutual fund at regular intervals — like a steady income stream.\n\nNISM example — Withdraw ₹1,000/month:\n• Month 1: NAV ₹10 → redeem 100 units\n• Month 2: NAV ₹12 → redeem only 83.33 units\n• Month 3: NAV ₹9 → redeem 111.11 units\n\nYou avoid selling all units at a market bottom. Units are liquidated gradually at an average price.\n\nImportant: Exit loads and capital gains taxes apply on each withdrawal. If exit load is 1% and NAV is ₹10, effective price is ₹9.90 — you must redeem more units to get the same amount.\n\nUse cases: Retirement income, regular expenses, periodic profit booking.\n\n(Source: NISM Workbook Ch.9.11.2)`,
    tag: 'FAQ',
  },
  {
    id: 'stp',
    category: 'Basics',
    question: 'What is STP (Systematic Transfer Plan)?',
    keywords: ['stp', 'systematic transfer', 'switch plan', 'transfer plan'],
    answer: `STP automatically transfers a fixed amount from one mutual fund scheme (source) to another (target) of the same AMC at regular intervals.\n\nIt combines SWP (from source) + SIP (into target).\n\nCommon use: Park ₹10 lakhs in a liquid/debt fund, set STP to transfer ₹1 lakh/month into an equity fund — you enter equity gradually without market timing risk.\n\nKey rules from NISM:\n• Exit loads apply on redemption from source scheme\n• Capital gains tax applies on gains from source\n• AMC specifies eligible source and target schemes\n• Minimum investment limits don't apply to STP tranches\n\n(Source: NISM Workbook Ch.9.11.3)`,
    tag: 'FAQ',
  },
  {
    id: 'aum',
    category: 'Basics',
    question: 'What is AUM (Assets Under Management)?',
    keywords: ['aum', 'assets under management', 'fund size', 'corpus'],
    answer: `AUM is the total market value of all investments in a mutual fund scheme. Formula: Current NAV × Total Units Outstanding.\n\nKey facts from NISM:\n• AUM measures size of an AMC or individual scheme\n• AUM rises when scheme performs well or attracts new investments\n• AUM falls when investors redeem or dividends are paid\n• Larger AUM can mean lower expense ratios (SEBI's slab-based TER structure)\n• Very large equity funds may face difficulty deploying money efficiently\n\nAUM is the key metric to compare the scale of different AMCs in India.\n\n(Source: NISM Workbook Ch.2.1.4)`,
    tag: 'FAQ',
  },
  {
    id: 'tax-equity',
    category: 'Tax',
    question: 'What is the capital gains tax on equity mutual funds?',
    keywords: ['equity tax', 'ltcg equity', 'stcg equity', 'capital gains equity', 'equity fund tax'],
    answer: `Capital Gains Tax on Equity Mutual Funds (Union Budget 2024, effective July 23, 2024):\n\nShort-Term Capital Gains (held < 12 months): 20%\n\nLong-Term Capital Gains (held ≥ 12 months):\n• Tax rate: 12.5%\n• First ₹1.25 lakh LTCG per year: Tax-free\n• Example: LTCG of ₹1,35,000 → only ₹10,000 taxed at 12.5%\n\nGrandfathering: For equity funds bought before Jan 31, 2018, gains up to that date are not taxed. NAV on Jan 31, 2018 is the cost base.\n\nOld rates apply if redeemed before July 23, 2024. New rates apply for redemptions on or after July 23, 2024.\n\nEquity-oriented = schemes with 65%+ of AUM in equity shares listed on Indian stock exchanges.\n\nConsult a CA for your specific tax computation.\n\n(Source: NISM Workbook Ch.8.2)`,
    tag: 'FAQ',
  },
  {
    id: 'tax-debt',
    category: 'Tax',
    question: 'How are debt mutual funds taxed?',
    keywords: ['debt fund tax', 'debt taxation', 'bond fund tax', 'fixed income tax'],
    answer: `Debt Mutual Fund Taxation (post April 1, 2023):\n\nFor units bought on or after April 1, 2023:\n• All capital gains added to your total income\n• Taxed at your applicable income tax slab rate\n• No indexation benefit\n• No separate LTCG/STCG distinction\n\nFor units bought before April 1, 2023:\n• Old rules applied — LTCG (3+ years) taxed at 20% with indexation\n\nDebt funds include: Liquid, overnight, short-duration, credit risk, dynamic bond, gilt funds, and fund-of-funds investing in equity mutual funds (classified as non-equity for tax purposes).\n\nAlways consult a CA for your specific situation.\n\n(Source: NISM Workbook Ch.8.2)`,
    tag: 'FAQ',
  },
  {
    id: 'elss',
    category: 'Tax',
    question: 'What is ELSS and how does it save tax?',
    keywords: ['elss', 'tax saving', '80c', 'tax benefit', 'tax deduction', 'equity linked savings'],
    answer: `ELSS (Equity Linked Savings Scheme) is a mutual fund that qualifies for Section 80C deduction.\n\nKey features:\n• Deduction up to ₹1.5 lakh/year under Section 80C\n• Shortest lock-in among all 80C instruments: just 3 years\n• Equity-oriented: 65%+ in equity → potential for better long-term returns vs PPF/FD\n• SIP in ELSS: Each monthly instalment has its own 3-year lock-in\n\nTax savings:\n• 30% slab: Save ₹46,800 on ₹1.5 lakh investment\n• 20% slab: Save ₹31,200 on ₹1.5 lakh investment\n\nGains after 3-year lock-in are LTCG — taxed at 12.5% above ₹1.25 lakh exemption.\n\n(Source: NISM Workbook Ch.8, Section 80C)`,
    tag: 'FAQ',
  },
  {
    id: 'dividend-tax',
    category: 'Tax',
    question: 'How is dividend (IDCW) from mutual funds taxed?',
    keywords: ['dividend tax', 'idcw tax', 'dividend income', 'dividend mutual fund'],
    answer: `Dividends from mutual funds are now officially called Income Distribution cum Capital Withdrawal (IDCW).\n\nTax treatment (post Union Budget 2020):\n• Dividend/IDCW added to investor's total income\n• Taxed at the investor's applicable income tax slab rate\n• Earlier Dividend Distribution Tax (DDT) paid by fund is now abolished\n\nTDS:\n• If IDCW exceeds ₹5,000 in a financial year: TDS @ 10% is deducted for resident Indians\n• Different TDS rates apply for NRIs\n\nImportant: When dividend is declared, NAV falls by the dividend amount. Dividend is essentially a return of your own capital — not additional income.\n\nFor long-term wealth creation, Growth option is generally more tax-efficient than IDCW.\n\n(Source: NISM Workbook Ch.8.3)`,
    tag: 'FAQ',
  },
  {
    id: 'equity-funds',
    category: 'Fund Types',
    question: 'What are the types of equity mutual funds?',
    keywords: ['equity fund', 'equity mutual fund', 'stock fund', 'types of equity funds', 'large cap', 'small cap', 'mid cap'],
    answer: `SEBI-defined categories of equity mutual funds:\n\n• Large Cap Fund: Top 100 companies by market cap — most stable equity category\n• Mid Cap Fund: 101st–250th companies — moderate risk and return potential\n• Small Cap Fund: 251st company onwards — high risk, high potential\n• Multi Cap Fund: Minimum 25% each in large, mid, small cap\n• Flexi Cap Fund: Flexible allocation, fund manager decides\n• Large & Mid Cap Fund: Min 35% each in large cap and mid cap\n• ELSS: Tax-saving fund with 3-year lock-in (Section 80C)\n• Focused Fund: Concentrated portfolio of maximum 30 stocks\n• Sectoral/Thematic Fund: Specific sectors (IT, pharma, banking) — high concentration risk\n• Index Fund: Passively tracks Nifty 50, Sensex, etc. — very low TER\n\nEquity funds are suitable for goals 5+ years away.\n\n(Source: NISM Workbook Ch.2.2)`,
    tag: 'FAQ',
  },
  {
    id: 'debt-funds',
    category: 'Fund Types',
    question: 'What are the types of debt mutual funds?',
    keywords: ['debt fund', 'fixed income fund', 'bond fund', 'debt mutual fund types', 'liquid fund', 'overnight fund'],
    answer: `SEBI-defined categories of debt mutual funds:\n\n• Overnight Fund: Invests in 1-day maturity securities — lowest risk, maximum liquidity\n• Liquid Fund: Up to 91-day maturity — for parking surplus for 1 week to 6 months\n• Ultra Short Duration: 3–6 month Macaulay duration\n• Short Duration: 1–3 year duration — good for 1–3 year goals\n• Medium Duration: 3–4 year duration\n• Long Duration: More than 7 year duration — interest rate sensitive\n• Dynamic Bond Fund: Duration changes based on interest rate view\n• Credit Risk Fund: Min 65% in below AA-rated bonds — higher yield, higher credit risk\n• Gilt Fund: Only government securities — no credit risk, but interest rate risk\n• Banking & PSU Fund: Min 80% in banks/PSU instruments\n\nDebt funds are for conservative investors and short-to-medium term goals.\n\n(Source: NISM Workbook Ch.2.2)`,
    tag: 'FAQ',
  },
  {
    id: 'hybrid-funds',
    category: 'Fund Types',
    question: 'What are hybrid mutual funds?',
    keywords: ['hybrid fund', 'balanced fund', 'asset allocation fund', 'hybrid mutual fund', 'balanced advantage'],
    answer: `Hybrid mutual funds invest in a mix of equity and debt to balance risk and return.\n\nSEBI categories:\n\n• Conservative Hybrid Fund: 10–25% equity, 75–90% debt — suitable for conservative investors\n• Balanced Hybrid Fund: 40–60% equity, 40–60% debt — equal balance\n• Aggressive Hybrid Fund: 65–80% equity, 20–35% debt — equity-oriented\n• Dynamic Asset Allocation / Balanced Advantage Fund: Allocation changes dynamically with market valuations — popular for automated risk management\n• Multi Asset Allocation Fund: Min 10% each in at least 3 asset classes\n• Arbitrage Fund: Exploits cash-futures price differences — taxed like equity fund\n• Equity Savings Fund: Mix of equity, arbitrage and debt — moderate risk\n\nHybrid funds suit moderate risk investors who want equity growth with some downside protection.\n\n(Source: NISM Workbook Ch.2.2)`,
    tag: 'FAQ',
  },
  {
    id: 'expense-ratio',
    category: 'Costs',
    question: 'What is Total Expense Ratio (TER)?',
    keywords: ['expense ratio', 'ter', 'total expense ratio', 'fund charges', 'management fee', 'amc fee'],
    answer: `TER (Total Expense Ratio) is the annual cost of running a mutual fund, expressed as % of AUM. It is deducted from the fund's assets daily — you never pay it separately.\n\nWhat TER includes:\n• Fund management fees\n• Distribution and marketing expenses\n• Registrar & Transfer Agent (RTA) fees\n• Audit, trustee, and other operational costs\n\nSEBI TER limits (equity funds):\n• Up to ₹500 cr AUM: Max 2.25%\n• ₹500–750 cr: Max 2.00%\n• ₹750–2,000 cr: Max 1.75%\n• Larger funds get further reductions\n\nKey fact: Higher TER directly reduces NAV and returns. Even a 0.5% TER difference over 20 years compounds to lakhs of rupees difference.\n\nDirect plans always have lower TER than Regular plans.\n\n(Source: NISM Workbook Ch.7)`,
    tag: 'FAQ',
  },
  {
    id: 'exit-load',
    category: 'Costs',
    question: 'What is exit load in mutual funds?',
    keywords: ['exit load', 'redemption charge', 'exit charge', 'load', 'penalty'],
    answer: `Exit load is a charge deducted when you redeem mutual fund units within a specified period. It discourages short-term trading.\n\nHow it works (NISM):\n• Exit load = 1% if redeemed within 1 year\n• If NAV = ₹100 and you redeem within 1 year → you receive ₹100 × (1−1%) = ₹99 per unit\n\nKey facts:\n• Exit load proceeds go back into the scheme (not to the AMC) — protects remaining long-term investors\n• No entry load is allowed in India (abolished by SEBI)\n• Exit loads reduce effective SWP amounts — more units must be redeemed to get the same cash\n• Liquid/overnight funds typically have no exit load or very minimal (up to 7 days)\n\nAlways check the exit load period before investing, especially if you may need the money soon.\n\n(Source: NISM Workbook Ch.7.4)`,
    tag: 'FAQ',
  },
  {
    id: 'direct-regular',
    category: 'Costs',
    question: 'What is the difference between Direct and Regular plan?',
    keywords: ['direct plan', 'regular plan', 'direct vs regular', 'distributor', 'direct mutual fund'],
    answer: `Every mutual fund scheme offers two variants:\n\nDirect Plan:\n• Invest directly with the AMC — no distributor\n• Lower TER (no distributor commission)\n• Higher NAV over time\n• Available on AMC websites, MFCentral, MF Utility\n\nRegular Plan:\n• Bought through distributor, bank, or broker\n• Higher TER (includes distributor commission ~0.5–1% extra)\n• Lower NAV compared to Direct plan\n\nLong-term impact:\n₹5,000/month SIP, 20 years, 12% gross CAGR:\n• Regular plan (1% higher TER): Smaller corpus\n• Direct plan: ₹8–15 lakh MORE at the end\n\nChoose Regular when: You are a first-time investor who needs guidance from an AMFI-registered distributor.\nChoose Direct when: You are financially aware and can invest independently.\n\n(Source: NISM Workbook Ch.6)`,
    tag: 'FAQ',
  },
  {
    id: 'market-down',
    category: 'Market',
    question: 'Why is my mutual fund investment showing a loss?',
    keywords: ['loss', 'portfolio down', 'investment down', 'negative returns', 'market down', 'red', 'why falling', 'portfolio negative'],
    answer: `A short-term negative return is normal for market-linked mutual funds — it does NOT mean permanent loss.\n\nCommon reasons (from NISM):\n• Stock market correction (domestic triggers or global events)\n• Rising interest rates (hurts debt fund NAVs)\n• Sector-specific slowdowns (IT, banking, real estate)\n• FPI (Foreign Portfolio Investor) selling in Indian markets\n• Global factors — inflation, geopolitical tensions, currency weakness\n\nWhat you should do:\n• Do NOT panic-sell — you lock in losses permanently\n• Continue your SIP — you buy MORE units at lower NAVs (Rupee Cost Averaging)\n• Remember: equity mutual funds need 5+ year horizon\n• In 2022, when FPIs sold heavily, mutual fund investors who stayed invested benefited from the recovery\n\nPlease consult a SEBI-registered investment advisor for personalized guidance on your portfolio.\n\n(Source: NISM Workbook Ch.2.1.1 & Ch.1)`,
    tag: 'FAQ',
  },
  {
    id: 'risk-types',
    category: 'Risk',
    question: 'What are the types of risk in mutual funds?',
    keywords: ['risk', 'types of risk', 'risky', 'volatility', 'market risk', 'credit risk', 'interest rate risk'],
    answer: `Types of investment risk in mutual funds (NISM Workbook Ch.1):\n\n• Market Risk: NAV falls when markets fall — affects equity funds. Cannot be diversified away.\n• Credit Risk: Bond issuer defaults or gets downgraded — mainly affects debt funds. Higher in Credit Risk Funds.\n• Interest Rate Risk: When RBI raises rates, bond prices fall — longer duration debt funds are most affected.\n• Liquidity Risk: Difficulty exiting in stressed markets — higher for small-cap stocks and illiquid bonds.\n• Concentration Risk: Over-exposure to one stock/sector magnifies losses from that segment.\n• Inflation Risk: Returns don't beat inflation — real wealth erodes.\n• Re-investment Risk: Maturing bond proceeds may need to be reinvested at lower rates.\n\nRisk reduction strategies:\n✓ Diversify across equity, debt, and gold\n✓ Longer horizon for equity (5+ years)\n✓ Choose funds matching your risk profile (use Riskometer)\n\n(Source: NISM Workbook Ch.1.4)`,
    tag: 'FAQ',
  },
  {
    id: 'rupee-cost-averaging',
    category: 'Market',
    question: 'What is Rupee Cost Averaging?',
    keywords: ['rupee cost averaging', 'rca', 'cost averaging', 'sip benefit', 'average cost'],
    answer: `Rupee Cost Averaging (RCA) is the key mechanism that makes SIP effective in volatile markets.\n\nNISM example — ₹1,000/month SIP over 3 months:\n• Month 1: NAV ₹10 → 100.000 units\n• Month 2: NAV ₹12 → 83.333 units\n• Month 3: NAV ₹9 → 111.111 units\n\nTotal invested: ₹3,000 | Total units: 294.44\nAverage cost per unit: ₹10.19\nSimple average of NAV over 3 months: ₹10.33\n\nYou acquire units at a LOWER average cost than the simple average NAV — this is Rupee Cost Averaging.\n\nWhy it matters:\n• Automatic "buy more when cheap, buy less when expensive" discipline\n• No market timing required\n• This is why stopping SIP during corrections is counterproductive — corrections are when you accumulate the most units\n\n(Source: NISM Workbook Ch.9.11.1)`,
    tag: 'FAQ',
  },
  {
    id: 'sebi-role',
    category: 'Regulation',
    question: 'What is SEBI\'s role in regulating mutual funds?',
    keywords: ['sebi', 'regulator', 'sebi role', 'mutual fund regulation', 'amfi', 'sebi regulations'],
    answer: `SEBI (Securities and Exchange Board of India) is the primary regulator for mutual funds in India under SEBI (Mutual Funds) Regulations, 1996.\n\nSEBI's key roles:\n• Registers and regulates AMCs, trustees, custodians, and RTAs\n• Sets rules for scheme launches, investment norms, and mandatory disclosures\n• Mandates daily NAV publication\n• Caps TER (expense ratios) to protect investors\n• Regulates distributor commissions and mandates disclosure\n• Governs KYC, AML norms under PMLA\n• Issues scheme categorization guidelines\n• Operates SCORES (SEBI Complaints Redress System) for investor grievances\n\nAMFI (Association of Mutual Funds in India):\n• Industry body — not a SEBI-level regulator\n• Issues ARN (AMFI Registration Number) to distributors\n• Sets and enforces Code of Conduct for intermediaries\n• Publishes investor education materials at amfiindia.com\n\nMutual fund structure: Sponsor → Trust → Trustee → AMC → SEBI oversight\n\n(Source: NISM Workbook Ch.3 & Ch.4)`,
    tag: 'FAQ',
  },
  {
    id: 'kyc',
    category: 'Process',
    question: 'What is KYC and is it mandatory for mutual funds?',
    keywords: ['kyc', 'know your customer', 'kyc mandatory', 'documents required', 'pan card', 'ckyc'],
    answer: `Yes — KYC is mandatory for all mutual fund investments in India as per SEBI and PMLA requirements.\n\nKYC documents required (individuals):\n• PAN card — mandatory for investments above ₹50,000/year\n• Proof of Identity: Aadhaar, Passport, Voter ID, Driving Licence\n• Proof of Address: Aadhaar, utility bill, bank statement\n• Recent photograph\n• Bank account details (for redemption credits)\n\nCKYC (Centralized KYC):\n• Once done with any SEBI-registered intermediary, valid across all mutual funds\n• KYC done with a bank or broker is valid for mutual fund investments too\n\nFor joint accounts: KYC needed for all holders; income taxed in the hands of first holder.\n\nFor institutional investors: Additional documents needed — Board Resolution, Ultimate Beneficial Owner (UBO) details (who owns 25%+ of company or 15%+ of trust).\n\n(Source: NISM Workbook Ch.9.10)`,
    tag: 'FAQ',
  },
  {
    id: 'nfo',
    category: 'Process',
    question: 'What is a New Fund Offer (NFO)?',
    keywords: ['nfo', 'new fund offer', 'new scheme', 'launch', 'new fund'],
    answer: `An NFO (New Fund Offer) is the first subscription period for a new mutual fund scheme — similar to an IPO for stocks.\n\nKey facts from NISM:\n• Units offered at face value (typically ₹10) during NFO\n• NFO period is usually 15 days\n• After NFO closes, units are allotted and scheme begins investing\n• For open-ended schemes: can buy/sell at NAV any time after NFO\n\nNFO ≠ Cheap: ₹10 NAV during NFO is NOT cheaper than ₹100 NAV of an existing scheme. A new scheme has no track record — evaluate it carefully.\n\nTypes of mutual fund structures:\n• Open-ended: Buy/sell anytime after NFO — most common\n• Close-ended: Fixed maturity; units listed on stock exchange; limited liquidity\n• Interval funds: Open for transactions only at specified intervals\n\nAlways read the SID (Scheme Information Document) before investing.\n\n(Source: NISM Workbook Ch.2 & Ch.5)`,
    tag: 'FAQ',
  },
  {
    id: 'cagr',
    category: 'Returns',
    question: 'What is CAGR and how is it calculated?',
    keywords: ['cagr', 'compound annual growth', 'annualised return', 'returns calculation', 'xirr'],
    answer: `CAGR (Compound Annual Growth Rate) is the year-over-year growth rate of your investment, assuming all gains are reinvested.\n\nFormula: CAGR = (End Value ÷ Start Value)^(1 ÷ Years) − 1\n\nExample:\n• Invest ₹1,00,000 in 2017\n• Value in 2024 (7 years): ₹2,50,000\n• CAGR = (2.5)^(1/7) − 1 = 13.9% per year\n\nCAGR vs Absolute Return:\n• Absolute: (₹2,50,000 − ₹1,00,000) ÷ ₹1,00,000 = 150% — misleading without time context\n• CAGR: 13.9% per year — comparable across funds\n\nFor SIP returns, use XIRR (Extended Internal Rate of Return) — accounts for irregular cash flows at different dates.\n\nNever compare a 1-year CAGR with a 5-year CAGR — compare over the same time period only.\n\n(Source: NISM Workbook — Returns concepts)`,
    tag: 'FAQ',
  },
  {
    id: 'lumpsum-vs-sip',
    category: 'Basics',
    question: 'Lump sum vs SIP — which is better?',
    keywords: ['lumpsum vs sip', 'lump sum', 'one time investment', 'sip or lumpsum', 'bulk investment'],
    answer: `Both approaches have their place — the right choice depends on your situation.\n\nSIP is better when:\n✓ You have regular monthly income\n✓ You want to avoid timing the market\n✓ Starting amount is small\n✓ Volatile markets (Rupee Cost Averaging works best)\n\nLump Sum is better when:\n✓ You have a large windfall (bonus, inheritance, maturity proceeds)\n✓ Markets have corrected significantly (20–30% down from peak)\n✓ Very long investment horizon (10+ years)\n\nBest of both — STP Strategy:\nPark large sum in a liquid/debt fund → set STP to transfer monthly into equity fund. This gives you Rupee Cost Averaging on a lump sum.\n\nFrom NISM: "Saving for goals becomes easier when investible surpluses are periodically invested." SIP remains the recommended approach for most retail investors.\n\n(Source: NISM Workbook Ch.9.11.1)`,
    tag: 'FAQ',
  },
  {
    id: 'distributor-advisor',
    category: 'Regulation',
    question: 'Difference between a Mutual Fund Distributor and Investment Advisor?',
    keywords: ['distributor vs advisor', 'ifa', 'investment advisor', 'mutual fund agent', 'arn', 'rna', 'sebi registered advisor'],
    answer: `This is an important SEBI-regulated distinction:\n\nMutual Fund Distributor (MFD):\n• Registered with AMFI; holds ARN (AMFI Registration Number)\n• Must pass NISM Series V-A Certification Examination\n• Earns commission from AMC (paid from Regular plan TER)\n• Cannot charge advisory fees directly from investors\n• Sells/distributes mutual fund products\n\nSEBI-Registered Investment Advisor (RIA):\n• Registered directly with SEBI\n• Charges fees directly from the investor (fee-only model)\n• Provides personalized investment advice — has fiduciary duty to client\n• Cannot earn commissions from AMCs\n• Higher qualification and net-worth requirements\n\nKey difference:\n• Distributor: compensated by AMC → potential conflict of interest\n• RIA: compensated by you → better alignment of interests\n\nSEBI mandates all distributors to disclose their commission to investors. This transparency protects your interests.\n\n(Source: NISM Workbook Ch.6.8)`,
    tag: 'FAQ',
  },
]

export function matchFAQ(query) {
  const q = query.toLowerCase().trim()
  for (const item of FAQ_DATA) {
    if (item.keywords.some((kw) => q.includes(kw))) return item
  }
  // Fallback patterns
  if (q.includes('80c') || q.includes('save tax') || q.includes('tax saving')) return FAQ_DATA.find(f => f.id === 'elss')
  if (q.includes('ltcg') || q.includes('stcg') || q.includes('capital gain')) return FAQ_DATA.find(f => f.id === 'tax-equity')
  if (q.includes('down') || q.includes('loss') || q.includes('negative') || q.includes('red') || q.includes('fell') || q.includes('drop')) return FAQ_DATA.find(f => f.id === 'market-down')
  if (q.includes('rupee cost') || q.includes('averaging')) return FAQ_DATA.find(f => f.id === 'rupee-cost-averaging')
  if (q.includes('lump') || q.includes('one time') || q.includes('bulk')) return FAQ_DATA.find(f => f.id === 'lumpsum-vs-sip')
  if (q.includes('fee') || q.includes('charge') || q.includes('cost') || q.includes('ter')) return FAQ_DATA.find(f => f.id === 'expense-ratio')
  if (q.includes('return') && !q.includes('cagr')) return FAQ_DATA.find(f => f.id === 'cagr')
  if (q.includes('dividend') || q.includes('idcw')) return FAQ_DATA.find(f => f.id === 'dividend-tax')
  if (q.includes('sebi') || q.includes('regul') || q.includes('amfi')) return FAQ_DATA.find(f => f.id === 'sebi-role')
  if (q.includes('kyc') || q.includes('document') || q.includes('pan')) return FAQ_DATA.find(f => f.id === 'kyc')
  if (q.includes('nfo') || q.includes('new fund') || q.includes('launch')) return FAQ_DATA.find(f => f.id === 'nfo')
  if (q.includes('equity fund') || q.includes('large cap') || q.includes('small cap') || q.includes('mid cap') || q.includes('index fund')) return FAQ_DATA.find(f => f.id === 'equity-funds')
  if (q.includes('debt fund') || q.includes('liquid fund') || q.includes('bond fund') || q.includes('gilt')) return FAQ_DATA.find(f => f.id === 'debt-funds')
  if (q.includes('hybrid') || q.includes('balanced') || q.includes('balanced advantage')) return FAQ_DATA.find(f => f.id === 'hybrid-funds')
  if (q.includes('aum') || q.includes('assets under')) return FAQ_DATA.find(f => f.id === 'aum')
  if (q.includes('swp') || q.includes('withdrawal plan')) return FAQ_DATA.find(f => f.id === 'swp')
  if (q.includes('stp') || q.includes('transfer plan')) return FAQ_DATA.find(f => f.id === 'stp')
  if (q.includes('exit load') || q.includes('redemption charge')) return FAQ_DATA.find(f => f.id === 'exit-load')
  if (q.includes('distributor') || q.includes('advisor') || q.includes('arn')) return FAQ_DATA.find(f => f.id === 'distributor-advisor')
  return null
}
