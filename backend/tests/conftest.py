import os
import sys
from pathlib import Path

import pytest
from dotenv import load_dotenv

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

load_dotenv()
os.environ.setdefault("SECRET_KEY", "test-secret")


@pytest.fixture
def anyio_backend():
    return "asyncio"
