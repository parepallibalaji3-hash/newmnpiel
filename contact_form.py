from datetime import datetime
from firebase_init import get_db
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
import threading
import concurrent.futures

db = get_db()

# ── Email Configuration ──────────────────────────────────────────
SMTP_SERVER  = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT    = int(os.getenv("SMTP_PORT", "587"))
SMTP_EMAIL   = os.getenv("SMTP_USER")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")
ADMIN_EMAIL  = os.getenv("ADMIN_EMAIL")
CLIENT_NAME  = os.getenv("CLIENT_NAME", "MNPIEPL")

# Reuse a thread pool instead of spawning new threads every time
_executor = concurrent.futures.ThreadPoolExecutor(max_workers=5)

# ── Reusable SMTP Send ───────────────────────────────────────────
def _send_email(to_email, subject, body):
    try:
        msg = MIMEMultipart()
        msg['From']    = SMTP_EMAIL
        msg['To']      = to_email
        msg['Subject'] = subject
        msg.attach(MIMEText(body, 'plain'))

        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT, timeout=10) as server:
            server.starttls()
            server.login(SMTP_EMAIL, SMTP_PASSWORD)
            server.send_message(msg)

        print(f"✅ Email sent → {to_email}")
    except Exception as e:
        print(f"❌ Email error ({to_email}): {e}")

# ── Save to Firebase ─────────────────────────────────────────────
def _save_to_firebase(data):
    try:
        ref = db.reference("contacts")
        new_contact = ref.push({
            "name":       data.get("name"),
            "phone":      data.get("phone"),
            "email":      data.get("email"),
            "subject":    data.get("subject"),
            "message":    data.get("message"),
            "created_at": datetime.utcnow().isoformat(),
            "ip_address": data.get("ip_address"),
        })
        print(f"✅ Saved to Firebase → {new_contact.key}")
    except Exception as e:
        print(f"❌ Firebase error: {e}")

# ── Background Task: Save + Emails ──────────────────────────────
def _process_contact(data):
    # Run Firebase save + both emails at the same time (parallel)
    futures = [
        _executor.submit(_save_to_firebase, data),
        _executor.submit(
            _send_email,
            data["email"],
            "Thank you for contacting us!",
            f"Hi {data['name']},\n\n"
            f"Thank you for reaching out! We received your message and will get back to you soon.\n\n"
            f"Best regards,\n{CLIENT_NAME} Team"
        ),
        _executor.submit(
            _send_email,
            ADMIN_EMAIL,
            f"New Contact Form - {data.get('subject')}",
            f"📧 NEW CONTACT FORM SUBMISSION\n\n"
            f"Name:    {data.get('name')}\n"
            f"Phone:   {data.get('phone')}\n"
            f"Email:   {data.get('email')}\n"
            f"Subject: {data.get('subject')}\n\n"
            f"Message:\n{data.get('message')}\n\n"
            f"---\n"
            f"IP:        {data.get('ip_address')}\n"
            f"Timestamp: {datetime.utcnow().isoformat()}"
        ),
    ]

# ── Main Contact Form Handler ────────────────────────────────────
def contact_form(data):
    try:
        # Immediately fire everything in background, don't wait
        _executor.submit(_process_contact, data)

        # ⚡ Returns in <5ms — user gets response instantly
        return {
            "success": True,
            "message": "Message received!",
        }

    except Exception as e:
        return {
            "success": False,
            "message": str(e),
        }
