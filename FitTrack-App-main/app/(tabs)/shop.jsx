import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { AVATAR_CONFIGS } from '../../constants';
import { useApp } from '../../hooks';
import { api } from '../../utils/api';
import WalkingAvatar from '../components/WalkingAvatar';

const RARITY = {
  0:    { label: 'Free',      color: '#6B7280', bg: '#F3F4F6' },
  500:  { label: 'Rare',      color: '#7C3AED', bg: '#EDE9FE' },
  800:  { label: 'Epic',      color: '#0EA5E9', bg: '#E0F2FE' },
  1500: { label: 'Fierce',    color: '#EF4444', bg: '#FEE2E2' },
  2500: { label: 'Legendary', color: '#06B6D4', bg: '#CFFAFE' },
  5000: { label: '👑 MYTH',   color: '#F59E0B', bg: '#FEF3C7' },
};

function getRarity(price) {
  return RARITY[price] ?? { label: 'Special', color: '#F4621F', bg: '#FFF1EB' };
}

function AvatarCard({ avatarKey, cfg, owned, equipped, canBuy, dark, onBuy, onEquip, isSelected, onSelect }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rarity = getRarity(cfg.price);

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.94, duration: 80, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
      Animated.timing(scaleAnim, { toValue: 1,    duration: 120, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
    ]).start();
    onSelect(avatarKey);
  };

  const cardBg = dark ? '#1A1A24' : '#fff';
  const borderColor = equipped
    ? cfg.color
    : isSelected
    ? cfg.color + '88'
    : 'transparent';

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }], width: '47%' }}>
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={handlePress}
        style={[
          styles.card,
          { backgroundColor: cardBg, borderColor },
          equipped && styles.cardEquipped,
        ]}
      >
        {/* Rarity badge */}
        <View style={[styles.rarityBadge, { backgroundColor: rarity.bg }]}>
          <Text style={[styles.rarityText, { color: rarity.color }]}>{rarity.label}</Text>
        </View>

        {/* Avatar preview */}
        <View style={styles.avatarWrap}>
          <WalkingAvatar type={avatarKey} size={1.15} showRing={equipped} />
        </View>

        {/* Name */}
        <Text style={[styles.avatarName, { color: dark ? '#F0F0F5' : '#141416' }]}>
          {cfg.name}
        </Text>

        {/* Desc */}
        <Text style={styles.avatarDesc} numberOfLines={2}>{cfg.desc}</Text>

        {/* Action button */}
        {equipped ? (
          <View style={[styles.actionBtn, { backgroundColor: cfg.color + '22', borderColor: cfg.color, borderWidth: 1.5 }]}>
            <Text style={[styles.actionBtnText, { color: cfg.color }]}>✅ Equipped</Text>
          </View>
        ) : owned ? (
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: cfg.color }]} onPress={() => onEquip(avatarKey)}>
            <Text style={[styles.actionBtnText, { color: '#fff' }]}>Equip</Text>
          </TouchableOpacity>
        ) : cfg.price === 0 ? (
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: cfg.color }]} onPress={() => onEquip(avatarKey)}>
            <Text style={[styles.actionBtnText, { color: '#fff' }]}>Get Free</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: canBuy ? '#F59E0B' : '#E5E7EB' }]}
            onPress={() => canBuy && onBuy(avatarKey)}
            disabled={!canBuy}
          >
            <Text style={[styles.actionBtnText, { color: canBuy ? '#fff' : '#9CA3AF' }]}>
              🪙 {cfg.price.toLocaleString()}
            </Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function ShopScreen() {
  const {
    authToken,
    user,
    setUser,
    dark,
    showToast,
    setAchievement,
    shopAvatars,
    refreshProfile,
    refreshShop,
  } = useApp();

  const [selected, setSelected] = useState(user.selectedAvatar || 'blaze');

  const avatars = shopAvatars.length > 0
    ? shopAvatars.map((avatar) => ({
        ...AVATAR_CONFIGS[avatar.id],
        ...avatar,
        key: avatar.id,
      }))
    : Object.entries(AVATAR_CONFIGS).map(([key, cfg]) => ({
        ...cfg,
        id: key,
        key,
        owned: user.ownedAvatars?.includes(key),
        equipped: user.selectedAvatar === key,
      }));

  useEffect(() => {
    if (!authToken) return;
    refreshShop().catch(() => {});
  }, [authToken, refreshShop]);

  const buy = async (key) => {
    const cfg = AVATAR_CONFIGS[key];
    if (user.coins < cfg.price) {
      showToast('Not enough coins! 💸');
      return;
    }
    try {
      if (authToken) {
        await api.buyAvatar(authToken, key);
        await Promise.all([refreshShop(), refreshProfile(authToken)]);
      } else {
        setUser((u) => ({ ...u, coins: u.coins - cfg.price, ownedAvatars: [...(u.ownedAvatars || []), key] }));
      }
      setAchievement({ icon: cfg.effect || '🎉', title: `${cfg.name} Unlocked!`, sub: cfg.desc, xp: 0 });
    } catch (error) {
      showToast(error.message || 'Unable to buy avatar');
    }
  };

  const equip = async (key) => {
    try {
      if (authToken) {
        await api.equipAvatar(authToken, key);
        await Promise.all([refreshShop(), refreshProfile(authToken)]);
      } else {
        setUser((u) => ({ ...u, selectedAvatar: key }));
      }
      setSelected(key);
      showToast(`${AVATAR_CONFIGS[key].name} equipped! ✅`);
    } catch (error) {
      showToast(error.message || 'Unable to equip avatar');
    }
  };

  const selectedCfg = AVATAR_CONFIGS[selected] || AVATAR_CONFIGS.blaze;
  const bg = dark ? '#0F0F13' : '#F7F7FA';

  return (
    <ScrollView style={[styles.container, { backgroundColor: bg }]} showsVerticalScrollIndicator={false}>

      {/* ── HERO PREVIEW ── */}
      <View style={[styles.hero, { backgroundColor: selectedCfg.color }]}>
        {/* Decorative circles */}
        <View style={[styles.circle, { width: 160, height: 160, top: -40, left: -40, opacity: 0.12 }]} />
        <View style={[styles.circle, { width: 120, height: 120, top: 20, right: -30, opacity: 0.08 }]} />

        <View style={styles.heroContent}>
          <View style={styles.heroAvatar}>
            <WalkingAvatar type={selected} size={1.8} showRing />
          </View>
          <View style={styles.heroInfo}>
            <Text style={styles.heroName}>{selectedCfg.name}</Text>
            <Text style={styles.heroDesc}>{selectedCfg.desc}</Text>
            <View style={[styles.heroRarity, { backgroundColor: 'rgba(0,0,0,0.18)' }]}>
              <Text style={styles.heroRarityText}>{getRarity(selectedCfg.price).label}</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.inner}>
        {/* ── HEADER ── */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.title, { color: dark ? '#F0F0F5' : '#141416' }]}>Character Shop</Text>
            <Text style={styles.subtitle}>Choose your runner • Earn coins to unlock</Text>
          </View>
          <View style={[styles.coinBadge, { backgroundColor: dark ? 'rgba(245,158,11,0.15)' : '#FEF3C7' }]}>
            <Text style={styles.coinEmoji}>🪙</Text>
            <Text style={styles.coinVal}>{(user.coins || 0).toLocaleString()}</Text>
          </View>
        </View>

        {/* ── AVATAR GRID ── */}
        <View style={styles.grid}>
          {avatars.map((avatar) => {
            const key = avatar.key || avatar.id;
            const cfg = AVATAR_CONFIGS[key] || avatar;
            const owned   = avatar.owned   ?? user.ownedAvatars?.includes(key);
            const equipped = avatar.equipped ?? user.selectedAvatar === key;
            const canBuy  = (user.coins || 0) >= cfg.price;

            return (
              <AvatarCard
                key={key}
                avatarKey={key}
                cfg={cfg}
                owned={owned}
                equipped={equipped}
                canBuy={canBuy}
                dark={dark}
                onBuy={buy}
                onEquip={equip}
                isSelected={selected === key}
                onSelect={setSelected}
              />
            );
          })}
        </View>

        {/* Bottom tip */}
        <View style={[styles.tip, { backgroundColor: dark ? 'rgba(244,98,31,0.1)' : '#FFF1EB' }]}>
          <Text style={styles.tipEmoji}>💡</Text>
          <Text style={styles.tipText}>Walk more steps → earn more coins → unlock crazier characters!</Text>
        </View>

        <View style={{ height: 100 }} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Hero
  hero: {
    paddingTop: 24,
    paddingBottom: 32,
    paddingHorizontal: 24,
    overflow: 'hidden',
    position: 'relative',
  },
  circle: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: '#fff',
  },
  heroContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    zIndex: 1,
  },
  heroAvatar: {
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  heroInfo: { flex: 1, gap: 6 },
  heroName: {
    fontSize: 26,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 0.4,
  },
  heroDesc: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.82)',
    lineHeight: 17,
  },
  heroRarity: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginTop: 2,
  },
  heroRarityText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  // Inner
  inner: { padding: 16 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  title:    { fontSize: 20, fontWeight: '900', letterSpacing: 0.2 },
  subtitle: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  coinBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  coinEmoji: { fontSize: 18 },
  coinVal:   { fontSize: 16, fontWeight: '800', color: '#F59E0B' },

  // Grid
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },

  // Card
  card: {
    borderRadius: 22,
    padding: 14,
    alignItems: 'center',
    borderWidth: 2,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
    position: 'relative',
    overflow: 'hidden',
  },
  cardEquipped: {
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 6,
  },
  rarityBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  rarityText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  avatarWrap: {
    marginTop: 18,
    marginBottom: 10,
    height: 110,
    justifyContent: 'center',
  },
  avatarName: {
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.3,
    marginBottom: 4,
    textAlign: 'center',
  },
  avatarDesc: {
    fontSize: 10,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 14,
    minHeight: 28,
    paddingHorizontal: 2,
  },
  actionBtn: {
    borderRadius: 999,
    paddingVertical: 9,
    width: '100%',
    alignItems: 'center',
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.2,
  },

  // Tip
  tip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 14,
    padding: 14,
    marginTop: 16,
  },
  tipEmoji: { fontSize: 18 },
  tipText:  { flex: 1, fontSize: 12, fontWeight: '600', color: '#F4621F', lineHeight: 17 },
});
