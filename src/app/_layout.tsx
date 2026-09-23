import React, { useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Alert, SafeAreaView, Dimensions } from 'react-native';
import { useWorkoutStore } from '@/stores/workoutStore';
import auth from '@react-native-firebase/auth';
import GlassCard from '@/components/ui/GlassCard';
import { Dumbbell, Mail, Lock, User } from 'lucide-react-native';
import "../global.css";

const { width } = Dimensions.get('window');

function AuthScreen() {
  const { updateProfile } = useWorkoutStore();
  const [isLogin, setIsLogin] = useState(false); // false = Sign Up, true = Login
  const [isOtpMode, setIsOtpMode] = useState(false);
  const [otpInput, setOtpInput] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = () => {
    if (!email || !password) {
      Alert.alert('入力エラー', 'メールアドレスとパスワードを入力してください。');
      return;
    }
    if (!email.includes('@')) {
      Alert.alert('入力エラー', '有効なメールアドレスを入力してください。');
      return;
    }
    if (!isLogin && !name) {
      Alert.alert('入力エラー', 'お名前を入力してください。');
      return;
    }

    setIsLoading(true);
    if (isLogin) {
      auth().signInWithEmailAndPassword(email, password)
        .then(() => {
          setIsLoading(false);
          Alert.alert('認証完了', 'ログインしました。');
        })
        .catch(err => {
          setIsLoading(false);
          Alert.alert('ログインエラー', `ログインに失敗しました。\nエラーコード: ${err.code || err}\n${err.message || ''}`);
          console.error(err);
        });
    } else {
      setIsLoading(false);
      setIsOtpMode(true);
      Alert.alert(
        'メール送信完了',
        `${email} 宛てに確認用のワンタイム認証コードを送信しました。メールに記載された6桁の確認コードを入力してください。（デモ用コード: 123456）`
      );
    }
  };

  const handleVerifyOtp = () => {
    if (otpInput === '123456') {
      setIsLoading(true);
      auth().createUserWithEmailAndPassword(email, password)
        .then(() => {
          updateProfile({
            name: name,
            email: email,
            status: '筋トレ歴: 未設定 | 現状維持',
          });
          setIsLoading(false);
          Alert.alert('アカウント作成完了', 'メールアドレスの確認が完了し、アカウントを作成しました！');
        })
        .catch(err => {
          setIsLoading(false);
          Alert.alert('登録エラー', `アカウントの作成に失敗しました。\nエラーコード: ${err.code || err}\n${err.message || ''}`);
          console.error(err);
        });
    } else {
      Alert.alert('認証エラー', '入力された確認コードが正しくありません。メールに記載された「123456」を入力してください。');
    }
  };

  return (
    <SafeAreaView style={styles.authContainer}>
      <View style={styles.authHeader}>
        <View style={styles.logoContainer}>
          <Dumbbell size={36} color="#ff6b00" />
        </View>
        <Text style={styles.appTitle}>DataDrive Training Memo</Text>
        <Text style={styles.appSub}>データを味方に、理想の身体へ</Text>
      </View>

      <GlassCard style={styles.authCard}>
        {isOtpMode ? (
          <View style={styles.formContainer}>
            <Text style={styles.otpTitle}>メールアドレス確認</Text>
            <Text style={styles.otpSub}>
              {email} 宛てに送信された6桁の確認コード（テスト用: 123456）を入力してください。
            </Text>
            
            <View style={styles.inputWrapper}>
              <Lock size={18} color="#888888" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="6桁の認証コード"
                placeholderTextColor="#555"
                keyboardType="number-pad"
                maxLength={6}
                value={otpInput}
                onChangeText={setOtpInput}
              />
            </View>

            <TouchableOpacity style={styles.submitButton} onPress={handleVerifyOtp}>
              <Text style={styles.submitButtonText}>コードを確認して登録完了</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.resendBtn} onPress={() => Alert.alert('再送信完了', '認証コードをメールへ再送信しました。（テストコード: 123456）')}>
              <Text style={styles.resendBtnText}>コードを再送信する</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.backToRegisterBtn} onPress={() => setIsOtpMode(false)}>
              <Text style={styles.backToRegisterText}>← アカウント入力に戻る</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Tab switcher */}
            <View style={styles.tabContainer}>
              <TouchableOpacity
                style={[styles.tabButton, !isLogin && styles.activeTabButton]}
                onPress={() => setIsLogin(false)}
              >
                <Text style={[styles.tabButtonText, !isLogin && styles.activeTabButtonText]}>新規登録</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tabButton, isLogin && styles.activeTabButton]}
                onPress={() => setIsLogin(true)}
              >
                <Text style={[styles.tabButtonText, isLogin && styles.activeTabButtonText]}>ログイン</Text>
              </TouchableOpacity>
            </View>

            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#ff6b00" />
                <Text style={styles.loadingText}>アカウント情報を処理中...</Text>
              </View>
            ) : (
              <View style={styles.formContainer}>
                {!isLogin && (
                  <View style={styles.inputWrapper}>
                    <User size={18} color="#888888" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="お名前"
                      placeholderTextColor="#555"
                      value={name}
                      onChangeText={setName}
                    />
                  </View>
                )}

                <View style={styles.inputWrapper}>
                  <Mail size={18} color="#888888" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="メールアドレス"
                    placeholderTextColor="#555"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>

                <View style={styles.inputWrapper}>
                  <Lock size={18} color="#888888" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="パスワード (6文字以上)"
                    placeholderTextColor="#555"
                    secureTextEntry={true}
                    value={password}
                    onChangeText={setPassword}
                    autoCapitalize="none"
                  />
                </View>

                <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
                  <Text style={styles.submitButtonText}>
                    {isLogin ? 'ログインする' : 'アカウントを作成して始める'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
      </GlassCard>
    </SafeAreaView>
  );
}

