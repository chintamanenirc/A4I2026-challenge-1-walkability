"""Interactive CLI for testing the Urban Heat Resilience Agent."""

import asyncio
import os
import sys

os.environ["GOOGLE_GENAI_USE_VERTEXAI"] = "1"
os.environ["GOOGLE_CLOUD_PROJECT"] = "qwiklabs-gcp-04-ec3596addc43"
os.environ["GOOGLE_CLOUD_LOCATION"] = "us-central1"

from google.adk.runners import InMemoryRunner
from google.genai import types
from urban_heat_agent.agent import root_agent

async def ask_agent(query: str):
    runner = InMemoryRunner(agent=root_agent)
    session_id = f"cli_test_{os.getpid()}"
    await runner.session_service.create_session(
        app_name=runner.app_name,
        user_id="tester",
        session_id=session_id
    )

    content = types.Content(
        role="user",
        parts=[types.Part.from_text(text=query)]
    )

    print(f"\n💬 Query: {query}")
    print("=" * 60)
    response_text = []
    async for event in runner.run_async(user_id="tester", session_id=session_id, new_message=content):
        if hasattr(event, "content") and event.content:
            for part in event.content.parts:
                if getattr(part, "text", None):
                    response_text.append(part.text)
    print("".join(response_text))
    print("=" * 60 + "\n")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        query = " ".join(sys.argv[1:])
    else:
        query = "We can fund 3 cooling centers in Dallas this summer. Where should they go based on heat offsets and demographic vulnerability?"
    asyncio.run(ask_agent(query))
