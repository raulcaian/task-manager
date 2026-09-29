"""Contact form: store the message, check the captcha, email the owner.

Every external piece is optional so the API also runs locally and in tests:
- no TURNSTILE_SECRET_KEY -> the captcha check is skipped
- no CONTACT_TO_EMAIL / CONTACT_FROM_EMAIL -> the message is only stored
The message is saved before the email is sent, so a mail failure never
loses a message.
"""

import logging
import os

import httpx
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from db import get_session
from models import ContactMessage
from rate_limit import RateLimiter, client_address
from schemas import ContactCreate

log = logging.getLogger(__name__)

TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify"

router = APIRouter(prefix="/api", tags=["contact"])
contact_limit = RateLimiter(max_calls=5, period_s=3600)


class CaptchaVerifier:
    """Checks a Cloudflare Turnstile token on the server side."""

    def __init__(self, secret: str | None):
        self.secret = secret

    def verify(self, token: str | None, remote_ip: str | None) -> bool:
        if not self.secret:
            return True  # captcha not configured (local development, tests)
        if not token:
            return False
        try:
            response = httpx.post(
                TURNSTILE_VERIFY_URL,
                data={"secret": self.secret, "response": token, "remoteip": remote_ip or ""},
                timeout=10,
            )
            return bool(response.json().get("success"))
        except (httpx.HTTPError, ValueError):
            log.exception("Turnstile verification failed")
            return False


class SesMailer:
    """Sends the message with Amazon SES, using the EC2 instance role."""

    def __init__(self, sender: str, recipient: str, region: str):
        self.sender = sender
        self.recipient = recipient
        self.region = region

    def send(self, message: ContactMessage) -> None:
        import boto3  # imported lazily: only needed when email is configured

        boto3.client("sesv2", region_name=self.region).send_email(
            FromEmailAddress=self.sender,
            Destination={"ToAddresses": [self.recipient]},
            ReplyToAddresses=[message.email],
            Content={
                "Simple": {
                    "Subject": {"Data": f"Showroom contact: {message.name}"},
                    "Body": {"Text": {"Data": f"From: {message.name} <{message.email}>\n\n{message.message}"}},
                }
            },
        )


class NoMailer:
    def send(self, message: ContactMessage) -> None:
        raise RuntimeError("Email is not configured")


def get_captcha_verifier() -> CaptchaVerifier:
    return CaptchaVerifier(os.getenv("TURNSTILE_SECRET_KEY") or None)


def get_mailer():
    sender = os.getenv("CONTACT_FROM_EMAIL")
    recipient = os.getenv("CONTACT_TO_EMAIL")
    if sender and recipient:
        return SesMailer(sender, recipient, os.getenv("AWS_REGION", "eu-north-1"))
    return NoMailer()


@router.post("/contact", status_code=201, dependencies=[Depends(contact_limit)])
def send_contact_message(
    payload: ContactCreate,
    request: Request,
    session: Session = Depends(get_session),
    captcha: CaptchaVerifier = Depends(get_captcha_verifier),
    mailer=Depends(get_mailer),
):
    if payload.website:
        # Honeypot filled in: most likely a bot. Pretend it worked, store nothing.
        return {"status": "received"}

    if not captcha.verify(payload.turnstile_token, client_address(request)):
        raise HTTPException(status_code=400, detail="The captcha check failed. Please try again.")

    message = ContactMessage(
        name=payload.name.strip(),
        email=payload.email.strip(),
        message=payload.message.strip(),
    )
    session.add(message)
    session.commit()

    try:
        mailer.send(message)
        message.email_sent = True
        session.commit()
    except Exception:  # noqa: BLE001 - the message is stored; email is best effort
        log.warning("Contact message %s stored but not emailed", message.id, exc_info=True)

    return {"status": "received"}
