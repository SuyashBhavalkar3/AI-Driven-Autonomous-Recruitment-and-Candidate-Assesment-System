import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
from datetime import datetime

SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_EMAIL = os.getenv("SMTP_EMAIL")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")

def send_email(to_email: str, subject: str, body: str):
    """Send email notification"""
    if not SMTP_EMAIL or not SMTP_PASSWORD:
        print(f"Email not configured. Would send: {subject} to {to_email}")
        return False
    
    try:
        msg = MIMEMultipart()
        msg['From'] = SMTP_EMAIL
        msg['To'] = to_email
        msg['Subject'] = subject
        msg.attach(MIMEText(body, 'html'))
        
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(SMTP_EMAIL, SMTP_PASSWORD)
        server.send_message(msg)
        server.quit()
        return True
    except Exception as e:
        print(f"Email error: {e}")
        return False

def send_assessment_scheduled(to_email: str, candidate_name: str, job_title: str, scheduled_time: datetime):
    subject = f"Assessment Scheduled - {job_title}"
    body = f"""
    <html>
        <body>
            <h2>Assessment Scheduled</h2>
            <p>Hi {candidate_name},</p>
            <p>Your assessment for <strong>{job_title}</strong> has been scheduled.</p>
            <p><strong>Date & Time:</strong> {scheduled_time.strftime('%B %d, %Y at %I:%M %p')}</p>
            <p>Please login 5 minutes before the scheduled time.</p>
            <p>Best regards,<br>Recruitment Team</p>
        </body>
    </html>
    """
    return send_email(to_email, subject, body)

def send_assessment_reminder(to_email: str, candidate_name: str, job_title: str, minutes_left: int):
    subject = f"Assessment Reminder - {job_title}"
    body = f"""
    <html>
        <body>
            <h2>Assessment Starting Soon</h2>
            <p>Hi {candidate_name},</p>
            <p>Your assessment for <strong>{job_title}</strong> will start in {minutes_left} minutes.</p>
            <p>Please login now to avoid missing it.</p>
            <p>Best regards,<br>Recruitment Team</p>
        </body>
    </html>
    """
    return send_email(to_email, subject, body)

def send_interview_scheduled(to_email: str, candidate_name: str, job_title: str, scheduled_time: datetime):
    subject = f"Interview Scheduled - {job_title}"
    body = f"""
    <html>
        <body>
            <h2>Interview Scheduled</h2>
            <p>Hi {candidate_name},</p>
            <p>Your interview for <strong>{job_title}</strong> has been scheduled.</p>
            <p><strong>Date & Time:</strong> {scheduled_time.strftime('%B %d, %Y at %I:%M %p')}</p>
            <p>Please login 5 minutes before the scheduled time.</p>
            <p>Best regards,<br>Recruitment Team</p>
        </body>
    </html>
    """
    return send_email(to_email, subject, body)

def send_interview_reminder(to_email: str, candidate_name: str, job_title: str, minutes_left: int):
    subject = f"Interview Reminder - {job_title}"
    body = f"""
    <html>
        <body>
            <h2>Interview Starting Soon</h2>
            <p>Hi {candidate_name},</p>
            <p>Your interview for <strong>{job_title}</strong> will start in {minutes_left} minutes.</p>
            <p>Please login now to avoid missing it.</p>
            <p>Best regards,<br>Recruitment Team</p>
        </body>
    </html>
    """
    return send_email(to_email, subject, body)
