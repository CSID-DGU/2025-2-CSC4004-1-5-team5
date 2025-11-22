from apps.recordings.services.llm import is_continuation

def group_broadcasts(broadcasts):

    def is_incomplete(text):
        return not text.strip().endswith(("입니다.", ".", "다.", "요."))

    announcements = []
    current = []

    for b in broadcasts:
        if not current:
            current.append(b)
            continue

        prev = current[-1]
        diff = (b.created_at - prev.created_at).total_seconds()

        # LLM continuation (문맥 기반 이어짐 판단)
        cont = is_continuation(prev.full_text, b.full_text)

        # 기존 조건 + LLM 조건 적용
        if diff <= 2 or is_incomplete(prev.full_text) or cont:
            current.append(b)
        else:
            announcements.append(current)
            current = [b]

    if current:
        announcements.append(current)

    return announcements
