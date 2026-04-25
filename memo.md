今後のリリース手順
今後、新しいバージョンをリリースする際は以下の手順だけで完了します：

package.json の version を更新。
以下のコマンドを実行：
bash
npm run release:tag
これで GitHub 側で自動的にバイナリ付きのリリースが作成されます。
