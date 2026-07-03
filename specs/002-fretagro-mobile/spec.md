# Feature Specification: FreteAgro Mobile — App do Motorista

**Feature Branch**: `002-fretagro-mobile`

**Created**: 2026-06-22

**Status**: Draft

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Account Activation & Login (Priority: P1)

The driver receives a WhatsApp invite link from the fleet owner, opens it on their phone,
and sets a personal password to activate their account. On every subsequent app open the
driver is logged in automatically. The login screen displays the fleet name so the driver
can confirm they are in the right system.

**Why this priority**: Without authentication no other feature is accessible. Invite-based
activation is the only supported onboarding path (self-registration is not available), so
this story must work reliably before anything else is built.

**Independent Test**: A freshly invited driver opens the invite link, sets a password,
logs into the app, and confirms the fleet name is displayed. On closing and reopening the
app the driver is already logged in without entering credentials again.

**Acceptance Scenarios**:

1. **Given** a driver has received a WhatsApp invite link, **When** they open the link and set
   a password, **Then** their account is activated and they are logged into the app.
2. **Given** a driver is logged in, **When** they close and reopen the app, **Then** they land
   directly on the home screen without being asked to log in again.
3. **Given** a driver opens the login screen, **When** the screen loads, **Then** the fleet name
   is visible alongside the login form.
4. **Given** a driver enters an incorrect password, **When** they submit the form, **Then** an
   error message is shown and no session is created.
5. **Given** a driver taps "Logout" on the profile screen, **When** confirmed, **Then** the session
   is ended and the login screen is shown.

---

### User Story 2 — Register a Complete Trip: Start → Advance Legs → Close (Priority: P2)

The driver starts a trip by entering origin, destination, cargo type, initial km, and the
freight value from the **Carta Frete** (the freight letter the driver receives at load pickup,
which contains weight, price per ton, and total freight value). The truck is filled automatically
from the driver's registration. The driver registers the km at each waypoint (departure, arrival
at loading point, arrival at unloading point, return to base) to create and close each leg of the
trip. The system calculates km per leg automatically. Before closing the trip the driver sees a
full summary (km vazio, km carregado, totals) and confirms. Once closed, the trip and its legs
cannot be modified.

**Why this priority**: This is the core workflow that replaces pen-and-paper. Every other feature
(expenses, sync, history) only adds value on top of a working trip registration flow.

**Independent Test**: A driver starts a trip, advances through all four waypoints recording km at
each step, views the auto-calculated leg summaries, and closes the trip. The trip appears in the
history list with correct km totals.

**Acceptance Scenarios**:

1. **Given** the driver has no active trip, **When** they tap "Iniciar viagem" and fill origin,
   destination, cargo type, and km inicial, **Then** a new trip and the first leg (vazio) are
   created with the driver's truck pre-filled.
2. **Given** the driver has an active trip in the first leg (vazio), **When** they record the
   km at the loading point, **Then** the vazio leg is closed, km_rodado is calculated, and a new
   carregado leg is opened.
3. **Given** a leg is closed, **When** the driver views the leg summary, **Then** km_rodado is
   shown; if a diesel refuel was linked to that leg, media_consumo (km/L) is also shown.
4. **Given** the driver is on the last open leg, **When** they record the final km and confirm
   closing the trip, **Then** the trip is marked as encerrada and can no longer be modified.
5. **Given** a trip is in progress, **When** the driver opens the app (even after a force-close),
   **Then** the active trip is restored exactly where it was left.
6. **Given** a driver already has an active trip, **When** they attempt to start a new trip,
   **Then** the action is blocked and a message instructs them to close the current trip first.
7. **Given** a driver has no truck assigned, **When** they attempt to start a trip, **Then** the
   action is blocked and a message instructs them to contact the fleet owner.

---

### User Story 3 — Register Expenses During a Trip (Priority: P3)

During a trip the driver records all expenses inline: diesel or Arla refuels (litros + price/liter,
name of posto, km, optional photo), and general expenses like borracharia, pátio, or pedágio
(value, optional description, optional photo). The system calculates the refuel total automatically.
The driver can see a running list of all expenses with the cumulative total at any time during
the trip.

