# Cost Breakdown Pattern Codes

Every equipment line in a rental cost calculation / quote carries a **cost breakdown** explaining how the line's
`itemCost` was derived. It is emitted as a `calculationBreakdown` object on each
`EquipmentCostBreakdownResponse`:

```json
{
  "breakdownPatternCode": "breakdown.cost.degressive_hourly.standard",
  "message": "7h 0min degressive: 9+7+5+3+3*1 = 27",
  "params": { "hours": 7, "minutes": 0, "rateBreakdown": "9+7+5+3+3*1", "total": "27" }
}
```

| Field                  | Meaning                                                                                          |
|------------------------|--------------------------------------------------------------------------------------------------|
| `breakdownPatternCode` | Stable i18n key — **the key the frontend branches on / localizes**. Never branch on `message`.   |
| `message`              | Pre-rendered English **fallback** string (built server-side via `String.format`). Not localized. |
| `params`               | Structured context object — the numeric parts the frontend feeds into its own localized template. |

The backend does **not** resolve `breakdownPatternCode` against a message bundle — the string is shipped as-is for
the frontend to translate using `params`. Monetary values inside `message`/`params` are rendered with the money
value object's formatting (the examples below omit the currency suffix for brevity).

Source of truth:
[`BreakdownCostDetails`](../service/src/main/java/com/github/jenkaby/bikerental/tariff/BreakdownCostDetails.java)
(codes + `params` records) and the `calculateCost` methods of each
[`*TariffV2`](../service/src/main/java/com/github/jenkaby/bikerental/tariff/domain/model) model (message templates).

> **Maintenance rule:** whenever you add or change a `BreakdownCostDetails` subtype, its `Details` record, or a
> `calculateCost` message template, update this catalogue in the same change.

Notation in the templates below: `{field}` = a value taken from `params`; `+`, `*`, `/`, `( )` are literal.

---

## Zero / special

### `breakdown.cost.zero`
- **When:** any tariff, non-positive (zero or negative) billed duration.
- **params:** `null`.
- **Template:** `0 min: 0.00`
- **Example:** `0 min: 0.00`

### `breakdown.cost.special`
- **When:** a `SPECIAL` tariff is applied to a single equipment line (operator-set fixed price).
- **params:** `null`.
- **Template:** `Special tariff`
- **Example:** `Special tariff`

### `breakdown.cost.special.group`
- **When:** special pricing applied to the whole rental group (one line per item, group total set separately).
- **params:** `null`.
- **Template:** `Special tariff applied to group`
- **Example:** `Special tariff applied to group`

---

## Flat hourly (`FlatHourlyTariffV2`)

### `breakdown.cost.flat_hourly.minimum`
- **When:** billed duration ≤ the tariff's minimum duration — charged as half the hourly rate plus the surcharge.
- **params:** `{ durationMinutes: int, rate: string, surcharge: string, total: string }`
- **Template:** `{durationMinutes}min minimum: {rate}/2 + {surcharge} = {total}`
- **Example:** `30min minimum: 15/2 + 1 = 8.5`

### `breakdown.cost.flat_hourly.standard`
- **When:** one or more full hours. `partial` is a literal placeholder for the fractional-hour amount already folded
  into `total` (billed in 5-minute intervals at `rate/12`).
- **params:** `{ hours: int, minutes: int, rate: string, total: string }`
- **Template:** `{hours}h {minutes}min flat: {hours}*{rate} + partial = {total}`
- **Example:** `2h 15min flat: 2*15 + partial = 33.75`

### `breakdown.cost.flat_hourly.minutes_only`
- **When:** above the minimum duration but under one full hour.
- **params:** `{ minutes: int, total: string }`
- **Template:** `{minutes}min flat: {total}`
- **Example:** `45min flat: 11.25`

---

## Daily (`DailyTariffV2`)

### `breakdown.cost.daily.standard`
- **When:** a whole number of days with no leftover hours/minutes (includes the sub-one-day case, billed as one day).
- **params:** `{ days: int, total: string }`
- **Template:** `{days}d = {total}`
- **Example:** `1d = 25` · `3d = 75`

### `breakdown.cost.daily.overtime`
- **When:** whole days plus leftover hours/minutes charged at the overtime hourly rate.
- **params:** `{ days: int, hours: int, minutes: int, total: string }`
- **Template:** `{days}d + {hours}h {minutes}min = {total}`
- **Example:** `2d + 3h 20min = 61.67`

---

## Flat fee (`FlatFeeTariffV2`)

### `breakdown.cost.flat_fee`
- **When:** a per-calendar-day issuance fee.
- **params:** `{ fee: string, days: int, total: string }`
- **Template:** `Flat fee: {fee}*{days}d = {total}`
- **Example:** `Flat fee: 3*2d = 6`

---

## Degressive hourly (`DegressiveHourlyTariffV2`)

The per-hour rate starts at `firstHourPrice` and decreases by `hourlyDiscount` each hour down to a
`minimumHourlyPrice` floor. `rateBreakdown` lists each hour's rate joined by `+`. **Consecutive equal rates are
collapsed** into `count*rate` (a run of two or more only); a single hour stays bare. This keeps the string compact
for long rentals whose later hours all sit at the floor.

### `breakdown.cost.degressive_hourly.minimum`
- **When:** billed duration ≤ the tariff's minimum duration.
- **params:** `{ durationMinutes: long, rate: string, surcharge: string, total: string }`
- **Template:** `{durationMinutes}min minimum: {rate}/2 + {surcharge} = {total}`
- **Example:** `30min minimum: 9/2 + 1 = 5.5`

### `breakdown.cost.degressive_hourly.standard`
- **When:** one or more full hours. A trailing partial hour appends `{intervals}*({nextHourRate}/12)`.
- **params:** `{ hours: long, minutes: long, rateBreakdown: string, total: string }`
- **Template:** `{hours}h {minutes}min degressive: {rateBreakdown} = {total}`
- **Examples:**
  - distinct rates: `4h 0min degressive: 9+7+5+3 = 24`
  - collapsed floor run: `7h 0min degressive: 9+7+5+3+3*1 = 27`
  - with partial hour: `1h 8min degressive: 9+1*(7/12) = 9.58`

### `breakdown.cost.degressive_hourly.minutes_only`
- **When:** above the minimum duration but under one full hour — a single partial-hour fragment.
- **params:** `{ minutes: long, rateBreakdown: string, total: string }`
- **Template:** `{minutes}min degressive: {rateBreakdown} = {total}`
- **Example:** `40min degressive: 8*(9/12) = 6`
