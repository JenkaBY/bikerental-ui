# Task 021: i18n for terminal settlement and removal of the interim label

> **Applied Skill:** AGENTS.md "i18n Rules" - extract, then add the Russian `<target>` in the same change. Project memory "Manual i18n msgid" - `npm run i18n:extract` works and writes only `messages.xlf`.

## 1. Objective

Extract the one new string (`pointSettlementRecordedMessage`, task 020), add its Russian target (additions only), and remove `Labels.PointActionNotAvailableYet` now that nothing uses it. No other new visible text exists: the dialog reuses `Labels.PointMoveSettlementDate` ("Settlement date" -> existing «Дата зачисления»), `FormErrorMessages.settlementDateRequired` / `settlementDateFuture`, and `Labels.PointRecordSettlement` (existing «Зачислить в банк»). No new "point" wording is introduced (if any appears, use «пункт»).

Requires tasks 020 and FR-04 task-006 (both interim `onSettle` handlers must be gone before the label is removed).

## 2. File to Modify / Create

* **File Path:** `projects/shared/src/shared/constant/labels.ts` - **Action:** Modify Existing File
* **File Path:** `projects/shared/src/locale/messages.xlf` - **Action:** Regenerated (never hand-edit)
* **File Path:** `projects/shared/src/locale/messages.ru.xlf` - **Action:** Modify Existing File (additions only)

## 3. Code Implementation

**Step 1 - confirm the label is unused**, then delete its line from `labels.ts`:

```bash
git grep -n "PointActionNotAvailableYet" -- projects
```

Expected: only the definition `static readonly PointActionNotAvailableYet = $localize\`This action is not available yet\`;` in `labels.ts`. If any other usage is listed, stop and report it instead of deleting. Otherwise delete that single line.

**Step 2:**

```bash
npm run i18n:extract
```

**Step 3 - `messages.ru.xlf`.** Open `projects/shared/src/locale/messages.xlf`, find the new unit with source `Settlement recorded: <x id="amount" equiv-text="amount"/>` and copy its `id`. Directly after the existing unit whose source is `Collected: <x id="amount" equiv-text="amount"/>` in `messages.ru.xlf` add (substitute the real id):

```xml
      <trans-unit id="REAL_ID_FROM_messages.xlf" datatype="html">
        <source>Settlement recorded: <x id="amount" equiv-text="amount"/></source>
        <target>Зачислено в банк: <x id="amount" equiv-text="amount"/></target>
      </trans-unit>
```

Do NOT change or delete any existing unit. The orphaned Russian unit for "This action is not available yet" stays in `messages.ru.xlf` untouched (extra units there are harmless).

## 4. Validation Steps

Execute the following commands to ensure this task was successful. Do NOT run the full application server.

```bash
npm run i18n:check
npx ng build admin --configuration development
npm run lint
```
