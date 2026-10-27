"""Test script verifying the core urban heat planning questions using the ADK Agent."""

import asyncio
import os
import sys

os.environ["GOOGLE_GENAI_USE_VERTEXAI"] = "1"
os.environ["GOOGLE_CLOUD_PROJECT"] = "qwiklabs-gcp-04-ec3596addc43"
os.environ["GOOGLE_CLOUD_LOCATION"] = "us-central1"

from google.adk.runners import InMemoryRunner
from google.genai import types
from urban_heat_agent.agent import root_agent

QUESTIONS = [
    (
        "Candidate Siting",
        "We can fund 3 cooling centers in Dallas this summer. Where should they go based on heat offsets and demographic vulnerability?"
    ),
    (
        "Attribution & Explainability",
        "Predict the temperature offset at latitude 32.7877, longitude -96.7906 and explain why it is warmer or cooler than city baseline."
    ),
    (
        "Historical Frequency",
        "How often does Dallas cross dangerous 100°F heat thresholds over the last 7 years of station records?"
    ),
    (
        "Equity Audit",
        "Perform an equity audit on tracts 48113020300, 48113008704, and 48113020500 compared to Dallas city averages."
    )
]

async def run_scenario(runner, label, query, session_id):
    print("=" * 70)
    print(f"SCENARIO: {label}")
    print(f"QUERY: {query}")
    print("-" * 70)

    await runner.session_service.create_session(
        app_name=runner.app_name,
        user_id="lead_planner",
        session_id=session_id
    )

    content = types.Content(
        role="user",
        parts=[types.Part.from_text(text=query)]
    )

    async for event in runner.run_async(user_id="lead_planner", session_id=session_id, new_message=content):
        if hasattr(event, "content") and event.content:
            for part in event.content.parts:
                if getattr(part, "text", None):
                    print(part.text)
    print("\n")

async def main():
    runner = InMemoryRunner(agent=root_agent)
    for idx, (label, query) in enumerate(QUESTIONS, 1):
        await run_scenario(runner, label, query, f"session_{idx}")

if __name__ == "__main__":
    asyncio.run(main())
