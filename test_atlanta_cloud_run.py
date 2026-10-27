"""Automated verification suite against the live deployed Cloud Run Agent for Atlanta."""

import json
import urllib.request
import time

BASE_URL = "https://urban-heat-agent-1042443035046.us-central1.run.app"
APP_NAME = "urban_heat_agent"
USER_ID = "atlanta_planner"

TEST_PROMPTS = [
    (
        "Atlanta Cooling Center Siting",
        "We have funding for 3 cooling centers in Atlanta this summer. Where should they go to maximize equity and mitigate extreme heat?"
    ),
    (
        "Atlanta Microclimate Explainability",
        "Predict the temperature offset at latitude 33.7043, longitude -84.3610 in Atlanta and explain the top physical feature drivers."
    ),
    (
        "Atlanta Extreme Heat Frequency",
        "How often does Atlanta experience dangerous heat days of 95°F or higher based on historical weather station data?"
    ),
    (
        "Atlanta Demographic Equity Audit",
        "Perform an equity audit on tracts 13121006802, 13121007808, and 13121007603 compared to Atlanta citywide baselines."
    )
]

def query_deployed_agent(prompt: str, session_id: str):
    sess_url = f"{BASE_URL}/apps/{APP_NAME}/users/{USER_ID}/sessions/{session_id}"
    req = urllib.request.Request(
        sess_url,
        data=json.dumps({}).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    urllib.request.urlopen(req)

    run_url = f"{BASE_URL}/run"
    payload = {
        "appName": APP_NAME,
        "userId": USER_ID,
        "sessionId": session_id,
        "newMessage": {
            "role": "user",
            "parts": [{"text": prompt}]
        }
    }
    run_req = urllib.request.Request(
        run_url,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST"
    )

    with urllib.request.urlopen(run_req) as resp:
        events = json.loads(resp.read().decode("utf-8"))
        texts = []
        for ev in events:
            content = ev.get("content")
            if content and "parts" in content:
                for part in content["parts"]:
                    if "text" in part:
                        texts.append(part["text"])
        return "".join(texts)

def main():
    print("=" * 80)
    print(f"VERIFYING LIVE ATLANTA DEPLOYMENT ON CLOUD RUN: {BASE_URL}")
    print("=" * 80)

    for idx, (label, prompt) in enumerate(TEST_PROMPTS, 1):
        session_id = f"atlanta_session_{idx}_{int(time.time())}"
        print(f"\n[TEST {idx}/4] {label}")
        print(f"Query: {prompt}")
        print("-" * 80)
        start = time.time()
        response = query_deployed_agent(prompt, session_id)
        duration = round(time.time() - start, 2)
        print(response)
        print(f"Elapsed: {duration}s")
        print("-" * 80)

if __name__ == "__main__":
    main()
