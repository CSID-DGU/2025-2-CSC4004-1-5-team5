import { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  Image,
  ScrollView,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { useSettings } from '../context/SettingsContext';

// 알림 핸들러 설정 (앱 실행 중에도 알림 표시)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// 테스트 알림 전송 함수
async function scheduleTestNotification() {
  console.log('테스트 알림을 1초 후에 전송합니다...');
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "🔔 알림 테스트",
      body: "알림 권한이 성공적으로 설정되었습니다!",
      sound: 'default',
    },
    trigger: { seconds: 1 },
  });
}

export default function SettingsScreen({ onClose }) {
  const { settings, apply, theme } = useSettings();

  // (슬라이더 관련 state - 기존 코드)
  const [barW, setBarW] = useState(1);
  const [detentLatched, setDetentLatched] = useState(false);
  const MIN = 50, MAX = 100, DETENT = 75, SNAP_EPS = 2, UNLOCK_EPS = 6;

  const persist = (next) => apply(next);

  // ✅ (수정) 알림 활성화/권한 요청 함수
  const toggleAlerts = async () => {
    if (settings.alertsEnabled) {
      persist({ ...settings, alertsEnabled: false });
      console.log('알림이 비활성화되었습니다.');
      return;
    }

    if (!Device.isDevice) {
      Alert.alert('알림 테스트', '시뮬레이터에서는 알림 권한을 요청할 수 없습니다.');
      persist({ ...settings, alertsEnabled: true }); // UI 토글만
      return;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      console.log('알림 권한을 요청합니다...');
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus === 'granted') {
      console.log('알림 권한이 허용되었습니다.');
      persist({ ...settings, alertsEnabled: true });
      await scheduleTestNotification(); // 테스트 알림
    } else {
      console.log('알림 권한이 거부되었습니다.');
      Alert.alert(
        '알림 권한 필요',
        '키워드 알림을 받으려면 앱 설정에서 권한을 허용해야 합니다.',
        [
          { text: '취소', style: 'cancel' },
          { text: '설정으로 이동', onPress: () => Linking.openSettings() },
        ]
      );
    }
  };

  // (슬라이더 헬퍼 함수 - 기존 코드)
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

  // (return 문 - 기존 코드)
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
        {/* 알림 설정 */}
        <View style={[styles.card, { backgroundColor: theme.colors.card }]}>
          <View style={styles.cardTitleRow}>
            <Image
              source={require('../assets/alarm.png')}
              style={styles.leadImg}
            />
            <Text style={[styles.cardTitle, t(theme, 16)]}>알림 설정</Text>
          </View>
          <View style={styles.rowBetween}>
            <View>
              <Text style={[styles.label, t(theme, 13)]}>알림 활성화</Text>
              <Text style={[styles.helpText, ts(theme, 12)]}>
                키워드 감지 시 알림을 받습니다
              </Text>
            </View>
            <SwitchLike on={settings.alertsEnabled} onPress={toggleAlerts} />
          </View>
          <View style={styles.tipBox}>
            <Text style={[styles.tipText, ts(theme, 12)]}>
              💡 알림을 받으려면 등록된 키워드가 안내방송에 포함되어야 합니다.
            </Text>
          </View>
        </View>

        {/* 접근성 설정 (기존 코드와 동일) */}
        <View style={[styles.card, { backgroundColor: theme.colors.card }]}>
          <View style={styles.cardTitleRow}>
            <Image
              source={require('../assets/Accessibility.png')}
              style={styles.leadImg}
            />
            <Text style={[styles.cardTitle, t(theme, 16)]}>접근성 설정</Text>
          </View>
          {/* ... (이하 접근성 설정 UI) ... */}
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
              label="낮음  부드러운 색상"
              selected={settings.contrast === 'low'}
              onPress={() => selectContrast('low')}
              theme={theme}
            />
            <RadioRow
              label="보통  기본 설정"
              selected={settings.contrast === 'normal'}
              onPress={() => selectContrast('normal')}
              theme={theme}
            />
            <RadioRow
              label="높음  선명한 색상"
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

// (헬퍼 컴포넌트 및 스타일 - 기존 코드)
function SwitchLike({ on, onPress }) {
  return (
    <Pressable onPress={onPress} style={[styles.switch, on && styles.switchOn]}>
      <View style={[styles.knob, on && styles.knobOn]} />
    </Pressable>
  );
}
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
  helpText: {},
  valueText: {},
  descText: {},
  tipBox: { backgroundColor: '#EEF6FF', borderRadius: 10, padding: 10 },
  tipText: {},
  switch: {
    width: 48,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#d1d5db',
    padding: 2,
    justifyContent: 'center',
  },
  switchOn: { backgroundColor: '#111827' },
  knob: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
    transform: [{ translateX: 0 }],
  },
  knobOn: { transform: [{ translateX: 20 }] },
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