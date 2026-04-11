## Description

<!-- A clear and concise description of what the pull request does. -->

## Types of changes

- [ ] 🐞 Bug Fix
- [ ] ✨ New Feature
- [ ] 🔨 Refactor / Tech Debt
- [ ] 📝 Documentation

## 🛡️ EDARA Quality Gate (Mandatory)

<!-- Please verify your changes against the core project rules -->

- [ ] **Multi-Tenancy (ADR-02):** If this PR touches the database, have I ensured `school_id` is correctly handled and RLS is respected?
- [ ] **Financial Precision (ADR-07):** If dealing with currency, did I use `decimal.js` instead of standard JS math/numbers?
- [ ] **Append-Only (ADR-04):** Did I avoid any `UPDATE` or `DELETE` on the `payment_transactions` table?
- [ ] **SPA Mode (ADR-01):** Have I avoided using SSR (like component loaders)?
- [ ] **Activity Logs (ADR-05):** If adding a mutation, is it wrapped with the `withActivityLog` middleware?

## Checklist

- [ ] I have ran `pnpm lint` and it passes (within the allowed warning limit).
- [ ] I have ran `pnpm typecheck` and it passes.
- [ ] My changes follow the project's [Design System](https://github.com/alarwasyi98/edara/blob/main/DOCUMENTATION.md).

## Related Issue

Closes: #

<!-- Issue number -->
