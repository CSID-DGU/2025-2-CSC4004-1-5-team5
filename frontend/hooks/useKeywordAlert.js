// FRONTEND/hooks/useKeywordAlert.js

import { useEffect } from "react";
import EventSource from "react-native-sse"; // yarn add react-native-sse 필요
import { useSession } from "../context/SessionContext";
import { api } from "../api/instance"; // axios baseURL 사용

// axios instance에서 baseURL 가져오기
const SSE_BASE_URL = api.defaults.baseURL; 
// 예: "https://yeonhee.shop/api"

export function useKeywordAlert(onKeywordAlert) {
  const { sessionId } = useSession();

  useEffect(() => {
    if (!sessionId) return;

    const url = `${SSE_BASE_URL}/session/${sessionId}/stream/`;
    console.log("[SSE] 연결 시작:", url);

    const es = new EventSource(url);

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("[SSE] 수신:", data);

        if (data.type === "keyword_alert") {
          onKeywordAlert?.({
            keyword: data.keyword,
            broadcastId: data.broadcast_id,
            detectedAt: data.detected_at,
          });
        }
      } catch (e) {
        console.log("[SSE] JSON 파싱 실패:", e);
      }
    };

    es.onerror = (err) => {
      console.log("[SSE] 에러:", err);
      // 필요하면 재연결 로직 추가 가능
    };

    return () => {
      console.log("[SSE] 연결 종료");
      es.close();
    };
  }, [sessionId, onKeywordAlert]);
}
