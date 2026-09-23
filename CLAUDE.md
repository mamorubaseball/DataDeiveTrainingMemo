# DataDrive Training Memo 開発ガイド

## プロジェクト概要
データドリブンな筋トレ記録アプリのUIモック。自動リアルタイム保存とAIチャット機能を統合。

## コマンド一覧

### 開発・起動
*   **アプリ起動 (iOS)**: `LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 npm run ios` (CocoaPods/Xcodeビルドを伴う)
*   **アプリ起動 (Android)**: `npm run android`
*   **開発サーバー起動のみ**: `npm start`
*   **型チェック**: `npx tsc --noEmit`

## 開発ルール・仕様メモ
*   **リアルタイム保存**: 保存ボタンは配置しない。入力イベント毎に Zustand / Firestore を更新。
*   **課金システム (RevenueCat)**:
    *   [purchaseService.ts](file:///Users/mamoru/My_Application/DataDeiveTrainingMemo/src/services/purchaseService.ts) は、APIキーがモック状態の場合に自動で「モックモード」で動作します。シミュレーターでもテスト可能です。
    *   本番キーに差し替えるだけで、コード変更なしで実際のアプリストア決済に切り替わります。

## 将来的な導入予定 (バックログ)
*   **PostHog (プロダクト分析・イベントトラッキング)**
    *   ユーザーの利用傾向・定性データ分析のために導入予定。
    *   `posthog-react-native` を用いたイベントトラッキングの実装。
