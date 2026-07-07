# Initial User Request — REQ-AGREEMENT

Rental agreement signing + admin management of agreement template versions (frontend).

Original request (Russian, verbatim summary of the agreed contract):

## Роль и принципы

1. **OpenAPI — единственный источник правды по контрактам.** Все пути, HTTP-методы, формы
   запросов/ответов, коды статусов и коды ошибок берутся из живой OpenAPI-спецификации
   (`http://localhost:8080/v3/api-docs/all`). Модели/DTO и клиентские сервисы генерируются
   (`npm run generate:api`), не пишутся руками.
2. **Максимум логики — на бэкенде.** Фронт не рассчитывает стоимости, не собирает PDF, не
   вычисляет момент начала аренды, не управляет hold'ами. Только отображение и оркестрация вызовов.
3. **Каждая функция — независимо мержимый срез** (FR-01..FR-05, отдельные ветки/PR).

## Модель состояний аренды

`DRAFT → AWAITING_SIGNATURE → ACTIVE`; из `AWAITING_SIGNATURE` возможны возвраты в `DRAFT`
(отмена подписания) и терминальный `CANCELLED` (клиент отказался). Переходы — одним эндпоинтом
`PATCH /api/rentals/{id}/lifecycles` с телом `{status, operatorId}`.

- **DRAFT** — состав/клиент редактируются; действие «Вывести на подписание» (непустой состав +
  выбранный клиент).
- **AWAITING_SIGNATURE** — редактирование состава заблокировано; действия: «Продолжить
  подписание», «Отменить подписание» (→DRAFT), «Отменить аренду» (→CANCELLED).
- **ACTIVE+** — блок «Соглашение подписано».

## Фенсинг-токен `version`

Объект аренды несёт одноразовый оптимистичный токен `version`. Перевод в AWAITING_SIGNATURE
возвращает аренду с актуальным `version`; он обязателен в запросе подписи вместе с `templateId`
прочитанного текста. Любой 409 при подписи = «данные устарели»: закрыть диалог, перезапросить
аренду и активный шаблон, показать сообщение по `errorCode`. При повторном открытии диалога
(после перезагрузки) `version` берётся из свежего GET аренды.

## Ответ на успешную подпись

Содержит только `{signatureId, signedAt}` — без объекта аренды. Успех означает переход в ACTIVE;
после успеха перезапросить карточку аренды (GET). Никаких polling/WebSocket/SSE.

## Ошибки

RFC 9457 ProblemDetail (`application/problem+json`): `errorCode` (машинный ключ), `detail`
(безопасен для показа), `correlationId`, опционально `params`, `errors[]`. Ветвление — по
`errorCode`. Каталог кодов — `docs/error-codes.md` бэкенд-репозитория (часть контракта).
Локализация сообщений по `errorCode` — на фронте.

## PDF подписанного соглашения

`GET /api/rentals/{rentalId}/signatures` — один путь, представление выбирается `Accept`:
`application/json` → массив 0..1 сводок; `application/pdf` → документ (404, если не подписано).

## Срезы

- **FR-01** — Admin UI управления версиями соглашения (CRUD шаблонов + предпросмотр PDF).
- **FR-02** — переиспользуемый компонент рисованной подписи (мышь/палец/стилус, без мыла на
  retina, страница не скроллится при рисовании, Clear, экспорт base64 PNG с data-URI префиксом).
- **FR-03** — поток подписания в оформлении аренды (ядро).
- **FR-04** — отображение подписанного соглашения + скачивание PDF.
- **FR-05** — удаление прямой активации DRAFT→ACTIVE из UI (готовится, мержится последним,
  координируется с ломающим изменением бэка).

## Definition of Done

Полный happy path кликается: создать черновик шаблона → предпросмотр → активировать → вывести
аренду на подписание → подписать пальцем на планшете → аренда ACTIVE в UI без перезагрузки →
PDF скачивается. Все 409-коды подписи обрабатываются осмысленно; состав недоступен для
редактирования в AWAITING_SIGNATURE; модели/сервисы сгенерированы из OpenAPI.

## Process decisions (confirmed by user)

- SDD without BA: design.md per FR is authored by the main session; no fr.md files.
- One branch per FR off `master`; commits grouped logically per slice branch.
- Admin editor is a large MatDialog (existing Admin CRUD pattern).
- FR-05 prepared on its own branch but NOT merged until backend ships the breaking change.
- No `npm run i18n:extract` runs. No tests (MVP rule).