**Why this priority**: Expense capture is the second most critical data flow — it replaces the
WhatsApp photo album and gives the fleet owner full cost visibility. It is independently testable
given an active trip.

**Independent Test**: During an active trip a driver records one diesel refuel, one Arla refuel,
one pedágio, and one borracharia with a photo. The expense list shows all four items with the
correct calculated total. The refuel value equals litros × price/liter.

**Acceptance Scenarios**:

1. **Given** an active trip, **When** the driver registers a diesel refuel with litros and
   price/liter, **Then** the total value is calculated as `litros × preco_por_litro` and displayed;
   manual entry of a total is not accepted.
2. **Given** an active trip, **When** the driver registers an Arla refuel, **Then** it is stored
   separately from diesel refuels under the same combustivel category.
3. **Given** an active trip, **When** the driver registers a borracharia, pátio, or pedágio expense
   with a value and optional description, **Then** it is saved and appears in the expense list.
4. **Given** the driver taps "Foto da nota" on any expense form, **When** they grant camera
   permission and take a photo, **Then** the photo is compressed and attached to the expense.
5. **Given** an active trip with recorded expenses, **When** the driver views the expense list,
   **Then** all expenses are listed with individual values and a running total at the bottom.
6. **Given** a refuel form with litros = 0 or preco_por_litro = 0, **When** the driver submits,
   **Then** the submission is rejected with a clear validation error.

---

### User Story 4 — Offline Operation & Automatic Sync (Priority: P4)

All driver actions in the field — starting a trip, advancing legs, recording expenses — work
completely without internet. Data is saved locally on the device immediately. When connectivity
is restored the app syncs automatically and the fleet owner sees the data on the web dashboard
without the driver doing anything manually. A connection status indicator is always visible when
offline. The driver can see which items are pending synchronization.

**Why this priority**: This is a non-negotiable constraint, not a feature enhancement. Without
offline support the app fails its primary use case (drivers in fields with poor connectivity)
and delivers no value compared to paper.

**Independent Test**: With the phone in airplane mode a driver starts a trip, registers two
expenses, and advances one leg. The app shows the offline indicator and a pending sync count.
After reconnecting, all data appears on the web dashboard within 30 seconds without any manual
action.

**Acceptance Scenarios**:

1. **Given** the device has no internet, **When** the driver starts a trip, advances a leg, or
   registers an expense, **Then** the action completes successfully and data is saved locally.
2. **Given** the device is offline, **When** any screen is displayed, **Then** an offline indicator
   is permanently visible; it is not hidden by any other UI state.
3. **Given** data was saved offline, **When** internet connectivity is detected, **Then** the app
   automatically syncs all pending items without requiring any driver action.
4. **Given** a sync is complete, **When** the driver views the sync status, **Then** there are zero
   pending items.
5. **Given** the driver views the pending sync screen, **When** there are unsynced items, **Then**
   each item is listed so the driver can confirm nothing was lost.

---

### User Story 5 — Trip History & Detail (Priority: P5)

The driver can see a list of all their past trips with date, route, and acerto status. Tapping a
trip opens the full detail: all legs with km, all expenses, and the corresponding acerto if
settled.

**Why this priority**: History provides the driver with a record for dispute resolution and
financial accountability. It is independently testable with pre-existing trips.

**Independent Test**: A driver with three closed trips opens the history screen, sees the list
with correct dates and routes, taps one trip, and sees the complete km and expense breakdown.

**Acceptance Scenarios**:

1. **Given** a driver has closed trips, **When** they open the history screen, **Then** trips are
   listed with date, origin–destination, and acerto status (pendente/realizado).
2. **Given** the history list, **When** the driver taps a trip, **Then** the detail screen shows
   all trechos with km values and all expenses with values and photos.
3. **Given** a trip with a linked acerto, **When** the driver views its detail, **Then** the acerto
   summary (commission, deductions, net value) is visible.

---

### User Story 6 — My Acerto: Financial Summary (Priority: P6)

The driver can see their current pending acerto balance (commission generated from trips, total
deductions, net amount receivable) and the full history of past acertos with payment dates. Each
settled acerto has a viewable receipt.

**Why this priority**: Financial transparency reduces the need for drivers to call the fleet owner
for balance queries. Independently testable with existing acerto data.

