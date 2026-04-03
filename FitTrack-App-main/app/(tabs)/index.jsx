import { Dimensions, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { AVATAR_CONFIGS, XP_PER_LEVEL } from '../../constants';
import { useApp } from '../../hooks';
import MapPreview from '../components/MapPreview';

const { width: SCREEN_W } = Dimensions.get('window');

export default function HomeScreen({ onNav }) {
  const { user, dark, leaderboard, challenges } = useApp();
  const cfg = AVATAR_CONFIGS[user.selectedAvatar] || AVATAR_CONFIGS.blaze;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const xpPct = Math.min(100, (user.xp / XP_PER_LEVEL) * 100);
  const displayLeaderboard = leaderboard.length > 0 ? leaderboard : [];

  // Real stats from user context
  const caloriesEstimate = Math.round((user.totalSteps || 0) * 0.04); // ~0.04 cal/step
  const distanceKm = (user.distance || 0).toFixed(1);
  const stats = [
    { label: 'Calories',  val: caloriesEstimate > 0 ? `${caloriesEstimate}` : '—', icon: '🔥', color: '#F4621F' },
    { label: 'Distance',  val: `${distanceKm}km`, icon: '📍', color: '#7C3AED' },
    { label: 'Streak',    val: `${user.streak || 0}d`,  icon: '⚡', color: '#F5A623' },
    { label: 'Level',     val: `Lv.${user.level || 1}`, icon: '⭐', color: '#16A34A' },
  ];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: dark ? '#0F0F13' : '#F7F7FA' }]}
      showsVerticalScrollIndicator={false}
    >
      {/* ── HEADER ── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity style={styles.avatarBtn} onPress={() => onNav('profile')}>
            {user.profilePic ? (
              <Image source={{ uri: user.profilePic }} style={styles.profileImage} />
            ) : (
              <View style={[styles.avatarCircle, { backgroundColor: cfg.color || '#F4621F' }]}>
                <Text style={styles.avatarFace}>{cfg.face || '😤'}</Text>
              </View>
            )}
            <View style={styles.onlineDot} />
          </TouchableOpacity>
          <View>
            <Text style={styles.greeting}>{greeting} 👋</Text>
            <Text style={[styles.userName, { color: dark ? '#F0F0F5' : '#141416' }]}>
              {user.name}
            </Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <View style={[styles.coinBadge, { backgroundColor: dark ? 'rgba(245,158,11,0.15)' : '#FEF3C7' }]}>
            <Text style={styles.coinEmoji}>🪙</Text>
            <Text style={styles.coinVal}>{(user.coins || 0).toLocaleString()}</Text>
          </View>
          <View style={styles.levelBadge}>
            <Text style={styles.levelText}>Lv.{user.level || 1}</Text>
          </View>
        </View>
      </View>

      {/* ── XP BAR ── */}
      <View style={styles.xpRow}>
        <View style={styles.xpTrack}>
          <View style={[styles.xpFill, { width: `${xpPct}%` }]} />
        </View>
        <Text style={styles.xpText}>{user.xp}/{XP_PER_LEVEL} XP</Text>
      </View>

      {/* ── MAP PREVIEW ── */}
      <View style={styles.mapWrap}>
        <MapPreview dark={dark} />
        <View style={styles.mapTrackingBadge}>
          <View style={styles.liveDot} />
          <Text style={styles.liveBadgeText}>GPS</Text>
        </View>
        <View style={styles.mapStatsBadge}>
          <Text style={styles.mapStatVal}>{((user.totalSteps || 0) / 1000).toFixed(1)}k</Text>
          <Text style={styles.mapStatLabel}>STEPS</Text>
          <View style={styles.mapStatDivider} />
          <Text style={styles.mapStatVal}>{distanceKm}</Text>
          <Text style={styles.mapStatLabel}>KM</Text>
        </View>
      </View>

      {/* ── STATS BAR ── */}
      <View style={styles.statsBar}>
        {stats.map((s, i) => (
          <View key={i} style={[styles.statCard, { backgroundColor: dark ? '#1A1A20' : '#fff' }]}>
            <Text style={styles.statIcon}>{s.icon}</Text>
            <Text style={[styles.statVal, { color: s.color }]}>{s.val}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* ── START WALKING CTA ── */}
      <View style={styles.ctaWrap}>
        <TouchableOpacity style={styles.ctaBtn} onPress={() => onNav('track')}>
          <Text style={styles.ctaBtnText}>🚶 Start Walking</Text>
        </TouchableOpacity>
      </View>

      {/* ── DAILY CHALLENGES ── */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: dark ? '#F0F0F5' : '#141416' }]}>
            Daily Challenges
          </Text>
          <Text style={styles.sectionMeta}>Reset in 8h</Text>
        </View>
        <View style={styles.challengesList}>
          {(challenges || []).map((ch) => {
            const pct = Math.min(100, Math.round((ch.current / ch.target) * 100));
            const done = ch.done || ch.current >= ch.target;
            return (
              <View key={ch.id} style={[styles.challengeCard, { backgroundColor: dark ? '#1A1A20' : '#fff' }]}>
                <View style={styles.challengeTop}>
                  <View style={styles.challengeLeft}>
                    <Text style={styles.challengeIcon}>{ch.icon}</Text>
                    <View>
                      <Text style={[styles.challengeLabel, { color: dark ? '#F0F0F5' : '#141416' }]}>
                        {ch.label}
                      </Text>
                      <Text style={styles.challengeProgress}>
                        {ch.current.toLocaleString()} / {ch.target.toLocaleString()}
                      </Text>
                    </View>
                  </View>
                  <View
                    style={[
                      styles.challengeStatus,
                      { backgroundColor: done ? 'rgba(22,163,74,0.12)' : 'rgba(107,114,128,0.12)' },
                    ]}
                  >
                    <Text
                      style={[
                        styles.challengeStatusText,
                        { color: done ? '#16A34A' : '#6B7280' },
                      ]}
                    >
                      {done ? 'Completed' : `${Math.max(0, ch.target - ch.current).toLocaleString()} left`}
                    </Text>
                  </View>
                </View>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${pct}%`, backgroundColor: ch.color }]} />
                </View>
                <Text style={styles.pctText}>{pct}% complete</Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* ── TERRITORY WAR / LEADERBOARD ── */}
      <View style={[styles.section, { paddingBottom: 100 }]}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: dark ? '#F0F0F5' : '#141416' }]}>
            Territory War ⚔️
          </Text>
          <TouchableOpacity onPress={() => onNav('profile')}>
            <Text style={styles.sectionMeta}>See all</Text>
          </TouchableOpacity>
        </View>
        <View style={[styles.lbCard, { backgroundColor: dark ? '#1A1A20' : '#fff' }]}>
          {displayLeaderboard.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 28, gap: 8 }}>
              <Text style={{ fontSize: 28 }}>🏜️</Text>
              <Text style={{ fontSize: 12, color: '#6B7280', fontWeight: '600', textAlign: 'center' }}>
                {'No players yet — start walking!\nYou\'ll appear here as you earn steps.'}
              </Text>
            </View>
          ) : (
            displayLeaderboard.slice(0, 4).map((p, i) => {
              const pcfg = AVATAR_CONFIGS[p.avatar] || AVATAR_CONFIGS.blaze;
              const steps = p.steps ?? p.totalSteps ?? 0;
              return (
                <View
                  key={p.id || i}
                  style={[
                    styles.lbRow,
                    { borderBottomColor: dark ? '#2A2A35' : '#E5E7EB' },
                    i < 3 && styles.lbRowBorder,
                    p.isUser && { backgroundColor: dark ? 'rgba(244,98,31,0.12)' : 'rgba(244,98,31,0.06)', borderLeftWidth: 3, borderLeftColor: '#F4621F' },
                  ]}
                >
                  <Text style={styles.lbRank}>{['🥇', '🥈', '🥉'][i] ?? `${i + 1}`}</Text>
                  <View style={[styles.lbAvatar, { backgroundColor: pcfg.color || '#F4621F' }]}>
                    <Text style={styles.lbAvatarEmoji}>{pcfg.face || '😤'}</Text>
                  </View>
                  <View style={styles.lbInfo}>
                    <View style={styles.lbNameRow}>
                      <Text style={[styles.lbName, { color: dark ? '#F0F0F5' : '#141416' }]}>{p.name}</Text>
                      {p.isUser && (
                        <View style={styles.youBadge}>
                          <Text style={styles.youBadgeText}>YOU</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.lbSub}>Lv.{p.level ?? 1} · {(steps / 1000).toFixed(1)}k steps</Text>
                  </View>
                  <Text style={[styles.lbPct, { color: p.isUser ? '#F4621F' : '#6B7280' }]}>
                    {steps >= 1000 ? `${(steps / 1000).toFixed(1)}k` : steps}
                  </Text>
                </View>
              );
            })
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 8, paddingBottom: 8,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatarBtn: { position: 'relative' },
  avatarCircle: {
    width: 46, height: 46, borderRadius: 23,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2.5, borderColor: '#F4621F',
  },
  profileImage: {
    width: 46, height: 46, borderRadius: 23,
    borderWidth: 2.5, borderColor: '#F4621F',
  },
  avatarFace: { fontSize: 22 },
  onlineDot: {
    position: 'absolute', bottom: 0, right: -2,
    width: 13, height: 13, borderRadius: 7,
    backgroundColor: '#16A34A',
    borderWidth: 2, borderColor: 'white',
  },
  greeting: { fontSize: 12, color: '#6B7280', fontWeight: '500' },
  userName: { fontSize: 17, fontWeight: '800' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  coinBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999,
  },
  coinEmoji: { fontSize: 15 },
  coinVal: { fontSize: 13, fontWeight: '700', color: '#F59E0B' },
  levelBadge: { backgroundColor: '#F4621F', borderRadius: 999, paddingHorizontal: 9, paddingVertical: 4 },
  levelText: { fontSize: 11, fontWeight: '700', color: '#fff' },

  xpRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: 10, paddingHorizontal: 20, marginBottom: 12,
  },
  xpTrack: { flex: 1, height: 6, backgroundColor: '#E5E7EB', borderRadius: 999, overflow: 'hidden' },
  xpFill: { height: '100%', backgroundColor: '#F4621F', borderRadius: 999 },
  xpText: { fontSize: 11, fontWeight: '600', color: '#6B7280' },

  mapWrap: {
    marginHorizontal: 20, borderRadius: 20,
    overflow: 'hidden', height: 210, position: 'relative',
  },
  mapTrackingBadge: {
    position: 'absolute', top: 10, left: 10,
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(20,20,22,0.8)',
    borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4,
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#16A34A' },
  liveBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  mapStatsBadge: {
    position: 'absolute', top: 10, right: 10,
    backgroundColor: 'rgba(20,20,22,0.75)',
    borderRadius: 10, padding: 8, alignItems: 'center', gap: 2,
  },
  mapStatVal: { color: '#fff', fontSize: 15, fontWeight: '800' },
  mapStatLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 9, fontWeight: '600' },
  mapStatDivider: { width: 1, height: 10, backgroundColor: 'rgba(255,255,255,0.2)', marginVertical: 2 },

  statsBar: { flexDirection: 'row', gap: 8, marginHorizontal: 20, marginTop: 14 },
  statCard: { flex: 1, padding: 10, borderRadius: 12, alignItems: 'center' },
  statIcon: { fontSize: 15 },
  statVal: { fontSize: 14, fontWeight: '800', marginTop: 2 },
  statLabel: { fontSize: 9, color: '#6B7280', fontWeight: '600', marginTop: 1 },

  ctaWrap: { paddingHorizontal: 20, marginTop: 14 },
  ctaBtn: {
    backgroundColor: '#F4621F', borderRadius: 999,
    paddingVertical: 16, alignItems: 'center',
    elevation: 6, shadowColor: '#F4621F',
    shadowOpacity: 0.35, shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  ctaBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },

  section: { paddingHorizontal: 20, paddingTop: 16 },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 12,
  },
  sectionTitle: { fontSize: 16, fontWeight: '800' },
  sectionMeta: { fontSize: 13, color: '#F4621F', fontWeight: '600' },

  challengesList: { gap: 10 },
  challengeCard: { padding: 14, borderRadius: 14 },
  challengeTop: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 10,
  },
  challengeLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  challengeIcon: { fontSize: 20 },
  challengeLabel: { fontSize: 14, fontWeight: '700' },
  challengeProgress: { fontSize: 12, color: '#6B7280', marginTop: 1 },
  challengeStatus: { borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  challengeStatusText: { fontSize: 11, fontWeight: '700' },
  progressTrack: { height: 6, backgroundColor: '#F3F4F6', borderRadius: 999, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 999 },
  pctText: { fontSize: 11, color: '#6B7280', marginTop: 6, textAlign: 'right' },

  lbCard: { borderRadius: 16, overflow: 'hidden' },
  lbRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12 },
  lbRowBorder: { borderBottomWidth: 1 },
  lbRank: { fontSize: 18, width: 28 },
  lbAvatar: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  lbAvatarEmoji: { fontSize: 16 },
  lbInfo: { flex: 1 },
  lbNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  lbName: { fontSize: 14, fontWeight: '700' },
  youBadge: { backgroundColor: '#F4621F', borderRadius: 999, paddingHorizontal: 5, paddingVertical: 1 },
  youBadgeText: { fontSize: 10, color: '#fff', fontWeight: '700' },
  lbSub: { fontSize: 12, color: '#6B7280' },
  lbPct: { fontSize: 16, fontWeight: '800' },
});
