import os
import sys

# Agar bisa mengimpor app.py dari root project
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import app  # noqa: E402

# Vercel Python runtime mencari objek WSGI bernama "app"