**Independent Test**: A driver opens "Meu Acerto", sees the correct pending balance, taps a past
settled acerto, and views the receipt.

**Acceptance Scenarios**:

1. **Given** a driver with active trips, **When** they open "Meu Acerto", **Then** the current
   pending balance shows commission generated, total deductions, and net receivable.
2. **Given** the driver views the acerto screen, **When** there are settled past acertos, **Then**
   the history list shows each acerto with net value paid and settlement date.
3. **Given** a settled acerto in the history, **When** the driver taps it, **Then** the receipt
   is displayed.

---

### User Story 7 — Home Screen: Active Trip & Status (Priority: P7)

The home screen shows whether there is an active trip (with a shortcut to continue it), the
driver's pending acerto balance, and a prominent offline indicator when there is no internet.

**Why this priority**: The home screen is the entry point for every session. It reduces navigation
steps for the most common flows but is independently testable without any specific feature changes.

**Independent Test**: A driver with an active trip and a pending acerto balance opens the app.
The home screen shows the active trip banner (correct route), the pending balance summary, and
(with airplane mode on) the offline indicator.

**Acceptance Scenarios**:

1. **Given** the driver has an active trip, **When** they open the app, **Then** a banner shows
   the active trip with a "Continuar" shortcut that opens the trip directly.
2. **Given** no active trip, **When** the driver opens the app, **Then** the banner shows "Nenhuma
   viagem em andamento" and a "Iniciar viagem" call-to-action.
3. **Given** the driver is offline, **When** the home screen is displayed, **Then** a prominent
   offline indicator is shown.
4. **Given** the driver has a pending acerto balance, **When** they view the home screen, **Then**
   the net amount receivable is visible without navigating to "Meu Acerto".

---

### User Story 8 — Driver Profile (Priority: P8)

The driver can view their registered name, WhatsApp number, linked truck, and commission
percentage. They can log out from this screen.

**Why this priority**: Profile is informational and low-impact, useful for confirming data
correctness and for logout.

**Independent Test**: A driver opens the profile screen and sees their name, truck plate, and
commission rate matching what the fleet owner registered.

**Acceptance Scenarios**:

1. **Given** a logged-in driver, **When** they open the profile screen, **Then** name, WhatsApp,
   truck (plate + model), and commission percentage are displayed.
2. **Given** the driver taps "Sair", **When** they confirm the action, **Then** the session ends
   and the login screen is shown.

---

### Edge Cases

- Driver opens the app offline before any local data is cached → show only locally available data; no crash.
- Driver loses connectivity mid-expense registration → the partially entered form is preserved on reopen; the data is not lost.
- Driver enters a km value lower than the previous km for a leg → submission is rejected with a validation error explaining the expected minimum km.
- Driver tries to advance a leg or close a trip while there is an open (not-yet-closed) previous leg → the action is blocked with a clear message.
- Device storage is critically low while saving offline data → the app shows a storage warning; already-saved data is not corrupted.
- Sync conflict: the same record was modified offline and on the web simultaneously → the most recent change by timestamp wins; no silent data loss.
- Driver opens invite link after it has expired → an error screen explains the link is invalid and instructs them to ask the fleet owner for a new one.
- Driver submits refuel with only one of the two required fields (litros or preco_por_litro) → the form blocks submission and highlights the missing field.
- A trip is closed with no expenses recorded → the close flow completes normally; zero expenses is a valid state.

---

## Requirements *(mandatory)*

### Functional Requirements

#### Authentication

- **FR-001**: The system MUST support driver account activation via an invite link; drivers MUST be able to set their own password during activation.
- **FR-002**: Once logged in, a driver's session MUST persist across app restarts until they explicitly log out.
- **FR-003**: The login screen MUST display the fleet name associated with the driver's account.
- **FR-004**: Drivers MUST NOT be able to self-register; only accounts created by the fleet owner are activatable.

#### Home Screen

- **FR-005**: The home screen MUST display a banner indicating whether an active trip exists, with a direct shortcut to continue it.
- **FR-006**: The home screen MUST display the driver's current pending acerto balance (net amount receivable).
- **FR-007**: An offline indicator MUST be permanently visible on every screen whenever the device has no internet connection.

