// // components/CoreInfo.js
// import { StyleSheet, Text, View, Image } from 'react-native';
// import { useSettings } from '../context/SettingsContext';

// const Card = ({ title, value, icon, theme }) => (
//   <View style={[styles.card, { backgroundColor: theme.colors.card }]}>
//     <View style={styles.cardHeader}>
//       {icon && <Image source={icon} style={styles.icon} />}
//       <Text
//         style={{
//           fontSize: Math.round(12 * theme.scale),
//           color: theme.colors.sub,
//           fontWeight: theme.weight,
//         }}
//       >
//         {title}
//       </Text>
//     </View>
//     <Text
//       style={{
//         fontSize: Math.round(16 * theme.scale),
//         fontWeight: theme.weight,
//         color: theme.colors.text,
//       }}
//     >
//       {value}
//     </Text>
//   </View>
// );

// const Badge = ({ label }) => (
//   <View style={styles.badge}>
//     <Text style={styles.badgeText}>{label}</Text>
//   </View>
// );

// export default function CoreInfo() {
//   const { theme } = useSettings();

//   return (
//     <View style={{ gap: Math.round(12 * theme.scale) }}>
//       <View style={{ flexDirection: 'row', gap: Math.round(12 * theme.scale) }}>
//         <Card
//           title="현재 역"
//           value="강남역"
//           icon={require('../assets/Current Station.png')}
//           theme={theme}
//         />
//         <Card
//           title="다음 역"
//           value="인식 대기 중"
//           icon={require('../assets/Next Station.png')}
//           theme={theme}
//         />
//       </View>

//       <View style={{ flexDirection: 'row', gap: Math.round(12 * theme.scale) }}>
//         <View style={[styles.card, { flex: 1, backgroundColor: theme.colors.card }]}>
//           <View style={styles.cardHeader}>
//             <Image source={require('../assets/Transfer.png')} style={styles.icon} />
//             <Text
//               style={{
//                 fontSize: Math.round(12 * theme.scale),
//                 color: theme.colors.sub,
//                 fontWeight: theme.weight,
//               }}
//             >
//               환승 노선
//             </Text>
//           </View>
//           <View style={[styles.badgeWrap, { marginTop: Math.round(6 * theme.scale) }]}>
//             <Badge label="2호선" />
//             <Badge label="신분당선" />
//             <Badge label="9호선" />
//             <Badge label="환승" />
//           </View>
//         </View>

//         <Card
//           title="출입문"
//           value="오른쪽"
//           icon={require('../assets/Exit.png')}
//           theme={theme}
//         />
//       </View>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: { gap: 12 },
//   row: { flexDirection: 'row', gap: 12 },
//   card: {
//     flex: 1,
//     borderRadius: 14,
//     padding: 14,
//     gap: 6,
//     shadowColor: '#000',
//     shadowOpacity: 0.05,
//     shadowRadius: 6,
//     elevation: 1,
//   },
//   cardHeader: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 6,
//   },
//   icon: { width: 20, height: 20 },
//   badgeWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
//   badge: {
//     backgroundColor: '#FFEDD4',
//     borderRadius: 999,
//     paddingHorizontal: 10,
//     paddingVertical: 6,
//   },
//   badgeText: { fontSize: 12, fontWeight: '700', color: '#CA3500' },
// });
