import sqlite3
import urllib.request, urllib.parse, json

# 1. Check cancelled subs in DB
conn = sqlite3.connect("streamboss.db")
c = conn.cursor()
c.execute("SELECT id, status FROM subscriptions WHERE status = 'cancelled'")
rows = c.fetchall()
print(f"Cancelled subs in DB: {rows}")
conn.close()

# 2. Login to get token
login_data = json.dumps({"email": "admin@admin.com", "password": "admin"}).encode()
req = urllib.request.Request(
    "http://127.0.0.1:8001/api/v1/auth/login",
    data=login_data,
    headers={"Content-Type": "application/json"},
    method="POST"
)
with urllib.request.urlopen(req) as resp:
    token_data = json.loads(resp.read())
    token = token_data.get("access_token")
    print(f"Login: {'OK' if token else 'FAILED'}")

# 3. Test DELETE on first cancelled sub
if token and rows:
    sub_id = rows[0][0]
    del_req = urllib.request.Request(
        f"http://127.0.0.1:8001/api/v1/subscriptions/{sub_id}",
        headers={"Authorization": f"Bearer {token}"},
        method="DELETE"
    )
    try:
        with urllib.request.urlopen(del_req) as resp:
            print(f"DELETE sub {sub_id}: {resp.status} OK - Deleted!")
    except urllib.error.HTTPError as e:
        print(f"DELETE sub {sub_id}: {e.code} - {e.read().decode()}")
