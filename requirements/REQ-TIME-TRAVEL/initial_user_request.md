# Initial User Request — REQ-TIME-TRAVEL

## Original Request

> I need a new feature - time travel that allow to set a time and send request to API, then subscribe on SSE to get the API server time. Also this feature allows to reset the time via endpoint.
> Requirements:
> - location - in the middle of the app toolbar for all applications - operator and admin.
> - initial information - the server time. Click on the time open dialog with datetime picker and 2 buttons: save and reset
> - feature must be under feature flag - time-travel-enabled. By default it's enabled only for development but can be overridden via env variable.
> - no need test coverage

## Clarifications Gathered

| Question                         | Answer                                                                                                                                                                                                          |
|----------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| API endpoints                    | Pre-generated `TimeTravelControllerService`: `GET /api/dev/time` (SSE), `PUT /api/dev/time` (set), `DELETE /api/dev/time` (reset). Subscribe to SSE immediately on init — no separate initial-time call needed. |
| SSE event format                 | Server pushes every second: `{"instant":"2026-05-22T05:03:52.442739805Z","fixed":false}`                                                                                                                        |
| Time display format              | `dd/MM HH:mm:ss`                                                                                                                                                                                                |
| Active time-travel visual marker | None — same appearance regardless of `fixed` state                                                                                                                                                              |
| Feature flag mechanism           | `timeTravelEnabled: boolean` in shared `environment.ts` files; default `true` in dev, `false` in prod                                                                                                           |
| Apps in scope                    | Admin and Operator only (not Gateway)                                                                                                                                                                           |
| Dialog pre-fill                  | Current server time from SSE signal                                                                                                                                                                             |
| Post-save / post-reset behavior  | Close dialog immediately on successful API response                                                                                                                                                             |
| SSE disconnect                   | Show initial dashes (`--/-- --:--:--`)                                                                                                                                                                          |
| CI/CD override                   | Same placeholder-`sed` pattern used for `apiUrl`; variable named `BIKE_TIME_TRAVEL_ENABLED`                                                                                                                     |
