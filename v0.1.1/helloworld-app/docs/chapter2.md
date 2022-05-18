# 静的なページから始めよう

先ずはデプロイ(ビルド)時にページ内容が静的に固定されるシンプルなアプリケーションから始めましょう。

本当の意味で静的なページだけで良いのであれば[Next.js の export コマンド](https://nextjs.org/docs/advanced-features/static-html-export)によって事前生成された HTML 等のファイルを配信するだけで良いのですが、我々の作るアプリケーションは最終的には SNS になるので何らかの形で動的ページを扱う必要があります。

そこで本書では段階的にアプリケーションの改築を進め、最終段階では SSR(リクエスト時サーバーサイドレンダリング)を基本としつつも[SWR(Stale-While-Revalidate)](https://datatracker.ietf.org/doc/html/rfc5861)対応の CDN を組み合わせる事で高パフォーマンスの実現を目指します。SWR 方式については第 4 章で詳しく触れますが「先ずはキャッシュをユーザーへ返し、その裏側で自動的にリモートの最新データをチェックしてユーザーへ改めて返す方式」という理解で今は大丈夫です。

:::details コラム：SSR? SG? Next.js のページ生成方式はどれを選べばいい？

https://zenn.dev/oubakiou/articles/f99252249837de

:::

# 事前に準備しておくもの

本書では下記が事前にインストールされているものとしますが、手に馴染んだ代替ソフトウェアがあるのであれば必ずしも下記構成に従う必要はありません。また併記のバージョンは本書で動作確認を行ったバージョンですがこれについても必ずしも一致させる必要はありません。

### [macOS](https://www.apple.com/jp/macos/) Intel Mac+MacOS v12.3.1

本書では開発環境として Intel Mac+macOS を想定しています。

### [Google Chrome](https://www.google.com/intl/ja_jp/chrome/) v100

本書では開発および動作確認に利用するブラウザとして Chrome を想定します。

### [React Developer Tools](https://chrome.google.com/webstore/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi?hl=ja) v4.24.3

React コンポーネントのインスペクションやプロファイルが出来る Chrome 向け拡張機能です。

### [Node.js](https://nodejs.org/ja/download/) v16.14.2

本書では JavaScript 実行環境として Node.js が既にインストールされているものとします。インストール方法は問いませんので好きな方法でインストールしてください。

### npm / npx v8.5.0

JavaScript 向けパッケージマネージャの npm および npx が既にインストールされているものとします。通常はどちらも Node.js に同梱されているため Node.js をインストールした時点で特に意識していなくても利用可能になっています。

### [direnv](https://github.com/direnv/direnv/blob/master/docs/installation.md) v2.30.3

ディレクトリ単位での環境変数管理ツールとして direnv が既にインストールされているものとします。

### [Visual Studio Code](https://azure.microsoft.com/ja-jp/products/visual-studio-code/) v1.66.0

本書では開発環境として VSCode を想定します。

### [vscode/dbaeumer.vscode-eslint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) v2.2.2

コードを解析して不適切な箇所があれば教えてくれる linter(ESLint)を VSCode から利用するための拡張機能です。

### [vscode/esbenp.prettier-vscode](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode) v9.5.0

コードを綺麗に整形してくれる formatter(Prettier)を VSCode から利用するための拡張機能です。

### [vscode/GraphQL.vscode-graphql](https://marketplace.visualstudio.com/items?itemName=GraphQL.vscode-graphql) v0.3.53

GraphQL のシンタックスハイライトや入力補完などを提供する拡張機能です。

### [vscode/prisma.prisma](https://marketplace.visualstudio.com/items?itemname=prisma.prisma) v3.11.0

Prisma で扱う Prisma Schema Language（PSL）のシンタックスハイライトなどを提供する拡張機能です。

### [MySQL Workbench](https://dev.mysql.com/downloads/workbench/) v8.0.29

本書では MySQL の動作確認のために MySQL Workbench を使う事がありますが、CUI での操作や他のソフトウェアで代用しても構いません。

### [Docker Desktop](https://www.docker.com/products/docker-desktop) v4.6.1

本書では何らかの Docker コンテナの実行環境が既にインストールされているものとします。

:::details コラム：コンテナ技術、例えば Docker を利用するべきか？

[Docker(Docker Engine)](https://www.docker.com/)はコンテナという単位で仮想環境を構築したり実行したりできる製品です。コンテナ仮想化はマシン単位で仮想化する旧来方式と比べて軽量で起動も速く、Dockerfile によるイメージの作成や共有が容易などの特徴から利用が広まりました。本書で扱うような開発環境の構築においても Docker を利用すると、マシン本体の環境を汚さずに隔離されたコンテナの中で作業が完結できたり、異なるマシン間や異なる OS 間での環境再現が容易といったメリットがあります。

その一方で macOS において Docker を利用する場合は[ファイルアクセスの性能があまり良くなく](https://github.com/docker/for-mac/issues/77)、頻繁なファイルアクセスが必要な用途では開発体験が悪化する場合があります。このため本書では基本的には Docker を利用していませんが、開発環境用の MySQL では利用しています。また下巻 CI(Continuous Integration)の章でも触れる予定です。

:::

# create-next-app を実行してアプリケーションの土台を生成しよう

[create-next-app](https://nextjs.org/docs/api-reference/create-next-app)は Next.js アプリケーションの土台を生成するオフィシャルな CLI ツールです。それではさっそく好きな作業ディレクトリで下記を実行してみましょう。

```shell
npx -y create-next-app@latest --use-npm --ts helloworld-app
```

:::message
@latest の指定が無いと挙動が変わるため注意しましょう
:::

コマンドの実行が正常に終わると`helloworld-app`という名前のディレクトリが作成され、またその中には Next.js を利用したアプリケーションの土台が作成されています。

npx コマンドは JavaScript 製 CLI ツール(この例では create-next-app)を実行するための便利なコマンドです。マシンにインストールされていないリモートパッケージの CLI ツールを実行しようとした場合、npx がパッケージの一時的なインストールの確認を求めてきますが`-y`オプションを指定する事でこれをスキップしています。

なお今回は利用しませんが create-next-app に`--example`を指定する事で[公式 example](https://github.com/vercel/next.js/tree/master/examples)からアプリケーションの土台となる雛形を選択する事もできます。

- [このセクションのサンプルコード](https://github.com/oubakiou/100perts/tree/26f5a375fe822235ab740b46171b673a7ff8125b/v0.1.1)

# TypeScript で書く準備をしよう

Next.js には[ESLint の標準サポート](https://nextjs.org/docs/basic-features/eslint)が含まれていますが、TypeScript のための ESLint プラグインと Prettier(フォーマッター)を追加でインストールしましょう。

```shell
cd helloworld-app
npm install --save-dev @typescript-eslint/eslint-plugin prettier eslint-config-prettier
```

:::message
VSCode 拡張の esbenp.prettier-vscode には prettier 本体も同梱されていますが、VSCode からだけではなく CLI からも実行可能なよう別途 prettier を追加しています
:::

実行が終わると`node_modules`ディレクトリにパッケージの実体が保存され package.json の devDependencies へその構成情報が保存されます。

また ESLint の設定ファイルを下記のように修正しましょう。

```diff json:helloworld-app/.eslintrc.json
{
  "extends": [
    "next/core-web-vitals",
+    "plugin:@typescript-eslint/recommended",
+    "prettier"
  ]
}
```

続けて Prettier の設定ファイルとして下記を作成します

```json:helloworld-app/.prettierrc.json
{
  "singleQuote": true,
  "semi": false
}
```

(本書では Next.js の[.prettierrc.json](https://github.com/vercel/next.js/blob/master/.prettierrc.json)を下敷きにしていますが、あなたの好みやチームの規約に応じて修正を行っても問題ありません)

ファイル保存時に実行するデフォルトフォーマッターが Prettier になるよう、また

- このワークスペースの node_modules にインストールした TypeScript を利用する
- 相対パスではなく絶対パスで auto import(import 文の自動追加)する

よう VSCode のワークスペース(プロジェクト)設定として下記を作成しましょう。

```json:helloworld-app/.vscode/settings.json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode" ,
  "[typescript]": { "editor.defaultFormatter": "esbenp.prettier-vscode" },
  "[typescriptreact]": { "editor.defaultFormatter": "esbenp.prettier-vscode" },
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "./node_modules/typescript/lib",
  "typescript.preferences.importModuleSpecifier": "non-relative"
}
```

最後に tsconfig.json(TypeScript の設定ファイル)を開き、今後作成していくコンポーネントの import 文が書きやすくなるよう[パスエイリアス](https://nextjs.org/docs/advanced-features/module-path-aliases)の設定も追加しておきましょう。

```diff json:helloworld-app/tsconfig.json
{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
+    "baseUrl": ".",
+    "paths": {
+      "@/*": ["components/*"]
+    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules"]
}
```

一通り設定ファイルの作成が終わったら Next.js の開発環境を起動します。

```shell
npm run dev
```

`npm run`はそのプロジェクトの[package.json の scripts](https://github.com/oubakiou/100perts/blob/2eae595b643e1f409ca884dcf914f12a78b51b18/v0.1.1/helloworld-app/package.json#L6)内で定義された処理を実行するコマンドですが、Next.js では`npm run dev`で開発環境が起動するよう最初から定義されています。

それではブラウザから Next.js の開発環境へアクセスして動作しているか確認してみましょう。ブラウザのアドレス欄に[localhost:3000](http://localhost:3000/)と入力します。

![](https://storage.googleapis.com/zenn-user-upload/1b37dfe4a0a1-20220406.png)

Next.js のウェルカムページが表示されたでしょうか。

- [このセクションのサンプルコード](https://github.com/oubakiou/100perts/tree/2eae595b643e1f409ca884dcf914f12a78b51b18/v0.1.1)
- [前回との差分](https://github.com/oubakiou/100perts/compare/26f5a375fe822235ab740b46171b673a7ff8125b...2eae595b643e1f409ca884dcf914f12a78b51b18)

# React Developer Tools を使ってみよう

React Developer Tools の動作も確認しておきましょう。`F12`キー等でデベロッパーツールを表示すると`Components`と[Profiler](https://ja.reactjs.org/blog/2018/09/10/introducing-the-react-profiler.html)という 2 つのタブが追加されているはずです。

![](https://storage.googleapis.com/zenn-user-upload/84fb698ab80d-20220408.png)

Components タブではブラウザ標準のデベロッパーツールで DOM 要素をインスペクションするのと同様の操作で、React コンポーネントをインスペクションする事ができます。

![](https://storage.googleapis.com/zenn-user-upload/5ed883d11d8e-20220408.png)

この例では[next/image コンポーネント](https://nextjs.org/docs/api-reference/next/image)で表示されているロゴ画像をインスペクションし、その[props(React コンポーネントが受け取る引数)](https://ja.reactjs.org/docs/components-and-props.html)などを表示しています。

また React Developer Tools の設定で`Highlight updates when components render.`にチェックを入れるとコンポーネントの再レンダリング発生時にハイライト表示をしてくれます。なお青色でのハイライトは最も低頻度、赤色でのハイライトは最も高頻度な再レンダリングの発生を意味しています。

![](https://storage.googleapis.com/zenn-user-upload/0d05d38f840e-20220408.png)

# Next.js を触ってみよう

ウェルカムページを少し触ってみましょう。`pages/index.tsx`をエディタで開きます。

```tsx:helloworld-app/pages/index.tsx
import type { NextPage } from 'next'
import Head from 'next/head'
import Image from 'next/image'
import styles from '../styles/Home.module.css'

const Home: NextPage = () => {
  return (
    <div className={styles.container}>
      <Head>
        <title>Create Next App</title>
        <meta name="description" content="Generated by create next app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>
          Welcome to <a href="https://nextjs.org">Next.js!</a>
        </h1>

        {/*中略*/}

      </main>

      {/*中略*/}

    </div>
  )
}

export default Home
```

Next.js では pages ディレクトリに配置した React コンポーネント(本書ではページコンポーネントと呼称します)と URL とを自動で対応させるファイルベースのルーターが提供されているため、`/`というパスに対してブラウザ等からのアクセスがあるとこの`pages/index.tsx`に定義されたページコンポーネントが表示される事になります。

この index.tsx では`Home`という`NextPage`型の変数に[アロー関数](https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Functions/Arrow_functions)を代入し、最後にその Home 変数を export(外部公開)しています。アロー関数が return しているものは一見すると見慣れた HTML タグに見えるかもしれませんが、例えば`<Head>...</Head>`という大文字で始まるタグは import 文が指し示すよう実際には[next/head](https://nextjs.org/docs/api-reference/next/head)という React コンポーネントです。

またこの`Home`コンポーネントのように関数で表現された React コンポーネントは関数コンポーネント(function component)、クラスで表現された React コンポーネントはクラスコンポーネントと呼ばれます。本書では原則として前者の関数コンポーネントのみを扱います。

それでは`Head`の中のページタイトルと`<main>`の中の見出し文を下記のように変更してみましょう。

```diff tsx:helloworld-app/pages/index.tsx
      <Head>
-        <title>Create Next App</title>
+        <title>出来る100%TypeScript</title>
        <meta name="description" content="Generated by create next app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>
-          Welcome to <a href="https://nextjs.org">Next.js!</a>
+          作って学ぶNext.js + GraphQL + Prisma
        </h1>
```

エディタからコンポーネントの変更を保存すると[Fast Refresh](https://nextjs.org/docs/basic-features/fast-refresh)と呼ばれる開発者向け機能によってブラウザ上にも自動で変更が反映されます。

![](https://storage.googleapis.com/zenn-user-upload/96ec7d4fd604-20220408.png)

最後に、以前のセクションで設定した formatter と linter の動作確認をしておきましょう。先ほどの index.tsx へ下記のように入力します。

```diff tsx:helloworld-app/pages/index.tsx
const Home: NextPage = () => {
+  const test = "hello";
  return (
```

続けて`cmd+s`などでファイルに保存します。

![](https://storage.googleapis.com/zenn-user-upload/11ef3ef77e6a-20220408.png)

.prettierrc.json に指定した通り自動で

- `"hello"`から`'hello'`への変換
- 行末の`;`の削除

が行われていれば formatter の設定は成功です。また黄線表示されている変数`test`にマウスオーバーしてみましょう。

![](https://storage.googleapis.com/zenn-user-upload/4cfa4d6e6dde-20220408.png)

[@typescript-eslint/no-unused-vars](https://github.com/typescript-eslint/typescript-eslint/blob/main/packages/eslint-plugin/docs/rules/no-unused-vars.md)という注意メッセージが表示されていれば ESLint の TypeScript 向けプラグインの設定も成功です。

続けて下記のように修正します。

```diff tsx:helloworld-app/pages/index.tsx
      <main className={styles.main}>
+        <img src="test" />
        <h1 className={styles.title}>作って学ぶNext.js + GraphQL + Prisma</h1>
```

保存が終わったら黄線表示されている`<img src="test" />`にマウスオーバーしてみましょう。

![](https://storage.googleapis.com/zenn-user-upload/5ed69b9fd08a-20220408.png)

今回は二つの注意メッセージが表示されています。一つ目は Next.js 組み込み Lint ルールの[no-img-element](https://nextjs.org/docs/messages/no-img-element)で、二つ目は[アクセシビリティ](https://ja.wikipedia.org/wiki/%E3%82%A2%E3%82%AF%E3%82%BB%E3%82%B7%E3%83%93%E3%83%AA%E3%83%86%E3%82%A3)に関する Lint ルールの[alt-text](https://github.com/jsx-eslint/eslint-plugin-jsx-a11y/blob/main/docs/rules/alt-text.md)です。こういった注意メッセージに気を付け対処していく事で潜在的なバグを防いだり、ページの表示速度などパフォーマンスが向上したり、あるいは様々な人が使いやすいページになるといった効果があります。

なお同様の事を CLI から実行したい場合には下記のように実行します。

```shell
npm run lint
```

![](https://storage.googleapis.com/zenn-user-upload/72311350fcc1-20220408.png)

エディタ上と同様に 3 つの注意メッセージが表示されたでしょうか。

- [このセクションのサンプルコード](https://github.com/oubakiou/100perts/tree/b5200a339d7efa5b258642d6e56283ebfc7562a8/v0.1.1)
- [前回との差分](https://github.com/oubakiou/100perts/compare/2eae595b643e1f409ca884dcf914f12a78b51b18...b5200a339d7efa5b258642d6e56283ebfc7562a8)
