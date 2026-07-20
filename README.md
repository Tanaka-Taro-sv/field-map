# 圃場マップ

LeafletとEsri World Imageryを使った、GitHub Pagesで公開できる静的な圃場マップです。

## 圃場データの編集

GitHub Pagesでは `fields.csv` を自動で読み込みます。端末上のCSVまたはExcelを一時的に表示する場合は、地図左下の **データを選択** を使います。

CSVの1行目に次の英字の見出しを置いてください。座標はWGS84形式の緯度（`lat`）・経度（`lng`）です。

| id | farmer | area | crop | notes | lat | lng |
| --- | --- | --- | --- | --- | ---: | ---: |
| 1 | 山田 太郎 | 2,500㎡ | 水稲 | 用水路側から進入 | 35.6819 | 139.7674 |

## Plus Codeから緯度・経度を生成する

`fields.xlsx` の先頭シートに `PlusCode` 列を作成してください。ほかに `id`、`farmer`、`area`、`crop`、`notes` 列を加えると、地図のポップアップにも表示されます。

| id | PlusCode | farmer | area | crop | notes |
| --- | --- | --- | --- | --- | --- |
| 1 | M5MP+GC8 更別村、北海道 | | | | |

### Google Maps APIキーの取得

1. [Google Cloud Console](https://console.cloud.google.com/) でプロジェクトを作成または選択します。
2. **APIとサービス → ライブラリ** で **Geocoding API** を有効にします。
3. **APIとサービス → 認証情報 → 認証情報を作成 → APIキー** でキーを作成します。
4. 作成したキーは、利用元のIPアドレスまたはアプリケーションに制限し、APIの制限では **Geocoding API** のみを許可します。
5. プロジェクト直下の `.env` に、次のように保存します（`.env` はGit管理から除外済みです）。

```text
GOOGLE_MAPS_API_KEY=ここにAPIキーを貼り付け
```

キーを設定後、次のコマンドを実行すると、Plus CodeをGoogle Maps Geocoding APIで変換した `lat` と `lng` を含む `fields.csv` が生成されます。

```powershell
& "C:\Users\rrstu\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" scripts/convert-pluscodes.mjs
```

GoogleのGeocoding APIは、Plus Codeを含む住所文字列をジオコーディングでき、レスポンスに緯度・経度を返します。[Google公式ドキュメント](https://developers.google.com/maps/documentation/geocoding/geocoding)
```

## GitHub Pagesで公開する方法

1. このフォルダーの内容をGitHubリポジトリのルートにアップロードします。
2. リポジトリの **Settings → Pages** を開きます。
3. **Deploy from a branch** を選び、公開するブランチ（通常は `main`）と `/ (root)` を指定して保存します。
4. 表示されたURLをiPhoneまたはAndroidで開きます。現在地の機能はHTTPSで公開されたページで利用できます。

> 公開用の `fields.xlsx` はブラウザから読み込むため、ローカルで確認する場合も簡易Webサーバー経由で開いてください。
