# Bank-Specific Description Extraction Rules for Inbox & Review

This plan details the design and architecture for adding user-defined Description rules to the Gmail Inbox & Review engine in Chuvadi. Rules can be scoped to specific bank accounts (or applied globally) and dynamically extract the transaction payee/description from email text between markers or via custom patterns, falling back to smart merchant detection when no rule matches.

## User Review & Critical Decisions

> [!IMPORTANT]
> The following design decisions were confirmed during the clarification interview:

- **Confirmed Decision 1 (Extraction Mechanism)**: Description rules will extract text **dynamically** between keywords or patterns (e.g., text between `"paid to "` and `" on "`, or via regex capture groups) rather than merely replacing with static text.
- **Confirmed Decision 2 (Bank Account Scoping)**: Each rule includes an optional bank account filter (**"Any Account"** vs. a **Specific Bank Account** like *HDFC Salary* or *ICICI Card*).
- **Confirmed Decision 3 (Fallback Strategy)**: When no custom description rule matches an incoming email, the engine falls back to the existing smart merchant and payee extraction heuristics.

---

## 1. Overview & Core Concept

Currently, the Gmail review engine supports user-defined rules for assigning **Account** (e.g., card ending 4091 $\rightarrow$ HDFC Millennia) and **Category** (e.g., Swiggy $\rightarrow$ Food & Dining). However, the **Description** field relies solely on built-in regex heuristics.

