import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, SafeAreaView, TouchableOpacity, ActivityIndicator, TextInput, Modal, Alert, Linking, Platform } from 'react-native';
import { User, Shield, Activity, Dumbbell, Award, ToggleLeft, ToggleRight, RefreshCw, Edit2, Mail, Link2 } from 'lucide-react-native';
import { useWorkoutStore } from '@/stores/workoutStore';
import GlassCard from '@/components/ui/GlassCard';
import Svg, { Polygon, Line, Circle, Text as SvgText, G } from 'react-native-svg';
import { isPurchasesInitialized, getAvailablePackages, purchasePremiumPackage, presentPaywall, presentCustomerCenter, checkPremiumStatus } from '@/services/purchaseService';

export default function ProfileScreen() {
  const { profile, updateProfile, logout } = useWorkoutStore();

  // Edit Modal States
  const [editModalVisible, setEditModalVisible] = useState(false);
  
  const handleLogoutPress = () => {
    Alert.alert(
      'ログアウト',
      'ログアウトしますか？ログアウトすると、次回起動時に再度ログインが必要になります。',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: 'ログアウト',
          style: 'destructive',
          onPress: () => {
            logout();
            Alert.alert('ログアウト完了', 'ログアウトしました。');
          }
        }
      ]
    );
  };
  const [editName, setEditName] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [editWeight, setEditWeight] = useState('');
  const [editMuscleMass, setEditMuscleMass] = useState('');
  const [editFatPercentage, setEditFatPercentage] = useState('');
  const [editBench, setEditBench] = useState('');
  const [editSquat, setEditSquat] = useState('');
  const [editDeadlift, setEditDeadlift] = useState('');
  const [editGender, setEditGender] = useState<'male' | 'female'>('male');

  // Sync edit states when profile opens
  useEffect(() => {
    if (profile) {
      setEditName(profile.name);
      setEditStatus(profile.status);
      setEditWeight(profile.weight);
      setEditMuscleMass(profile.muscleMass);
      setEditFatPercentage(profile.fatPercentage);
      setEditBench(String(profile.benchPressMax));
      setEditSquat(String(profile.squatMax));
      setEditDeadlift(String(profile.deadliftMax));
      setEditGender(profile.gender || 'male');
    }
  }, [profile, editModalVisible]);

  const big3 = {
    bench: profile?.benchPressMax || 85,
    squat: profile?.squatMax || 120,
    deadlift: profile?.deadliftMax || 140,
  };
  const totalBig3 = big3.bench + big3.squat + big3.deadlift;

  const handleSaveProfile = () => {
    updateProfile({
      name: editName,
      status: editStatus,
      weight: editWeight,
      muscleMass: editMuscleMass,
      fatPercentage: editFatPercentage,
      benchPressMax: parseFloat(editBench) || 0,
      squatMax: parseFloat(editSquat) || 0,
      deadliftMax: parseFloat(editDeadlift) || 0,
      gender: editGender,
    });
    setEditModalVisible(false);
    Alert.alert('更新完了', 'プロフィールを更新しました。');
  };



  // Radar Chart coordinates (5 axes: 胸, 背中, 肩, 腕, 脚)
  const center = 100;
  const maxRadius = 70;
  const axes = ['胸', '背中', '肩', '腕', '脚'];
  // Dynamic scaling based on BIG3 weight relative ratios
  const benchRatio = Math.min(1.0, Math.max(0.4, big3.bench / 120));
  const squatRatio = Math.min(1.0, Math.max(0.4, big3.squat / 160));
  const deadliftRatio = Math.min(1.0, Math.max(0.4, big3.deadlift / 200));
  const values = [benchRatio, deadliftRatio * 0.9, (benchRatio + deadliftRatio) / 2 * 0.8, benchRatio * 0.95, squatRatio];

  const points = values.map((val, i) => {
    const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
    const r = val * maxRadius;
    const x = center + r * Math.cos(angle);
    const y = center + r * Math.sin(angle);
    return { x, y };
  });

  const pointsString = points.map(p => `${p.x},${p.y}`).join(' ');

  // Calculate outer grid points for radar background
  const getGridPoints = (scale: number) => {
    return [0, 1, 2, 3, 4].map(i => {
      const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
      const r = scale * maxRadius;
      const x = center + r * Math.cos(angle);
      const y = center + r * Math.sin(angle);
      return `${x},${y}`;
    }).join(' ');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <GlassCard style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatarFallback}>
                <User size={38} color="#ff6b00" />
              </View>
              <View style={styles.levelBadge}>
                <Text style={styles.levelText}>Lv.24</Text>
              </View>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.userName}>{profile?.name || 'マモル (Mamoru)'}</Text>
              <Text style={styles.userStatus}>
                {profile?.status || '筋トレ歴: 2.5年 | 増量中'} • {profile?.gender === 'female' ? '女性' : '男性'}
              </Text>
            </View>
            <TouchableOpacity style={styles.editProfileBtn} onPress={() => setEditModalVisible(true)}>
              <Edit2 size={16} color="#ff6b00" />
            </TouchableOpacity>
          </View>

          {/* Quick Metrics */}
          <View style={styles.quickMetricsRow}>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>体重</Text>
              <Text style={styles.metricValue}>{profile?.weight || '70.2'}<Text style={styles.metricUnit}> kg</Text></Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>筋肉量</Text>
              <Text style={styles.metricValue}>{profile?.muscleMass || '56.4'}<Text style={styles.metricUnit}> kg</Text></Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>体脂肪率</Text>
              <Text style={styles.metricValue}>{profile?.fatPercentage || '14.2'}<Text style={styles.metricUnit}> %</Text></Text>
            </View>
          </View>
        </GlassCard>

        {/* Strength Scores */}
        <Text style={styles.sectionHeader}>筋力レベル</Text>
        <View style={styles.scoresRow}>
          <GlassCard style={styles.scoreCard}>
            <Award size={20} color="#ff6b00" style={{ marginBottom: 6 }} />
            <Text style={styles.scoreLabel}>Strength Score</Text>
            <Text style={styles.scoreVal}>72</Text>
            <Text style={styles.scoreSub}>上位 12.5 %</Text>
          </GlassCard>

          <GlassCard style={styles.scoreCard}>
            <Activity size={20} color="#ff6b00" style={{ marginBottom: 6 }} />
            <Text style={styles.scoreLabel}>筋力偏差値</Text>
            <Text style={styles.scoreVal}>58.5</Text>
            <Text style={styles.scoreSub}>前月比 +1.2</Text>
          </GlassCard>
        </View>

        {/* BIG 3 Display */}
        <GlassCard style={styles.big3Card}>
          <View style={styles.big3Header}>
            <Dumbbell size={18} color="#ff6b00" />
            <Text style={styles.big3Title}>BIG 3 ベンチマーク</Text>
            <Text style={styles.big3TotalVal}>Total: {totalBig3}kg</Text>
          </View>

          <View style={styles.big3Row}>
            <View style={styles.big3Item}>
              <Text style={styles.big3Label}>ベンチプレス</Text>
              <Text style={styles.big3Weight}>{big3.bench} kg</Text>
            </View>
            <View style={styles.big3Item}>
              <Text style={styles.big3Label}>スクワット</Text>
              <Text style={styles.big3Weight}>{big3.squat} kg</Text>
            </View>
            <View style={styles.big3Item}>
              <Text style={styles.big3Label}>デッドリフト</Text>
              <Text style={styles.big3Weight}>{big3.deadlift} kg</Text>
            </View>
          </View>
        </GlassCard>

        {/* Radar Chart (Balance Analysis) */}
        <GlassCard style={styles.radarCard}>
          <Text style={styles.radarTitle}>部位別パワーバランス</Text>
          <View style={styles.radarContainer}>
            <Svg height="200" width="200" viewBox="0 0 200 200">
              <G>
                {/* Background Grid */}
                <Polygon points={getGridPoints(1.0)} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
                <Polygon points={getGridPoints(0.75)} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
                <Polygon points={getGridPoints(0.5)} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
                <Polygon points={getGridPoints(0.25)} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />

                {/* Axis lines */}
                {[0, 1, 2, 3, 4].map(i => {
                  const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
                  const x = center + maxRadius * Math.cos(angle);
                  const y = center + maxRadius * Math.sin(angle);
                  return <Line key={i} x1={center} y1={center} x2={x} y2={y} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />;
                })}

                {/* Radar Area */}
                <Polygon points={pointsString} fill="rgba(255, 107, 0, 0.35)" stroke="#ff6b00" strokeWidth="2" />

                {/* Plot Dots */}
                {points.map((p, i) => (
                  <Circle key={i} cx={p.x} cy={p.y} r="3" fill="#ffffff" stroke="#ff6b00" strokeWidth="1.5" />
                ))}

                {/* Labels */}
                {axes.map((axis, i) => {
                  const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
                  const r = maxRadius + 18;
                  const x = center + r * Math.cos(angle) - 10;
                  const y = center + r * Math.sin(angle) + 4;
                  return (
                    <SvgText key={i} x={x} y={y} fill="#888888" fontSize="10" fontWeight="bold">
                      {axis}
                    </SvgText>
                  );
                })}
              </G>
            </Svg>
          </View>
        </GlassCard>

        {/* アカウント同期・データバックアップ */}
        <Text style={styles.sectionHeader}>アカウント・データバックアップ</Text>
        <GlassCard style={styles.backupCard}>
          <Text style={styles.backupCardTitle}>クラウドにデータをバックアップし、他デバイスと同期します。</Text>
          
          <View style={styles.linkRow}>
            <View style={styles.linkInfo}>
              <Mail size={18} color="#ff6b00" />
              <View style={{ marginLeft: 10, flex: 1 }}>
                <Text style={styles.linkLabel}>同期アカウント</Text>
                <Text style={styles.linkStatus} numberOfLines={1} ellipsizeMode="middle">
                  {profile?.email ? `${profile.email} 同期中` : '未ログイン'}
                </Text>
              </View>
            </View>
          </View>

          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogoutPress}>
            <Text style={styles.logoutBtnText}>ログアウト</Text>
          </TouchableOpacity>
        </GlassCard>

        {/* Space at the bottom */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* プロフィール編集モーダル */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={editModalVisible}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <GlassCard style={styles.modalContent}>
            <Text style={styles.modalTitle}>プロフィール編集</Text>
            
            <ScrollView style={styles.formScroll} showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>名前</Text>
              <TextInput style={styles.input} value={editName} onChangeText={setEditName} placeholder="マモル" placeholderTextColor="#555" />

              <Text style={styles.inputLabel}>ステータス</Text>
              <TextInput style={styles.input} value={editStatus} onChangeText={setEditStatus} placeholder="筋トレ歴: 2年 | 増量中" placeholderTextColor="#555" />

              <Text style={styles.inputLabel}>性別</Text>
              <View style={styles.genderRow}>
                <TouchableOpacity
                  style={[styles.genderBtn, editGender === 'male' && styles.activeGenderBtn]}
                  onPress={() => setEditGender('male')}
                >
                  <Text style={[styles.genderBtnText, editGender === 'male' && styles.activeGenderBtnText]}>男性</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.genderBtn, editGender === 'female' && styles.activeGenderBtn]}
                  onPress={() => setEditGender('female')}
                >
                  <Text style={[styles.genderBtnText, editGender === 'female' && styles.activeGenderBtnText]}>女性</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.formRow}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.inputLabel}>体重 (kg)</Text>
                  <TextInput style={styles.input} value={editWeight} onChangeText={setEditWeight} keyboardType="numeric" placeholder="70.0" placeholderTextColor="#555" />
                </View>
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={styles.inputLabel}>筋肉量 (kg)</Text>
                  <TextInput style={styles.input} value={editMuscleMass} onChangeText={setEditMuscleMass} keyboardType="numeric" placeholder="55.0" placeholderTextColor="#555" />
                </View>
              </View>

              <Text style={styles.inputLabel}>体脂肪率 (%)</Text>
              <TextInput style={styles.input} value={editFatPercentage} onChangeText={setEditFatPercentage} keyboardType="numeric" placeholder="15.0" placeholderTextColor="#555" />

              <Text style={[styles.sectionHeader, { marginTop: 15, textTransform: 'none' }]}>BIG 3 重量設定 (kg)</Text>
              
              <View style={styles.formRow}>
                <View style={{ flex: 1, marginRight: 5 }}>
                  <Text style={styles.inputLabel}>ベンチ</Text>
                  <TextInput style={styles.input} value={editBench} onChangeText={setEditBench} keyboardType="numeric" placeholder="80" placeholderTextColor="#555" />
                </View>
                <View style={{ flex: 1, marginHorizontal: 5 }}>
                  <Text style={styles.inputLabel}>スクワット</Text>
                  <TextInput style={styles.input} value={editSquat} onChangeText={setEditSquat} keyboardType="numeric" placeholder="120" placeholderTextColor="#555" />
                </View>
                <View style={{ flex: 1, marginLeft: 5 }}>
                  <Text style={styles.inputLabel}>デッド</Text>
                  <TextInput style={styles.input} value={editDeadlift} onChangeText={setEditDeadlift} keyboardType="numeric" placeholder="140" placeholderTextColor="#555" />
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditModalVisible(false)}>
                <Text style={styles.cancelBtnText}>キャンセル</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveProfile}>
                <Text style={styles.saveBtnText}>保存する</Text>
              </TouchableOpacity>
            </View>
          </GlassCard>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  profileCard: {
    marginBottom: 20,
    padding: 20,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatarFallback: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(255, 107, 0, 0.05)',
    borderWidth: 1.5,
    borderColor: '#ff6b00',
    justifyContent: 'center',
    alignItems: 'center',
  },
  levelBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: '#ff6b00',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#000000',
  },
  levelText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: 'bold',
  },
  profileInfo: {
    marginLeft: 16,
    flex: 1,
  },
  userName: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  userStatus: {
    color: '#888888',
    fontSize: 12,
    marginTop: 4,
  },
  quickMetricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    paddingTop: 16,
  },
  metricItem: {
    alignItems: 'center',
    flex: 1,
  },
  metricLabel: {
    color: '#888888',
    fontSize: 10,
    marginBottom: 4,
  },
  metricValue: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  metricUnit: {
    fontSize: 10,
    color: '#888888',
    fontWeight: 'normal',
  },
  metricDivider: {
    width: 1,
    height: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  sectionHeader: {
    color: '#888888',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 12,
    marginTop: 8,
  },
  scoresRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  scoreCard: {
    flex: 1,
    padding: 15,
    alignItems: 'center',
  },
  scoreLabel: {
    color: '#888888',
    fontSize: 11,
    fontWeight: 'bold',
  },
  scoreVal: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '800',
    marginVertical: 4,
  },
  scoreSub: {
    color: '#ff6b00',
    fontSize: 10,
    fontWeight: '600',
  },
  big3Card: {
    marginBottom: 20,
    padding: 16,
  },
  big3Header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  big3Title: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8,
    flex: 1,
  },
  big3TotalVal: {
    color: '#ff6b00',
    fontSize: 14,
    fontWeight: 'bold',
  },
  big3Row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  big3Item: {
    alignItems: 'center',
    flex: 1,
  },
  big3Label: {
    color: '#888888',
    fontSize: 11,
    marginBottom: 6,
  },
  big3Weight: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  radarCard: {
    marginBottom: 20,
    padding: 16,
    alignItems: 'center',
  },
  radarTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
    alignSelf: 'flex-start',
    marginBottom: 15,
  },
  radarContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  integrationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    marginBottom: 12,
  },
  integrationLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  integrationRight: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 40,
  },
  integrationTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  integrationStatus: {
    color: '#888888',
    fontSize: 11,
    marginTop: 2,
  },
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 0, 0.3)',
    backgroundColor: 'rgba(255, 107, 0, 0.02)',
    borderRadius: 14,
    height: 44,
    marginBottom: 20,
  },
  syncButtonText: {
    color: '#ff6b00',
    fontSize: 13,
    fontWeight: 'bold',
  },
  editProfileBtn: {
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  backupCard: {
    marginBottom: 20,
    padding: 16,
  },
  backupCardTitle: {
    color: '#888888',
    fontSize: 11,
    marginBottom: 15,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  linkInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  linkLabel: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  linkStatus: {
    color: '#888888',
    fontSize: 11,
    marginTop: 2,
  },
  linkBtn: {
    backgroundColor: '#ff6b00',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  linkBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  unlinkBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  unlinkBtnText: {
    color: '#ff4444',
    fontSize: 11,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxHeight: '80%',
    padding: 20,
  },
  modalTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  formScroll: {
    width: '100%',
    marginBottom: 15,
  },
  formRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  inputLabel: {
    color: '#888888',
    fontSize: 11,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 5,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 10,
    color: '#ffffff',
    fontSize: 13,
    height: 40,
    paddingHorizontal: 12,
    marginBottom: 5,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 10,
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  cancelBtnText: {
    color: '#888888',
    fontSize: 13,
    fontWeight: 'bold',
  },
  saveBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#ff6b00',
  },
  saveBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  logoutBtn: {
    backgroundColor: 'rgba(255, 68, 68, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 68, 68, 0.2)',
    borderRadius: 14,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 15,
    width: '100%',
  },
  logoutBtnText: {
    color: '#ff4444',
    fontSize: 13,
    fontWeight: 'bold',
  },
  genderRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 5,
  },
  genderBtn: {
    flex: 1,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeGenderBtn: {
    backgroundColor: '#ff6b00',
    borderColor: '#ff6b00',
  },
  genderBtnText: {
    color: '#888888',
    fontSize: 13,
    fontWeight: 'bold',
  },
  activeGenderBtnText: {
    color: '#ffffff',
  },
  planActionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  planUpgradeBtn: {
    backgroundColor: '#ff6b00',
  },
  planUpgradeBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  planCancelBtn: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  planCancelBtnText: {
    color: '#888888',
    fontSize: 11,
    fontWeight: 'bold',
  },
});
