from celery import shared_task

@shared_task
def test_task():
    print("✅ Celery test task 실행됨!")
    return "Hello from Celery!"
