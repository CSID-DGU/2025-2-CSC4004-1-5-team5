// FRONTEND/context/SessionContext.js (또는 .tsx)

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import { api } from "../api/instance";

// 세션 정보를 보관할 컨텍스트 생성
const SessionContext = createContext(null);

/**
 * 새 세션을 생성하는 헬퍼 함수
 * (previousSessionId는 백엔드가 무시하지만 일단 전송)
 */
async function createNewSession(previousSessionId = null) {
  // ✅ 여기만 /session/ 으로 변경
  const endpoint = "/session/";
  const payload = {};

  if (previousSessionId) {
    payload.previous_session_id = previousSessionId;
    console.log(
      `[Session] 새 세션 생성 요청 (이전 ID: ${previousSessionId}) POST ${endpoint}`
    );
  } else {
    console.log(`[Session] 새 세션 생성 요청 POST ${endpoint}`);
  }

  const res = await api.post(endpoint, payload);
  console.log("[Session] 새 세션 생성 응답 데이터:", res.data);

  const rawId = res.data.id ?? res.data.session_id;
  if (rawId === undefined || rawId === null) {
    console.log("[Session] 응답 데이터에 세션 ID가 없습니다.");
    throw new Error("세션 ID를 응답에서 찾을 수 없습니다.");
  }

  const newId = String(rawId);
  console.log("[Session] 새 세션 ID:", newId);
  return newId;
}

export function SessionProvider({ children }) {
  const [sessionId, setSessionId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 1. 앱 시작 시: 항상 새 세션 생성
  useEffect(() => {
    const initSession = async () => {
      try {
        setLoading(true);
        console.log("====================================");
        console.log("[Session] 앱 시작, 새 세션 초기화 시작");

        const newId = await createNewSession(null);

        console.log("[Session] 앱 시작, 새 세션 생성 완료, ID:", newId);
        setSessionId(newId);
        setError(null);
      } catch (e) {
        console.log("[Session] 초기 세션 생성 실패:", e);
        setError(e);
      } finally {
        setLoading(false);
        console.log("[Session] 세션 초기화 종료");
        console.log("====================================");
      }
    };

    initSession();
  }, []);

  // ✅ 2. "세션 교체" 함수
  // keywordsToTransfer (string[] 예: ["ㅎㅇ", "호호"])를 인자로 받음
  const resetSession = async (keywordsToTransfer = []) => {
    setLoading(true);
    setError(null);

    try {
      const oldSessionId = sessionId;
      console.log("[Session] 세션 교체 시작 (이전 ID:", oldSessionId, ")");

      // 1. 새 세션 생성
      const newId = await createNewSession(oldSessionId);

      console.log("[Session] 새 세션으로 교체 완료, New ID:", newId);

      // 2. 새 세션에 키워드 재등록
      if (keywordsToTransfer.length > 0) {
        console.log(
          `[Session] ${keywordsToTransfer.length}개의 키워드를 새 세션(${newId})에 재등록합니다.`
        );
        try {
          const payload = {
            session_id: newId,
            keywords: keywordsToTransfer, // string[]
          };
          console.log(
            "[Session] 키워드 재등록 요청: POST /keywords/",
            payload
          );
          // (호출 URL: https://yeonhee.shop/api/keywords/)
          await api.post("/keywords/", payload);
          console.log(`[Session] 키워드 재등록 완료.`);
        } catch (e) {
          console.error(
            "[Session] 키워드 재등록 실패:",
            e?.response?.data ?? e.message
          );
          // 재등록에 실패해도 세션 교체는 완료된 것으로 간주.
        }
      } else {
        console.log("[Session] 재등록할 키워드가 없습니다.");
      }

      // 3. 키워드 재등록까지 완료된 후, 앱 상태(sessionId)를 업데이트
      setSessionId(newId);
    } catch (e) {
      console.log("[Session] 세션 교체 실패:", e);
      setError(e);
      // 세션 생성 자체를 실패하면 ID를 바꾸지 않음
    } finally {
      setLoading(false); // 세션 교체 완료
    }
  };

  const value = {
    sessionId,
    loading,
    error,
    resetSession,
  };

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  );
}

// 훅
export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error("useSession은 SessionProvider 안에서만 사용해야 합니다.");
  }
  return ctx;
}