This enhancement introduces **Description Rules**:
1. Users can define custom extraction patterns specific to how their bank formats transaction alert emails (e.g., HDFC's *"Info: <Merchant> on <Date>"*, ICICI's *"VPA <UPI-ID> credited"*, or Axis Bank's *"towards <Merchant> via Card"*).
2. Rules can be constrained to a single bank account or left open to match across all accounts.
3. Users receive an interactive **Live Pattern Tester** in the rule editor to paste a sample email snippet and preview the extracted description instantly before saving.

---

## 2. User Experience & Visual Design

### A. Rules Tab Enhancements (`RulesTab.tsx`)
- **Target Field Segmented Selector**: Updated to offer three distinct targets: `Account`, `Category`, and `Description`.
- **Bank Account Scoper Dropdown**:
  - `Any Bank Account (Global)`
  - Direct selection of any configured account (e.g., `HDFC Salary (•••• 4091)`, `ICICI Credit Card`).
- **Dynamic Extraction Mode for Description**:
  - **Between Markers (Default & Accessible)**:
    - *Start Marker*: Substring immediately preceding the description (e.g., `"to "`, `"at "`, `"towards "`, `"VPA "`).
    - *End Marker*: Substring immediately following the description (e.g., `" on "`, `" via "`, `" using "`, `"\n"`, `","`).
  - **Regular Expression (Advanced)**:
    - Custom regex with capture group `(...)` (e.g., `(?:at|towards)\s+([A-Za-z0-9\s&'-]+?)(?:\s+on|\.|$)`).
- **Interactive Live Tester Box**:
  - Embedded sample text input within the modal where the user can paste any email line (e.g., *"INR 1,240.00 spent on Card ending 4091 at SHELL VELACHERY CHENNAI on 14-OCT-26"*).
  - Displays a live badge showing the exact extracted text: `Result: "SHELL VELACHERY CHENNAI"`.

### B. Review Tab Integration (`ReviewTab.tsx`)
- **Suggested Entry Card**:
  - When a user-defined description rule triggers, the Description preview row displays the rule-extracted text with an indicator (e.g., `Desc: SHELL VELACHERY (Rule: HDFC Shell)`).
  - When no custom rule matches, it seamlessly displays the fallback parsed merchant name.

### C. Design Discipline & Anti-Slop Compliance
- Strict **60-30-10** color distribution (dark slate canvas, hairline slate borders, amber focus accents).
- **No pill badge clutter**: Inline metadata uses clean text separators (`·`).
- Monospace font with `tabular-nums` used for account numbers and rule preview indices.
- All interactive controls use accessible touch targets ($\ge 44\text{px}$) and clear, natural labels (`"Add Description Rule"`, `"Test Pattern"`).

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Dual-Mode Dynamic Extraction (Between Markers + Regex)**
  - *Chosen Approach*: Provide a simple **"Between Markers"** builder as the primary interface, with an optional **"Regex Pattern"** toggle for complex banking formats.
  - *Why*: Most users do not know regular expression syntax; `"Between Marker A and Marker B"` covers 90% of banking SMS/email formats (e.g., *"towards [X] on"*). Power users still retain full regex capability.
  - *Alternatives Considered*: Requiring raw regex only (too error-prone for everyday users) or fixed text replacement only (cannot capture variable payees/merchants).

- **Decision 2: Account Scoping Resolution Hierarchy**
  - *Chosen Approach*: Specific account rules take precedence over global ("Any Account") rules. Account matching happens first (via account rules or last-4 digits), and then account-scoped description rules are evaluated.
  - *Why*: Different banks format emails completely differently. A rule designed for HDFC's sentence structure should not distort emails from SBI or ICICI.

- **Decision 3: Zero-Risk Fallback**
  - *Chosen Approach*: If an extraction rule matches an email's keywords but produces an empty string or whitespace, the system gracefully falls back to the smart merchant extractor rather than leaving a blank description.

---

## 4. Technical Architecture & Data Strategy

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            Gmail Inbox & Review                             │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ Raw Message (Subject, Body, Snippet)
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                 Phase 1: Account & Last-4 Identification                    │
│   1. Match user custom 'ACCOUNT' rules                                      │
│   2. Match account via last 4 digits (e.g. •••• 4091)                       │
│   3. Resolve active Account ID (e.g. acc_hdfc_4091)                         │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ Resolved Account Context
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                 Phase 2: Description Extraction Engine                      │
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │ Check User 'DESCRIPTION' Rules                                      │   │
│   │   • Specific Account Match (r.accountId === resolvedAccId)          │   │
│   │   • Global Account Match (r.accountId is null/empty)                │   │
│   │                                                                     │   │
│   │ Dynamic Extractor:                                                  │   │
│   │   • Between Markers: text.slice(startIdx + len, endIdx)             │   │
│   │   • Regex: pattern.exec(text)[1]                                    │   │
│   └──────────────────────────────────┬──────────────────────────────────┘   │
│                                      │                                      │
│                     ┌────────────────┴────────────────┐                     │
│               [Match found]                     [No match / empty]          │
│                     │                                 │                     │
│                     ▼                                 ▼                     │
│            Use Extracted Text            Fallback: extractMerchantFromText  │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                   ReviewTab Preview & TransactionModal                      │
│   Pre-populates suggestedDescription with rule-extracted text               │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Data Schema Changes (`src/types.ts`)

```typescript
export type FieldSuggestionRuleType = 'ACCOUNT' | 'CATEGORY' | 'DESCRIPTION';

export type DescriptionExtractMode = 'BETWEEN' | 'REGEX';

export interface FieldSuggestionRule {
  id: string;
  keyword: string; // Trigger phrase in email (e.g. "Alert: Update on your card", "VPA", "debited for")
  targetType: FieldSuggestionRuleType;
  targetValue: string; // accountId (for ACCOUNT), category (for CATEGORY), or template/notes (for DESCRIPTION)
  
  // Bank Account Scoping: null/undefined = All Accounts; or specific account.id
  accountId?: string | null;

  // Dynamic Extraction Configuration (used when targetType === 'DESCRIPTION')
  extractMode?: DescriptionExtractMode;
  startMarker?: string; // Substring before merchant/payee
  endMarker?: string;   // Substring after merchant/payee
  regexPattern?: string; // Custom regex pattern with capture group (1)

  label?: string;
  enabled: boolean;
  createdAt: number;
}
```

### Affected Files & Scope
1. `src/types.ts`: Extend `FieldSuggestionRuleType` and `FieldSuggestionRule` with `accountId`, `extractMode`, `startMarker`, `endMarker`, and `regexPattern`.
2. `src/services/gmail.ts`:
   - Enhance `applyFieldSuggestionRules` to resolve description dynamically using account-scoped and global rules.
   - Implement `extractTextBetweenMarkers` and `extractTextByRegex` helpers with sanitization.
   - Maintain seamless fallback to `extractMerchantFromText`.
3. `src/components/finance/RulesTab.tsx`:
   - Add `Description` tab/option in the Rule form.
   - Add Bank Account dropdown selector.
   - Add Marker & Regex extraction input controls.
   - Add real-time **Test with Sample Text** validation preview.
   - Render bank badge and extraction preview on rule cards.
4. `src/components/finance/InboxReviewTab.tsx`: Pass updated rules to email processing and `ReviewTab`.
5. `src/components/finance/ReviewTab.tsx`: Reflect the rule-extracted description on review cards.
