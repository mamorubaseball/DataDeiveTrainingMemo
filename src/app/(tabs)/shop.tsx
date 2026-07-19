import React from 'react';
import { StyleSheet, Text, View, ScrollView, SafeAreaView, TouchableOpacity, Dimensions, Image, Alert } from 'react-native';
import { ShoppingBag, ArrowRight, Star, Sparkles } from 'lucide-react-native';
import * as Linking from 'expo-linking';
import GlassCard from '@/components/ui/GlassCard';
import { useProductStore } from '@/stores/productStore';

const screenWidth = Dimensions.get('window').width;

export default function ShopScreen() {
  const { products } = useProductStore();

  const handleOpenURL = async (url: string, name: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('エラー', 'このURLを開くことができませんでした。');
      }
    } catch (error) {
      console.error(`Error opening URL for ${name}:`, error);
      Alert.alert('エラー', 'リンクを開く際にエラーが発生しました。');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <ShoppingBag size={24} color="#ff6b00" />
          <Text style={styles.headerTitle}>AI-RECOMMENDED SHOP</Text>
        </View>

        <Text style={styles.heroText}>
          あなたのトレーニング履歴とコンディションに基づき、AIが最適なサプリメントとギアをセレクトしました。
        </Text>

        {/* Product Cards List */}
        <View style={styles.productsList}>
          {products.map((product) => (
            <GlassCard key={product.id} style={styles.productCard}>
              {/* Product Image Container */}
              <View style={styles.imageContainer}>
                <Image source={product.image} style={styles.productImage} resizeMode="contain" />
                {product.tag && (
                  <View style={styles.tagBadge}>
                    <Sparkles size={10} color="#ffffff" style={{ marginRight: 3 }} />
                    <Text style={styles.tagText}>{product.tag}</Text>
                  </View>
                )}
              </View>

              <View style={styles.cardHeader}>
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryText}>{product.category}</Text>
                </View>
              </View>

              <Text style={styles.productName}>{product.name}</Text>
              <Text style={styles.productDescription}>{product.description}</Text>

              {/* Rating */}
              <View style={styles.ratingRow}>
                <Star size={14} color="#ffb300" fill="#ffb300" />
                <Text style={styles.ratingText}>{product.rating} (120+ レビュー)</Text>
              </View>

              {/* Footer */}
              <View style={styles.cardFooter}>
                <Text style={styles.productPrice}>{product.price}</Text>
                <TouchableOpacity 
                  style={styles.buyButton} 
                  activeOpacity={0.8}
                  onPress={() => handleOpenURL(product.url, product.name)}
                >
                  <Text style={styles.buyButtonText}>Amazonで見る</Text>
                  <ArrowRight size={12} color="#ffffff" />
                </TouchableOpacity>
              </View>
            </GlassCard>
          ))}
        </View>

        {/* Space at the bottom */}
        <View style={{ height: 100 }} />
      </ScrollView>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  heroText: {
    color: '#888888',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 24,
    paddingHorizontal: 10,
  },
  productsList: {
    gap: 16,
  },
  productCard: {
    padding: 16,
    overflow: 'hidden',
  },
  imageContainer: {
    width: '100%',
    height: 200,
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 10,
  },
  productImage: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  categoryBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  categoryText: {
    color: '#aaaaaa',
    fontSize: 10,
    fontWeight: 'bold',
  },
  tagBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ff6b00',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    shadowColor: '#ff6b00',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
  },
  tagText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  productName: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  productDescription: {
    color: '#888888',
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 12,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 16,
  },
  ratingText: {
    color: '#666666',
    fontSize: 11,
    fontWeight: '600',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    paddingTop: 14,
  },
  productPrice: {
    color: '#ff6b00',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ff6b00',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    shadowColor: '#ff6b00',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  buyButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
