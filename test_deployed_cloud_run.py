"""Automated verification suite against the live deployed Cloud Run Agent."""

import json
import urllib.request
import time

BASE_URL = "https://urban-heat-agent-1042443035046.us-central1.run.app"
APP_NAME = "urban_heat_agent"
USER_ID = "council_evaluator"

TEST_PROMPTS = [
    (
        "Candidate Siting",
        "We can fund 3 cooling centers in Dallas this summer. Where should they go based on heat offsets and demographic vulnerability?"
    ),
    (
        "Explainability Attribution",
        "Predict the temperature offset at latitude 32.7877, longitude -96.7906 and explain why it is warmer or cooler than city baseline."
    ),
    (
        "Historical Extreme Heat Frequency",
        "How often does Dallas cross dangerous 100°F heat thresholds over the last 7 years of station records?"
    ),
    (
        "Demographic Equity Audit",
        "Perform an equity audit on tracts 48113020300, 48113008704, and 48113020500 compared to Dallas city averages."
    )
]

def query_deployed_agent(prompt: str, session_id: str):
    # 1. Create Session
    sess_url = f"{BASE_URL}/apps/{APP_NAME}/users/{USER_ID}/sessions/{session_id}"
    req = urllib.request.Request(
        sess_url,
        data=json.dumps({}).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    urllib.request.urlopen(req)

    # 2. Post Query
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
    print(f"VERIFYING DEPLOYED CLOUD RUN AGENT: {BASE_URL}")
    print("=" * 80)

    for idx, (label, prompt) in enumerate(TEST_PROMPTS, 1):
        session_id = f"eval_session_{idx}_{int(time.time())}"
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
