import redis, json

r = redis.Redis(host="redis", port=6379, db=0)

def push_event(session_id, payload):
    r.publish(f"session:{session_id}", json.dumps(payload))
