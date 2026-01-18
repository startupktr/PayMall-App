from rest_framework.response import Response


def success_response(
    *,
    message="Success",
    data=None,
    status=200
):
    return Response(
        {
            "success": True,
            "message": message,
            "data": data,
            "errors": None,
        },
        status=status,
    )


def error_response(
    *,
    message="Error",
    errors=None,
    status=400
):
    return Response(
        {
            "success": False,
            "message": message,
            "data": None,
            "errors": errors,
        },
        status=status,
    )
