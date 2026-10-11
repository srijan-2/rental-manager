# AGENTS.md: rental-manager

Personal, single-user rental management app (buildings, units, tenants, rent, electricity). It is a working app with real data in it, so protect existing behaviour.

## Stack

- Expo 54, React Native 0.81, TypeScript (strict)
- UI: react-native-paper. Forms: react-hook-form. Navigation: React Navigation (bottom tabs + a stack for Units).
- State: Zustand stores in `src/store/`, persisted with AsyncStorage (`persist` middleware, keys `rm-*`).

## Data model (do not break)

- Hierarchy is Building -> Unit -> Tenant. Everything links by ID, never by display strings.
- Unit is unique by (buildingId, unitNumber), case-insensitive.
- Payments and electricity records reference `unitId`. Never match on unit number or name text.
- Tenant assign/update/remove must go through `src/store/actions.ts`, which keeps unit status and tenantId in sync. Screens must not call the raw tenant store methods for those.
- Display labels come from `formatUnitLabel()` in `src/utils/unitLabel.ts`.
- `Tenant.monthlyRent` is the source of truth for an occupied unit; `RentalUnit.monthlyRent` is only the default offered when assigning a tenant.

- A Payment is one billing-cycle bill per tenant (rent + electricity), in arrears: cycle k runs from addMonthsClamped(billingStartDate, k) to the day before cycle k+1; dueDate is the day after the cycle ends. Bills are created only by ensureBillSchedule.
- Bill status is derived (getBillStatus), never stored. The reading window opens on the cycle's last day via isReadingWindowOpen.
- Electricity advance is held on the tenant and is NOT deducted from bills.
- Never delete bills when a tenant is removed; unit changes after assigning a tenant are not allowed.
- Round money with roundMoney before storing.
- Dashboard and Payments summaries come only from getPaymentsSummary (utils/payments.ts) and getDashboardStats (utils/dashboard.ts). Never hardcode metrics or recompute them inline.
- Units with a tenant or billing history are never hard-deleted: archive them (archivedAt). Archived units are excluded from unit lists, tenant pickers and dashboard totals but their bills stay valid. Buildings can only be deleted when they have no units (archived included). Use the actions in src/store/actions.ts for unit/building edits and deletes.

## Hard rules

- Make the smallest change that does the task. No drive-by refactors, renames, or restyling.
- Do not edit `package.json`, `app.json`, `tsconfig.json`, `.gitignore` or lockfiles unless the task needs a new dependency. Do not delete files unless asked.
- No destructive commands: no `git reset`, `git clean`, `git checkout --`, `git push`, `rm -rf`. Do not commit. The owner commits.
- Ignore `.cursor/` completely.
- No mock or seed data. Stores start empty.
- If the task conflicts with the existing code or something is unclear, stop and ask instead of guessing.

## Code style

- Write normal multi-line code, formatted with Prettier (`.prettierrc`). Never write minified or one-line code.
- No unused imports, variables or dead code.
- Reuse existing helpers: `formatINR`, `formatINRInput`, `parseCurrencyInput`, `toISODate`, `parseISODate`, `todayISO`, `formatIndianDate`, `calculateUnitsConsumed` and friends in `src/utils/`.
- Keep colours and spacing consistent with `src/theme/appTheme.ts` and `src/styles/layout.ts`.

## Known pitfalls (avoid these)

- **Dates:** never use `toISOString()` for dates (UTC shifts them a day in IST). Never use `new Date("YYYY-MM-DD")`. Use the local-date helpers in `src/utils/date.ts`.
- **Keyboard:** every ScrollView/FlatList that has inputs or buttons beside inputs needs `keyboardShouldPersistTaps="handled"`.
- **Input focus:** never pass a function that is re-created each render as `ListHeaderComponent`, and never define components inline inside a component. Forms using `watch()` re-render on every keystroke and will remount the inputs and close the keyboard.
- **Money and meter readings:** validate numbers (required, valid, non-negative). A current meter reading must never be lower than the previous one.
- **Persisted data:** if you change a persisted type, bump that store's `persist` `version` and write a `migrate` that keeps existing data. Do not wipe it.

## Before you finish every task

1. `npx tsc --noEmit` must pass with zero errors.
2. `npx prettier --check "src/**/*.{ts,tsx}"` must pass.
3. Report every file you changed and anything you skipped.