export default function RootLayout() {
  const { profile, syncLogsWithFirestore, updateProfile } = useWorkoutStore();
  const [initializing, setInitializing] = useState(true);

  // Handle user state changes
  React.useEffect(() => {
    const subscriber = auth().onAuthStateChanged((user) => {
      if (user && user.email) {
        syncLogsWithFirestore(user.email).then(() => {
          setInitializing(false);
        });
      } else {
        updateProfile({ email: '' });
        setInitializing(false);
      }
    });
    return subscriber; // unsubscribe on unmount
  }, []);

  if (initializing) {
    return (
      <View style={{ flex: 1, backgroundColor: '#000000', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#ff6b00" />
      </View>
    );
  }

  const isLoggedIn = !!profile?.email;

  if (!isLoggedIn) {
    return (
      <View style={{ flex: 1, backgroundColor: '#000000' }}>
        <StatusBar style="light" />
        <AuthScreen />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#000000' }}>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="actions"
          options={{
            presentation: 'transparentModal',
            animation: 'fade',
            contentStyle: { backgroundColor: 'transparent' },
          }}
        />
        <Stack.Screen name="memo" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="share" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="complete" options={{ animation: 'slide_from_right' }} />
      </Stack>
    </View>
  );
}

const styles = StyleSheet.create({
  authContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 25,
  },
  authHeader: {
    alignItems: 'center',
    marginBottom: 35,
  },
  logoContainer: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 107, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 0, 0.2)',
  },
  appTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  appSub: {
    color: '#888888',
    fontSize: 13,
  },
  authCard: {
    width: '100%',
    padding: 20,
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTabButton: {
    backgroundColor: '#ff6b00',
  },
  tabButtonText: {
    color: '#888888',
    fontSize: 13,
    fontWeight: 'bold',
  },
  activeTabButtonText: {
    color: '#ffffff',
  },
  formContainer: {
    width: '100%',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 14,
    paddingHorizontal: 15,
    height: 48,
    marginBottom: 16,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: '#ffffff',
    fontSize: 13,
  },
  submitButton: {
    backgroundColor: '#ff6b00',
    borderRadius: 14,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#ff6b00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
  },
  loadingText: {
    color: '#ffffff',
    fontSize: 13,
    marginTop: 15,
  },
  otpTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  otpSub: {
    color: '#888888',
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  resendBtn: {
    alignItems: 'center',
    marginTop: 20,
  },
  resendBtnText: {
    color: '#ff6b00',
    fontSize: 12,
    fontWeight: 'bold',
  },
  backToRegisterBtn: {
    alignItems: 'center',
    marginTop: 15,
  },
  backToRegisterText: {
    color: '#555555',
    fontSize: 11,
    fontWeight: 'bold',
  },
});
