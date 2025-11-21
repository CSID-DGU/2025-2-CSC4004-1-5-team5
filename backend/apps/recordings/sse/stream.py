import time
import redis
from django.http import StreamingHttpResponse

r = redis.Redis(host="redis", port=6379, db=0)

def event_stream(session_id):
    pubsub = r.pubsub()
    pubsub.subscribe(f"session:{session_id}")

    for message in pubsub.listen():
        if message["type"] == "message":
            data = message["data"].decode("utf-8")
            yield f"data: {data}\n\n"
        time.sleep(0.01)


def session_event_stream(request, session_id):
    response = StreamingHttpResponse(
        event_stream(session_id),
        content_type="text/event-stream",
    )
    response["Cache-Control"] = "no-cache"
    response["X-Accel-Buffering"] = "no"
    return response
