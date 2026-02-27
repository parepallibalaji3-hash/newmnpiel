import os
import firebase_admin
from firebase_admin import credentials, db
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get Firebase credentials path from .env
SERVICE_ACCOUNT = os.getenv("FIREBASE_SERVICE_ACCOUNT_PATH")
DATABASE_URL = os.getenv("FIREBASE_DATABASE_URL")

# Check if credentials exist
if not SERVICE_ACCOUNT:
    raise ValueError("FIREBASE_SERVICE_ACCOUNT_PATH not found in .env file")

if not os.path.exists(SERVICE_ACCOUNT):
    raise ValueError(f"Firebase credentials file not found at: {SERVICE_ACCOUNT}")

# Initialize Firebase
if not firebase_admin._apps:
    cred = credentials.Certificate(SERVICE_ACCOUNT)
    firebase_admin.initialize_app(cred, {
        'databaseURL': DATABASE_URL
    })

def get_db():
    return db