#### Trip Management

- **FR-008**: The driver MUST be able to create a new trip directly from the mobile app by providing origin, destination, cargo type, initial km, and the freight value (`valorBruto` in centavos) from the Carta Frete received at load pickup. The truck is filled automatically from the driver's profile. The fleet owner does NOT need to pre-create the trip on the web for the driver to start it.
- **FR-008a**: `valorBruto` is optional at trip creation — if the driver does not yet have the Carta Frete, it may be left blank (defaults to 0) and updated later by the fleet owner on the web dashboard.
- **FR-009**: A driver with no linked truck MUST be blocked from starting a trip.
- **FR-010**: Only one trip can be active per driver at a time; starting a new trip while one is active MUST be blocked.
- **FR-011**: A trip is composed of one or more `TrechoKm` records; each trecho MUST carry `tipo` (vazio or carregado), `km_inicial`, and `km_final`.
- **FR-012**: The system MUST automatically calculate `km_rodado` for each leg as `km_final − km_inicial`.
- **FR-013**: When a diesel refuel is linked to a leg the system MUST calculate `media_consumo = km_rodado / litros_diesel`.
- **FR-014**: A leg with `km_final` set MUST NOT be editable or reopenable.
- **FR-015**: A trip with status `encerrada` MUST NOT be editable or reopenable.
- **FR-016**: Before closing a trip the driver MUST be shown a confirmation screen with km total vazio, km total carregado, km total da viagem, and total expenses.
- **FR-017**: On app open, if an active trip exists, its in-progress state MUST be fully restored.

#### Expenses — Refuel

- **FR-018**: A refuel expense MUST capture litros, preco_por_litro, and an optional receipt photo. Posto name (local) and km at the refuel point (kmAtual) are optional — drivers often record refuels after the fact and may not have this information available.
- **FR-019**: The system MUST calculate refuel value as `litros × preco_por_litro`; manual entry of a total value is forbidden.
- **FR-020**: Diesel and Arla refuels MUST be stored as separate records under the combustivel category.
- **FR-021**: A refuel with litros ≤ 0 or preco_por_litro ≤ 0 MUST be rejected with a validation error.

#### Expenses — General

- **FR-022**: General expenses MUST capture a category (borracharia, pátio, pedágio), a value, an optional description, and an optional photo.
- **FR-023**: The expense list for the active trip MUST show all expenses with their values and a running total.

#### Photos

- **FR-024**: The camera permission MUST be requested only when the driver taps a "Foto da nota" action; it MUST NOT be requested at app launch.
- **FR-025**: All photos MUST be compressed before being uploaded to the server.

#### Offline & Sync

- **FR-026**: Starting a trip, advancing a leg, and registering an expense MUST be possible without internet connectivity.
- **FR-027**: All locally saved data MUST be automatically synchronized with the server when internet connectivity is restored; no manual driver action is required.
- **FR-028**: The driver MUST be able to view a list of items pending synchronization.

#### History

- **FR-029**: The trip history screen MUST list all the driver's closed trips with date, route (origin–destination), and acerto status.
- **FR-030**: The trip detail screen MUST display all trechos with km data and all expenses with values and attached photos.

#### Acerto

- **FR-031**: The "Meu Acerto" screen MUST display the current pending balance: commission generated, total deductions, and net amount receivable.
- **FR-032**: The acerto history MUST list all settled acertos with net value paid and settlement date.
- **FR-033**: Each settled acerto MUST have a viewable receipt.
- **FR-034**: The driver's acerto data is read-only in the mobile app; modifications are made exclusively by the fleet owner through the web dashboard.

#### Profile

- **FR-035**: The profile screen MUST display the driver's name, WhatsApp number, linked truck (plate + model), and commission percentage.
- **FR-036**: The driver MUST be able to log out from the profile screen.

---

### Key Entities

