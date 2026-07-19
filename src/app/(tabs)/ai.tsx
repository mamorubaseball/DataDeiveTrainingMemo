import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, SafeAreaView, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, Dimensions, Image, Alert, Modal, ActivityIndicator, Keyboard } from 'react-native';
import { Send, Sparkles, Brain, Dumbbell, ShoppingBag, ArrowRight } from 'lucide-react-native';
import * as Linking from 'expo-linking';
import GlassCard from '@/components/ui/GlassCard';
import Svg, { Path, Circle } from 'react-native-svg';
import { useProductStore } from '@/stores/productStore';

import { useWorkoutStore } from '@/stores/workoutStore';
import { GEMINI_API_KEY } from '@/config/aiConfig';
import { initializePurchases, getAvailablePackages, purchasePremiumPackage, isPurchasesInitialized } from '@/services/purchaseService';

const screenWidth = Dimensions.get('window').width;

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  attachment?: 'chart' | 'card' | 'product';
}

export default function AIChatScreen() {
  const { plan, chatUsage, togglePlan, incrementChatUsage, profile, workoutLogs, workoutNotes, setPlan } = useWorkoutStore();
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [availablePackages, setAvailablePackages] = useState<any[]>([]);

  useEffect(() => {
    initializePurchases();
    const showListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setKeyboardVisible(true)
    );
    const hideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardVisible(false)
    );
    return () => {
      showListener.remove();
      hideListener.remove();
    };
  }, []);

  // Paywall checkout states
  const [paywallVisible, setPaywallVisible] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [isPaying, setIsPaying] = useState(false);

  useEffect(() => {
    if (paywallVisible) {
      getAvailablePackages().then(pkgs => setAvailablePackages(pkgs));
    }
  }, [paywallVisible]);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'ai',
      text: 'こんにちは！あなたのトレーニングパートナーAIです。最近のトレーニング状況について何か知りたいことはありますか？',
    }
  ]);
  const [inputText, setInputText] = useState('');
  const scrollViewRef = useRef<ScrollView>(null);

  const getTodayString = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };
  const todayStr = getTodayString();
  const todayCount = chatUsage[todayStr] || 0;
  const limit = plan === 'premium' ? 100 : 5;

  const suggestedQuestions = [
    'ベンチの推移を見せて',
    '最近疲れてる？',
    '胸が伸びない理由は？',
    'おすすめのプロテイン',
  ];

  const handlePurchasePremium = async () => {
    if (availablePackages.length === 0) {
      Alert.alert('エラー', '購入可能なプランが見つかりませんでした。');
      return;
    }
    setIsPaying(true);
    try {
      const success = await purchasePremiumPackage(availablePackages[0]);
      if (success) {
        setPlan('premium');
        setPaywallVisible(false);
        setCardNumber('');
        setCardExpiry('');
        setCardCvv('');
        Alert.alert('決済成功', '月額500円（税込）のプレミアムプラン登録が完了しました！');
      } else {
        Alert.alert('決済キャンセル', '決済手続きが完了しませんでした。');
      }
    } catch (error: any) {
      Alert.alert('エラー', error.message || '決済処理中にエラーが発生しました。');
    } finally {
      setIsPaying(false);
    }
  };

  // Helper to serialize recent logs and construct system prompt
  const getSystemPrompt = () => {
    const genderText = profile.gender === 'female' ? '女性' : '男性';
    const profileInfo = `
ユーザー基本情報:
- 名前: ${profile.name}
- 状態: ${profile.status}
- 体重: ${profile.weight}kg
- 筋肉量: ${profile.muscleMass}kg
- 体脂肪率: ${profile.fatPercentage}%
- 性別: ${genderText}
- 主要種目の自己ベスト: ベンチプレス ${profile.benchPressMax}kg, スクワット ${profile.squatMax}kg, デッドリフト ${profile.deadliftMax}kg
`;

    const dates = Object.keys(workoutLogs)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
      .slice(0, 5);

    let logsSummary = '';
    if (dates.length === 0) {
      logsSummary = '最近のトレーニング記録はありません。';
    } else {
      logsSummary = '直近5セッションのトレーニング記録:\n';
      dates.forEach(date => {
        logsSummary += `■ 日付: ${date}\n`;
        const note = workoutNotes[date];
        if (note) {
          logsSummary += `  メモ/感想: ${note}\n`;
        }
        const exercises = workoutLogs[date] || {};
        Object.keys(exercises).forEach(ex => {
          const sets = exercises[ex] || [];
          const setStrings = sets.map((s, i) => `  - ${i + 1}セット目: ${s.weight}kg x ${s.reps}reps (RPE ${s.rpe || '未設定'})`);
          logsSummary += `  * 種目: ${ex}\n` + setStrings.join('\n') + '\n';
        });
      });
    }

    return `あなたはユーザーの筋トレをサポートする優秀なAIパーソナルトレーナー・アドバイザーです。
以下のユーザー情報と最近のトレーニング記録に基づいて、ユーザーの質問（トレーニング計画、フォーム改善、モチベーション、栄養摂取など）に対して、具体的、論理的、かつ親身になって日本語でアドバイスをしてください。

${profileInfo}

${logsSummary}

回答に関する注意点:
1. ユーザーの自己ベストや最近のトレーニング状況を尋ねられたら、上記の実際のデータを引用して正確に答えてください。
2. 簡潔かつ明確に回答してください（長文になりすぎないようマークダウンの箇条書きや改行を有効に活用してください）。
3. ユーザーの体調や怪我に配慮し、安全かつ段階的なトレーニング（漸進性過負荷の原則）を推奨してください。`;
  };

  const handleSend = (text: string) => {
    if (!text.trim()) return;

    // Verify limit and increment usage
    const success = incrementChatUsage();
    if (!success) {
      Alert.alert(
        '利用上限に達しました',
        `無料プランのチャット上限（1日5回）に達しました。月額500円のプレミアムプラン（1日100回＋広告削除）へアップグレードしますか？`,
        [
          { text: 'キャンセル', style: 'cancel' },
          {
            text: 'プランを見る',
            onPress: () => setPaywallVisible(true)
          }
        ]
      );
      return;
    }

    // 1. Add user message
    const userMsgId = Date.now().toString();
    const newMessages = [
      ...messages,
      { id: userMsgId, sender: 'user', text } as Message
    ];
    setMessages(newMessages);
    setInputText('');
    setIsLoading(true);
    
    // Auto scroll to bottom
    setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);

    // 2. Call live Gemini API via HTTP fetch
    (async () => {
      try {
        const apiHistory = messages.map(msg => ({
          role: msg.sender === 'user' ? 'user' : 'model',
          parts: [{ text: msg.text }]
        }));

        const systemPrompt = getSystemPrompt();

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              contents: [
                ...apiHistory,
                {
                  role: 'user',
                  parts: [{ text: text }],
                },
              ],
              systemInstruction: {
                parts: [{ text: systemPrompt }],
              },
            }),
          }
        );

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error?.message || `HTTP ${response.status}`);
        }

        const data = await response.json();
        const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || '申し訳ありません。お返事を生成できませんでした。';

        // Keep simulated attachment integrations for richer UX
        let attachment: 'chart' | 'card' | 'product' | undefined;
        const textLower = text.toLowerCase();
        if (textLower.includes('ベンチ')) {
          attachment = 'chart';
        } else if (textLower.includes('疲れて') || textLower.includes('睡眠') || textLower.includes('疲労')) {
          attachment = 'card';
        } else if (textLower.includes('プロテイン') || textLower.includes('サプリ')) {
          attachment = 'product';
        }

        setMessages(prev => [
          ...prev,
          { id: (Date.now() + 1).toString(), sender: 'ai', text: aiText, attachment }
        ]);
      } catch (err: any) {
        console.error('Gemini API Error:', err);
        setMessages(prev => [
          ...prev,
          { id: (Date.now() + 1).toString(), sender: 'ai', text: `エラーが発生しました: ${err.message}` }
        ]);
      } finally {
        setIsLoading(false);
        setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
      }
    })();
  };

  // Render attachment components
  const renderAttachment = (type: 'chart' | 'card' | 'product') => {
    if (type === 'chart') {
      return (
        <GlassCard style={styles.chartAttachment}>
          <Text style={styles.attachmentTitle}>ベンチプレス 1RM推移</Text>
          <View style={styles.chartPlaceholder}>
            {/* Custom SVG Line Chart */}
            <Svg height="80" width={screenWidth - 100}>
              <Path
                d="M10 60 Q 60 50 110 35 T 210 20 T 290 10"
                fill="none"
                stroke="#ff6b00"
                strokeWidth="3"
              />
              <Circle cx="10" cy="60" r="4" fill="#ff6b00" />
              <Circle cx="110" cy="35" r="4" fill="#ff6b00" />
              <Circle cx="210" cy="20" r="4" fill="#ff6b00" />
              <Circle cx="290" cy="10" r="4" fill="#ffffff" />
            </Svg>
            <View style={styles.chartLabels}>
              <Text style={styles.chartLabelText}>4月 (80kg)</Text>
              <Text style={styles.chartLabelText}>5月 (82.5kg)</Text>
              <Text style={styles.chartLabelText}>6月 (85kg)</Text>
              <Text style={styles.chartLabelText}>現在 (87.5kg)</Text>
            </View>
          </View>
        </GlassCard>
      );
    }
    
    if (type === 'card') {
      return (
        <GlassCard style={styles.cardAttachment}>
          <Text style={styles.attachmentTitle}>疲労・コンディション分析</Text>
          <View style={styles.statusGrid}>
            <View style={styles.statusBox}>
              <Text style={styles.statusLabel}>疲労度スコア</Text>
              <Text style={styles.statusValue}>24%</Text>
              <Text style={styles.statusSub}>良好な回復状態</Text>
            </View>
            <View style={styles.statusBox}>
              <Text style={styles.statusLabel}>睡眠効率</Text>
              <Text style={styles.statusValue}>92%</Text>
              <Text style={styles.statusSub}>深い睡眠十分</Text>
            </View>
          </View>
        </GlassCard>
      );
    }

    if (type === 'product') {
      const wpiProduct = useProductStore.getState().products.find(p => p.id === '1');
      if (!wpiProduct) return null;

      const handleProductPress = async () => {
        try {
          const supported = await Linking.canOpenURL(wpiProduct.url);
          if (supported) {
            await Linking.openURL(wpiProduct.url);
          } else {
            Alert.alert('エラー', 'このURLを開くことができませんでした。');
          }
        } catch (error) {
          console.error(`Error opening URL for ${wpiProduct.name}:`, error);
          Alert.alert('エラー', 'リンクを開く際にエラーが発生しました。');
        }
      };

      return (
        <GlassCard style={styles.productAttachment}>
          <Image source={wpiProduct.image} style={styles.productAttachmentImage} resizeMode="contain" />
          <View style={{ flex: 1 }}>
            <Text style={styles.productName}>{wpiProduct.name}</Text>
            <Text style={styles.productDesc}>{wpiProduct.description}</Text>
            <View style={styles.productFooter}>
              <Text style={styles.productPrice}>{wpiProduct.price}</Text>
              <TouchableOpacity style={styles.buyButton} onPress={handleProductPress} activeOpacity={0.8}>
                <Text style={styles.buyButtonText}>Amazonで見る</Text>
                <ArrowRight size={12} color="#ffffff" />
              </TouchableOpacity>
            </View>
          </View>
        </GlassCard>
      );
    }

    return null;
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Header */}
        <View style={styles.header}>
          <Brain size={24} color="#ff6b00" />
          <Text style={styles.headerTitle}>AIアドバイザー</Text>
          <Sparkles size={16} color="#ff6b00" />
        </View>

        {/* Plan Header status bar (hidden when keyboard is open to maximize screen space) */}
        {!isKeyboardVisible && (
          <GlassCard style={styles.planBar}>
            <View style={styles.planInfo}>
              <Text style={styles.planText}>
                {plan === 'premium' ? '👑 プレミアムプラン' : '⚡ 無料プラン'}
              </Text>
              <Text style={styles.planUsageText}>
                今日残り: {limit - todayCount} / {limit} 回
              </Text>
            </View>
            <TouchableOpacity
              style={styles.planBtn}
              onPress={() => {
                if (plan === 'premium') {
                  Alert.alert(
                    'プラン解約',
                    'プレミアムプランを解約しますか？解約すると、AIチャット回数が1日5回に制限され、広告が表示されるようになります。',
                    [
                      { text: 'キャンセル', style: 'cancel' },
                      { text: '解約する', style: 'destructive', onPress: () => togglePlan() }
                    ]
                  );
                } else {
                  setPaywallVisible(true);
                }
              }}
            >
              <Text style={styles.planBtnText}>
                {plan === 'premium' ? '解約する' : 'アップグレード'}
              </Text>
            </TouchableOpacity>
          </GlassCard>
        )}

        {/* Chat Area */}
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.chatScroll}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.map((msg) => {
            const isAI = msg.sender === 'ai';
            return (
              <View key={msg.id} style={[styles.msgWrapper, isAI ? styles.aiWrapper : styles.userWrapper]}>
                <GlassCard style={[styles.msgCard, isAI ? styles.aiCard : styles.userCard]}>
                  <Text style={isAI ? styles.aiText : styles.userText}>{msg.text}</Text>
                </GlassCard>
                {msg.attachment && renderAttachment(msg.attachment)}
              </View>
            );
          })}
          {isLoading && (
            <View style={[styles.msgWrapper, styles.aiWrapper]}>
              <GlassCard style={[styles.msgCard, styles.aiCard, { paddingVertical: 12, paddingHorizontal: 16 }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <ActivityIndicator size="small" color="#ff6b00" />
                  <Text style={[styles.aiText, { color: '#888888' }]}>AIが回答を生成中...</Text>
                </View>
              </GlassCard>
            </View>
          )}
        </ScrollView>

        {/* Suggested Questions */}
        {messages.length === 1 && (
          <View style={styles.suggestionsContainer}>
            <Text style={styles.suggestionsTitle}>質問のヒント</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.suggestionsScroll}>
              {suggestedQuestions.map((q, idx) => (
                <TouchableOpacity
                  key={idx}
                  activeOpacity={0.8}
                  onPress={() => handleSend(q)}
                  style={styles.suggestionBtn}
                >
                  <Text style={styles.suggestionBtnText}>{q}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}



        {/* Input Bar */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            placeholder={isLoading ? "AIが回答を生成中..." : "AIにトレーニングについて相談する..."}
            placeholderTextColor="#666666"
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={() => !isLoading && handleSend(inputText)}
            editable={!isLoading}
          />
          <TouchableOpacity
            style={[styles.sendButton, (!inputText.trim() || isLoading) && styles.sendButtonDisabled]}
            disabled={!inputText.trim() || isLoading}
            onPress={() => handleSend(inputText)}
          >
            <Send size={18} color="#ffffff" />
          </TouchableOpacity>
        </View>

        {/* Space at the bottom */}
        <View style={{ height: Platform.OS === 'ios' ? 80 : 70 }} />
      </KeyboardAvoidingView>

      {/* 課金モーダル (PaywallModal) */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={paywallVisible}
        onRequestClose={() => setPaywallVisible(false)}
      >
        <View style={styles.modalContainer}>
          <GlassCard style={styles.modalContent}>
            <Text style={styles.paywallTitle}>👑 PREMIUM PLAN</Text>
            <Text style={styles.paywallPrice}>月額 500 円 <Text style={styles.priceTax}>(税込)</Text></Text>
            
            <View style={styles.benefitContainer}>
              <View style={styles.benefitRow}>
                <Text style={styles.benefitCheck}>✓</Text>
                <Text style={styles.benefitText}>AIチャットの上限が 1日100回 に拡大</Text>
              </View>
              <View style={styles.benefitRow}>
                <Text style={styles.benefitCheck}>✓</Text>
                <Text style={styles.benefitText}>アプリ内のスポンサー広告を完全非表示</Text>
              </View>
              <View style={styles.benefitRow}>
                <Text style={styles.benefitCheck}>✓</Text>
                <Text style={styles.benefitText}>最新機能の先行リリース権</Text>
              </View>
            </View>

            {isPaying ? (
              <View style={styles.payingContainer}>
                <ActivityIndicator size="large" color="#ff6b00" />
                <Text style={styles.payingText}>決済を処理中...</Text>
              </View>
            ) : (
              <View style={{ width: '100%' }}>
                {isPurchasesInitialized() ? (
                  <View style={{ gap: 12, marginVertical: 15 }}>
                    <Text style={styles.benefitText}>
                      App Store または Google Play アカウントに登録されている決済方法で安全に登録手続きを行います。
                    </Text>
                    <TouchableOpacity style={styles.payConfirmBtn} onPress={handlePurchasePremium}>
                      <Text style={styles.payConfirmText}>購入手続きに進む</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <>
                    <Text style={styles.paymentSectionHeader}>クレジットカードで支払う (デモ環境)</Text>
                    
                    <TextInput
                      style={styles.paymentInput}
                      placeholder="カード番号 (16桁)"
                      placeholderTextColor="#555"
                      keyboardType="numeric"
                      maxLength={16}
                      value={cardNumber}
                      onChangeText={setCardNumber}
                    />
                    
                    <View style={{ flexDirection: 'row', gap: 10, marginVertical: 8 }}>
                      <TextInput
                        style={[styles.paymentInput, { flex: 1 }]}
                        placeholder="有効期限 (MM/YY)"
                        placeholderTextColor="#555"
                        maxLength={5}
                        value={cardExpiry}
                        onChangeText={setCardExpiry}
                      />
                      <TextInput
                        style={[styles.paymentInput, { flex: 1 }]}
                        placeholder="CVV (3桁)"
                        placeholderTextColor="#555"
                        keyboardType="numeric"
                        maxLength={3}
                        value={cardCvv}
                        onChangeText={setCardCvv}
                      />
                    </View>

                    <TouchableOpacity style={styles.payConfirmBtn} onPress={handlePurchasePremium}>
                      <Text style={styles.payConfirmText}>月額500円で登録する</Text>
                    </TouchableOpacity>

                    <Text style={styles.orText}>または</Text>

                    <TouchableOpacity style={styles.applePayBtn} onPress={handlePurchasePremium}>
                      <Text style={styles.applePayText}> Pay で支払う</Text>
                    </TouchableOpacity>
                  </>
                )}

                <TouchableOpacity style={styles.payCancelBtn} onPress={() => setPaywallVisible(false)}>
                  <Text style={styles.payCancelText}>キャンセル</Text>
                </TouchableOpacity>
              </View>
            )}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  chatScroll: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  msgWrapper: {
    marginBottom: 20,
    maxWidth: '85%',
  },
  aiWrapper: {
    alignSelf: 'flex-start',
  },
  userWrapper: {
    alignSelf: 'flex-end',
  },
  msgCard: {
    borderRadius: 20,
  },
  aiCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderTopLeftRadius: 4,
  },
  userCard: {
    backgroundColor: '#ff6b00',
    borderColor: '#ff6b00',
    borderTopRightRadius: 4,
  },
  aiText: {
    color: '#dddddd',
    fontSize: 14,
    lineHeight: 20,
  },
  userText: {
    color: '#ffffff',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  suggestionsContainer: {
    marginBottom: 10,
  },
  suggestionsTitle: {
    color: '#555555',
    fontSize: 11,
    fontWeight: 'bold',
    marginLeft: 20,
    marginBottom: 8,
    letterSpacing: 1,
  },
  suggestionsScroll: {
    paddingHorizontal: 20,
    gap: 10,
  },
  suggestionBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  suggestionBtnText: {
    color: '#cccccc',
    fontSize: 12,
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 20,
    marginHorizontal: 20,
    marginBottom: 10,
    paddingHorizontal: 15,
    height: 50,
  },
  textInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 14,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ff6b00',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#333333',
  },
  // Attachment styles
  chartAttachment: {
    marginTop: 8,
    width: screenWidth - 60,
    padding: 15,
    borderColor: 'rgba(255, 107, 0, 0.25)',
  },
  cardAttachment: {
    marginTop: 8,
    width: screenWidth - 60,
    padding: 15,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  productAttachment: {
    marginTop: 8,
    flexDirection: 'row',
    width: screenWidth - 60,
    padding: 12,
    borderColor: 'rgba(255, 107, 0, 0.25)',
    backgroundColor: 'rgba(255, 107, 0, 0.03)',
    alignItems: 'center',
  },
  productAttachmentImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    padding: 2,
  },
  attachmentTitle: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  chartPlaceholder: {
    alignItems: 'center',
  },
  chartLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 6,
  },
  chartLabelText: {
    color: '#555555',
    fontSize: 9,
    fontWeight: 'bold',
  },
  statusGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statusBox: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    padding: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  statusLabel: {
    color: '#888888',
    fontSize: 10,
  },
  statusValue: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 4,
  },
  statusSub: {
    color: '#22c55e',
    fontSize: 9,
    fontWeight: '600',
  },
  productName: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  productDesc: {
    color: '#888888',
    fontSize: 11,
    marginTop: 2,
  },
  productFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  productPrice: {
    color: '#ff6b00',
    fontSize: 15,
    fontWeight: 'bold',
  },
  buyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ff6b00',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  buyButtonText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  planBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    marginHorizontal: 20,
    marginTop: 5,
    marginBottom: 10,
  },
  planInfo: {
    flex: 1,
  },
  planText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  planUsageText: {
    color: '#888888',
    fontSize: 11,
    marginTop: 2,
  },
  planBtn: {
    backgroundColor: '#ff6b00',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  planBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  adBanner: {
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 12,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  adHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  adBadge: {
    backgroundColor: '#444444',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  adBadgeText: {
    color: '#888888',
    fontSize: 9,
    fontWeight: 'bold',
  },
  adCloseText: {
    color: '#ff6b00',
    fontSize: 10,
    fontWeight: 'bold',
  },
  adTitle: {
    color: '#cccccc',
    fontSize: 12,
    lineHeight: 16,
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
    padding: 24,
    alignItems: 'center',
  },
  paywallTitle: {
    color: '#ff6b00',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  paywallPrice: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  priceTax: {
    fontSize: 12,
    color: '#888888',
    fontWeight: 'normal',
  },
  benefitContainer: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  benefitCheck: {
    color: '#ff6b00',
    fontSize: 14,
    fontWeight: 'bold',
    marginRight: 10,
  },
  benefitText: {
    color: '#cccccc',
    fontSize: 12,
  },
  payingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
    width: '100%',
  },
  payingText: {
    color: '#ffffff',
    fontSize: 13,
    marginTop: 15,
  },
  paymentSectionHeader: {
    color: '#888888',
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  paymentInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 10,
    color: '#ffffff',
    fontSize: 13,
    height: 40,
    paddingHorizontal: 12,
  },
  payConfirmBtn: {
    backgroundColor: '#ff6b00',
    borderRadius: 10,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  payConfirmText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  orText: {
    color: '#555555',
    fontSize: 11,
    textAlign: 'center',
    marginVertical: 10,
    fontWeight: 'bold',
  },
  applePayBtn: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  applePayText: {
    color: '#000000',
    fontSize: 13,
    fontWeight: 'bold',
  },
  payCancelBtn: {
    alignItems: 'center',
    marginTop: 15,
  },
  payCancelText: {
    color: '#888888',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
