from celery import shared_task
import datetime

@shared_task
def test_task():
    now = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"🕒 Celery Beat test 실행됨! 현재 서버 시각: {now}")
    return f"Task executed at {now}"
