#!/bin/bash
# メモ帳アプリ APKビルドスクリプト
#
# 方法1: EAS Build (クラウドビルド・推奨)
#   npm install -g eas-cli
#   eas login
#   eas build --platform android --profile preview
#
# 方法2: ローカルビルド (Android SDK必要)
#   npx expo prebuild --platform android
#   cd android && ./gradlew assembleRelease
#   APKは android/app/build/outputs/apk/release/ に生成されます

set -e

echo "=== メモ帳アプリ APK ビルド ==="

# Check if eas-cli is installed
if command -v eas &> /dev/null; then
    echo "EAS CLIを使用してクラウドビルドを開始します..."
    eas build --platform android --profile preview --non-interactive
else
    echo "ローカルビルドを試みます..."

    # Check ANDROID_HOME
    if [ -z "$ANDROID_HOME" ]; then
        echo "エラー: ANDROID_HOME が設定されていません"
        echo ""
        echo "Android SDKをインストールして環境変数を設定してください:"
        echo "  export ANDROID_HOME=\$HOME/Android/Sdk"
        echo "  export PATH=\$PATH:\$ANDROID_HOME/platform-tools"
        echo ""
        echo "または EAS Build (クラウド) を使用してください:"
        echo "  npm install -g eas-cli"
        echo "  eas login"
        echo "  eas build --platform android --profile preview"
        exit 1
    fi

    # Prebuild if needed
    if [ ! -d "android" ]; then
        echo "Android プロジェクトを生成中..."
        npx expo prebuild --platform android
    fi

    echo "APKをビルド中..."
    cd android
    ./gradlew assembleRelease

    APK_PATH="app/build/outputs/apk/release/app-release.apk"
    if [ -f "$APK_PATH" ]; then
        cp "$APK_PATH" ../notes-app.apk
        echo ""
        echo "ビルド完了！APKファイル: notes-app.apk"
    else
        echo "エラー: APKファイルが見つかりません"
        exit 1
    fi
fi
