# 圃場マップ

LeafletとEsri World Imageryを使った、GitHub Pagesで公開できる静的な圃場マップです。

## 圃場データの編集

Excelファイルの先頭シートを読み込みます。GitHub Pagesで自動表示するには、Excelファイルを `fields.xlsx` という名前でこのフォルダーに置いてください。端末上のファイルを一時的に表示する場合は、地図左下の **Excelを選択** を使います。

1行目に次の英字の見出しを置いてください。座標はWGS84形式の緯度（`latitude`）・経度（`longitude`）です。

| id | farmer | area | crop | notes | latitude | longitude |
| --- | --- | --- | --- | --- | ---: | ---: |
| 1 | 山田 太郎 | 2,500㎡ | 水稲 | 用水路側から進入 | 35.6819 | 139.7674 |
```

## GitHub Pagesで公開する方法

1. このフォルダーの内容をGitHubリポジトリのルートにアップロードします。
2. リポジトリの **Settings → Pages** を開きます。
3. **Deploy from a branch** を選び、公開するブランチ（通常は `main`）と `/ (root)` を指定して保存します。
4. 表示されたURLをiPhoneまたはAndroidで開きます。現在地の機能はHTTPSで公開されたページで利用できます。

> 公開用の `fields.xlsx` はブラウザから読み込むため、ローカルで確認する場合も簡易Webサーバー経由で開いてください。
