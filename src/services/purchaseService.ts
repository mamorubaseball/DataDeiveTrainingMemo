import { Platform, Alert } from 'react-native';
import Purchases, { PurchasesPackage } from 'react-native-purchases';
import RevenueCatUI from 'react-native-purchases-ui';

// RevenueCat API keys
// 指定されたPublic API keyを設定
const REVENUECAT_API_KEYS = {
  ios: 'test_NEJwtftICWZTNoxUYOJqhfKHWPR',
  android: 'test_NEJwtftICWZTNoxUYOJqhfKHWPR'
};

// エンタイトルメント定数
const ENTITLEMENT_ID = 'DataDriveTrainingMemo Pro';

let isInitialized = false;
let isMockMode = false;
let mockPremiumStatus = false; // デモ環境用のプレミアム購入状態

// プレースホルダーのキーのままであればモックモードで動かす判定
const isMockKey = (key: string): boolean => {
  return !key || key.startsWith('appl_mock') || key.startsWith('goog_mock') || key === '';
};

export const isPurchasesInitialized = (): boolean => {
  return isInitialized;
};

export const initializePurchases = async () => {
  if (isInitialized || isMockMode) return;
  
  const key = Platform.OS === 'ios' ? REVENUECAT_API_KEYS.ios : REVENUECAT_API_KEYS.android;
  
  if (isMockKey(key)) {
    isMockMode = true;
    console.log('RevenueCat initialized in MOCK mode (Using placeholder developer keys)');
    return;
  }

  try {
    Purchases.configure({ apiKey: key });
    isInitialized = true;
    isMockMode = false;
    console.log('RevenueCat initialized successfully for Public API Key.');
  } catch (error) {
    console.warn('RevenueCat initialization failed, falling back to mock mode:', error);
    isMockMode = true;
  }
};

export const loginUserToPurchases = async (email: string): Promise<void> => {
  if (isMockMode || !isInitialized) return;
  try {
    await Purchases.logIn(email);
    console.log('Successfully logged in user to RevenueCat:', email);
  } catch (error) {
    console.error('Error logging in user to RevenueCat:', error);
  }
};

export const logoutUserFromPurchases = async (): Promise<void> => {
  if (isMockMode || !isInitialized) return;
  try {
    await Purchases.logOut();
    console.log('Successfully logged out user from RevenueCat');
  } catch (error) {
    console.error('Error logging out user from RevenueCat:', error);
  }
};

export const checkPremiumStatus = async (): Promise<boolean> => {
  if (isMockMode) {
    return mockPremiumStatus;
  }
  if (!isInitialized) return false;
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    return customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
  } catch (error) {
    console.error('Error fetching customer info from RevenueCat:', error);
    return false;
  }
};

export const getAvailablePackages = async (): Promise<PurchasesPackage[]> => {
  if (isMockMode) {
    // シミュレーターテスト用の3つのプロダクト（lifetime, yearly, monthly）をシミュレート
    return [
      {
        identifier: 'monthly',
        packageType: 'MONTHLY',
        product: {
          identifier: 'monthly',
          description: '月間プラン - AI制限解除＋広告非表示',
          title: '月間プラン (月額)',
          price: 500,
          priceString: '￥500',
          currencyCode: 'JPY',
        },
      } as any,
      {
        identifier: 'yearly',
        packageType: 'ANNUAL',
        product: {
          identifier: 'yearly',
          description: '年間プラン - お得な年払い',
          title: '年間プラン (年額)',
          price: 4800,
          priceString: '￥4,800',
          currencyCode: 'JPY',
        },
      } as any,
      {
        identifier: 'lifetime',
        packageType: 'LIFETIME',
        product: {
          identifier: 'lifetime',
          description: '買い切りプラン - 永久アクセス',
          title: '買い切りプラン (永久)',
          price: 12000,
          priceString: '￥12,000',
          currencyCode: 'JPY',
        },
      } as any
    ];
  }

  try {
    const offerings = await Purchases.getOfferings();
    if (offerings.current !== null && offerings.current.availablePackages.length > 0) {
      return offerings.current.availablePackages;
    }
  } catch (error) {
    console.error('Error fetching offerings from RevenueCat:', error);
  }

  return [];
};

