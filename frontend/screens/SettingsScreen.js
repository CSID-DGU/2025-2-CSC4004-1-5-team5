import { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  Image,
  ScrollView,
} from 'react-native';
import { useSettings } from '../context/SettingsContext';

export default function SettingsScreen({ onClose }) {
  const { settings, apply, theme } = useSettings();

  // 슬라이더 관련 state
  const [barW, setBarW] = useState(1);
  const [detentLatched, setDetentLatched] = useState(false);
  const MIN = 50, MAX = 100, DETENT = 75, SNAP_EPS = 2, UNLOCK_EPS = 6;

  const persist = (next) => apply(next);

  // 슬라이더 헬퍼 함수
  const toProgressPct = (val) => ((val - MIN) / (MAX - MIN)) * 100;
  const mapXToValue = (x) => {
    if (barW <= 0) return settings.fontScalePct;
    const p = Math.max(0, Math.min(1, x / barW));
    return Math.round(MIN + p * (MAX - MIN));
  };
  const onGrant = (e) => {
    setDetentLatched(false);
    onMove(e);
  };
  const onMove = (e) => {
    const raw = mapXToValue(e.nativeEvent.locationX);
    const diffToDetent = Math.abs(raw - DETENT);
    if (!detentLatched && diffToDetent <= SNAP_EPS) {
      persist({ ...settings, fontScalePct: DETENT });
      setDetentLatched(true);
      return;
    }
    if (detentLatched) {
      if (Math.abs(raw - DETENT) >= UNLOCK_EPS) {
        setDetentLatched(false);
        persist({ ...settings, fontScalePct: raw });
      } else {
        persist({ ...settings, fontScalePct: DETENT });
      }
      return;
    }
    persist({ ...settings, fontScalePct: raw });
  };
  const progressPct = toProgressPct(settings.fontScalePct);
  const selectContrast = (v) => persist({ ...settings, contrast: v });
  const selectWeight = (v) => persist({ ...settings, fontWeight: v });

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.bg }]}>
      {/* 헤더 */}
      <View style={[styles.header, { borderColor: theme.colors.line }]}>
        <Text style={[styles.headerTitle, t(theme, 16)]}>설정</Text>
        <Pressable onPress={onClose} hitSlop={10}>
          <Image
            source={require('../assets/Setting.png')}
            style={styles.headerIcon}
          />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ✅ 알림 설정 섹션 삭제됨 */}

        {/* 접근성 설정 */}
        <View style={[styles.card, { backgroundColor: theme.colors.card }]}>
          <View style={styles.cardTitleRow}>
            <Image
              source={require('../assets/Accessibility.png')}
              style={styles.leadImg}
            />
            <Text style={[styles.cardTitle, t(theme, 16)]}>접근성 설정</Text>
          </View>
          
          <Text style={[styles.descText, ts(theme, 12)]}>
            화면 표시를 개인 선호도에 맞게 조정합니다.
          </Text>

          {/* 글자 크기 */}
          <View style={{ marginTop: 10 }}>
            <View style={styles.rowBetween}>
              <Text style={[styles.label, t(theme, 13)]}>글자 크기</Text>
              <Text style={[styles.valueText, ts(theme, 12)]}>
                {settings.fontScalePct}%
              </Text>
            </View>
            <View
              style={styles.slider}
              onLayout={(e) => setBarW(e.nativeEvent.layout.width)}
              onStartShouldSetResponder={() => true}
              onResponderGrant={onGrant}
              onResponderMove={onMove}
            >
              <View style={[styles.sliderFill, { width: `${progressPct}%` }]} />
              <View style={[styles.sliderKnob, { left: `${progressPct}%` }]} />
            </View>
            <View style={styles.sliderLabels}>
              <Text style={[styles.sliderLabelText, ts(theme, 11)]}>작게</Text>
              <Text style={[styles.sliderLabelText, ts(theme, 11)]}>보통</Text>
              <Text style={[styles.sliderLabelText, ts(theme, 11)]}>크게</Text>
            </View>
          </View>

          {/* 색상 대비 */}
          <View style={{ marginTop: 18 }}>
            <Text style={[styles.label, t(theme, 13)]}>색상 대비</Text>
            <RadioRow
              label="낮음  부드러운 색상"
              selected={settings.contrast === 'low'}
              onPress={() => selectContrast('low')}
              theme={theme}
            />
            <RadioRow
              label="보통  기본 설정"
              selected={settings.contrast === 'normal'}
              onPress={() => selectContrast('normal')}
              theme={theme}
            />
            <RadioRow
              label="높음  선명한 색상"
              selected={settings.contrast === 'high'}
              onPress={() => selectContrast('high')}
              theme={theme}
            />
          </View>

          {/* 글꼴 굵기 */}
          <View style={{ marginTop: 18 }}>
            <Text style={[styles.label, t(theme, 13)]}>글꼴 굵기</Text>
            <RadioRow
              label="보통"
              selected={settings.fontWeight === 'normal'}
              onPress={() => selectWeight('normal')}
              theme={theme}
            />
            <RadioRow
              label="중간"
              selected={settings.fontWeight === 'medium'}
              onPress={() => selectWeight('medium')}
              theme={theme}
            />
            <RadioRow
              label="굵게"
              selected={settings.fontWeight === 'bold'}
              onPress={() => selectWeight('bold')}
              theme={theme}
            />
          </View>

          <View style={[styles.tipBox, { marginTop: 16 }]}>
            <Text style={[styles.tipText, ts(theme, 12)]}>
              💡 설정은 자동으로 저장되며 앱을 다시 열어도 유지됩니다.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

// 헬퍼 컴포넌트 및 스타일
function RadioRow({ label, selected, onPress, theme }) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.radioRow, { borderColor: theme.colors.line }]}
    >
      <View style={[styles.radioDot, selected && styles.radioDotOn]}>
        {selected && <View style={styles.radioInner} />}
      </View>
      <Text style={[styles.radioLabel, ts(theme, 13)]}>{label}</Text>
    </Pressable>
  );
}

const t = (theme, base) => ({
  fontSize: Math.round(base * theme.scale),
  fontWeight: theme.weight,
  color: theme.colors.text,
});
const ts = (theme, base) => ({
  fontSize: Math.round(base * theme.scale),
  color: theme.colors.sub,
});

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    height: 56,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: { fontWeight: '700' },
  headerIcon: { width: 45, height: 45, tintColor: '#6b7280' },
  content: { padding: 16, gap: 16 },
  card: {
    borderRadius: 14,
    padding: 14,
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  leadImg: { width: 20, height: 20, resizeMode: 'contain' },
  cardTitle: { fontWeight: '700' },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: { fontWeight: '700' },
  valueText: {},
  descText: {},
  tipBox: { backgroundColor: '#EEF6FF', borderRadius: 10, padding: 10 },
  tipText: {},
  slider: {
    height: 24,
    borderRadius: 999,
    backgroundColor: '#e5e7eb',
    marginTop: 10,
    justifyContent: 'center',
  },
  sliderFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: '#111827',
    borderRadius: 999,
  },
  sliderKnob: {
    position: 'absolute',
    top: -6,
    marginLeft: -10,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
    paddingHorizontal: 2,
  },
  sliderLabelText: {},
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  radioDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDotOn: { borderColor: '#111827' },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#111827',
  },
  radioLabel: {},
});