- **Motorista (Driver)**: The authenticated user of the mobile app. Has name, WhatsApp, email, commission percentage, and one linked truck. Created by the fleet owner; self-registration not permitted.
- **Caminhao (Truck)**: The vehicle assigned to the driver (1:1 relationship). Has plate and model. Automatically associated to any trip started by the driver.
- **Viagem (Trip)**: A complete trip from departure to return. **Created by the driver via the mobile app** — the driver provides origin, destination, cargo type, initial km, and the freight value from the Carta Frete; the truck is pre-filled from their profile. Has origin, destination, cargo type, status (em andamento / encerrada), date, freight value (`valorBruto`), and calculated km totals (vazio and carregado). `valorBruto` may be 0 if the Carta Frete was not yet available at departure and can be updated later by the fleet owner on the web. Belongs to one driver and one truck. Immutable once encerrada.
- **TrechoKm (Trip Leg)**: A segment of the trip with `tipo` (vazio or carregado), `km_inicial`, `km_final`, calculated `km_rodado`, and optional `media_consumo`. Belongs to one viagem. Immutable once `km_final` is set.
- **Despesa (Expense)**: A cost incurred during a trip. Has category (combustivel, borracharia, pátio, pedágio), subcategory (for combustivel: diesel or arla), value, optional description, and optional receipt photo. Belongs to one viagem.
- **Abastecimento (Refuel — subtype of Despesa)**: Carries litros, preco_por_litro, calculated valor, optional posto name (local), and optional km at time of refuel (kmAtual). Also carries an optional trechoId linking to the leg during which the refuel occurred, enabling media_consumo calculation (FR-013). Value is always computed, never entered manually.
- **Acerto (Settlement)**: The financial settlement for the driver. Has commission value, list of deductions, net payable, status (pendente / realizado), and settlement date. **Created and managed exclusively by the fleet owner on the web dashboard; read-only for the driver in the mobile app.**
- **Motorista / Caminhão management**: Creating, editing, or deleting driver and truck records is performed exclusively by the fleet owner on the web dashboard. The driver cannot self-register or manage fleet entities.
- **SyncQueue**: The local record of driver actions that have not yet been synchronized with the server. Each entry has a timestamp used for last-write-wins conflict resolution.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A driver can activate their account and complete first login within 3 minutes of opening the WhatsApp invite link.
- **SC-002**: All core field operations (start trip, advance leg, register expense) succeed in airplane mode — zero network dependency for these actions.
- **SC-003**: Data recorded offline appears on the fleet owner's web dashboard within 30 seconds of the driver's device regaining internet connectivity.
- **SC-004**: A driver who has never used the app can complete the full trip workflow (start → register expenses → close trip) without any assistance, guidance, or training material.
- **SC-005**: A driver can advance a trip leg (record km and confirm) in under 60 seconds.
- **SC-006**: A driver can register a refuel expense including attaching a photo in under 90 seconds.
- **SC-007**: Zero closed trips or legs are ever reopened or modified — the immutability constraint has a 100% enforcement rate.
- **SC-008**: A driver can never view or interact with trips, expenses, or acertos belonging to another driver or fleet.
- **SC-009**: The home screen displays the pending acerto balance within 2 seconds of app open, even when offline.
- **SC-010**: Drivers report in user feedback that they understand the offline indicator and trust their data is saved when shown it.

---

## Assumptions

- The driver's account (name, WhatsApp, email, truck, commission rate) is fully created and configured by the fleet owner through the web dashboard before the driver receives the invite link.
- Each driver has exactly one truck permanently assigned; the app never presents a truck selection screen.
- The app targets Android as the primary platform. The same functional requirements apply to iOS; any platform-specific constraints are implementation concerns, not spec concerns.
- A standard trip follows a four-waypoint sequence (base → carregamento → descarregamento → base), producing three legs: vazio → carregado → vazio. Additional intermediate legs may exist but are not required.
- Additional intermediate stops (multiple unloading points, extra intermediate bases) are out of scope for v1; the spec covers the canonical 3-leg trip.
- Photo attachments for expenses are optional in v1; the driver can save an expense without a photo.
- The fleet owner's web dashboard is already operational (fretagro-web); the mobile app consumes the same data store but does not alter the web schema.
- An initial internet connection is required for first-time account activation and login; after the first successful login the driver can operate fully offline.
- Acerto calculation is performed exclusively by the web platform. The mobile app displays pre-calculated acerto values; it does not calculate settlements independently.
- Drivers are adults with basic Android smartphone proficiency; detailed onboarding tutorials are out of scope for v1.
