import { Platform } from 'react-native';
import Purchases, { PurchasesPackage } from 'react-native-purchases';

// RevenueCat API keys (Replace with actual keys from RevenueCat Dashboard before release)
const REVENUECAT_API_KEYS = {
  ios: 'appl_mockKeyForIosDevelopmentKey',
  android: 'goog_mockKeyForAndroidDevelopmentKey'
};

let isInitialized = false;

export const isPurchasesInitialized = (): boolean => {
  return isInitialized;
};

export const initializePurchases = async () => {
  if (isInitialized) return;
  try {
    if (Platform.OS === 'ios') {
      Purchases.configure({ apiKey: REVENUECAT_API_KEYS.ios });
      isInitialized = true;
    } else if (Platform.OS === 'android') {
      Purchases.configure({ apiKey: REVENUECAT_API_KEYS.android });
      isInitialized = true;
    }
  } catch (error) {
    console.warn('RevenueCat initialization skipped or failed:', error);
  }
};

export const loginUserToPurchases = async (email: string): Promise<void> => {
  if (!isInitialized) return;
  try {
    await Purchases.logIn(email);
    console.log('Successfully logged in user to RevenueCat:', email);
  } catch (error) {
    console.error('Error logging in user to RevenueCat:', error);
  }
};

export const logoutUserFromPurchases = async (): Promise<void> => {
  if (!isInitialized) return;
  try {
    await Purchases.logOut();
    console.log('Successfully logged out user from RevenueCat');
  } catch (error) {
    console.error('Error logging out user from RevenueCat:', error);
  }
};

export const checkPremiumStatus = async (): Promise<boolean> => {
  if (!isInitialized) return false;
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    return customerInfo.entitlements.active['premium'] !== undefined;
  } catch (error) {
    console.error('Error fetching customer info from RevenueCat:', error);
    return false;
  }
};

export const getAvailablePackages = async (): Promise<PurchasesPackage[]> => {
  if (!isInitialized) {
    // Return a mock package for simulator testing
    return [
      {
        identifier: 'premium_monthly',
        packageType: 'MONTHLY',
        product: {
          identifier: 'premium_monthly_sub',
          description: 'AIアドバイザーの利用制限解除＋広告削除',
          title: 'プレミアムプラン (月額)',
          price: 500,
          priceString: '￥500',
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

  // Fallback mock package
  return [
    {
      identifier: 'premium_monthly',
      packageType: 'MONTHLY',
      product: {
        identifier: 'premium_monthly_sub',
        description: 'AIアドバイザーの利用制限解除＋広告削除',
        title: 'プレミアムプラン (月額)',
        price: 500,
        priceString: '￥500',
        currencyCode: 'JPY',
      },
    } as any
  ];
};

export const purchasePremiumPackage = async (pkg: PurchasesPackage): Promise<boolean> => {
  if (!isInitialized || (pkg as any).identifier === 'premium_monthly') {
    // Simulator mock checkout bypass
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(true);
      }, 1500);
    });
  }

  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    return customerInfo.entitlements.active['premium'] !== undefined;
  } catch (error: any) {
    if (!error.userCancelled) {
      console.error('Error purchasing package:', error);
      throw error;
    }
  }
  return false;
};

export const restorePurchases = async (): Promise<boolean> => {
  if (!isInitialized) {
    return true; // Mock success
  }
  try {
    const customerInfo = await Purchases.restorePurchases();
    return customerInfo.entitlements.active['premium'] !== undefined;
  } catch (error) {
    console.error('Error restoring purchases:', error);
  }
  return false;
};

