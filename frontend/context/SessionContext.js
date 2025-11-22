// FRONTEND/context/SessionContext.js

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { api } from "../api/instance";

const SessionContext = createContext(null);
const SESSION_HISTORY_KEY = "SESSION_HISTORY_IDS";

/**
 * 로컬 스토리지에 세션 ID 추가
 */
async function addSessionIdToHistory(id) {
  try {
    const jsonValue = await AsyncStorage.getItem(SESSION_HISTORY_KEY);
    const history = jsonValue != null ? JSON.parse(jsonValue) : [];
    if (!history.includes(id)) {
      history.push(id);
      await AsyncStorage.setItem(SESSION_HISTORY_KEY, JSON.stringify(history));
    }
  } catch (e) {
    console.error("[Session] 세션 ID 저장 실패:", e);
  }
}

/**
 * 앱 시작 시 이전 세션들 일괄 삭제
 */
async function cleanupOldSessions() {
  try {
    const jsonValue = await AsyncStorage.getItem(SESSION_HISTORY_KEY);
    const history = jsonValue != null ? JSON.parse(jsonValue) : [];

    if (history.length === 0) return;

    console.log(`[Session] 이전 세션 ${history.length}개 삭제 시도 중...`);

    const deletePromises = history.map((id) =>
      api.delete(`/session/${id}/`).catch((err) => {
        console.log(
          `[Session] 세션 ${id} 삭제 실패 (이미 만료됐을 수 있음)`
        );
      })
    );

    await Promise.allSettled(deletePromises);

    await AsyncStorage.removeItem(SESSION_HISTORY_KEY);
    console.log("[Session] 이전 세션 정리 완료");
  } catch (e) {
    console.error("[Session] 이전 세션 정리 중 오류:", e);
  }
}

/**
 * 새 세션을 생성하는 헬퍼 함수
 */
async function createNewSession(previousSessionId = null) {
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

  const rawId = res.data.id ?? res.data.session_id;
  if (rawId === undefined || rawId === null) {
    throw new Error("세션 ID를 응답에서 찾을 수 없습니다.");
  }

  const newId = String(rawId);
  console.log("[Session] 새 세션 ID:", newId);

  await addSessionIdToHistory(newId);

  return newId;
}

export function SessionProvider({ children }) {
  const [sessionId, setSessionId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 앱 시작 시: 이전 세션 정리 후 새 세션 생성
  useEffect(() => {
    const initSession = async () => {
      try {
        setLoading(true);
        console.log("====================================");

        await cleanupOldSessions();

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

  // 세션 교체 함수
  const resetSession = async (keywordsToTransfer = []) => {
    setLoading(true);
    setError(null);

    try {
      const oldSessionId = sessionId;
      console.log("[Session] 세션 교체 시작 (이전 ID:", oldSessionId, ")");

      const newId = await createNewSession(oldSessionId);

      console.log("[Session] 새 세션으로 교체 완료, New ID:", newId);

      if (keywordsToTransfer.length > 0) {
        console.log(
          `[Session] ${keywordsToTransfer.length}개의 키워드를 새 세션(${newId})에 재등록합니다.`
        );
        try {
          const payload = {
            session_id: newId,
            keywords: keywordsToTransfer,
          };
          await api.post("/keywords/", payload);
          console.log(`[Session] 키워드 재등록 완료.`);
        } catch (e) {
          console.error(
            "[Session] 키워드 재등록 실패:",
            e?.response?.data ?? e.message
          );
        }
      } else {
        console.log("[Session] 재등록할 키워드가 없습니다.");
      }

      setSessionId(newId);
    } catch (e) {
      console.log("[Session] 세션 교체 실패:", e);
      setError(e);
    } finally {
      setLoading(false);
    }
  };

  /**
   * ✅ 오디오 청크 업로드 (/audio/)
   * - fileUri: expo-audio로 녹음된 파일 URI
   * - durationSec: 선택, 초 단위 길이 (10초 청크면 10, 모르면 null)
   */
  const uploadAudioChunk = useCallback(
    async (fileUri, durationSec = null) => {
      if (!fileUri) {
        console.log("[Session] 업로드할 파일 URI가 없습니다.");
        return;
      }
      if (!sessionId) {
        console.warn("[Session] sessionId 없음, 청크 업로드 스킵");
        return;
      }

      const formData = new FormData();
      formData.append("session_id", Number(sessionId));
      if (durationSec != null) {
        formData.append("duration", durationSec);
      }
      formData.append("audio_file", {
        uri: fileUri,
        type: "audio/m4a", // expo-audio 기본 포맷(m4a)에 맞춤
        name: `chunk_${Date.now()}.m4a`,
      });

      console.log("[Session] 청크 업로드 시작:", {
        sessionId,
        durationSec,
        fileUri,
      });

      try {
        const res = await api.post("/audio/", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
        console.log("[Session] 청크 업로드 완료:", res.data);
        return res.data;
      } catch (e) {
        console.error(
          "[Session] 청크 업로드 실패:",
          e?.response?.data ?? e.message
        );
        throw e;
      }
    },
    [sessionId]
  );

  const value = {
    sessionId,
    loading,
    error,
    resetSession,
    uploadAudioChunk,
  };

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error("useSession은 SessionProvider 안에서만 사용해야 합니다.");
  }
  return ctx;
}
