// components/Keywords.js
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View, TextInput, Pressable } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSettings } from '../context/SettingsContext';

function Chip({ text, onRemove, theme }) {
  // ✅ 글자 크기에 따라 칩 크기 자동 조정
  const scaledHeight = 28 * theme.scale;
  const scaledPaddingV = 6 * theme.scale;
  const scaledPaddingH = 10 * theme.scale;
  const scaledRadius = 999 * theme.scale;

  return (
    <View
      style={[
        styles.chip,
        {
          backgroundColor: '#e9f5ff',
          height: scaledHeight,
          paddingVertical: scaledPaddingV,
          paddingHorizontal: scaledPaddingH,
          borderRadius: scaledRadius,
        },
      ]}
    >
      <Text
        style={{
          fontSize: Math.round(12 * theme.scale),
          fontWeight: '600',
          color: '#1f4f7a',
        }}
      >
        {text}
      </Text>

      <Pressable
        onPress={onRemove}
        style={[
          styles.chipX,
          { transform: [{ scale: theme.scale }] },
        ]}
      >
        <Text
          style={{
            fontSize: Math.round(12 * theme.scale),
            color: '#432DD7',
          }}
        >
          ×
        </Text>
      </Pressable>
    </View>
  );
}

/** 최초 1회 시드용 기본 키워드 */
const DEFAULT_KEYWORDS = [
  '○○○○', '○○○○', '승강장', '안전', '지연', '출발', '혼잡', '환승', '좌측'
];

export default function Keywords({ sessionId = 'default', onChange }) {
  const { theme } = useSettings();
  const storageKey = useMemo(() => `keywords:${sessionId}`, [sessionId]);

  const [input, setInput] = useState('');
  const [items, setItems] = useState([]);
  const [collapsed, setCollapsed] = useState(true);

  const persist = async (next) => {
    setItems(next);
    onChange?.(next);
    try {
      await AsyncStorage.setItem(storageKey, JSON.stringify(next));
    } catch (e) {
      console.warn('키워드 저장 실패:', e);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(storageKey);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            setItems(parsed);
            onChange?.(parsed);
            return;
          }
        }
        await AsyncStorage.setItem(storageKey, JSON.stringify(DEFAULT_KEYWORDS));
        setItems(DEFAULT_KEYWORDS);
        onChange?.(DEFAULT_KEYWORDS);
      } catch (e) {
        console.warn('키워드 로드 실패:', e);
        setItems(DEFAULT_KEYWORDS);
        onChange?.(DEFAULT_KEYWORDS);
      }
    })();
  }, [storageKey]);

  const add = async () => {
    const v = input.trim();
    if (!v) return;
    const existsIdx = items.findIndex(k => k.toLowerCase() === v.toLowerCase());
    let next;
    if (existsIdx >= 0) {
      next = [items[existsIdx], ...items.filter((_, i) => i !== existsIdx)];
    } else {
      next = [v, ...items];
    }
    setInput('');
    await persist(next);
  };

  const remove = async (idx) => {
    const next = items.filter((_, i) => i !== idx);
    await persist(next);
  };

  return (
    <View
      style={[
        styles.wrap,
        { backgroundColor: theme.colors.card, shadowColor: '#000' },
      ]}
    >
      <Text
        style={{
          fontSize: Math.round(12 * theme.scale),
          color: theme.colors.sub,
          fontWeight: theme.weight,
        }}
      >
        등록한 키워드가 안내방송에 포함되면 알림을 받습니다
      </Text>

      <View style={[styles.inputRow, { gap: 8 }]}>
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="새 키워드 입력"
          placeholderTextColor={theme.colors.sub}
          style={[
            styles.input,
            {
              backgroundColor: theme.colors.bg,
              color: theme.colors.text,
              fontSize: Math.round(14 * theme.scale),
            },
          ]}
          returnKeyType="done"
          onSubmitEditing={add}
        />
        <Pressable
          onPress={add}
          style={[
            styles.addBtn,
            { backgroundColor: '#22c55e' },
          ]}
        >
          <Text
            style={{
              color: '#fff',
              fontSize: Math.round(22 * theme.scale),
              fontWeight: '700',
            }}
          >
            ＋
          </Text>
        </Pressable>
      </View>

      <View style={styles.rowHeader}>
        <Text
          style={{
            fontSize: Math.round(12 * theme.scale),
            color: theme.colors.sub,
            fontWeight: theme.weight,
          }}
        >
          등록된 키워드 ({items.length})
        </Text>
        <Pressable onPress={() => setCollapsed(p => !p)}>
          <Text
            style={{
              fontSize: Math.round(12 * theme.scale),
              color: '#2563eb',
              fontWeight: '700',
            }}
          >
            {collapsed ? '더 보기' : '접기'}
          </Text>
        </Pressable>
      </View>

      <View style={[styles.chips, collapsed && styles.chipsCollapsed]}>
        {items.map((t, i) => (
          <Chip key={`${t}-${i}`} text={t} onRemove={() => remove(i)} theme={theme} />
        ))}
      </View>
    </View>
  );
}

const CHIP_ROW_HEIGHT = 28;
const ROW_GAP = 8;
const TWO_ROWS_MAX_HEIGHT = CHIP_ROW_HEIGHT * 2 + ROW_GAP;

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 14,
    padding: 14,
    gap: 10,
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  inputRow: { flexDirection: 'row' },
  input: {
    flex: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chipsCollapsed: {
    maxHeight: TWO_ROWS_MAX_HEIGHT,
    overflow: 'hidden',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  chipX: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#E0E7FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
