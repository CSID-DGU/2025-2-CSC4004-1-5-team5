import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const DEFAULT_SETTINGS = {
  alertsEnabled: false,
  fontScalePct: 75,            // ✅ 50~100, 기본 75 = 보통(중앙)
  contrast: 'normal',          // 'low' | 'normal' | 'high'
  fontWeight: 'normal',        // 'normal' | 'medium' | 'bold'
};

const Ctx = createContext(null);

export function SettingsProvider({ sessionId = 'default', children }) {
  const storageKey = `settings:${sessionId}`;
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);

  // 처음 로드
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(storageKey);
        if (raw) {
          const parsed = JSON.parse(raw);
          // 저장된 값이 있으면 기본값과 병합
          setSettings({ ...DEFAULT_SETTINGS, ...parsed });
        }
      } catch {
        // ignore
      }
    })();
  }, [storageKey]);

  // 저장 + 적용
  const apply = async (next) => {
    setSettings(next);
    try {
      await AsyncStorage.setItem(storageKey, JSON.stringify(next));
    } catch {
      // ignore
    }
  };

  // 설정 → 테마/글꼴 계산
  const theme = useMemo(() => {
    const palettes = {
      low:    { bg: '#f5f7ff', card: '#ffffff', text: '#1f2937', sub: '#6b7280', line: '#eef2ff' },
      normal: { bg: '#eef2ff', card: '#ffffff', text: '#111827', sub: '#6b7280', line: '#eef2ff' },
      high:   { bg: '#e6ecff', card: '#ffffff', text: '#0b0f17', sub: '#111827', line: '#dbe1ff' },
    };
    const p = palettes[settings.contrast] || palettes.normal;

    const weightMap = { normal: '400', medium: '600', bold: '800' };
    const weight = weightMap[settings.fontWeight] || '400';

    // ✅ 75%를 1.0배로 스케일 계산 (50~100 범위 지원)
    const scale = settings.fontScalePct / 75;

    return { colors: p, weight, scale };
  }, [settings]);

  return (
    <Ctx.Provider value={{ settings, apply, theme }}>
      {children}
    </Ctx.Provider>
  );
}

export const useSettings = () => useContext(Ctx);
