# LeadCheck — CRM Hygiene Engine
### Project 3 of 10 · Sales Admin Portfolio

Automatically audits and cleans dirty CRM records using AI. Normalizes names, fixes phone formats, expands abbreviations, identifies buyer personas, and suggests the best time to contact each lead based on their timezone.

---

## What It Does

| Problem | LeadCheck Fix |
|---|---|
| `laura claire reyes` (no caps) | → `Laura Claire Reyes` |
| `info@techcorp.com` (generic email) | → `laura@techcorp.com` |
| `9171234567` (no format) | → `+63 917 123 4567` |
| `vp sales` (abbreviated title) | → `Vice President of Sales` |
| `techcorp solutions inc.` | → `TechCorp Solutions` |
| No persona classification | → `Executive Buyer` |
| No contact timing | → `9:00 AM – 11:00 AM PHT (Tue–Thu)` |

---

## Architecture

```
Browser (React)          ←→      FastAPI (port 8001)      ←→     Groq AI (free)
localhost:5173                   localhost:8001                   Llama 3-70B

                                        ↓ on confirm
                                  Supabase (Postgres)
                                  crm_staging table
                                  crm_audit_log table
```

---

## File Structure

```
LeadCheck/
├── index.html
├── vite.config.js
├── package.json
├── src/
│   ├── main.jsx          ← React entry
│   ├── App.jsx           ← Full dashboard UI
│   └── index.css         ← Gradient theme, Inter font
└── backend/
    ├── main.py           ← FastAPI endpoints
    ├── schema.sql        ← Supabase tables
    ├── requirements.txt
    └── .env.example
```

---

## Setup Guide

### Step 1 — Supabase (5 min)

