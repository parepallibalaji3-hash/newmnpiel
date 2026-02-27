import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

SMTP_HOST = os.getenv("SMTP_HOST")
SMTP_PORT = int(os.getenv("SMTP_PORT"))
SMTP_USER = os.getenv("SMTP_USER")
SMTP_PASS = os.getenv("SMTP_PASSWORD")

CLIENT_EMAIL = os.getenv("CLIENT_EMAIL")
CLIENT_NAME = os.getenv("CLIENT_NAME")


def send_email(to_email, subject, html):

    msg = MIMEMultipart()
    msg["From"] = SMTP_USER
    msg["To"] = to_email
    msg["Subject"] = subject

    msg.attach(MIMEText(html, "html"))

    with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
        server.starttls()
        server.login(SMTP_USER, SMTP_PASS)
        server.send_message(msg)


# ✅ EMAIL TO CUSTOMER
def send_user_thankyou(name, user_email):

    html = f"""
    <h2>Thank You for Contacting {CLIENT_NAME}</h2>

    <p>Dear {name},</p>

    <p>We have received your enquiry. Our team will contact you within 24 hours.</p>

    <br>

    <p>Regards,<br>
    {MNPIEPL}</p>
    """

    send_email(user_email, "Thank you for contacting us", html)


# ✅ EMAIL TO ADMIN
def send_admin_notification(data):

    html = f"""
    <h3>New Contact Form Submission</h3>

    <p><b>Name:</b> {data['name']}</p>
    <p><b>Phone:</b> {data['phone']}</p>
    <p><b>Email:</b> {data['email']}</p>
    <p><b>Subject:</b> {data['subject']}</p>
    <p><b>Message:</b> {data['message']}</p>
    """

    send_email(CLIENT_EMAIL, "New Enquiry Received", html)