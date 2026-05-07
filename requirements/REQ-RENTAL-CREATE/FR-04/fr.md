# User Story: FR-04 — Step 1: Customer Selection

## 1. Description

**As an** operator
**I want to** search for a customer by phone number and select them, or create a new customer inline if they are not found
**So that** the rental is associated with the correct customer before configuring rental parameters

## 2. Context & Business Rules

* **Trigger:** Operator arrives at Step 1 of the Create Rental stepper (`/rentals/new`)
* **Rules Enforced:**
  * The search input is a phone number field; typing triggers a debounced search call to `GET /api/customers?phone={query}`
  * Debounce delay is 300 ms; minimum query length before triggering the search is 3 characters
  * Search results appear as options in a dropdown beneath the input; each option displays the customer's phone number, first name, and last name
  * If the API returns no results, a "Create new customer" option is shown at the bottom of the dropdown
  * Selecting an existing customer stores the `Customer` in `RentalStore` and advances the stepper to Step 2
  * Selecting "Create new customer" expands an inline form within the dropdown panel:
    * Phone field is pre-filled with the current search query and is read-only in the inline form
    * First name and last name fields are **required**
    * "Add customer" button submits a `POST /api/customers` request
    * On success, the new `Customer` is stored in the store and the stepper advances to Step 2
    * On error, a snackbar message is shown and the inline form remains open
  * Step 1 is complete only when a customer is stored in the store; the stepper blocks advancement if no customer is selected
  * Navigating back to Step 1 from a later step preserves the currently selected customer in the input

## 3. Non-Functional Requirements (NFRs)

* **Performance:** Debounced API calls only; in-flight search requests are cancelled when a new character is typed
* **Security/Compliance:** Phone numbers are transmitted over HTTPS; not logged at the component level
* **Usability/Other:** The phone field must use `type="tel"` and a numeric soft keyboard on mobile; touch targets are ≥ 48 px; "Add customer" button is disabled while the POST request is in flight

## 4. Acceptance Criteria (BDD)

**Scenario 1: Operator finds and selects an existing customer**

* **Given** the operator is on Step 1 and types a phone number that matches one or more customers
* **When** the search results appear and the operator taps a customer
* **Then** the customer is stored in `RentalStore`, the selected name and phone are displayed in the input field, and the stepper advances to Step 2

**Scenario 2: No results — operator creates a new customer**

* **Given** the operator types a phone number and the API returns an empty results list
* **When** the operator selects the "Create new customer" option
* **Then** an inline form appears with the phone pre-filled; first name and last name fields are shown as required

**Scenario 3: New customer is successfully created**

* **Given** the inline create form is open with phone `+79001234567`, first name `Anna`, last name `Ivanova`
* **When** the operator taps "Add customer"
* **Then** `POST /api/customers` is called with `phone: '+79001234567'`, `firstName: 'Anna'`, `lastName: 'Ivanova'`; on success the new customer is stored in the store and the stepper advances to Step 2

**Scenario 3a: Create form blocks submission when required fields are empty**

* **Given** the inline create form is open with phone pre-filled but first name or last name left blank
* **When** the operator taps "Add customer"
* **Then** the empty required field shows a validation error and the API call is not made

**Scenario 4: Customer creation fails**

* **Given** the inline form is submitted
* **When** the API returns an error
* **Then** a snackbar error message is shown; the inline form remains open and the operator can retry

**Scenario 5: Step 1 blocks advancement without a customer**

* **Given** the operator has not yet selected or created a customer
* **When** the operator attempts to proceed to Step 2
* **Then** the stepper remains on Step 1; the "Next" button is disabled

**Scenario 6: Returning to Step 1 preserves the selected customer**

* **Given** the operator has selected a customer and advanced to Step 2
* **When** the operator taps "Back" to return to Step 1
* **Then** the selected customer's phone number is still shown in the search input

## 5. Out of Scope

* Editing an existing customer's profile (handled in the Admin area and the Customer Section feature)
* Searching by name or email (phone-only search for operator speed)
* Paginating customer search results (dropdown shows the first page returned by the API)
