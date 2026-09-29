import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select

import main
from contact import contact_limit, get_captcha_verifier, get_mailer
from db import SessionLocal
from models import ContactMessage

client = TestClient(main.app)


class FakeCaptcha:
    def __init__(self, ok=True):
        self.ok = ok

    def verify(self, token, remote_ip):
        return self.ok


class FakeMailer:
    def __init__(self, fail=False):
        self.fail = fail
        self.sent = []

    def send(self, message):
        if self.fail:
            raise RuntimeError("SES is down")
        self.sent.append(message.email)


@pytest.fixture(autouse=True)
def reset_limit():
    contact_limit.reset()
    yield
    main.app.dependency_overrides.clear()


def use(captcha=None, mailer=None):
    main.app.dependency_overrides[get_captcha_verifier] = lambda: captcha or FakeCaptcha()
    main.app.dependency_overrides[get_mailer] = lambda: mailer or FakeMailer()


def payload(**overrides):
    body = {"name": "Ada Lovelace", "email": "ada@example.com", "message": "Hello, I like the site!"}
    body.update(overrides)
    return body


def stored(email):
    with SessionLocal() as session:
        return session.scalars(select(ContactMessage).where(ContactMessage.email == email).order_by(ContactMessage.id)).all()


def test_message_is_stored_and_emailed():
    mailer = FakeMailer()
    use(mailer=mailer)
    response = client.post("/api/contact", json=payload(email="sent@example.com"))
    assert response.status_code == 201
    assert mailer.sent == ["sent@example.com"]
    assert stored("sent@example.com")[-1].email_sent is True


def test_message_is_kept_when_email_fails():
    use(mailer=FakeMailer(fail=True))
    assert client.post("/api/contact", json=payload(email="kept@example.com")).status_code == 201
    assert stored("kept@example.com")[-1].email_sent is False


def test_failed_captcha_is_rejected():
    use(captcha=FakeCaptcha(ok=False))
    response = client.post("/api/contact", json=payload(email="bot@example.com"))
    assert response.status_code == 400
    assert stored("bot@example.com") == []


def test_honeypot_pretends_success_but_stores_nothing():
    use()
    response = client.post("/api/contact", json=payload(email="honey@example.com", website="http://spam"))
    assert response.status_code == 201
    assert stored("honey@example.com") == []


def test_invalid_fields_are_rejected():
    use()
    assert client.post("/api/contact", json=payload(email="not-an-email")).status_code == 422
    assert client.post("/api/contact", json=payload(message="short")).status_code == 422


def test_rate_limit():
    use()
    for _ in range(5):
        assert client.post("/api/contact", json=payload(email="many@example.com")).status_code == 201
    assert client.post("/api/contact", json=payload(email="many@example.com")).status_code == 429
