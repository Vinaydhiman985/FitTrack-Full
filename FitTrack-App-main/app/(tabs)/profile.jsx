import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from "react";
import {
  Alert, Image, Linking, Modal, ScrollView,
  StyleSheet, Switch, Text, TextInput,
  TouchableOpacity, View,
} from "react-native";
import { useApp } from '../../hooks';
import { AVATAR_CONFIGS, BADGES, XP_PER_LEVEL } from '../../constants';
import { api } from '../../utils/api';

const PROFILE_PIC_KEY = 'ft_profile_pic';

export default function ProfileScreen({ onLogout }) {
  const { authToken, user, setUser, dark, toggleDark, showToast, setAchievement, leaderboard } = useApp();
  const [tab, setTab] = useState('overview');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [editName, setEditName] = useState(user.name);
  const [profilePic, setProfilePic] = useState(user.profilePic || null);
  const [saving, setSaving] = useState(false);
  const [hasShownRank1, setHasShownRank1] = useState(false);

  // Load profile pic from AsyncStorage cache on mount
  useEffect(() => {
    AsyncStorage.getItem(PROFILE_PIC_KEY).then(cached => {
      if (cached) {
        setProfilePic(cached);
        setUser(u => ({ ...u, profilePic: cached }));
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cfg = AVATAR_CONFIGS[user.selectedAvatar] || AVATAR_CONFIGS.blaze;
  const xpPct = Math.min(100, (user.xp / XP_PER_LEVEL) * 100);
  const displayLeaderboard = leaderboard;

  useEffect(() => {
    const userRank = displayLeaderboard.findIndex(p => p.isUser);
    if (userRank === 0 && !hasShownRank1) {
      setHasShownRank1(true);
      setTimeout(() => {
        setAchievement({
          icon: '🏆',
          title: "You're #1!",
          sub: "You've reached the top of the leaderboard! Incredible!",
          xp: 500,
        });
      }, 1000);
    }
  }, [displayLeaderboard, hasShownRank1, setAchievement]);

  const toggleSetting = (key) => {
    setUser(u => ({ ...u, settings: { ...u.settings, [key]: !u.settings[key] } }));
    showToast(`${key.charAt(0).toUpperCase() + key.slice(1)} ${!user.settings[key] ? 'enabled' : 'disabled'}`);
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photo library.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'Images',
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled) {
      setProfilePic(result.assets[0].uri);
    }
  };

  const _saveProfile = () => {
    if (!editName.trim()) {
      Alert.alert('Error', 'Name cannot be empty!');
      return;
    }
    setUser(u => ({ ...u, name: editName.trim(), profilePic }));
    setShowEditModal(false);
    showToast('Profile updated! ✅');
  };

  const shareApp = async () => {
    try {
      await Sharing.shareAsync('https://fittrack.app', {
        dialogTitle: 'Share FitTrack',
      });
    } catch (_e) {
      showToast('Sharing not available on this device');
    }
  };

  const saveProfileRemote = async () => {
    if (!editName.trim()) {
      Alert.alert('Error', 'Name cannot be empty!');
      return;
    }
    setSaving(true);
    try {
      let picToSave = profilePic;

      // If it's a local file URI, convert to base64 data URL so it
      // can be sent as plain JSON and stored in the database.
      if (picToSave && picToSave.startsWith('file://')) {
        const b64 = await FileSystem.readAsStringAsync(picToSave, {
          encoding: FileSystem.EncodingType.Base64,
        });
        picToSave = `data:image/jpeg;base64,${b64}`;
      }

      // Always persist locally in AsyncStorage so it survives restarts
      if (picToSave) {
        await AsyncStorage.setItem(PROFILE_PIC_KEY, picToSave);
      } else {
        await AsyncStorage.removeItem(PROFILE_PIC_KEY);
      }

      // Sync name (+ pic if token available) to backend
      if (authToken) {
        await api.updateProfile(authToken, {
          name: editName.trim(),
          profilePic: picToSave || null,
        });
      }

      setProfilePic(picToSave);
      setUser(u => ({ ...u, name: editName.trim(), profilePic: picToSave || null }));
      setShowEditModal(false);
      showToast('Profile updated! ✅');
    } catch (error) {
      Alert.alert('Update failed', error.message || 'Could not update your profile.');
    } finally {
      setSaving(false);
    }
  };

  const stats = [
    { label: 'Steps',    val: `${((user.totalSteps||0)/1000).toFixed(1)}k`, icon: 'footsteps-outline', color: '#F4621F' },
    { label: 'Distance', val: `${(user.distance||0).toFixed(1)}km`,         icon: 'navigate-outline',  color: '#7C3AED' },
    { label: 'Zones',    val: user.zones || 0,                               icon: 'map-outline',       color: '#F5A623' },
    { label: 'Streak',   val: `${user.streak || 0}d`,                       icon: 'flame-outline',     color: '#EF4444' },
    { label: 'Badges',   val: (user.badges||[]).length,                     icon: 'ribbon-outline',    color: '#06B6D4' },
    { label: 'Coins',    val: (user.coins||0).toLocaleString(),              icon: 'wallet-outline',    color: '#F59E0B' },
  ];

  const menuItems = [
    {
      icon: 'person-outline', color: '#F4621F',
      label: 'Edit Profile',
      onPress: () => setShowEditModal(true),
    },
    {
      icon: 'notifications-outline', color: '#7C3AED',
      label: 'Notifications',
      value: (user.settings||{}).notifications,
      isToggle: true,
      onPress: () => toggleSetting('notifications'),
    },
    {
      icon: 'location-outline', color: '#0EA5E9',
      label: 'GPS Tracking',
      value: (user.settings||{}).gps,
      isToggle: true,
      onPress: () => toggleSetting('gps'),
    },
    {
      icon: 'moon-outline', color: '#6B7280',
      label: 'Dark Mode',
      value: dark,
      isToggle: true,
      onPress: toggleDark,
    },
    {
      icon: 'eye-off-outline', color: '#EF4444',
      label: 'Privacy Mode',
      value: (user.settings||{}).privacy,
      isToggle: true,
      onPress: () => toggleSetting('privacy'),
    },
    {
      icon: 'shield-checkmark-outline', color: '#16A34A',
      label: 'Privacy Policy',
      onPress: () => setShowPrivacyModal(true),
    },
    {
      icon: 'help-circle-outline', color: '#F59E0B',
      label: 'Help & Support',
      onPress: () => setShowHelpModal(true),
    },
    {
      icon: 'star-outline', color: '#F59E0B',
      label: 'Rate FitTrack',
      onPress: () => Linking.openURL('https://play.google.com/store'),
    },
    {
      icon: 'share-social-outline', color: '#06B6D4',
      label: 'Share App',
      onPress: shareApp,
    },
    {
      icon: 'information-circle-outline', color: '#9CA3AF',
      label: 'App Version 1.0.0',
      onPress: () => showToast('FitTrack v1.0.0 🚀'),
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: dark ? '#0F0F13' : '#F7F7FA' }]}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.heroCircle1} />
          <View style={styles.heroCircle2} />
          <View style={styles.heroContent}>

            {/* Avatar / Profile Photo */}
            <TouchableOpacity onPress={() => setShowEditModal(true)} style={styles.avatarWrap}>
              {profilePic ? (
                <Image source={{ uri: profilePic }} style={styles.profileImage} />
              ) : (
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarFace}>{cfg.face || '😤'}</Text>
                </View>
              )}
              <View style={styles.editBadge}>
                <Ionicons name="camera" size={12} color="#fff" />
              </View>
              <View style={styles.onlineDot} />
            </TouchableOpacity>

            {/* Info */}
            <View style={styles.heroInfo}>
              <View style={styles.heroNameRow}>
                <Text style={styles.heroName}>{user.name}</Text>
                <Ionicons name="checkmark-circle" size={18} color="rgba(255,255,255,0.8)" />
              </View>
              <Text style={styles.heroUsername}>@{user.username}</Text>
              <View style={styles.heroBadges}>
                <View style={styles.heroBadge}>
                  <Text style={styles.heroBadgeText}>⭐ Level {user.level}</Text>
                </View>
                <View style={styles.heroBadge}>
                  <Text style={styles.heroBadgeText}>🔥 {user.streak}d streak</Text>
                </View>
              </View>
            </View>
          </View>

          {/* XP bar */}
          <View style={styles.xpWrap}>
            <View style={styles.xpLabelRow}>
              <Text style={styles.xpLabel}>XP Progress</Text>
              <Text style={styles.xpLabel}>{user.xp}/{XP_PER_LEVEL}</Text>
            </View>
            <View style={styles.xpTrack}>
              <View style={[styles.xpFill, { width: `${xpPct}%` }]} />
            </View>
          </View>
        </View>

        <View style={styles.body}>

          {/* Stats grid */}
          <View style={styles.statsGrid}>
            {stats.map((s, i) => (
              <View key={i} style={[styles.statCard, { backgroundColor: dark ? '#1A1A20' : '#fff' }]}>
                <View style={[styles.statIconWrap, { backgroundColor: s.color + '18' }]}>
                  <Ionicons name={s.icon} size={18} color={s.color} />
                </View>
                <Text style={[styles.statVal, { color: s.color }]}>{s.val}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            ))}
          </View>

          {/* Tab bar */}
          <View style={[styles.tabBar, { backgroundColor: dark ? '#22222A' : '#F3F4F6' }]}>
            {['overview', 'leaderboard'].map((t) => (
              <TouchableOpacity
                key={t}
                style={[styles.tabItem, tab === t && styles.tabItemActive]}
                onPress={() => setTab(t)}
              >
                <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {tab === 'overview' && (
            <>
              {/* Badges */}
              <View style={[styles.card, { backgroundColor: dark ? '#1A1A20' : '#fff' }]}>
                <Text style={[styles.cardTitle, { color: dark ? '#F0F0F5' : '#141416' }]}>
                  🏅 Badge Showcase
                </Text>
                <View style={styles.badgesGrid}>
                  {(BADGES || []).map((b) => {
                    const earned = (user.badges || []).includes(b.id);
                    return (
                      <TouchableOpacity
                        key={b.id}
                        style={[styles.badgeItem, { opacity: earned ? 1 : 0.35 }]}
                        onPress={() => earned && showToast(`${b.name}: ${b.desc}`)}
                      >
                        <View style={[styles.badgeCircle, { backgroundColor: earned ? '#FFF1EB' : '#F3F4F6' }]}>
                          <Text style={styles.badgeEmoji}>{b.emoji}</Text>
                        </View>
                        <Text style={[styles.badgeName, { color: dark ? '#9BA1A6' : '#6B7280' }]}>
                          {b.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Settings & More */}
              <View style={[styles.card, { backgroundColor: dark ? '#1A1A20' : '#fff' }]}>
                <Text style={[styles.cardTitle, { color: dark ? '#F0F0F5' : '#141416' }]}>
                  ⚙️ Settings & More
                </Text>
                {menuItems.map((item, i) => (
                  <TouchableOpacity
                    key={i}
                    style={[
                      styles.menuRow,
                      { borderBottomColor: dark ? '#2A2A35' : '#F3F4F6' },
                      i === menuItems.length - 1 && { borderBottomWidth: 0 },
                    ]}
                    onPress={item.onPress}
                  >
                    <View style={[styles.menuIconWrap, { backgroundColor: item.color + '18' }]}>
                      <Ionicons name={item.icon} size={20} color={item.color} />
                    </View>
                    <Text style={[styles.menuLabel, { color: dark ? '#F0F0F5' : '#141416' }]}>
                      {item.label}
                    </Text>
                    {item.isToggle ? (
                      <Switch
                        value={item.value || false}
                        onValueChange={item.onPress}
                        trackColor={{ false: '#E5E7EB', true: '#F4621F' }}
                        thumbColor="#fff"
                        style={{ transform: [{ scaleX: 0.85 }, { scaleY: 0.85 }] }}
                      />
                    ) : (
                      <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              {/* Logout */}
              <TouchableOpacity
                style={[styles.logoutBtn, { backgroundColor: dark ? 'rgba(239,68,68,0.15)' : '#FEE2E2' }]}
                onPress={() => Alert.alert(
                  'Log Out',
                  'Are you sure you want to log out?',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Log Out', style: 'destructive', onPress: onLogout },
                  ]
                )}
              >
                <Ionicons name="log-out-outline" size={20} color="#EF4444" />
                <Text style={styles.logoutText}>Log Out</Text>
              </TouchableOpacity>
            </>
          )}

          {tab === 'leaderboard' && (
            <View style={[styles.card, { backgroundColor: dark ? '#1A1A20' : '#fff', padding: 0 }]}>
              <View style={[styles.lbHeader, { borderBottomColor: dark ? '#2A2A35' : '#E5E7EB' }]}>
                <Text style={[styles.cardTitle, { color: dark ? '#F0F0F5' : '#141416', marginBottom: 0 }]}>
                  🏆 Global Leaderboard
                </Text>
                <Text style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>
                  Ranked by total steps
                </Text>
              </View>

              {displayLeaderboard.length === 0 ? (
                <View style={styles.lbEmpty}>
                  <Text style={styles.lbEmptyIcon}>🏜️</Text>
                  <Text style={[styles.lbEmptyText, { color: dark ? '#9BA1A6' : '#6B7280' }]}>
                    No players yet. Start walking to appear here!
                  </Text>
                </View>
              ) : (
                displayLeaderboard.map((p, i) => {
                  const pcfg = AVATAR_CONFIGS[p.avatar] || AVATAR_CONFIGS.blaze;
                  const steps = p.steps ?? p.totalSteps ?? 0;
                  const rankEmojis = ['🥇','🥈','🥉'];
                  return (
                    <View
                      key={p.id || i}
                      style={[
                        styles.lbRow,
                        { borderBottomColor: dark ? '#2A2A35' : '#E5E7EB' },
                        p.isUser && {
                          backgroundColor: dark ? 'rgba(244,98,31,0.1)' : 'rgba(244,98,31,0.05)',
                          borderLeftWidth: 3, borderLeftColor: '#F4621F',
                        },
                      ]}
                    >
                      <Text style={styles.lbRank}>
                        {rankEmojis[i] ?? `${i + 1}`}
                      </Text>
                      <View style={[styles.lbAvatar, { backgroundColor: pcfg.color || '#F4621F' }]}>
                        <Text style={styles.lbAvatarEmoji}>{pcfg.face || '😤'}</Text>
                      </View>
                      <View style={styles.lbInfo}>
                        <View style={styles.lbNameRow}>
                          <Text style={[styles.lbName, { color: dark ? '#F0F0F5' : '#141416' }]}>
                            {p.name}
                          </Text>
                          {p.isUser && (
                            <View style={styles.youBadge}>
                              <Text style={styles.youBadgeText}>YOU</Text>
                            </View>
                          )}
                          {i === 0 && (
                            <View style={styles.topBadge}>
                              <Text style={styles.topBadgeText}>👑 #1</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.lbSub}>
                          Lv.{p.level ?? 1} · {pcfg.name} · {(steps / 1000).toFixed(1)}k steps
                        </Text>
                      </View>
                      <View style={styles.lbRight}>
                        <Text style={[styles.lbSteps, { color: p.isUser ? '#F4621F' : (dark ? '#F0F0F5' : '#141416') }]}>
                          {steps >= 1000 ? `${(steps/1000).toFixed(1)}k` : steps}
                        </Text>
                        <Text style={styles.lbStepsLabel}>steps</Text>
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          )}

          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      {/* ── Edit Profile Modal ── */}
      <Modal visible={showEditModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: dark ? '#1A1A20' : '#fff' }]}>
            <View style={styles.modalHandle} />
            <Text style={[styles.modalTitle, { color: dark ? '#F0F0F5' : '#141416' }]}>
              Edit Profile
            </Text>

            {/* Photo picker */}
            <TouchableOpacity onPress={pickImage} style={styles.pickerWrap}>
              {profilePic ? (
                <Image source={{ uri: profilePic }} style={styles.pickerImage} />
              ) : (
                <View style={[styles.pickerPlaceholder, { backgroundColor: cfg.color }]}>
                  <Text style={styles.pickerEmoji}>{cfg.face || '😤'}</Text>
                </View>
              )}
              <View style={styles.pickerEditBadge}>
                <Ionicons name="camera" size={14} color="#fff" />
              </View>
            </TouchableOpacity>
            <Text style={[styles.pickerHint, { color: dark ? '#9BA1A6' : '#9CA3AF' }]}>
              Tap to change photo
            </Text>

            {/* Name input */}
            <Text style={[styles.inputLabel, { color: dark ? '#9BA1A6' : '#6B7280' }]}>
              Display Name
            </Text>
            <TextInput
              style={[styles.nameInput, {
                color: dark ? '#F0F0F5' : '#141416',
                borderColor: dark ? '#2A2A35' : '#E5E7EB',
                backgroundColor: dark ? '#0F0F13' : '#F9F9F9',
              }]}
              value={editName}
              onChangeText={setEditName}
              placeholder="Enter your name"
              placeholderTextColor="#9BA1A6"
              maxLength={30}
            />

            <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.6 }]} onPress={saveProfileRemote} disabled={saving}>
              <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
              <Text style={styles.saveBtnText}>{saving ? 'Saving…' : 'Save Changes'}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowEditModal(false)}>
              <Text style={[styles.cancelBtnText, { color: dark ? '#9BA1A6' : '#6B7280' }]}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── Privacy Policy Modal ── */}
      <Modal visible={showPrivacyModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: dark ? '#1A1A20' : '#fff', maxHeight: '85%' }]}>
            <View style={styles.modalHandle} />
            <Text style={[styles.modalTitle, { color: dark ? '#F0F0F5' : '#141416' }]}>
              Privacy Policy
            </Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {[
                { icon: 'location-outline', title: 'Location Data', body: 'FitTrack uses your GPS location only while the app is active to track your walking route and claim territory. We never collect location data in the background without your permission.' },
                { icon: 'person-outline', title: 'Personal Information', body: 'We collect only your name and email for account creation. Your profile information is stored securely and never sold to third parties.' },
                { icon: 'game-controller-outline', title: 'Game Data', body: 'Your steps, coins, XP, territory, and badges are stored locally on your device and on our secure servers to sync across devices.' },
                { icon: 'bar-chart-outline', title: 'Analytics', body: 'We collect anonymous usage data to improve the app experience. This data cannot be used to identify you personally.' },
                { icon: 'lock-closed-outline', title: 'Data Security', body: 'All data is encrypted in transit using SSL/TLS. Passwords are hashed and never stored in plain text.' },
                { icon: 'trash-outline', title: 'Data Deletion', body: 'You can delete your account and all associated data at any time by contacting support@fittrack.app.' },
                { icon: 'mail-outline', title: 'Contact', body: 'For any privacy concerns, contact us at privacy@fittrack.app' },
              ].map((item, i) => (
                <View key={i} style={[styles.privacySection, { borderBottomColor: dark ? '#2A2A35' : '#F3F4F6' }]}>
                  <View style={styles.privacyTitleRow}>
                    <Ionicons name={item.icon} size={18} color="#F4621F" />
                    <Text style={[styles.privacyTitle, { color: dark ? '#F0F0F5' : '#141416' }]}>
                      {item.title}
                    </Text>
                  </View>
                  <Text style={[styles.privacyBody, { color: dark ? '#9BA1A6' : '#6B7280' }]}>
                    {item.body}
                  </Text>
                </View>
              ))}
              <Text style={[styles.privacyFooter, { color: dark ? '#9BA1A6' : '#9CA3AF' }]}>
                Last updated: March 2026
              </Text>
            </ScrollView>
            <TouchableOpacity style={styles.saveBtn} onPress={() => setShowPrivacyModal(false)}>
              <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
              <Text style={styles.saveBtnText}>Got it!</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── Help & Support Modal ── */}
      <Modal visible={showHelpModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: dark ? '#1A1A20' : '#fff', maxHeight: '85%' }]}>
            <View style={styles.modalHandle} />
            <Text style={[styles.modalTitle, { color: dark ? '#F0F0F5' : '#141416' }]}>
              Help & Support
            </Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {[
                { icon: 'map-outline', q: 'How do I claim territory?', a: 'Tap "Start Claiming" in the Territory screen and walk around. Every area you walk through gets claimed as your territory!' },
                { icon: 'wallet-outline', q: 'How do I earn coins?', a: 'You earn coins by walking and claiming territory. Every 100 steps earns 1 coin. Claiming zones and winning battles also rewards extra coins.' },
                { icon: 'flash-outline', q: 'How does XP work?', a: 'XP is earned by walking, completing daily challenges, and winning territory battles. Earn enough XP to level up!' },
                { icon: 'bag-outline', q: 'How do I buy avatars?', a: 'Go to the Shop tab and use your coins to purchase new avatars. Each avatar has a unique look and special effects!' },
                { icon: 'sword-outline', q: 'What is a territory battle?', a: 'When you claim a zone that belongs to another player, a battle occurs! Win the battle to take their territory.' },
                { icon: 'battery-charging-outline', q: 'Does the app drain battery?', a: 'GPS tracking uses battery. We recommend only tracking when actively walking.' },
                { icon: 'mail-outline', q: 'Contact Support', a: 'Email us at support@fittrack.app and we will respond within 24 hours.' },
              ].map((item, i) => (
                <View key={i} style={[styles.privacySection, { borderBottomColor: dark ? '#2A2A35' : '#F3F4F6' }]}>
                  <View style={styles.privacyTitleRow}>
                    <Ionicons name={item.icon} size={18} color="#F4621F" />
                    <Text style={[styles.privacyTitle, { color: dark ? '#F0F0F5' : '#141416' }]}>
                      {item.q}
                    </Text>
                  </View>
                  <Text style={[styles.privacyBody, { color: dark ? '#9BA1A6' : '#6B7280' }]}>
                    {item.a}
                  </Text>
                </View>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.saveBtn} onPress={() => setShowHelpModal(false)}>
              <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
              <Text style={styles.saveBtnText}>Got it!</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  hero: {
    backgroundColor: '#F4621F',
    padding: 20, paddingBottom: 50,
    overflow: 'hidden', position: 'relative',
  },
  heroCircle1: {
    position: 'absolute', top: -30, right: -30,
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  heroCircle2: {
    position: 'absolute', bottom: -40, left: -20,
    width: 160, height: 160, borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  heroContent: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  avatarWrap: { position: 'relative' },
  avatarCircle: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: 'rgba(255,255,255,0.5)',
  },
  profileImage: {
    width: 72, height: 72, borderRadius: 36,
    borderWidth: 3, borderColor: 'rgba(255,255,255,0.5)',
  },
  avatarFace: { fontSize: 36 },
  editBadge: {
    position: 'absolute', top: -4, right: -4,
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: '#141416',
    alignItems: 'center', justifyContent: 'center',
    elevation: 3,
  },
  onlineDot: {
    position: 'absolute', bottom: 0, right: -2,
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: '#16A34A',
    borderWidth: 2, borderColor: 'white',
  },
  heroInfo: { flex: 1 },
  heroNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  heroName: { fontSize: 22, fontWeight: '800', color: '#fff' },
  heroUsername: { fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: '500' },
  heroBadges: { flexDirection: 'row', gap: 8, marginTop: 6 },
  heroBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3,
  },
  heroBadgeText: { fontSize: 11, fontWeight: '700', color: '#fff' },
  xpWrap: { marginTop: 16 },
  xpLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  xpLabel: { fontSize: 12, color: 'rgba(255,255,255,0.8)', fontWeight: '600' },
  xpTrack: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 999, height: 8, overflow: 'hidden',
  },
  xpFill: { height: '100%', backgroundColor: '#fff', borderRadius: 999 },

  body: { padding: 20, marginTop: -24 },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  statCard: {
    width: '31%', borderRadius: 14,
    padding: 12, alignItems: 'center',
  },
  statIconWrap: {
    width: 34, height: 34, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 4,
  },
  statVal: { fontSize: 16, fontWeight: '800', marginTop: 2 },
  statLabel: { fontSize: 9, color: '#6B7280', fontWeight: '600', marginTop: 1 },

  tabBar: {
    flexDirection: 'row',
    borderRadius: 999, padding: 3, marginBottom: 16,
  },
  tabItem: { flex: 1, paddingVertical: 8, borderRadius: 999, alignItems: 'center' },
  tabItemActive: { backgroundColor: '#fff' },
  tabText: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  tabTextActive: { color: '#141416' },

  card: { borderRadius: 16, padding: 16, marginBottom: 12 },
  cardTitle: { fontSize: 15, fontWeight: '800', marginBottom: 12 },

  badgesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  badgeItem: { width: '22%', alignItems: 'center' },
  badgeCircle: {
    width: 48, height: 48, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  badgeEmoji: { fontSize: 24 },
  badgeName: { fontSize: 9, fontWeight: '600', marginTop: 4, textAlign: 'center' },

  menuRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 12, borderBottomWidth: 1, gap: 12,
  },
  menuIconWrap: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  menuLabel: { flex: 1, fontSize: 14, fontWeight: '600' },

  logoutBtn: {
    borderRadius: 16, paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 8, marginBottom: 16,
  },
  logoutText: { fontSize: 15, fontWeight: '700', color: '#EF4444' },

  lbHeader: { padding: 16, borderBottomWidth: 1 },
  lbRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: 12, padding: 14, borderBottomWidth: 1,
  },
  lbRank: { fontSize: 22, width: 32 },
  lbAvatar: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  lbAvatarEmoji: { fontSize: 20 },
  lbInfo: { flex: 1 },
  lbNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  lbName: { fontSize: 15, fontWeight: '700' },
  youBadge: {
    backgroundColor: '#F4621F', borderRadius: 999,
    paddingHorizontal: 6, paddingVertical: 1,
  },
  youBadgeText: { fontSize: 10, color: '#fff', fontWeight: '700' },
  topBadge: {
    backgroundColor: '#FEF3C7', borderRadius: 999,
    paddingHorizontal: 6, paddingVertical: 1,
  },
  topBadgeText: { fontSize: 10, color: '#F59E0B', fontWeight: '700' },
  lbSub: { fontSize: 12, color: '#6B7280', marginTop: 1 },
  lbRight: { alignItems: 'flex-end' },
  lbSteps: { fontSize: 17, fontWeight: '800' },
  lbStepsLabel: { fontSize: 9, color: '#9CA3AF', fontWeight: '600' },
  lbEmpty: { alignItems: 'center', paddingVertical: 36, gap: 10 },
  lbEmptyIcon: { fontSize: 36 },
  lbEmptyText: { fontSize: 13, fontWeight: '600', textAlign: 'center', paddingHorizontal: 24 },

  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 24, paddingBottom: 40,
  },
  modalHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: '#E5E7EB',
    alignSelf: 'center', marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20, fontWeight: '800',
    marginBottom: 20, textAlign: 'center',
  },

  pickerWrap: {
    width: 90, height: 90, borderRadius: 45,
    alignSelf: 'center', marginBottom: 8, position: 'relative',
  },
  pickerImage: { width: 90, height: 90, borderRadius: 45 },
  pickerPlaceholder: {
    width: 90, height: 90, borderRadius: 45,
    alignItems: 'center', justifyContent: 'center',
  },
  pickerEmoji: { fontSize: 40 },
  pickerEditBadge: {
    position: 'absolute', bottom: 0, right: 0,
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#F4621F',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'white',
  },
  pickerHint: { fontSize: 12, textAlign: 'center', marginBottom: 20 },

  inputLabel: { fontSize: 13, fontWeight: '600', marginBottom: 8 },
  nameInput: {
    borderWidth: 1.5, borderRadius: 12,
    padding: 14, fontSize: 16, marginBottom: 20,
  },

  saveBtn: {
    backgroundColor: '#F4621F', borderRadius: 999,
    paddingVertical: 16, alignItems: 'center',
    flexDirection: 'row', justifyContent: 'center',
    gap: 8, marginTop: 8, elevation: 4,
  },
  saveBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  cancelBtn: { alignItems: 'center', paddingVertical: 12 },
  cancelBtnText: { fontSize: 15, fontWeight: '600' },

  privacySection: { paddingVertical: 14, borderBottomWidth: 1 },
  privacyTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  privacyTitle: { fontSize: 14, fontWeight: '700', flex: 1 },
  privacyBody: { fontSize: 13, lineHeight: 20 },
  privacyFooter: { fontSize: 12, textAlign: 'center', paddingVertical: 16 },
});
