from typing import Any, Dict, Optional
from fastapi import Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException


def create_problem_detail(
    status_code: int,
    title: str,
    detail: str,
    code: str,
    instance: str,
    errors: Optional[Any] = None,
) -> Dict[str, Any]:
    """Generates an RFC 7807 compliant problem details dictionary."""
    problem = {
        "type": f"https://errors.eventflow.io/{code}",
        "title": title,
        "status": status_code,
        "detail": detail,
        "code": code,
        "instance": instance,
    }
    if errors is not None:
        problem["errors"] = errors
    return problem


async def http_exception_handler(request: Request, exc: StarletteHTTPException) -> JSONResponse:
    detail_data = exc.detail
    if isinstance(detail_data, dict):
        code = detail_data.get("code", "HTTP_ERROR")
        message = detail_data.get("message", str(detail_data))
    else:
        code = "HTTP_ERROR"
        message = str(detail_data)

    problem = create_problem_detail(
        status_code=exc.status_code,
        title=code.replace("_", " ").title(),
        detail=message,
        code=code,
        instance=str(request.url.path),
    )
    return JSONResponse(status_code=exc.status_code, content=problem)


async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    problem = create_problem_detail(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        title="Validation Error",
        detail="One or more request parameters failed schema validation.",
        code="VALIDATION_FAILED",
        instance=str(request.url.path),
        errors=exc.errors(),
    )
    return JSONResponse(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, content=problem)


async def generic_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    problem = create_problem_detail(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        title="Internal Server Error",
        detail="An unexpected error occurred. Please contact system administrators.",
        code="INTERNAL_SERVER_ERROR",
        instance=str(request.url.path),
    )
    return JSONResponse(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, content=problem)
