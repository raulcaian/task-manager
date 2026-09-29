import httpx

from external import _failure


def test_failure_message_includes_upstream_status():
    request = httpx.Request("GET", "https://example.com")
    response = httpx.Response(403, request=request, text="Access denied")
    error = httpx.HTTPStatusError("forbidden", request=request, response=response)

    assert str(_failure("Could not search for places", error)) == (
        "Could not search for places (upstream HTTP 403)"
    )


def test_failure_message_names_network_errors():
    error = httpx.ConnectTimeout("timed out")
    assert str(_failure("Could not compute a road route", error)) == (
        "Could not compute a road route (ConnectTimeout)"
    )
