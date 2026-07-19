import { create } from 'zustand';

export interface Product {
  id: string;
  name: string;
  category: 'サプリメント' | 'トレーニングギア';
  price: string;
  rating: number;
  description: string;
  image: any;
  url: string;
  tag?: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
}

interface ProductState {
  products: Product[];
  getProductById: (id: string) => Product | undefined;
}

export const useProductStore = create<ProductState>((set, get) => ({
  products: [
    {
      id: '1',
      name: 'プロテイン',
      category: 'サプリメント',
      price: 'Amazonで確認',
      rating: 4.8,
      description: '体づくりの基礎となるタンパク質を手軽に補給。まずはこれから始めましょう！',
      url: 'https://amzn.to/4eg9QsW',
      bgColor: 'bg-blue-50/70',
      borderColor: 'border-blue-100',
      textColor: 'text-blue-600',
      image: require('../../assets/images/products/protein.png'),
      tag: '必須',
    },
    {
      id: '2',
      name: 'BCAA',
      category: 'サプリメント',
      price: 'Amazonで確認',
      rating: 4.6,
      description: 'トレーニング中のスタミナ維持や、筋肉の分解を防ぐアミノ酸ドリンクです。',
      url: 'https://amzn.to/4uWXwF5',
      bgColor: 'bg-orange-50/70',
      borderColor: 'border-orange-100',
      textColor: 'text-orange-600',
      image: require('../../assets/images/products/bcaa.png'),
    },
    {
      id: '3',
      name: 'クエン酸',
      category: 'サプリメント',
      price: 'Amazonで確認',
      rating: 4.5,
      description: 'エネルギー代謝を高め、トレーニング中・後の疲労回復を強力にサポート。',
      url: 'https://amzn.to/4vqyD4m',
      bgColor: 'bg-amber-50/70',
      borderColor: 'border-amber-100',
      textColor: 'text-amber-600',
      image: require('../../assets/images/products/citric_acid.png'),
    },
    {
      id: '4',
      name: 'アルギニン',
      category: 'サプリメント',
      price: 'Amazonで確認',
      rating: 4.4,
      description: 'トレーニング時の血流を促し、パンプアップ感や活力を高めるアミノ酸です。',
      url: 'https://amzn.to/4vdSO61',
      bgColor: 'bg-purple-50/70',
      borderColor: 'border-purple-100',
      textColor: 'text-purple-600',
      image: require('../../assets/images/products/arginine.png'),
    },
    {
      id: '5',
      name: 'クレアチン',
      category: 'サプリメント',
      price: 'Amazonで確認',
      rating: 4.7,
      description: '高強度のトレーニングで瞬発的なパワーと最大筋力を発揮したい方におすすめ。',
      url: 'https://amzn.to/4ul9wiw',
      bgColor: 'bg-emerald-50/70',
      borderColor: 'border-emerald-100',
      textColor: 'text-emerald-600',
      image: require('../../assets/images/products/creatine.png'),
    },
    {
      id: '6',
      name: 'パワーグリップ',
      category: 'トレーニングギア',
      price: 'Amazonで確認',
      rating: 4.9,
      description: '背中のトレーニング（デッドリフトやラットプルなど）で、握力が先に尽きるのを防ぐ必須アイテム。ターゲットの筋肉に100%集中できます。',
      url: 'https://amzn.to/4esB14N',
      bgColor: 'bg-indigo-50/70',
      borderColor: 'border-indigo-100',
      textColor: 'text-indigo-600',
      image: require('../../assets/images/products/power_grip.png'),
      tag: '人気',
    },
    {
      id: '7',
      name: 'リストラップ',
      category: 'トレーニングギア',
      price: 'Amazonで確認',
      rating: 4.7,
      description: 'ベンチプレスやショルダープレスなど、プレス系種目で手首を強固に固定して怪我を予防。手首が安定することで挙上重量のアップも狙えます。',
      url: 'https://amzn.to/3RRzr3S',
      bgColor: 'bg-rose-50/70',
      borderColor: 'border-rose-100',
      textColor: 'text-rose-600',
      image: require('../../assets/images/products/wrist_wrap.png'),
    }
  ],
  getProductById: (id: string) => {
    return get().products.find(p => p.id === id);
  }
}));
