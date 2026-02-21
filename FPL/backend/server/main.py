# server/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import httpx

app = FastAPI()

# allow your frontend port:
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8081"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

FPL_BASE = "https://fantasy.premierleague.com/api"

@app.get("/api/fpl/opponents")
async def fpl_opponents():
    async with httpx.AsyncClient() as client:
        boot = (await client.get(f"{FPL_BASE}/bootstrap-static/")).json()
        teamsById = { t["id"]: t["short_name"].upper() for t in boot["teams"] }

        event = next((e["id"] for e in boot["events"] if e.get("is_current")), boot["events"][0]["id"])
        fixtures = (await client.get(f"{FPL_BASE}/fixtures/?event={event}")).json()
        if not fixtures:
            for e in boot["events"]:
                fx = (await client.get(f"{FPL_BASE}/fixtures/?event={e['id']}")).json()
                if fx:
                    fixtures = fx
                    break

        opp_map = {}
        for f in fixtures:
            h = teamsById.get(f["team_h"])
            a = teamsById.get(f["team_a"])
            if h and a:
                opp_map[h] = f"{a} (H)"
                opp_map[a] = f"{h} (A)"
        return opp_map