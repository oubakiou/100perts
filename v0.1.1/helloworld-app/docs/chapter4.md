# Next.js を Cloud Functions にデプロイして SSR してみよう

ここまで開発環境(手元の Mac)で作業を続けてきましたがこの辺りで一度、本番環境([Cloud Functions for Firebase](https://firebase.google.com/docs/functions?hl=ja))にデプロイをしてみましょう。今回はお手軽に Cloud Functions を使います。

- コールドスタート時にレスポンスが遅くなる(対策によってある程度の緩和は可能)
- 1 関数あたり最大 100MB のアップロード上限などいくつかの[制限](https://firebase.google.com/docs/functions/quotas?hl=ja)がある

などのデメリットはあるものの、サーバーもコンテナすらも管理する必要がなく要件がマッチする場合には非常に便利なサービスです。

まずは Firebase の[ブラウザコンソール](https://console.firebase.google.com/?hl=ja)へアクセスし新しい Firebase プロジェクトを作成します。

![](https://storage.googleapis.com/zenn-user-upload/202ee09c37ee50f9d7730362.png)

![](https://storage.googleapis.com/zenn-user-upload/2c6613110274-20220425.png)

プロジェクト名を入力するとユニークなプロジェクト ID が自動で割り振られます。

![](https://storage.googleapis.com/zenn-user-upload/94ebdf24e5a9-20220425.png)

プロジェクトで GA を有効化するかを確認されますが、ひとまずは無効で問題ありません。

![](https://storage.googleapis.com/zenn-user-upload/7ef9ab1c414a-20220425.png)

プロジェクトの作成が終わったら、歯車のアイコンからプロジェクトの設定画面を開いて**プロジェクト ID**を確認します。また「デフォルトの GCP リソース ロケーション」も設定しておきましょう。asia-northeast1 が東京、asia-northeast2 が大阪です。

![](https://storage.googleapis.com/zenn-user-upload/b9c341ce3a8fe083eefad5fd.png)

また 2022/4 現在、Cloud Functions for Firebase の利用には Blaze(従量課金)プランである事が必須になっているので、「アップグレード」のリンクを開き[料金プラン](https://firebase.google.com/pricing?hl=ja)を Spark(無料プラン)から Blaze(従量制プラン)へ変更しましょう。

なお Blaze であっても無料枠内の利用に収まっていれば請求は発生しません。例えば functions であれば[月に 200 万回の呼び出しまでは無料](https://cloud.google.com/functions/pricing#free_tier)です。ホビー用途であれば基本的には無料枠に収まるでしょう。料金の詳細については Firebase 公式を確認してください。

![](https://storage.googleapis.com/zenn-user-upload/b2093455335057d87734c41d.png)

請求先情報の選択(無ければ新規作成)を求められるので選択します。

![](https://storage.googleapis.com/zenn-user-upload/2d96f3ab123a58cbad541a8a.png)

なお歯車アイコンから「使用量と請求額」へ移動した「詳細と設定」タブから[予算アラート](https://cloud.google.com/billing/docs/how-to/budgets?hl=ja&visit_id=637598634836275533-894077033&rd=1)の設定へ移動する事ができます。意図しない請求を防ぐため規定額を越えた時にアラートが飛ぶよう設定しておくとよいでしょう。

![](https://storage.googleapis.com/zenn-user-upload/14bb3c5c0c3ab05875f16294.png)

![](https://storage.googleapis.com/zenn-user-upload/50ab04b6573d2efc23511515.png)

Blaze プランの設定が終わったら続けて下記のファイルを作成します。

```shell:.envrc
dotenv
```

```shell:.env
XDG_CONFIG_HOME=.config
```

デフォルトでは Firebase CLI はログイン情報などを Mac ユーザーのホームディレクトリの.config へ保存しますが、これを`XDG_CONFIG_HOME`という環境変数でプロジェクトディレクトリの.config へ個別に保存するよう変更しています。続けて CLI から`helloworld-app`ディレクトリへ移動し

```shell
direnv: error .envrc is blocked. Run `direnv allow` to approve its content.
```

というメッセージが表示されたら下記を実行して.envrc の読み込みを許可しましょう。

```shell
direnv allow
```

またプロジェクトディレクトリの.config や.env がバージョン管理されないよう.gitignore には下記を追加しておきましょう。

```diff gitignore:.gitignore
# typescript
*.tsbuildinfo

+# Firebase
+.firebase/
+
+# XDG Base Directory
+.config
+
+# env
+.env
+
```

次に以下を実行します

```shell
npm install firebase-functions
npm install --save-dev firebase-tools
npx firebase login
```

エラーレポートの送信可否を問われるので yes か no か自由に返答しましょう。途中でブラウザが起動しアカウント選択を促されるので、Firebase プロジェクトを作成するのに使用した Google アカウントを選択しましょう。ログインに成功するとブラウザとコンソールにはそれぞれ下記のように表示されます。

![](https://storage.googleapis.com/zenn-user-upload/36307c243e15-20220425.png)

```shell
✔  Success! Logged in as {選択したアカウントの名前}
```

ログインに成功すると.config ディレクトリへログイン情報が保存されますが、gitignore によってそれらがバージョン管理対象から外れている事を確認しておきましょう。問題なければセットアップを続けます。

```shell
npx firebase init
```

![](https://storage.googleapis.com/zenn-user-upload/6ca8a7c90491-20220425.png)

利用する機能では`Functions`と`Hosting: Configure files...`にチェックを入れて Enter

![](https://storage.googleapis.com/zenn-user-upload/2e2950db514c-20220425.png)

デフォルトプロジェクトの設定では`Use an existing project`を選択して Enter

![](https://storage.googleapis.com/zenn-user-upload/2000673c1ea1-20220425.png)

先ほどブラウザ操作で作っておいたプロジェクトが表示されるので選択して Enter

:::message
.firebaserc へデフォルトプロジェクトの`プロジェクトID`が保存されます。サンプルコードでは`helloworld-dbb3c`という本書用のプロジェクトが設定されていますが自身のプロジェクト ID に読み替えてください
:::

![](https://storage.googleapis.com/zenn-user-upload/5b7af4c16077-20220425.png)

利用言語は TypeScript を選択して Enter

![](https://storage.googleapis.com/zenn-user-upload/750df83b2c23-20220425.png)

ESLint 利用は n で Enter

![](https://storage.googleapis.com/zenn-user-upload/27e932afa43c-20220425.png)

依存ライブラリのインストール可否は n で Enter

![](https://storage.googleapis.com/zenn-user-upload/4e6b383cc4e5-20220425.png)

公開ディレクトリは public ディレクトリのまま Enter

![](https://storage.googleapis.com/zenn-user-upload/06533cb28c1e-20220425.png)

全てのリクエストを index.html で受ける(リライトする)かを聞かれるので Y で Enter

![](https://storage.googleapis.com/zenn-user-upload/3eb48e6a4d57-20220425.png)

Github からのデプロイ設定は N で Enter。

以上で init による初期設定は終了です。Cloud Functions 用に`functions`というディレクトリが、Hosting 用に`public/index.html`というファイルが生成されますが今回は不要なので両方とも削除しておきます。

それでは次に Cloud Functions 用のエントリーポイントを準備しましょう。

```ts:firebaseFunctions.ts
import * as functions from 'firebase-functions'
import next from 'next'

const nextjsServer = next({
  dev: false,
  conf: {
    distDir: '.next',
    future: {},
    experimental: {},
  },
})
const nextjsHandle = nextjsServer.getRequestHandler()

// @see https://firebase.google.com/docs/hosting/full-config?hl=ja#rewrite-functions
const fn = functions.region('us-central1')

export const nextjsFunc = fn.https.onRequest(async (req, res) => {
  await nextjsServer.prepare()
  return nextjsHandle(req, res)
})

```

:::message
Firebase のデフォルトリソースロケーションでは asia-northeast1 等を設定していたのに、ここでは us-central1 を指定している事を不思議に思うかもしれませんが、これは 2022/4 現在**Firebase Hosting は、us-central1 でのみ Cloud Functions をサポート**しているためです。
:::

firebase.json を編集し、functions のデプロイ時前処理として tsc コマンドで`firebaseFunctions.ts`から`firebaseFunctions.js`を生成するよう、hosting において全てのリクエストを index.html ではなく nextjsFunc で受けるよう設定します。なおエントリーポイントの設定自体は package.json の main ディレクティブにあります。

```diff json:firebase.json
{
  "functions": {
+    "runtime": "nodejs16",
+    "source": ".",
    "predeploy": [
      "npm --prefix \"$RESOURCE_DIR\" run build",
+      "npx tsc --skipLibCheck firebaseFunctions.ts"
    ]
  },
  "hosting": {
    "public": "public",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [
      {
        "source": "**",
-	"destination": "/index.html"
+        "function": "nextjsFunc"
      }
    ]
  }
}

```

合わせて package.json に`main`ディレクティブを追加し`firebaseFunctions.js`がエントリーポイントになるよう設定します。また firebase へのデプロイ用に npm スクリプトとして`deploy`コマンドを追加しておきましょう。

```diff json:package.json
{
  "name": "helloworld-app",
  "version": "0.1.0",
  "private": true,
+  "main": "firebaseFunctions.js",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
+    "deploy": "firebase deploy --only functions,hosting"
  },
```

ここまでの準備が終わったら一度デプロイします。

```
npm run deploy
```

デプロイが終わったら[ブラウザコンソール](https://console.firebase.google.com/)から functions のホスト名を確認しましょう。

![](https://storage.googleapis.com/zenn-user-upload/0f5e1718ce34-20220425.png)

`https://${regionName}-${projectId}.cloudfunctions.net/nextjsFunc`

という形式になっている URL の最後に`/api/status/getStatus?id=1`を加えてブラウザでアクセスします。

`https://us-central1-${あなたのFirebaseプロジェクトID}.cloudfunctions.net/nextjsFunc/api/status/getStatus?id=1`

![](https://storage.googleapis.com/zenn-user-upload/6de7f4dbfce9-20220425.png)

API へのアクセスで開発環境と同様の json を表示できる事が確認できたら、nextjsFunc の利用可能メモリ量を 256MB から 512MB へ引き上げておきましょう。

![](https://storage.googleapis.com/zenn-user-upload/77e2b01fba79-20220426.png)

「使用状況の詳細な統計情報」をクリックして Firebase Functions のコンソールから、実体である GCP の Cloud Functions のコンソールへ移動したら「編集」をクリック

![](https://storage.googleapis.com/zenn-user-upload/796fa6a0be86-20220426.png)

「ランタイム、ビルド、接続、セキュリティの設定」をクリックで開き「割り当てられるメモリ」を変更してデプロイします。

![](https://storage.googleapis.com/zenn-user-upload/42bb619bc085-20220426.png)

メモリ設定の変更が終わったらページコンポーネントで fetch する API のホスト名を localhost から差し替えてもう一度デプロイしましょう。

```diff ts:pages/statuses/[id].tsx
  const res = await fetch(
-    `http://localhost:3000/api/status/getStatus?id=${context.query.id}`
+    `https://us-central1-${あなたのFirebaseプロジェクトID}.cloudfunctions.net/nextjsFunc/api/status/getStatus?id=${context.query.id}`
  )
```

```diff ts:pages/index.tsx
  const res = await fetch(
-      `http://localhost:3000/api/status/listStatuses`
+      `https://us-central1-${あなたのFirebaseプロジェクトID}.cloudfunctions.net/nextjsFunc/api/status/listStatuses`
  )
```

```
npm run deploy
```

今度は API ではなくページコンポーネントの表示を確認します。

`https://us-central1-${あなたのFirebaseプロジェクトID}.cloudfunctions.net/nextjsFunc/statuses/1`

![](https://storage.googleapis.com/zenn-user-upload/b7d9a4dc8347-20220425.png)

functions のインスタンスが無い状態での初回アクセスは**コールドスタート**と呼ばれ、functions インスタンスの初期セットアップ([依存関係の解決](https://medium.com/@duhroach/improving-cloud-function-cold-start-time-2eb6f5700f6)なども含まれる)から始まるため通常のアクセス時と比べ処理時間がとても長くなります。これが問題になる用途ではキャッシュと組み合わせたり、[インスタンスを常駐させる](https://firebase.google.com/docs/functions/tips?hl=ja#min)といった対策が必要になります。

- [このセクションのサンプルコード](https://github.com/oubakiou/100perts/tree/0f87bfe4ff7cd44739a286d8d881bd358af92d6d/v0.1.1/helloworld-app)
- [前回との差分](https://github.com/oubakiou/100perts/compare/49ed0b00ae9460e4ab4f7f63a7f7da342f41e281...0f87bfe4ff7cd44739a286d8d881bd358af92d6d)

# 環境変数を使ってアプリケーションの外から設定を注入してみよう

Next.js では.env ファイルによる[環境変数](https://nextjs.org/docs/basic-features/environment-variables)という仕組みを使うことで、アプリケーションの外から設定を注入する事ができます。また Firebase Function においても同様に[環境変数](https://firebase.google.com/docs/functions/config-env?hl=ja#env-variables)がサポートされています。先ほどのセクションでハードコーディングしていた API のリクエスト先について、これらを利用して設定してみましょう。

```diff ts:pages/statuses/[id].tsx
const res = await fetch(
  `${process.env.API_ROOT}/api/status/getStatus?id=${context.query.id}`
)
```

```diff ts:pages/index.tsx
const res = await fetch(`${process.env.API_ROOT}/api/status/listStatuses`)
```

Node.js で動くプログラム内からは`process.env`で設定した環境変数にアクセスする事ができます。

:::message
Node.js 上(サーバーサイド)ではなくブラウザ上(クライアントサイド)で動くプログラムの場合通常は環境変数にアクセスする事ができません。しかし Next.js には`NEXT_PUBLIC_`から始まる名前の環境変数についてはブラウザ上からもアクセス出来るようにしてくれる仕組みがあります。

ただしクライアントサイドのプログラムから環境変数を扱えるという事は、ユーザーがその気になればその値を見ることが出来るという事でもあります。意図せず秘匿情報をクライアントサイドへ公開しないよう注意しましょう。
:::

続けて開発環境用に.env ファイルへ API_ROOT という環境変数を追加します。

```diff shell:.env
XDG_CONFIG_HOME=.config
+API_ROOT=https://us-central1-{あなたのFirebaseプロジェクトID}.cloudfunctions.net/nextjsFunc
```

:::message
.env を変更した後は、ディレクトリ移動または下記で direnv による環境変数の再読み込みをしておきましょう

```shell
direnv reload
```

:::

変更と再デプロイが終わったら以前にメモリ設定を変更した画面で、nextjsFunc に設定されている環境変数を確認してみましょう。

![](https://storage.googleapis.com/zenn-user-upload/7dd082f69e9f-20220426.png)

これでどちらの環境でも.env の API_ROOT を利用できるようなりました。チーム開発であれば『開発環境では手元の.env を利用し、デプロイ時には本番環境用の.env を新たに生成して使う』といった運用も考えられますが個人開発であればより簡易な運用でも良いでしょう。

今回は`.env`とは別に`.env.{あなたのFirebaseプロジェクトID}`を作る事で環境毎の設定を切り替えます。

```diff shell:.env
XDG_CONFIG_HOME=.config
API_ROOT=http://localhost:3000/
```

.env を開発環境用に

```diff shell:.env.{あなたのFirebaseプロジェクトID}
API_ROOT=https://us-central1-{あなたのFirebaseプロジェクトID}.cloudfunctions.net/nextjsFunc
```

.env.{あなたの Firebase プロジェクト ID}を本番環境用に使い

```diff shell:.gitignore
-.env
+.env*
```

.gitignore では.env で始まる全てのファイルがバージョン管理対象外になるよう設定しましょう。

![](https://storage.googleapis.com/zenn-user-upload/f7ddbfea3cc6-20220426.png)

デプロイ時にこのように表示されていれば成功です。`.env`と`.env.{あなたのFirebaseプロジェクトID}`の両方が読み込まれていますがプロジェクト ID が入ったファイルの内容が優先されます。

- [このセクションのサンプルコード](https://github.com/oubakiou/100perts/tree/6cb2145a74f4d82b0cd6dc844bd7c8487d5eca48/v0.1.1/helloworld-app)
- [前回との差分](https://github.com/oubakiou/100perts/compare/0f87bfe4ff7cd44739a286d8d881bd358af92d6d...6cb2145a74f4d82b0cd6dc844bd7c8487d5eca48)

# Firebase Hosting の設定をしてみよう

本書では HTML やスタイルといったファイルは functions が動的に配信し、例えばロゴ画像のような静的なファイルの配信は functions の前段にある Firebase Hosting が担う構成になっています。先ずは Firebase Hosting のブラウザコンソールを確認してみましょう。

![](https://storage.googleapis.com/zenn-user-upload/544f0b412a75-20220427.png)

初期状態では Firebase プロジェクト ID を元に生成されたドメインが自動で割り振られていますが、[Google Domain](https://domains.google/intl/ja_jp/)などで取得した独自ドメインを設定する事もできます。

![](https://storage.googleapis.com/zenn-user-upload/490e870da103-20220427.png)

リリース履歴として一覧表示されているように、Firebase Hosting ではデプロイが発生するたびに古いバージョンのコンテンツをバックアップとして保存するようになっています。デプロイによって何らかの問題が発生した時などに、このバックアップからロールバック(巻き戻し)を行う事もできますが、ストレージ容量の節約をしたい場合は「ストレージのリリースに関する設定」から保存する世代数を有限へ変更しておきましょう。

![](https://storage.googleapis.com/zenn-user-upload/74a55f874d5ff5c4d9f2e4a9.png)

それでは自分のプロジェクトの Firebase Hosting へ割り振られているドメインへ、実際にアクセスしてみましょう。

![](https://storage.googleapis.com/zenn-user-upload/8a0433605cd5-20220427.png)

問題なく表示される事を確認したら、最後に stale-while-revalidate による Firebase Hosting でのキャッシュ設定を行いましょう。

:::message
このセクションで紹介している stale-while-revalidate ディレクティブに関する挙動については[Firebase Hosting の公式ドキュメント](https://firebase.google.com/docs/hosting/manage-cache?hl=ja)での言及がないため、将来的に予告なく挙動が変更される可能性が考えられます。なお Firebase と同じく Google が提供している GCP の CDN サービスである[Cloud CDN](https://cloud.google.com/cdn/docs/serving-stale-content?hl=ja)ではドキュメントに記載されています。
:::

```diff ts:pages/statuses/[id].tsx
  if (!isStatus(statusData)) {
    return { notFound: true }
  }
+
+  const m = 60
+  const h = 60 * m
+  const d = 24 * h
+  context.res.setHeader(
+    'Cache-Control',
+    `public, s-maxage=${10 * m}, stale-while-revalidate=${30 * d}`
+  )

  return { props: { status: statusData } }
```

getServerSideProps の context からレスポンスヘッダを設定します。またここで設定しているものは[キャッシュコントロールヘッダ](https://developer.mozilla.org/ja/docs/Web/HTTP/Headers/Cache-Control)と呼ばれているものです。

:::details コラム：もっとくわしく。SWR(stale-while-revalidate)とは？

SWR は端的に言えばキャッシュ戦略に関する[標準化された手法](https://datatracker.ietf.org/doc/html/rfc5861)の一つです。ブラウザの世界では[Chrome](https://www.chromestatus.com/feature/5050913014153216)などが実装していますが、CDN の世界でもいくつかのサービスで利用可能です。なお Next.js の開発元である Vercel 社が開発している[vercel/swr](https://github.com/vercel/swr)という SWR 方式を採用した同名ライブラリもありますが直接の関係はありません。

### s-maxage

s-maxage ディレクティブは、CDN やプロキシのような共有キャッシュ(今回の例で言えば Firebase Hosting)においてキャッシュが新鮮であると無条件で信用する秒数の設定です。

仮に s-maxage を 600 秒に設定した場合は、CDN 上に一度作られたキャッシュは 600 秒間は無条件で信用され使用されます。その間は CDN からバックエンド(今回の例で言えば functions)にアクセスしないため高速に配信できバックエンドの負荷も減る反面、バックエンドのオリジナルコンテンツに変更や削除があったとしても過去にキャッシュされている古い内容がそのまま返るという事でもあります。そして 600 秒を経過するとキャッシュは古くなった(stale)と見なされ破棄され、CDN はバックエンドから再び最新のコンテンツを取得しキャッシュする事になります。

1. キャッシュ作成から 600 秒までは無条件にキャッシュから高速に返す
2. 600 秒以降アクセスがあった場合は既にキャッシュが破棄されているので、バックエンドから同期的に最新のコンテンツを取得し(キャッシュから返すよりは)低速に返す。またキャッシュを再検証(再生成)する

stale-while-revalidate が併用されている場合はこの 600 秒経過後の動作が変わります。

### stale-while-revalidate

仮に s-maxage が 600 秒かつ、stale-while-revalidate が 1000 秒に設定されている場合

1. キャッシュ作成から 600 秒までは無条件にキャッシュから高速に返す
2. 600 秒から 1600 秒の間にアクセスがあった場合はとりあえず古くなっているキャッシュを高速に返すが、非同期にバックエンドから最新のコンテンツを取得しキャッシュを再検証(再生成)する
3. 1600 秒以降に初めてアクセスがあった場合は既にキャッシュが破棄されているので、バックエンドから同期的に最新のコンテンツを取得し(キャッシュから返すよりは)低速に返す。またキャッシュを再検証(再生成)する

という挙動になります。バックエンドへのアクセス回数や負荷という点では stale-while-revalidate 自体にメリットはありませんが、クライアントに対して常に高速にコンテンツを返せるという点がメリットです。

revalidate のトリガーとなるアクセスで 1 度は古いコンテンツがクライアントに渡ってしまう可能性がある、というデメリットを許容できるかどうか、あるいは設定秒数の長さなどはそのページの特性や扱っているビジネスによっても変わってくるでしょう。

:::

```
npm run deploy
```

再デプロイが終わったら Firebase Hosting の URL にアクセスし、デベロッパーツールなどでレスポンスヘッダを確認してみましょう。

```diff txt:Response Headers
- cache-control: private, no-cache, no-store, max-age=0, must-revalidate
- x-cache: MISS
+ cache-control: public, s-maxage=600, stale-while-revalidate=2592000
+ x-cache: HIT
```

cache-control に設定した内容は反映されているでしょうか。なお Firebase Hosting の場合はレスポンスヘッダ内の x-cache ヘッダ(独自仕様のため将来的に Cache-Status ヘッダへ変更される可能性があります)によってキャッシュにヒットしたかどうかを教えてくれます。

- [このセクションのサンプルコード](https://github.com/oubakiou/100perts/tree/d2bfed244ba113abfb215cf921a7660ccb31bc82/v0.1.1/helloworld-app)
- [前回との差分](https://github.com/oubakiou/100perts/compare/6cb2145a74f4d82b0cd6dc844bd7c8487d5eca48...d2bfed244ba113abfb215cf921a7660ccb31bc82)
