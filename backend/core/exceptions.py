import traceback

from fastapi import Request, status
from fastapi.responses import JSONResponse


class PulseIQError(Exception):
    """Base application error."""
    status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR
    code: str = "internal_error"

    def __init__(self, message: str, details: dict | None = None) -> None:
        self.message = message
        self.details = details or {}
        super().__init__(message)


class NotFoundError(PulseIQError):
    status_code = status.HTTP_404_NOT_FOUND
    code = "not_found"


class UnauthorizedError(PulseIQError):
    status_code = status.HTTP_401_UNAUTHORIZED
    code = "unauthorized"


class ForbiddenError(PulseIQError):
    status_code = status.HTTP_403_FORBIDDEN
    code = "forbidden"


class ConflictError(PulseIQError):
    status_code = status.HTTP_409_CONFLICT
    code = "conflict"


class ValidationError(PulseIQError):
    status_code = status.HTTP_422_UNPROCESSABLE_ENTITY
    code = "validation_error"


class RateLimitError(PulseIQError):
    status_code = status.HTTP_429_TOO_MANY_REQUESTS
    code = "rate_limit_exceeded"


class ServiceUnavailableError(PulseIQError):
    status_code = status.HTTP_503_SERVICE_UNAVAILABLE
    code = "service_unavailable"


def _error_response(status_code: int, code: str, message: str, details: dict) -> JSONResponse:
    return JSONResponse(
        status_code=status_code,
        content={"error": {"code": code, "message": message, "details": details}},
    )


async def pulseiq_exception_handler(request: Request, exc: PulseIQError) -> JSONResponse:
    return _error_response(exc.status_code, exc.code, exc.message, exc.details)


async def generic_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    traceback.print_exc()
    return _error_response(
        status.HTTP_500_INTERNAL_SERVER_ERROR,
        "internal_error",
        "An unexpected error occurred.",
        {},
    )