1. Go to [supabase.com](https://supabase.com) → New Project → name it `LeadCheck`
2. SQL Editor → New Query → paste all of `backend/schema.sql` → Run
3. Settings → API → copy:
   - Project URL → `SUPABASE_URL`
   - Anon public key → `SUPABASE_ANON_KEY`

### Step 2 — Backend

```bash
cd backend
cp .env.example .env
# Fill in GROQ_API_KEY, SUPABASE_URL, SUPABASE_ANON_KEY

pip install -r requirements.txt
uvicorn main:app --reload --port 8001
```

Visit `http://localhost:8001/docs` → interactive API docs.

**Test the audit endpoint:**
```bash
curl -X POST http://localhost:8001/audit \
  -H "Content-Type: application/json" \
  -d '{
    "records": [{
      "id": 1,
      "name": "laura claire reyes",
      "email": "info@techcorp.com",
      "phone": "9171234567",
      "title": "vp sales",
      "company": "techcorp solutions",
      "timezone": "Asia/Manila",
      "country": "PH"
    }]
  }'
```

Expected response:
```json
[{
  "original_id": 1,
  "cleaned_name": "Laura Claire Reyes",
  "cleaned_email": "laura@techcorp.com",
  "cleaned_phone": "+63 917 123 4567",
  "cleaned_title": "Vice President of Sales",
  "cleaned_company": "TechCorp Solutions",
  "buyer_persona": "Executive Buyer",
  "best_contact_time": "9:00 AM – 11:00 AM PHT (Tue–Thu)",
  "issues_found": ["name_case","generic_email","phone_format","title_abbrev"],
  "issues_fixed": ["name_case","generic_email","phone_format","title_abbrev"]
}]
```

### Step 3 — Frontend

```bash
# From LeadCheck/ root folder
npm install
npm run dev
```

Visit `http://localhost:5173`

---

## How to Use the Dashboard

### 1. The Flagged Records Table
The main table shows all CRM records with detected issues. Each row shows:
- The lead's name and email (dirty version)
- Their role and company
- Issue badges (what's wrong)
- Status: Pending / Cleaned / Skipped
- Apply / Skip buttons

### 2. Click any row → Preview Panel opens
The right panel shows:
- A field-by-field before/after diff (red strikethrough → green corrected)
- AI-assigned Buyer Persona
- Best time to contact (based on timezone)
- Full issue list

### 3. Apply Changes
Click **Apply** to confirm the clean. This:
- Updates the record status to "Cleaned" in the UI
- Calls `POST /confirm-update` on the backend
- Writes the cleaned record to `crm_staging` in Supabase
- Logs the action in `crm_audit_log`

### 4. Apply All
Click **✓ Apply All** in the health bar to bulk-confirm all pending records at once.

### 5. Run AI Audit (when connected to backend)
Click **⚡ Run AI Audit** to send all records to Groq for deep cleaning. Currently runs a 2.8s simulation — wire up by calling `POST /audit` with your records array.

---

## Connecting Frontend to Backend

In `src/App.jsx`, find the `runAudit` function and replace it:

```javascript
async function runAudit() {
  setRunning(true)
  try {
    const res = await fetch('http://localhost:8001/audit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ records: records })
    })
    const data = await res.json()
    // data is array of CleanedRecord objects
    // Map them back and update records state
    setRecords(prev => prev.map(r => {
      const cleaned = data.find(d => d.original_id === r.id)
      if (!cleaned) return r
      return { ...r, _cleaned: cleaned, issues: cleaned.issues_found }
    }))
    setRunComplete(true)
  } catch(err) {
    alert('Backend not reachable. Is uvicorn running on port 8001?')
  } finally {
    setRunning(false)
  }
}
```

And when user clicks "Apply", call the confirm endpoint:

```javascript
async function approve(id) {
  const record = records.find(r => r.id === id)
  const cleaned = record._cleaned
  if (cleaned) {
    await fetch('http://localhost:8001/confirm-update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ record_id: id, cleaned })
    })
  }
  setRecords(prev => prev.map(r => r.id === id ? { ...r, status: 'approved' } : r))
}
```

---

## Issue Types Detected

| Issue Code | What It Means | Example |
|---|---|---|
| `name_case` | Wrong capitalization | `JAMES SANTOS` or `james santos` |
| `name_incomplete` | Only one name part | `carlos m.` |
| `name_suffix` | Has Jr/Sr suffix | `david kim jr` |
| `generic_email` | Shared inbox email | `info@`, `contact@`, `admin@` |
| `phone_format` | Not E.164 international | `9171234567` |
| `phone_missing` | No phone on record | `""` |
| `title_case` | Wrong capitalization | `Head Of Sales` |
| `title_abbrev` | Abbreviation used | `vp`, `cro`, `sr.`, `revops` |
| `company_format` | Legal entity suffix | `Techcorp Inc.` |
| `company_case` | Wrong caps | `ZENDESK INC` |

---

## Supabase Tables

### `crm_staging`
Every confirmed-clean record lands here before being pushed back to the real CRM.

| Column | Type | Description |
|---|---|---|
| `original_id` | integer | ID from your CRM |
| `cleaned_data` | jsonb | Full cleaned record |
| `confirmed_at` | timestamptz | When user clicked Apply |
| `pushed_to_crm` | boolean | Whether it's been synced back |
| `status` | text | `confirmed` or `pushed` |

### `crm_audit_log`
Every clean action is logged here for compliance and review.

| Column | Type | Description |
|---|---|---|
| `record_id` | integer | CRM record ID |
| `action` | text | `cleaned`, `skipped`, `pushed` |
| `before` | jsonb | Original dirty values |
| `after` | jsonb | Cleaned values |
| `timestamp` | timestamptz | When action happened |

---

## Portfolio Presentation

**Resume bullet:**
> "Built an AI-powered CRM hygiene engine (React + FastAPI + Groq + Supabase) that automatically detects and fixes dirty data — normalizing names, fixing phone formats, expanding title abbreviations, classifying buyer personas, and suggesting contact times by timezone — across hundreds of CRM records."

**Key talking points:**
1. "This solves the #1 complaint I hear from Sales Managers: garbage in, garbage out in the CRM."
2. "The backend detects 10 different issue types using rule-based logic, then passes each record to Groq AI for intelligent normalization."
3. "The staging table pattern means no changes go to the CRM without explicit human approval — every fix is auditable."
4. "For a team with 500 dirty records, this runs in under 2 minutes and would take a human 8+ hours manually."

**What to screenshot:**
- [ ] The main table with colored issue badges visible
- [ ] The right preview panel showing red strikethrough → green corrected diff
- [ ] The Data Health progress bar going from 0% to 100%
- [ ] Supabase → crm_staging table with confirmed records

---

*LeadCheck · Project 3 of 10 · Sales Admin AI Portfolio*
*All tools free tier. Build time: ~3 hours.*
