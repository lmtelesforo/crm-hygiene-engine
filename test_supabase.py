import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv(dotenv_path="backend/.env")

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_ANON_KEY")

if not url or not key:
    print("Error: SUPABASE_URL or SUPABASE_ANON_KEY missing in .env")
    exit(1)

print(f"Connecting to: {url}")
try:
    supabase = create_client(url, key)
    # Try a simple select to see if it works
    res = supabase.table("crm_staging").select("id").limit(1).execute()
    print("Connection successful!")
    print(f"Data: {res.data}")
except Exception as e:
    print(f"Connection failed: {e}")
