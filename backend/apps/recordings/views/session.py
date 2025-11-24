from datetime import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.http import StreamingHttpResponse

from apps.keywords.models import Alert
from apps.recordings.models import Session
from apps.recordings.serializers.serializers import SessionSerializer
from apps.recordings.serializers.result import ResultSerializer
from apps.recordings.services.llm import correct_transcription, summarize_text
from apps.recordings.services.nlp import correct_transcription_v2, summarize_text_v2, extract_info_v1
from apps.recordings.services.merger import group_broadcasts

from apps.recordings.sse.stream import event_stream
from apps.broadcasts.models import Broadcast, Transcript


# ========================================================
# Session ViewSet — CRUD + status + results + SSE
# ========================================================
class SessionViewSet(viewsets.ViewSet):

    # [POST] /api/session/
    def create(self, request):
        session = Session.objects.create()
        return Response(SessionSerializer(session).data, status=status.HTTP_201_CREATED)

    # [GET] /api/session/{id}/
    def retrieve(self, request, pk=None):
        session = get_object_or_404(Session, id=pk)
        if session.is_expired:
            session.delete()
            return Response({"detail": "Session이 만료되었습니다."}, status=410)
        return Response(SessionSerializer(session).data)

    # [DELETE] /api/session/{id}/
    def destroy(self, request, pk=None):
        session = get_object_or_404(Session, id=pk)
        session.delete()
        return Response({"detail": f"Session {pk} deleted."})

    # -----------------------------
    # [GET] /api/session/{id}/status/
    @action(detail=True, methods=["GET"], url_path="status")
    def status(self, request, pk=None):
        session = get_object_or_404(Session, id=pk)
        if session.is_expired:
            session.delete()
            return Response({"detail": "Session이 만료되었습니다."}, status=410)

        alerts = Alert.objects.filter(keyword__session=session)
        
        done = session.chunks.filter(status="COMPLETE").count()
        total = session.chunks.count()
        
        # ==== 세션 자동 종료 판정 ====
        if total > 0 and done >= total:
            if session.status != "COMPLETE":
                session.status = "COMPLETE"
                session.save()
        else:
            session.status = "RECORDING"
            session.save()

        return Response({
            "session_id": pk,
            "status": session.status,
            "done_chunks": done,
            "total_chunks": total,
            "total_keywords": alerts.count(),
            "keyword_alerts": [
                {
                    "broadcast_id": a.broadcast.id if a.broadcast else None,
                    "keyword": a.keyword.word,
                    "detected_at": a.detected_at,
                }
                for a in alerts
            ],
        })

    # -----------------------------
    # [GET] /api/session/{id}/results/
    @action(detail=True, methods=["GET"], url_path="results")
    def results(self, request, pk=None):
        session = get_object_or_404(Session, id=pk)

        # 세션의 방송 목록
        broadcasts = Broadcast.objects.filter(session=session).order_by("created_at")

        if not broadcasts.exists():
            return Response({"detail": "No broadcasts detected yet."})

        # 1) 방송 → 안내방송 단위 그룹핑
        try:
            announcement_groups = group_broadcasts(broadcasts)
        except Exception as e:
            print("❌ group_broadcasts 오류:", e)
            announcement_groups = [[b] for b in broadcasts]

        timeline = []
        confidences_total = []
        
        # 2) 안내방송 단위 처리
        for i, group in enumerate(announcement_groups):

            # --- 텍스트 병합 + LLM 재생성 ---
            raw_texts = [b.full_text for b in group]
            merged_raw = " ".join(raw_texts)

            fixed_text = correct_transcription_v2(merged_raw)
            summary = summarize_text_v2(fixed_text)
            info = extract_info_v1(fixed_text)

            # --- 메타데이터 수집 ---
            broadcast_ids = [b.id for b in group]
            chunk_ids = [b.audio_chunk.id for b in group]
            group_conf = [b.confidence_avg or 0 for b in group]

            confidences_total.extend(group_conf)

            # 키워드
            keywords = []
            for b in group:
                kw = list(b.keywords_detected.values_list("word", flat=True))
                keywords.extend(kw)

            timeline.append({
                "announcement_id": i + 1,
                "broadcast_ids": broadcast_ids,
                "audio_chunks": chunk_ids,
                "full_text": fixed_text,
                "summary": summary,
                "info": info,
                "keywords_detected": list(set(keywords)),
                "confidence_avg": round(sum(group_conf) / len(group_conf), 3) if group_conf else 0
            })

        # 3) 세션 전체 요약
        session_full_text = " ".join([t["full_text"] for t in timeline])
        session_summary = summarize_text_v2(session_full_text)
        
        # Tramscript 모델에 저장
        total_keywords = Alert.objects.filter(keyword__session=session).count()

        Transcript.objects.update_or_create(
            session=session,
            defaults={
                "summary": session_summary,
                "total_broadcasts": len(broadcasts),
                "total_keywords": total_keywords,
                "accuracy_avg": round(sum(confidences_total) / len(confidences_total), 3)
            }
        )

        return Response({
            "session_id": pk,
            "total_announcements": len(timeline),
            "summary": session_summary,
            "timeline": timeline
        })

    # -----------------------------
    # [GET] /api/session/{id}/stream/
    @action(detail=True, methods=["GET"], url_path="stream")
    def stream(self, request, pk=None):
        response = StreamingHttpResponse(event_stream(pk), content_type="text/event-stream")
        response["X-Accel-Buffering"] = "no"
        return response
