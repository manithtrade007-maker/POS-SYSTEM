# Project Notes

Use this file to record important project updates after each new feature or fix.

## 2026-04-30 - Telegram Sale Alerts

### Summary

Added Telegram alerts when a sale is confirmed from the POS screen. After the backend creates the invoice, saves sale items, and deducts stock, it sends a Telegram message with invoice details and sold item information.

### Files changed

- `backend/services/telegram.js`
  - Added Telegram message formatting and sending logic.
  - Reads bot token, chat ID, enable flag, and timeout from environment variables.
- `backend/routes/sales.js`
  - Collects sold item details during sale creation.
  - Sends the Telegram alert after the sale transaction succeeds.
  - Telegram failure is logged but does not cancel the sale.
- `backend/server.js`
  - Loads `backend/.env` using `dotenv`.
- `backend/.env.example`
  - Added placeholder Telegram environment variables.
- `backend/package.json`
  - Added `dotenv`.
- `backend/package-lock.json`
  - Updated dependency lockfile.

### Environment variables

Real values go in `backend/.env`, which is ignored by Git.

```env
TELEGRAM_ALERTS_ENABLED=true
TELEGRAM_BOT_TOKEN=your_token_here
TELEGRAM_CHAT_ID=your_chat_id_here
TELEGRAM_TIMEOUT_MS=5000
```

Do not put real Telegram tokens in `.env.example` or commit them to GitHub.

### Verification

- Confirmed Telegram alert works after a sale is completed.
- Backend syntax checks passed.
- Backend `/health` smoke test passed.
- Frontend production build passed.

### Git

Committed and pushed:

```text
9273e56 Add Telegram sale alerts
```

## 2026-04-30 - Owner And Cashier Authorization

### Summary

Added role authorization so the shop owner can see purchase cost and profit data, while cashiers can still add products, manage stock, create sales, and view normal selling information without seeing cost/profit values.

### Files changed

- `backend/middleware/auth.js`
  - Added PIN login helpers, signed bearer tokens, auth middleware, and role helpers.
- `backend/routes/auth.js`
  - Added `/api/auth/login` and `/api/auth/me`.
- `backend/server.js`
  - Mounted auth routes and protected `/api` routes.
- `backend/routes/products.js`
  - Redacts purchase cost fields for cashiers.
  - Preserves existing product cost when a cashier edits a product.
- `backend/routes/sales.js`
  - Redacts sale profit and cost snapshots for cashiers.
- `backend/routes/reports.js`
  - Redacts profit fields for cashiers.
- `frontend/src/api/api.js`
  - Stores auth sessions and sends bearer tokens with API requests.
- `frontend/src/App.jsx`
  - Adds role-aware app shell and sign out.
- `frontend/src/pages/Login.jsx`
  - Adds owner/cashier PIN login.
- `frontend/src/pages/Products.jsx`
  - Hides purchase-cost inputs and profit previews for cashiers.
- `frontend/src/pages/Dashboard.jsx`
  - Handles hidden profit values.
- `frontend/src/pages/Reports.jsx`
  - Handles hidden profit values.

### Environment variables

Real values go in `backend/.env`, which is ignored by Git.

```env
AUTH_ENABLED=true
AUTH_TOKEN_SECRET=change-this-long-random-secret
AUTH_TOKEN_TTL_HOURS=12
OWNER_PIN=1234
CASHIER_PIN=0000
```

Change the default PINs before using the system in the shop.

### Verification

- Backend syntax checks passed.
- Frontend production build passed.
- API smoke test passed:
  - Cashier login succeeds.
  - Owner login succeeds.
  - Cashier product responses do not include `cost_price_base`.
  - Owner product responses include `cost_price_base`.
  - Cashier daily report responses do not include `total_profit`.
- Local backend and frontend dev servers started for manual testing.

### Git

Pending commit.

## Update Template

Copy this section when adding the next feature.

```md
## YYYY-MM-DD - Feature Name

### Summary

Short explanation of what changed and why.

### Files changed

- `path/to/file`
  - What changed.

### Environment variables

List any new `.env` values. Never include real secrets.

### Verification

- Commands run.
- Manual testing done.

### Git

Commit hash and message after pushing.
```
