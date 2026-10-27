"""Test suite verifying Agent 2: atlanta_heat_explainer with a4i_climate.atlanta_heat_model."""

import asyncio
import os
import sys

os.environ["GOOGLE_GENAI_USE_VERTEXAI"] = "1"
os.environ["GOOGLE_CLOUD_PROJECT"] = "qwiklabs-gcp-04-ec3596addc43"
os.environ["GOOGLE_CLOUD_LOCATION"] = "us-central1"

from google.adk.runners import InMemoryRunner
from google.genai import types
from atlanta_heat_agent.agent import root_agent

async def run_test():
    runner = InMemoryRunner(agent=root_agent)
    session_id = f"test_session_{os.getpid()}"
    await runner.session_service.create_session(
        app_name=runner.app_name,
        user_id="tester",
        session_id=session_id
    )

    test_queries = [
        "Rank the top 3 census tracts in Atlanta using the atlanta_heat_model and show their primary feature attributions.",
        "Why is tract 13121006200 predicted to run hot? Break down its feature attributions."
    ]

    for q in test_queries:
        print(f"\n==================================================")
        print(f"QUERY: {q}")
        print("==================================================")
        content = types.Content(role="user", parts=[types.Part.from_text(text=q)])
        response_text = []
        async for event in runner.run_async(user_id="tester", session_id=session_id, new_message=content):
            if hasattr(event, "content") and event.content:
                for part in event.content.parts:
                    if getattr(part, "text", None):
                        response_text.append(part.text)
        print("".join(response_text))

if __name__ == "__main__":
    asyncio.run(run_test())
