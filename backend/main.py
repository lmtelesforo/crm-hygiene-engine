"""
LeadCheck — CRM Hygiene Engine Backend v2
FastAPI + Groq (free) + Supabase (free)

Install: pip install fastapi uvicorn groq supabase python-dotenv python-multipart
Run:     uvicorn main:app --reload --port 8001
Docs:    http://localhost:8001/docs
"""

from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional
from groq import Groq
from supabase import create_client
from dotenv import load_dotenv
import os, json, re, csv, io, uuid
from datetime import datetime

load_dotenv()

app = FastAPI(title="LeadCheck CRM Hygiene API", version="2.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

groq_client = Groq(api_key=os.environ["GROQ_API_KEY"])
supabase = create_client(
    os.environ["SUPABASE_URL"],
    os.environ.get("SUPABASE_SERVICE_KEY") or os.environ["SUPABASE_ANON_KEY"]
)

# ── Models ────────────────────────────────────────────────────────────────────

class DirtyRecord(BaseModel):
    id: int
    name: str
    email: str
    phone: str
    title: str
    company: str
    timezone: str
    country: str

class CleanedRecord(BaseModel):
    original_id: int
    original_name: str
    original_email: str
    original_phone: str
    original_title: str
    original_company: str
    cleaned_name: str
    cleaned_email: str
    cleaned_phone: str
    cleaned_title: str
    cleaned_company: str
    buyer_persona: str
    best_contact_time: str
    issues_found: list[str]
    issues_fixed: list[str]

class AuditRequest(BaseModel):
    records: list[DirtyRecord]

class ConfirmRequest(BaseModel):
    record_id: int
    cleaned: dict

# ── Issue Detection ───────────────────────────────────────────────────────────

def detect_issues_from_dict(d: dict) -> list[str]:
    issues = []
    name    = d.get('name', '').strip()
    email   = d.get('email', '')
    phone   = d.get('phone', '')
    title   = d.get('title', '')
    company = d.get('company', '')

    if name and (name.upper() == name or name.lower() == name or name != name.title()):
        issues.append("name_case")
    if len(name.split()) < 2 and name:
        issues.append("name_incomplete")
    if re.search(r'\b(jr|sr|ii|iii)\b', name, re.I):
        issues.append("name_suffix")

    generic = ['info@','contact@','admin@','hello@','careers@','support@','sales@','noreply@']
    if any(email.startswith(g) for g in generic):
        issues.append("generic_email")

    if not phone or phone.strip() == '':
        issues.append("phone_missing")
    elif not phone.startswith('+') and len(re.sub(r'\D','', phone)) == 10:
        issues.append("phone_format")

    if title and title != title.title() and title != title.lower():
        issues.append("title_case")
    abbrevs = ['vp','cro','coo','ceo','sr.','jr.','mgr','exec','revops']
    if any(a in title.lower().split() for a in abbrevs):
        issues.append("title_abbrev")

    corp_noise = ['inc.','ltd.','pty ltd','llc','inc','corp.']
    if any(n in company.lower() for n in corp_noise):
        issues.append("company_format")
    if company.upper() == company and len(company) > 3:
        issues.append("company_case")

    return list(set(issues))

def detect_issues(r: DirtyRecord) -> list[str]:
    return detect_issues_from_dict({
        'name': r.name, 'email': r.email, 'phone': r.phone,
        'title': r.title, 'company': r.company
    })

# ── AI Cleaning via Groq ──────────────────────────────────────────────────────

def clean_with_ai(name, email, phone, title, company, timezone, country, issues) -> dict:
    prompt = f"""You are a CRM data quality specialist. Clean this lead record. Return ONLY valid JSON, no markdown, no extra text.

Record:
- Name: {name}
- Email: {email}
- Phone: {phone}
- Title: {title}
- Company: {company}
- Timezone: {timezone}
- Country: {country}
- Issues to fix: {', '.join(issues)}

Rules:
1. Name: Proper case (First Last). Remove Jr/Sr. Fix ALL CAPS or all lowercase.
2. Email: If generic (info@, contact@, admin@, hello@, careers@), use firstname@domain.com.
3. Phone: E.164. PH=+63, US=+1, AU=+61, IN=+91, IE=+353, IL=+972, SG=+65, EE=+372. Empty="Request on next touchpoint".
4. Title: Expand VP=Vice President, CRO=Chief Revenue Officer, Sr.=Senior, RevOps=Revenue Operations. Proper case.
5. Company: Remove Inc., Ltd., Pty Ltd, LLC, Corp. Proper case. Keep brands as-is (HubSpot, Canva, Figma, Salesforce, SAP, Zoho, Pipedrive, Airtable, Intercom, Stripe, Notion).
6. Buyer Persona: ONE of: C-Suite / Economic Buyer, Executive Buyer, Budget Holder, Operations Leader, Champion, Influencer, End User, Evaluator.
7. Best Contact Time: "HH:MM AM/PM - HH:MM AM/PM TZ (Days)" e.g. "10:00 AM - 12:00 PM EST (Tue-Thu)".

Return ONLY:
{{"cleaned_name":"","cleaned_email":"","cleaned_phone":"","cleaned_title":"","cleaned_company":"","buyer_persona":"","best_contact_time":"","issues_fixed":[]}}"""

    try:
        res = groq_client.chat.completions.create(
            model="llama3-70b-8192", temperature=0.2, max_tokens=400,
            messages=[{"role": "user", "content": prompt}]
        )
        raw = re.sub(r"```json|```", "", res.choices[0].message.content.strip()).strip()
        return json.loads(raw)
    except Exception as e:
        print(f"Groq error: {e}")
        return {
            "cleaned_name": name.title(),
            "cleaned_email": email,
            "cleaned_phone": phone or "Request on next touchpoint",
            "cleaned_title": title.title(),
            "cleaned_company": company.title(),
            "buyer_persona": "Evaluator",
            "best_contact_time": "9:00 AM - 11:00 AM local time (Tue-Thu)",
            "issues_fixed": issues
        }

# ── CSV IMPORT ────────────────────────────────────────────────────────────────

@app.post("/import-csv")
async def import_csv(file: UploadFile = File(...)):
    """
    Step 1 of the pipeline.
    Parses the uploaded CSV, detects issues per row,
    and bulk-inserts all rows into crm_dirty_records in Supabase.
    Returns the full list of inserted records with their IDs and issues.
    """
    if not file.filename.lower().endswith('.csv'):
        raise HTTPException(status_code=400, detail="File must be a .csv")

    contents = await file.read()
    try:
        text = contents.decode('utf-8-sig')
    except UnicodeDecodeError:
        text = contents.decode('latin-1')

    reader = csv.DictReader(io.StringIO(text))
    rows = [{k.strip().lower(): (v or '').strip() for k, v in row.items()} for row in reader]

    if not rows:
        raise HTTPException(status_code=400, detail="CSV is empty")

    FIELD_MAP = {
        'name':     ['name','full name','full_name','contact name','contact_name'],
        'email':    ['email','email address','email_address'],
        'phone':    ['phone','phone number','phone_number','mobile','tel'],
        'title':    ['title','job title','job_title','position','role'],
        'company':  ['company','company name','company_name','organization','org'],
        'timezone': ['timezone','time zone','time_zone','tz'],
        'country':  ['country','country code','country_code'],
    }

    def get_field(row, field):
        for alias in FIELD_MAP[field]:
            if alias in row:
                return row[alias]
        return ''

    batch_id = str(uuid.uuid4())[:8]
    db_rows = []

    for row in rows:
        name    = get_field(row, 'name')
        email   = get_field(row, 'email')
        if not name and not email:
            continue
        d = {
            'name': name, 'email': email,
            'phone':   get_field(row, 'phone'),
            'title':   get_field(row, 'title'),
            'company': get_field(row, 'company'),
            'timezone': get_field(row, 'timezone') or 'America/New_York',
            'country':  get_field(row, 'country')  or 'US',
        }
        d['issues'] = detect_issues_from_dict(d)
        d['batch_id'] = batch_id
        d['uploaded_at'] = datetime.utcnow().isoformat()
        db_rows.append(d)

    if not db_rows:
        raise HTTPException(status_code=400, detail="No valid rows found in CSV")

    try:
        result = supabase.table("crm_dirty_records").insert(db_rows).execute()
        inserted = result.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Supabase insert failed: {str(e)}")

    return {
        "success": True,
        "batch_id": batch_id,
        "imported_count": len(inserted),
        "records": inserted
    }

# ── Load dirty records from Supabase ─────────────────────────────────────────

@app.get("/dirty-records")
async def get_dirty_records(limit: int = 200):
    """
    Step 2 — frontend reads these to populate the table.
    Returns all dirty records from crm_dirty_records, most recent first.
    """
    try:
        result = supabase.table("crm_dirty_records") \
            .select("*").order("uploaded_at", desc=False).limit(limit).execute()
        return {"records": result.data, "count": len(result.data)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ── AI Audit ──────────────────────────────────────────────────────────────────

@app.post("/audit", response_model=list[CleanedRecord])
async def audit_records(req: AuditRequest):
    """Step 3 — AI cleans records. Does NOT save yet."""
    results = []
    for r in req.records:
        issues = detect_issues(r)
        if not issues:
            continue
        cleaned = clean_with_ai(r.name, r.email, r.phone, r.title, r.company, r.timezone, r.country, issues)
        results.append(CleanedRecord(
            original_id=r.id,
            original_name=r.name, original_email=r.email,
            original_phone=r.phone, original_title=r.title, original_company=r.company,
            cleaned_name=cleaned.get("cleaned_name", r.name),
            cleaned_email=cleaned.get("cleaned_email", r.email),
            cleaned_phone=cleaned.get("cleaned_phone", r.phone),
            cleaned_title=cleaned.get("cleaned_title", r.title),
            cleaned_company=cleaned.get("cleaned_company", r.company),
            buyer_persona=cleaned.get("buyer_persona", "Evaluator"),
            best_contact_time=cleaned.get("best_contact_time", ""),
            issues_found=issues,
            issues_fixed=cleaned.get("issues_fixed", [])
        ))
    return results

# ── Confirm update ────────────────────────────────────────────────────────────

@app.post("/confirm-update")
async def confirm_update(req: ConfirmRequest):
    """Step 4 — user approved a record. Save to crm_staging."""
    try:
        supabase.table("crm_staging").insert({
            "original_id": req.record_id,
            "cleaned_data": req.cleaned,
            "confirmed_at": datetime.utcnow().isoformat(),
            "status": "confirmed"
        }).execute()
        supabase.table("crm_audit_log").insert({
            "record_id": req.record_id,
            "action": "cleaned",
            "before": req.cleaned.get("before", {}),
            "after": req.cleaned.get("after", {}),
            "timestamp": datetime.utcnow().isoformat()
        }).execute()
        return {"success": True, "message": f"Record {req.record_id} saved."}
    except Exception as e:
        print(f"confirm-update error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ── Fetch staged records ──────────────────────────────────────────────────────

@app.get("/staged")
async def get_staged():
    try:
        result = supabase.table("crm_staging") \
            .select("original_id, cleaned_data, confirmed_at, status") \
            .order("confirmed_at", desc=True).execute()
        return {"records": result.data, "count": len(result.data)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ── EXPORT cleaned CSV ────────────────────────────────────────────────────────

@app.get("/export-csv")
async def export_csv():
    """
    Step 5 — export all cleaned records as a downloadable CSV.
    Pulls from crm_staging, formats each row with cleaned values.
    """
    try:
        result = supabase.table("crm_staging") \
            .select("original_id, cleaned_data, confirmed_at") \
            .order("confirmed_at", desc=True).execute()
        records = result.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(['id','name','email','phone','title','company',
                     'buyer_persona','best_contact_time','issues_fixed','cleaned_at'])

    for r in records:
        cd  = r.get('cleaned_data', {})
        aft = cd.get('after', {})
        writer.writerow([
            r['original_id'],
            aft.get('name',    cd.get('cleaned_name',    '')),
            aft.get('email',   cd.get('cleaned_email',   '')),
            aft.get('phone',   cd.get('cleaned_phone',   '')),
            aft.get('title',   cd.get('cleaned_title',   '')),
            aft.get('company', cd.get('cleaned_company', '')),
            cd.get('buyer_persona', ''),
            cd.get('best_contact_time', ''),
            ', '.join(cd.get('issues_fixed', [])),
            r.get('confirmed_at', '')
        ])

    output.seek(0)
    fname = f"LeadCheck_cleaned_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.csv"
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={fname}"}
    )

@app.delete("/delete-record/{record_id}")
async def delete_record(record_id: int):
    """Delete a dirty record from crm_dirty_records."""
    try:
        supabase.table("crm_dirty_records").delete().eq("id", record_id).execute()
        return {"success": True, "message": f"Record {record_id} deleted."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/delete-staged/{record_id}")
async def delete_staged(record_id: int):
    """Delete a cleaned record from crm_staging by original_id."""
    try:
        supabase.table("crm_staging").delete().eq("original_id", record_id).execute()
        return {"success": True, "message": f"Staged record {record_id} deleted."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health")
async def health():
    return {"status": "ok", "version": "2.0.0"}