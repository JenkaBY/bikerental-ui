# User Story: FR-03 — Business Settings Page: Rental-Point Level (Override and Reset to Network)

> **Status: Deferred (2026-11-06).** The delivered backend (`JenkaBY/bike-rental` #331) permits no `POINT` level yet (`422 settings.level.not_permitted`), and FR-02 was revised to single-setting changes without a draft or batch save. Revisit this story, and adapt it to per-setting change/reset requests, once a setting permits `POINT`.

> **Depends on:** FR-01 (contract, type registry) and FR-02 (the page, draft, save bar, batch save
> and conflict handling, which this story extends to point-level changes).

## 1. Description

**As an** admin user
**I want to** switch the Business settings page to a specific rental point, see which settings it
inherits from the network and which it overrides, and override or reset them
**So that** individual points can run with their own rules (e.g. a longer quota at a busy point)
while everything else stays in line with the network

## 2. Context & Business Rules

* **Trigger:** On `/settings`, the admin chooses **"Rental point"** in the scope switcher and picks
  a point
* **Rules Enforced:**
  * **Scope switcher** in the page header: **"Вся сеть / Whole network"** | **"Точка проката /
    Rental point"**. "Whole network" is the default when the page opens
  * **Point select** appears next to the switcher when "Rental point" is chosen:
    - lists rental points by name, showing the slug as secondary text
    - only points with status ACTIVE are listed; inactive and permanently closed points are not
      (decided, Q5)
    - until a point is picked, the setting list shows the prompt "Choose a rental point"
    - the last chosen point is remembered while the admin stays on the page
  * **Category badges in point mode** show the number of settings in that category that the
    selected point **overrides** (saved overrides plus overrides added in the draft, minus resets in
    the draft); a category with zero overrides shows no badge or "0"
  * **Row states in point mode**, decided per setting:
    - **Inherited** (setting allows points, the point has no own value): the control is read-only
      and shows the network value (or the catalog default when no network value exists), with an
      "Inherited from network" note and an **"Override for point"** button
    - **Overridden** (the point has its own value): the control is editable and shows the point
      value, with a secondary line **"Network: <value>"** (formatted per type) and a **"Reset to
      network"** button
    - **Network only** (setting allows only the whole network): the control is locked, with the
      note **"Not configurable per point"** and no buttons
  * **"Override for point"**: adds a draft override for this point, pre-filled with the current
    network value; the row turns *Overridden*, becomes editable and shows the "Edited" marker.
    Nothing is sent until Save
  * **"Reset to network"**:
    - for a **saved** override: adds a draft removal; the row shows the network value read-only,
      the "Edited" marker and an "Override will be removed" note, with an "Undo" action that cancels
      the removal
    - for an override that exists **only in the draft**: simply drops it, and the row returns to
      *Inherited* without a marker
    - on save, the point's own value is deleted, so the point inherits again
  * **Overriding with the same value as the network** is allowed and saved as an override (the
    point then stays fixed even if the network value changes later)
  * **One draft across scopes:** edits to the network and to any number of points accumulate in
    one draft. Switching scope or point never discards edits. The save bar counter counts every
    change across all scopes, and Save sends all of them in one batch (FR-02)
  * **Network edits and inherited rows:** if the network value of a setting is edited in the
    draft, inherited rows in point mode keep showing the **saved** network value until the change
    is saved (the "Network: <value>" line likewise shows the saved network value)
  * **Whole-network mode** keeps FR-02 behaviour; its "Overridden in N points" chip reflects saved
    data only and is refreshed after each save
  * **Validation** of point values uses the same definition constraints as network values (FR-01);
    an invalid point value disables Save exactly as in FR-02
  * **Conflict (409)** for a point-level change (another admin changed or removed the same point
    override, or created it first) follows FR-02: the batch is rejected, data reloads, the
    conflicting entries leave the draft and the warning names them as "<label> (<point name>)"
  * **Search** in point mode works as in FR-02 and keeps showing point-mode row states
  * **Leaving the page** with point-level changes in the draft asks for confirmation (FR-02)
  * **Load failure** of the selected point's values shows an error state with "Retry" in the
    settings area; the network draft is not lost

## 3. Non-Functional Requirements (NFRs)

* **Performance:** Switching to a point should show its rows within 1 second (at most one request
  for that point's values, or none if all point values were loaded with the page); switching back
  and forth does not reload data that is already loaded unless a save happened
* **Security/Compliance:** Admin-only. The backend rejects a point override of a network-only
  setting even if the UI were bypassed (FR-01)
* **Usability/Other:**
  * The three row states must be distinguishable at a glance (e.g. muted read-only control for
    Inherited, highlighted control for Overridden, lock icon for Network only)
  * All new chrome (switcher labels, point-select label and prompt, state notes, buttons, "Network:"
    prefix, "Override will be removed", "Undo", conflict wording) is localized in English and
    Russian, with Russian translations filled in the same change
  * Error handling follows the project's API error-handling rules

## 4. Acceptance Criteria (BDD)

**Scenario 1: Switch to a rental point**

* **Given** the admin is on `/settings` in "Whole network" mode
* **When** they choose "Rental point" and select point "Центр"
* **Then** the category badges show the number of overrides at "Центр" and each row shows the
  Inherited, Overridden or Network only state

**Scenario 2: Inherited row**

* **Given** "Quota duration" allows points, the network value is 60 and "Центр" has no own value
* **When** the admin views it for "Центр"
* **Then** a read-only control shows 60 with "Inherited from network" and an "Override for point"
  button

**Scenario 3: Override a setting**

* **Given** the row from Scenario 2
* **When** the admin clicks "Override for point" and changes the value to 90
* **Then** the row is editable, shows 90, "Network: 60 min", the "Edited" marker and "Reset to
  network"; the category badge increases by one; the save bar counts one change

**Scenario 4: Network-only setting is locked**

* **Given** a setting that allows only the whole network
* **When** the admin views it for any point
* **Then** the control is locked with "Not configurable per point" and no Override button

**Scenario 5: Reset a saved override**

* **Given** "Центр" has a saved override 90 for "Quota duration" and the network value is 60
* **When** the admin clicks "Reset to network"
* **Then** the row shows 60 read-only, "Override will be removed", the "Edited" marker and "Undo";
  after Save, the point's own value is deleted and the row shows Inherited with 60

**Scenario 6: Reset an unsaved override**

* **Given** the admin clicked "Override for point" but has not saved
* **When** they click "Reset to network"
* **Then** the row returns to Inherited and no change remains in the draft for it

**Scenario 7: One draft across network and points**

* **Given** the admin changed one network value, then overrode one setting at "Центр" and one at
  "Озеро"
* **When** they switch between scopes and points
* **Then** all three edits are kept, the counter reads "3 unsaved changes", and Save sends all
  three in one batch

**Scenario 8: Override counts refresh after save**

* **Given** "Quota duration" was overridden in 2 points
* **When** the admin saves a new override for it at a third point and returns to "Whole network"
* **Then** the chip reads "Overridden in 3 points"

**Scenario 9: Conflict on a point override**

* **Given** another admin removed the override of "Quota duration" at "Центр" after this admin
  loaded the page and edited it
* **When** this admin saves
* **Then** nothing is saved, data reloads, the row shows Inherited, and the warning names "Quota
  duration (Центр)"

**Scenario 10: Invalid point value**

* **Given** an overridden DURATION limited to 1–240 min
* **When** the admin enters 0
* **Then** the row shows the inline error and Save is disabled

**Scenario 11: No point chosen yet**

* **Given** the admin chose "Rental point"
* **When** no point is selected
* **Then** the settings area shows "Choose a rental point" and the draft is unchanged

## 5. Out of Scope

* Copying overrides from one point to another, or applying one override to several points at once
* A matrix view of one setting across all points
* Listing which points override a setting (only the count is shown)
* Point-level settings for inactive or permanently closed points
* Showing the point-level effective value as the operator sees it beyond the row states above
* Test files (MVP rule)

## 6. Open Questions

* **Q5 — decided:** only ACTIVE points can be selected; inactive and permanently closed points are
  hidden from the point select
* **Q6 — decided:** the selected scope and point stay in page state, not in the URL, in this
  story
