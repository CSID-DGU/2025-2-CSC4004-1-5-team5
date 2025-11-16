// FRONTEND/context/SessionContext.js
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { api } from "../api/instance"; // api 폴더 기준 경로

// 세션 정보를 보관할 컨텍스트 생성
const SessionContext = createContext(null);

// 새 세션 생성 + AsyncStorage에 저장하는 함수
async function createNewSession() {
  console.log("[Session] 새 세션 생성 요청 시작 POST /sessions/");

  const res = await api.post("/sessions/");

  // 백엔드 응답 전체를 한 번 찍어보기 (실제 응답 구조 확인용)
  console.log("[Session] 새 세션 생성 응답 데이터:", res.data);

  // 실제 응답 필드명에 맞게 선택 (id 또는 session_id)
  const newId = res.data.id ?? res.data.session_id;

  if (!newId) {
    console.log("[Session] 응답 데이터에 세션 ID가 없습니다.");
    throw new Error("세션 ID를 응답에서 찾을 수 없습니다.");
  }

  // AsyncStorage에 세션 ID 저장
  await AsyncStorage.setItem("sessionId", newId);
  console.log("[Session] 새 세션 ID AsyncStorage에 저장 완료:", newId);

  return newId;
}

export function SessionProvider({ children }) {
  const [sessionId, setSessionId] = useState(null);
  const [loading, setLoading] = useState(true); // 세션 준비 중 여부
  const [error, setError] = useState(null);

  useEffect(() => {
    const initSession = async () => {
      try {
        setLoading(true);
        console.log("====================================");
        console.log("[Session] 앱 시작, 세션 초기화 시작");

        // 1. 기기에 저장된 세션 ID가 있는지 확인
        const storedId = await AsyncStorage.getItem("sessionId");
        console.log("[Session] AsyncStorage에서 읽은 sessionId:", storedId);

        if (storedId) {
          try {
            // 2. 서버에 조회해서 유효한 세션인지 확인
            console.log(
              `[Session] 기존 세션 ID로 GET /sessions/${storedId}/ 요청`
            );
            const res = await api.get(`/sessions/${storedId}/`);

            // 응답 상태 및 데이터 로그
            console.log(
              "[Session] 기존 세션 조회 성공, status:",
              res.status
            );
            console.log("[Session] 기존 세션 조회 응답 데이터:", res.data);

            // 에러 없이 통과하면 그대로 사용
            setSessionId(storedId);
            setError(null);
            setLoading(false);
            console.log("[Session] 기존 세션 ID를 그대로 사용합니다:", storedId);
            console.log("====================================");
            return;
          } catch (e) {
            // 404 등으로 유효하지 않으면 새로 생성
            console.log(
              "[Session] 기존 세션 조회 실패, 새로 생성합니다. status:",
              e?.response?.status
            );
          }
        } else {
          console.log("[Session] 저장된 세션 ID가 없습니다. 새로 생성합니다.");
        }

        // 3. 저장된 세션이 없거나, 유효하지 않을 때 → 새 세션 생성
        const newId = await createNewSession();
        console.log("[Session] 새 세션 생성 완료, ID:", newId);
        setSessionId(newId);
        setError(null);
      } catch (e) {
        console.log("[Session] 세션 초기화 실패:", e);
        setError(e);
      } finally {
        setLoading(false);
        console.log("[Session] 세션 초기화 종료");
        console.log("====================================");
      }
    };

    initSession();
  }, []);

  // 필요할 때 세션을 강제로 리셋하고 싶을 때 사용할 수 있는 함수
  const resetSession = async () => {
    try {
      console.log("[Session] 세션 리셋 시작");
      await AsyncStorage.removeItem("sessionId");
      console.log("[Session] AsyncStorage의 sessionId 제거 완료");

      const newId = await createNewSession();
      console.log("[Session] 세션 리셋 후 새 세션 ID:", newId);

      setSessionId(newId);
    } catch (e) {
      console.log("[Session] 세션 리셋 실패:", e);
    }
  };

  const value = {
    sessionId,    // 현재 사용 중인 세션 ID
    setSessionId, // 필요시 수동으로 세션 ID를 바꾸고 싶을 때 사용
    loading,      // 세션 초기화 중인지 여부
    error,        // 세션 초기화 중 발생한 에러 정보
    resetSession, // 강제 세션 리셋 함수
  };

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  );
}

// 다른 컴포넌트에서 세션을 사용하기 위한 훅
export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error("useSession은 SessionProvider 안에서만 사용해야 합니다.");
  }
  return ctx;
}