export const purchasePremiumPackage = async (pkg: PurchasesPackage): Promise<boolean> => {
  if (isMockMode) {
    // シミュレータ決済をシミュレート（1.5秒待機して成功を返す）
    return new Promise((resolve) => {
      setTimeout(() => {
        mockPremiumStatus = true;
        resolve(true);
      }, 1500);
    });
  }

  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    return customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
  } catch (error: any) {
    if (error.userCancelled) {
      console.log('User cancelled the purchase process');
      return false;
    }
    
    let errorMessage = '決済処理中にエラーが発生しました。';
    if (error.code === Purchases.PURCHASES_ERROR_CODE.PURCHASE_NOT_ALLOWED_ERROR) {
      errorMessage = 'この端末でのアプリ内課金が許可されていません（ペアレンタルコントロールなど）。';
    } else if (error.code === Purchases.PURCHASES_ERROR_CODE.PAYMENT_PENDING_ERROR) {
      errorMessage = '決済が保留状態です。ストアの購入完了画面を確認してください。';
    } else if (error.code === Purchases.PURCHASES_ERROR_CODE.INVALID_CREDENTIALS_ERROR) {
      errorMessage = '認証エラーが発生しました。ストアアカウントに再ログインしてください。';
    } else if (error.code === Purchases.PURCHASES_ERROR_CODE.STORE_PROBLEM_ERROR) {
      errorMessage = 'App Store/Google Playとの接続に問題が発生しています。しばらく経ってから再度お試しください。';
    }
    
    console.error('RevenueCat purchase error:', error);
    throw new Error(errorMessage);
  }
};

export const restorePurchases = async (): Promise<boolean> => {
  if (isMockMode) {
    mockPremiumStatus = true;
    return true; // Mock success
  }
  try {
    const customerInfo = await Purchases.restorePurchases();
    return customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
  } catch (error) {
    console.error('Error restoring purchases:', error);
  }
  return false;
};

/**
 * RevenueCat Paywall をネイティブ表示する
 */
export const presentPaywall = async (): Promise<boolean> => {
  if (isMockMode) {
    // モックモード時は確認用のアラートダイアログを表示
    return new Promise((resolve) => {
      Alert.alert(
        'プレミアムアップグレード (デモ環境)',
        '月額500円（税込）でプレミアムプランに加入しますか？(デモ決済のため、実際の請求は発生しません)',
        [
          { text: 'キャンセル', onPress: () => resolve(false), style: 'cancel' },
          { 
            text: 'デモ決済で加入する', 
            onPress: () => {
              mockPremiumStatus = true;
              resolve(true);
            } 
          }
        ]
      );
    });
  }

  try {
    const paywallResult = await RevenueCatUI.presentPaywall();
    // 購入成功、またはすでに購入済みかチェック
    const customerInfo = await Purchases.getCustomerInfo();
    return customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
  } catch (error) {
    console.error('Error presenting paywall:', error);
    return false;
  }
};

/**
 * RevenueCat Customer Center を表示して、サブスクリプションを管理する
 */
export const presentCustomerCenter = async (): Promise<void> => {
  if (isMockMode) {
    // モックモード時はダミーの管理用アラートダイアログを表示
    return new Promise((resolve) => {
      Alert.alert(
        'サブスクリプションの管理 (デモ環境)',
        'プレミアムプランを解約しますか？解約すると、AIチャット回数が1日5回に制限されます。',
        [
          { text: 'キャンセル', onPress: () => resolve(), style: 'cancel' },
          { 
            text: '解約する', 
            style: 'destructive', 
            onPress: () => {
              mockPremiumStatus = false;
              resolve();
            } 
          }
        ]
      );
    });
  }

  try {
    await RevenueCatUI.presentCustomerCenter();
  } catch (error) {
    console.error('Error presenting customer center:', error);
  }
};
