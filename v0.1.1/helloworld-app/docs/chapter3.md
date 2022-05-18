# 動的なパスを持ったページを作ってみよう

`pages`の下に新しく`statuses`というディレクトリを作り、その中に`[id].tsx`という名前で下記のファイルを作ります。

```tsx:pages/statuses/[id].tsx
import type { NextPage } from 'next'
import { useRouter } from 'next/router'

const StatusPage: NextPage = () => {
  const router = useRouter()
  const { id, lang } = router.query

  return (
    <p>
      このページのIDは{id}で言語は{lang}です
    </p>
  )
}

export default StatusPage

```

保存できたら[http://localhost:3000/statuses/1?lang=ja](http://localhost:3000/statuses/1?lang=ja)へアクセスしてみましょう。

![](https://storage.googleapis.com/zenn-user-upload/4536399d55f0-20220411.png)

このようにページコンポーネント(pages 下に配置されたコンポーネント)のファイル名にブラケット記号`[]`で囲まれた部分がある場合はパス内変数として扱われ[next/router](https://nextjs.org/docs/api-reference/next/router)経由でクエリーの一部として取得する事が出来ます。なお今回登場した`useRouter()`のような use から始まる名前の関数は[Hook](https://ja.reactjs.org/docs/hooks-overview.html)と呼ばれているもので、これは React の関数コンポーネントにおいて状態や副作用を扱う仕組みです。

さて目ざとい人はページを表示した最初の瞬間は id 部分の表示が空になっていた事に気付いていたかもしれません。実はこの useRouter を使った処理はクライアントサイド(ブラウザ上)で実行されています。試しに JavaScript を無効化した状態でブラウザをリロードしてみましょう。

![](https://storage.googleapis.com/zenn-user-upload/a14b18cefb45-20220411.png)

これは JavaScript が実行できない BOT がこのページへアクセスした時に見ることになる光景でもあります。それでは下記のように修正してみましょう。

```tsx:pages/statuses/[id].tsx
import type {
  GetServerSidePropsContext,
  GetServerSidePropsResult,
  NextPage,
} from 'next'

// ページコンポーネントの引数の型定義
type StatusPageProps = { id: string; lang: string }

// サーバーサイドでの前処理を行う関数
export const getServerSideProps = async (
  context: GetServerSidePropsContext
): Promise<GetServerSidePropsResult<StatusPageProps>> => {
  // context経由でブラウザから送信されたパラメーターを受け取る
  const { id, lang } = context.query

  // 受け取ったパラメーターが意図した型でなければnotfoundページとして処理する
  if (typeof id !== 'string') {
    return { notFound: true }
  }
  if (typeof lang !== 'string') {
    return { notFound: true }
  }

  // 受け取ったパラメータに問題がなければStatusPagePropsを返す
  return { props: { id, lang } }
}

const StatusPage: NextPage<StatusPageProps> = (props) => {
  return (
    <p>
      このページのIDは{props.id}で言語は{props.lang}です
    </p>
  )
}

export default StatusPage

```

最初のコードとの最も大きな違いは`getServerSideProps`という名前で[Promise](https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Global_Objects/Promise)を返す[非同期関数](https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Statements/async_function)が export されている事です。詳しく見てみましょう。

```ts
// ページコンポーネントの引数の型定義
type StatusPageProps = { id: string; lang: string }

// サーバーサイドでの前処理を行う関数
export const getServerSideProps = async (
  context: GetServerSidePropsContext
): Promise<GetServerSidePropsResult<StatusPageProps>> => {
  // context経由でブラウザから送信されたパラメーターを受け取る
  const { id, lang } = context.query

  // 受け取ったパラメーターが意図した型でなければnotfoundページとして処理する
  if (typeof id !== 'string') {
    return { notFound: true }
  }
  if (typeof lang !== 'string') {
    return { notFound: true }
  }

  // 受け取ったパラメータに問題がなければStatusPagePropsを返す
  return { props: { id, lang } }
}
```

`getServerSideProps`はユーザーのリクエストに応じてサーバーサイド(Node.js)で実行されるページコンポーネントの前処理です。今回のように URL から取得したパラメーターや、あるいは外部の API などから取得したデータなど、外部から取得した情報等を元にしてページコンポーネントへ渡す props(コンポーネント引数)を組み立てる役割を持っています。(似たメソッドである[getStaticProps](https://nextjs.org/docs/basic-features/data-fetching/get-static-props)も同様にサーバーサイドでの前処理を担いますが、これはリクエスト時ではなくビルド時に処理されるという違いがあります)

また context(`GetServerSidePropsContext`型)という変数は getServerSideProps へ Next.js から渡されるもので、サーバーサイドにおいてはこの context 経由でブラウザから送信されたパラメーターなどを取得する事になります。なお

```ts
const { id, lang } = context.query
```

という書き方は[分割代入](https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Operators/Destructuring_assignment#%E3%82%AA%E3%83%96%E3%82%B8%E3%82%A7%E3%82%AF%E3%83%88%E3%81%AE%E5%88%86%E5%89%B2%E4%BB%A3%E5%85%A5)を

```ts
return { props: { id, lang } }
```

は[オブジェクトリテラルでの省略記法](https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Operators/Object_initializer#ecmascript_2015_%E3%81%A7%E3%81%AE%E6%96%B0%E3%81%97%E3%81%84%E8%A1%A8%E8%A8%98%E6%B3%95)を利用した書き方です。古い JavaScript には存在しなかった文法ですが、TypeScript から JavaScript へ変換(トランスパイル)される際に[tsconifg.json の target 設定](https://github.com/oubakiou/100perts/blob/main/v0.1.1/helloworld-app/tsconfig.json#L3)に基づいて古いブラウザでも動作するコードへ変換されます。(ただし IE など極端に古いブラウザの場合は別途対応が必要になります)

```ts:node_modules/next/types/index.d.ts
export type GetServerSidePropsResult<P> =
  | { props: P }
  | { redirect: Redirect }
  | { notFound: true }
```

`GetServerSidePropsResult<P>`は`getServerSideProps`関数が返すべき値の型です。カーソルを合わせた状態で`F12`キーを押して型定義を見ると分かるように`getServerSideProps`は

- props キーに P 型の値を持ったオブジェクト
- redirect キーに Redirect 型の値を持ったオブジェクト
- notFound キーに true を持ったオブジェクト

という 3 パターンのいずれかを返す事が想定されています。

この`<P>`というタグのようなもので囲まれている`P`は型定義で利用できる型変数です。今回の例では独自に定義した`type StatusPageProps = { id: string; lang: string }`という型を P として渡しているため`GetServerSidePropsResult<StatusPageProps>`型は最終的には下記の定義になります。

```ts
  | { props: { id: string; lang: string } }
  | { redirect: Redirect }
  | { notFound: true }
```

このように型変数を利用して定義された型を[ジェネリック型](https://www.typescriptlang.org/docs/handbook/2/generics.html)と呼んだりもします。

なおここまで紹介してきた型をまとめた`GetServerSideProps`型という便利な型も提供されているため、下記のようにより簡潔に書く事もできます。`GetServerSideProps`型の詳細については手元の型定義を見てみましょう。

```tsx:pages/statuses/[id].tsx
import type { GetServerSideProps, NextPage } from 'next'

type StatusPageProps = { id: string; lang: string }

export const getServerSideProps: GetServerSideProps<StatusPageProps> = async (
  context
) => {
  const { id, lang } = context.query

  if (typeof id !== 'string') {
    return { notFound: true }
  }
  if (typeof lang !== 'string') {
    return { notFound: true }
  }

  return { props: { id, lang } }
}

const StatusPage: NextPage<StatusPageProps> = (props) => {
  return (
    <p>
      このページのIDは{props.id}で言語は{props.lang}です
    </p>
  )
}

export default StatusPage

```

保存できたら JavaScript を無効化した状態でブラウザをリロードしてみましょう。

![](https://storage.googleapis.com/zenn-user-upload/d700adc16bc6-20220411.png)

JavaScript によるブラウザ上での処理に頼らずパラーメーターが処理できるようになった事を確認できたでしょうか。

- [このセクションのサンプルコード](https://github.com/oubakiou/100perts/tree/8d2aff0e48081b1af15e821ddb9621b187c28d8d/v0.1.1/helloworld-app)
- [前回との差分](https://github.com/oubakiou/100perts/compare/b5200a339d7efa5b258642d6e56283ebfc7562a8...8d2aff0e48081b1af15e821ddb9621b187c28d8d)

# ページタイトルを付けてみよう

せっかくなので index.tsx と同様にページタイトルも付けておきましょう。[next/head](https://nextjs.org/docs/api-reference/next/head)を使います。

```diff tsx:pages/statuses/[id].tsx
import type { GetServerSideProps, NextPage } from 'next'
+import Head from 'next/head'

type StatusPageProps = { id: string; lang: string }

export const getServerSideProps: GetServerSideProps<StatusPageProps> = async (
  context
) => {
  const { id, lang } = context.query

  if (typeof id !== 'string') {
    return { notFound: true }
  }
  if (typeof lang !== 'string') {
    return { notFound: true }
  }

  return { props: { id, lang } }
}

const StatusPage: NextPage<StatusPageProps> = (props) => {
+  const title = `このページのIDは${props.id}です`
  return (
+    <>
+      <Head>
+        <title>{title}</title>
+        <meta property="og:title" content={title} key="ogtitle" />
+      </Head>
      <p>
        このページのIDは{props.id}で言語は{props.lang}です
      </p>
+    </>
  )
}

export default StatusPage

```

title という変数では[テンプレートリテラル](https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Template_literals)を使って文字列を組み立てています。また`<>...</>`という空タグのような見た目のものは[フラグメント](https://ja.reactjs.org/docs/fragments.html)と呼ばれるものです。

React コンポーネントは最上位の要素として 1 つの親要素だけを返さなければならないというルールがあります。しかし今回の例では StatusPage コンポーネントの最上位の要素として Head と p という２つの要素を返そうとしているためそのままではルール違反になります。

こういった場合には 2 つの要素を div タグ等で包み 1 つの要素としてまとめる事もできますが、代わりにフラグメントで包む事で実際の DOM には無駄な要素を増やさずに 1 つの要素として扱わせる事が可能になります。

![](https://storage.googleapis.com/zenn-user-upload/1773a544c06e-20220414.png)

ページタイトルが表示される事を確認しておきましょう。

- [このセクションのサンプルコード](https://github.com/oubakiou/100perts/tree/63f25eceb2fb818c87d20080ddc03992a245c495/v0.1.1/helloworld-app)
- [前回との差分](https://github.com/oubakiou/100perts/compare/8d2aff0e48081b1af15e821ddb9621b187c28d8d...63f25eceb2fb818c87d20080ddc03992a245c495)

# Next.js の API Route で API を作ってみよう

Next.js には[API Route](https://nextjs.org/docs/api-routes/introduction)と呼ばれる Web API 開発のための仕組みが用意されています。次の章ではこの API Route を通じて GraphQL サーバーを提供する方法について説明しますが、その準備運動としてこの章ではハードコーディングされた JSON を返すシンプルな API を作ってみましょう。

:::message
本書では API Route を使い全てを Next.js 上に構築しますが、もちろん API サーバーを別のリポジトリへ分ける構成も可能です
:::

`pages/api`の下に`status`というディレクトリを作りその中に`getStatus.ts`という名前で下記のファイルを作ります。

```ts:pages/api/status/getStatus.ts
import { NextApiHandler } from 'next'

const handler: NextApiHandler<Response> = (req, res): void => {
  const status = statuses.find((status) => status.id === req.query.id)
  status
    ? res.status(200).json(status)
    : res.status(404).json({ message: 'not found' })
}

// レスポンス型
type Response = Failure | Success

// 失敗した場合のレスポンス型
type Failure = { message: string }

// 成功した場合のレスポンス型
type Success = Status
type Status = {
  id: string
  body: string
  author: string
  createdAt: Date
}

// ハードコーディングされたデータ
const statuses: Status[] = [
  {
    id: '2',
    body: 'inviting coworkers',
    author: 'jack',
    createdAt: new Date(2022, 1, 10),
  },
  {
    id: '1',
    body: 'just setting up my app',
    author: 'jack',
    createdAt: new Date(2022, 0, 10),
  },
]

export default handler

```

getStatus の API は指定した id の status を返すというシンプルなものです。さっそく API にアクセスしてみましょう。id が 1 のデータが JSON で表示されていれば成功です。

[http://localhost:3000/api/status/getStatus?id=1](http://localhost:3000/api/status/getStatus?id=1)

![](https://storage.googleapis.com/zenn-user-upload/2df64eed813e-20220414.png)

全ての status の一覧を返す API も作っておきます。

```ts:pages/api/status/listStatuses.ts
import { NextApiHandler } from 'next'

const handler: NextApiHandler<Response> = (req, res): void =>
  res.status(200).json(statuses)

// レスポンス型
type Response = Status[]
type Status = {
  id: string
  body: string
  author: string
  createdAt: Date
}

// ハードコーディングされたデータ
const statuses: Status[] = [
  {
    id: '2',
    body: 'inviting coworkers',
    author: 'jack',
    createdAt: new Date(2022, 1, 10),
  },
  {
    id: '1',
    body: 'just setting up my app',
    author: 'jack',
    createdAt: new Date(2022, 0, 10),
  },
]

export default handler

```

![](https://storage.googleapis.com/zenn-user-upload/e4cad8e967aa-20220414.png)

共通化する余地が大いにあるコードですがそれは後の課題として、先ずは getStatus の API をページコンポーネントから使ってみましょう。

```tsx:pages/statuses/[id].tsx
import type { GetServerSideProps, NextPage } from 'next'
import Head from 'next/head'

type StatusPageProps = { status: Status }

type Status = {
  id: string
  body: string
  author: string
  createdAt: string
}

// type guard
const isStatus = (data: unknown): data is Status => {
  const d = data as Status
  if (typeof d.id !== 'string') {
    return false
  }
  if (typeof d.body !== 'string') {
    return false
  }
  if (typeof d.author !== 'string') {
    return false
  }
  if (typeof d.createdAt !== 'string') {
    return false
  }

  return true
}

export const getServerSideProps: GetServerSideProps<StatusPageProps> = async (
  context
) => {
  const res = await fetch(
    `http://localhost:3000/api/status/getStatus?id=${context.query.id}`
  )
  const statusData = (await res.json()) as unknown
  if (!isStatus(statusData)) {
    return { notFound: true }
  }

  return { props: { status: statusData } }
}

const StatusPage: NextPage<StatusPageProps> = (props) => {
  return (
    <>
      <Head>
        <title>{props.status.body}</title>
        <meta property="og:title" content={props.status.body} key="ogtitle" />
      </Head>
      <h1>{props.status.body}</h1>
      <p>{props.status.author}</p>
    </>
  )
}

export default StatusPage

```

[http://localhost:3000/statuses/1](http://localhost:3000/statuses/1)

![](https://storage.googleapis.com/zenn-user-upload/9f92daed9491-20220414.png)

コードに戻って`getServerSideProps`から見てみましょう。

```ts
export const getServerSideProps: GetServerSideProps<StatusPageProps> = async (
  context
) => {
  const res = await fetch(
    `http://localhost:3000/api/status/getStatus?id=${context.query.id}`
  )
  const statusData = (await res.json()) as unknown
  if (!isStatus(statusData)) {
    return { notFound: true }
  }

  return { props: { status: statusData } }
}
```

[fetch](https://developer.mozilla.org/ja/docs/Web/API/Fetch_API)はリモートリソース取得のための[非同期](https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Statements/async_function)API です。ブラウザと違い通常 Node.js で fetch は利用できませんが Next.js が[node-fetch](https://www.npmjs.com/package/node-fetch)での[ポリフィル](https://developer.mozilla.org/ja/docs/Glossary/Polyfill)を行ってくれるため特に意識しなくても利用が可能です。

なお fetch によってネットワークの向こう側からやってくる statusData は、実行時チェックするまで実際にはどんな型なのか未知なので[unknown 型](https://www.typescriptlang.org/docs/handbook/2/functions.html#unknown)として扱っています。またこの statusData を isStatus という関数に通していますが、これは型述語(a is A という記法)を利用した[ユーザー定義 Type Guard](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#using-type-predicates)と呼ばれるものです。isStatus の本体を見てみましょう。

```ts
type Status = {
  id: string
  body: string
  author: string
  createdAt: string
}

const isStatus = (data: unknown): data is Status => {
  const d = data as Status
  if (typeof d.id !== 'string') {
    return false
  }
  if (typeof d.body !== 'string') {
    return false
  }
  if (typeof d.author !== 'string') {
    return false
  }
  if (typeof d.createdAt !== 'string') {
    return false
  }

  return true
}
```

型述語を利用したユーザー定義 Type Guard では受け取った未知のデータに対して true/false を返すことで『実行時に一定の条件を満たせるなら対象の型と見なして扱う』といったコードを書くことができます。ただし一定の条件をどういったものにするかというさじ加減はプログラマーへ託されているため、あなたが望むなら『どんな data を受け取っても Status として扱う』ような危険な Type Guard を書く自由もあります。

```ts
const isStatus = (data: unknown): data is Status => {
  return true
}
```

Type Guard は詳細に書けば書くほど安全になりますが、Type Guard を書く手間や Type Guard 自体の実装にバグが混入する可能性があります。またある時点では正しく実装されていた Type Guard が API 側の変更に追従できず正しくなくなるという事も有りえます。

こういった『ネットワークの向こう側からやってくるリソースの型にまつわる問題』の解決策の一つとして、型を何らかの形で自動生成するというアプローチがあります。次の章で扱う GraphQL ライブラリでもそういったアプローチが可能です。なお本書では扱いませんが本格的にユーザー定義 Type Guard を運用するのであれば[io-ts](https://github.com/gcanti/io-ts)や[Zod](https://github.com/colinhacks/zod)のようなライブラリを利用するのも良いでしょう。

- [このセクションのサンプルコード](https://github.com/oubakiou/100perts/tree/652bf7f3bcf76cdb1433ce74ee6fc8c5620e9f03/v0.1.1/helloworld-app)
- [前回との差分](https://github.com/oubakiou/100perts/compare/63f25eceb2fb818c87d20080ddc03992a245c495...652bf7f3bcf76cdb1433ce74ee6fc8c5620e9f03)

# コンポーネントをディレクトリで分類してみよう

これからいくつかの UI コンポーネントを実装していきますが、その前に components ディレクトリを細分化してみましょう。どういったモノがどこに置かれるかというルールとその共通認識は特にチーム開発においては重要です。

pages ディレクトリと違い Next.js が要求するルールは特に無いので個々の事情に合わせて自由に決める事ができます。TypeScript 環境であれば後からのディレクトリ構造変更やコンポーネントの移動は比較的容易な作業なので、アプリケーションの成長に応じて調整していくのも良いでしょう。

本書では[アトミックデザイン](https://bradfrost.com/blog/post/atomic-web-design/)の語彙から一部を借りて下記のディレクトリ構成とルールで始めます。

```
├─components/
| ├─atoms/
| ├─molecules/
| └─organisms/
├─pages/
```

- atoms には、機能的にそれ以上分割できない最小のコンポーネントを配置する
- molecules には、atoms を組合せる事で成立するコンポーネントを配置する
- organisms には、molecules を組み合わせる事で成立するコンポーネントを配置する
- organisms は molecules だけではなく atoms にも直接依存しても良い
- API コールや[Context](https://ja.reactjs.org/docs/context.html)の提供は原則ページコンポーネントまたは[\_app](https://nextjs.org/docs/advanced-features/custom-app)(後述)で行う

:::details コラム：アトミックデザインを元にした React コンポーネントの分類にまつわる話

アトミックデザインは元来ビジュアルデザインのためのコンポーネントベースの方法論であり、そのコンポーネント分類はあくまでデザイン要素としての分類という性質が強いものです。そのコンポーネントがどのように実装されているのか(例えばドメインと接触のあるコンポーネントか、内部状態を持ったコンポーネントかなど)や、経年に対する分類の不変性、分類の厳格さといった開発者にとっての関心事はあまり考慮されていません。

これは

- 特定の技術(例えば React)に依存した概念ではないので幅広く適用できる、
- 開発者でなくとも分類を扱えるので職種を跨った共通言語として利用できる

という強みでもありますが、その一方でチームによっては扱いにくかったり個人の解釈違いによって分類が混乱する事があります。このためチームによっては本書のように分類に対して独自ルールを追加する事で利便性を向上させたり分類の厳格さを補強しているケースがあります。

### Next.js においての注意点

アトミックデザインにおける Pages は Next.js における pages ディレクトリやページコンポーネントと直接対応した概念では**ありません**。Next.js のページコンポーネントに具体的な props を与えた最終的なレンダリング結果(またはそれを表現したデザインカンプ)がアトミックデザインにおける Pages です。

またアトミックデザインにおける Templates は、props 抜きでのページコンポーネントの表示(またはそれを表現したワイヤーフレーム)というのが一番近いかもしれません。再利用(複数のページコンポーネントで同じ Template の利用)が想定されないのであればページコンポーネントにその役割を持たせてしまうのも良いかもしれません。

:::

# Material-UI を導入してみよう

そろそろ我々のアプリケーションの殺風景な見栄えが気になりはじめた頃でしょうか。このセクションでは少しばかりのデザインと構造を付け加える事にしましょう。

![](https://storage.googleapis.com/zenn-user-upload/413e1625c2d160304ec45e18.png)

[Material-UI](https://mui.com/)(以下 MUI)は[マテリアルデザイン](https://material.io/design)と呼ばれる Google 社が提唱するデザインシステムをデフォルト採用した React コンポーネント集です。MUI v5 からは[Unstyled components](https://mui.com/material-ui/customization/unstyled-components/)を利用する事でマテリアルデザインとは異なるデザインシステムを実装する事もできますが本書ではマテリアルデザインのまま扱います。下記を実行してインストールします。

```
npm install @mui/material @mui/icons-material @emotion/react @emotion/styled @emotion/server @emotion/cache @fontsource/roboto
```

インストールが終わったら先ずは我々のアプリケーション用の[テーマ](https://mui.com/material-ui/customization/theming/)を作りましょう。新しく`src`ディレクトリを作成しその中に theme.ts というファイルを作ります。テーマはアプリケーション全体で共通して使うテーマカラーやフォントなどスタイル設定を共有するための仕組みです。本書では扱いませんが[ダークモード](https://mui.com/material-ui/customization/dark-mode/)などもテーマ機能を通して実現する事ができます。

```ts:src/theme.ts
import { createTheme, ThemeOptions } from '@mui/material/styles'

const themeOptions: ThemeOptions = {
  palette: {
    primary: {
      main: '#1DA1F2',
      contrastText: '#FFFFFF',
    },
  },
}

export const Theme = createTheme(themeOptions)

```

続けて今回は[スタイルについてもサーバーサイドレンダリング](https://mui.com/material-ui/guides/server-rendering/)するため、その準備として下記のファイルを作ります。

```ts:src/createEmotionCache.ts
import createCache from '@emotion/cache'

// prepend: true moves MUI styles to the top of the <head> so they're loaded first.
// It allows developers to easily override MUI styles with other styling solutions, like CSS modules.
export default function createEmotionCache() {
  return createCache({ key: 'css', prepend: true })
}

```

作ったテーマを Next.js アプリケーション全体で利用できるよう pages ディレクトリの[\_app.tsx](https://nextjs.org/docs/advanced-features/custom-app)を修正しましょう。`_app.tsx`は全てのページコンポーネントの親となる始祖コンポーネントです。アプリケーション全体を対象としたい設定や Context の提供等はここで行うと良いでしょう。また先ほど作成した createEmotionCache を利用してスタイルの SSR に関する設定も行います。

```tsx:pages/_app.tsx
import { NextComponentType } from 'next'
import {
  AppContextType,
  AppInitialProps,
  AppPropsType,
} from 'next/dist/shared/lib/utils'
import Head from 'next/head'
import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { CacheProvider, EmotionCache } from '@emotion/react'
import createEmotionCache from 'src/createEmotionCache'
import { Theme } from 'src/theme'

type MyAppProps = AppPropsType & { emotionCache?: EmotionCache }
export type MyAppType = NextComponentType<
  AppContextType,
  AppInitialProps,
  MyAppProps
>

// Client-side cache, shared for the whole session of the user in the browser.
const clientSideEmotionCache = createEmotionCache()

const MyApp = (props: MyAppProps) => {
  const { Component, emotionCache = clientSideEmotionCache, pageProps } = props
  return (
    <CacheProvider value={emotionCache}>
      <Head>
        <meta name="viewport" content="initial-scale=1, width=device-width" />
      </Head>
      <ThemeProvider theme={Theme}>
        {/* CssBaseline kickstart an elegant, consistent, and simple baseline to build upon. */}
        <CssBaseline />
        <Component {...pageProps} />
      </ThemeProvider>
    </CacheProvider>
  )
}

export default MyApp

```

合わせて[\_document.tsx](https://nextjs.org/docs/advanced-features/custom-document)を新しく作成します。\_app が React コンポーネントとしての始祖であるのに対して、\_document は HTML ドキュメントとしての起点になります。

```tsx:pages/_document.tsx
import Document, {
  Html,
  Head,
  Main,
  NextScript,
  DocumentProps,
  DocumentContext,
} from 'next/document'
import createEmotionServer from '@emotion/server/create-instance'
import createEmotionCache from 'src/createEmotionCache'
import { Theme } from 'src/theme'
import { MyAppType } from 'pages/_app'

type MyDocumentProps = DocumentProps & {
  emotionStyleTags: Record<string, number>
}

const MyDocument = (props: MyDocumentProps) => (
  <Html>
    <Head>
      {/* PWA primary color */}
      <meta name="theme-color" content={Theme.palette.primary.main} />
      <link rel="shortcut icon" href="/static/favicon.ico" />
      {/* Inject MUI styles first to match with the prepend: true configuration. */}
      {props.emotionStyleTags}
    </Head>
    <body>
      <Main />
      <NextScript />
    </body>
  </Html>
)

// `getInitialProps` belongs to `_document` (instead of `_app`),
// it's compatible with static-site generation (SSG).
MyDocument.getInitialProps = async (ctx: DocumentContext) => {
  // Resolution order
  //
  // On the server:
  // 1. app.getInitialProps
  // 2. page.getInitialProps
  // 3. document.getInitialProps
  // 4. app.render
  // 5. page.render
  // 6. document.render
  //
  // On the server with error:
  // 1. document.getInitialProps
  // 2. app.render
  // 3. page.render
  // 4. document.render
  //
  // On the client
  // 1. app.getInitialProps
  // 2. page.getInitialProps
  // 3. app.render
  // 4. page.render

  const originalRenderPage = ctx.renderPage

  // You can consider sharing the same emotion cache between all the SSR requests to speed up performance.
  // However, be aware that it can have global side effects.
  const cache = createEmotionCache()
  const { extractCriticalToChunks } = createEmotionServer(cache)

  ctx.renderPage = () =>
    originalRenderPage({
      enhanceApp: (App: MyAppType) =>
        function EnhanceApp(props) {
          return <App emotionCache={cache} {...props} />
        },
    })

  const initialProps = await Document.getInitialProps(ctx)
  // This is important. It prevents emotion to render invalid HTML.
  // See https://github.com/mui/material-ui/issues/26561#issuecomment-855286153
  const emotionStyles = extractCriticalToChunks(initialProps.html)
  const emotionStyleTags = emotionStyles.styles.map((style) => (
    <style
      data-emotion={`${style.key} ${style.ids.join(' ')}`}
      key={style.key}
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: style.css }}
    />
  ))

  return {
    ...initialProps,
    emotionStyleTags,
  }
}

export default MyDocument

```

以上で準備は終了です。さっそくテーマを利用したコンポーネントを一つ作ってみましょう。

```tsx:components/atoms/banners/MediumRectangleDummy.tsx
import { FC } from 'react'
import { Box, SxProps, useTheme } from '@mui/material'

export const MediumRectangleDummyBanner: FC = () => {
  const theme = useTheme()
  const style: SxProps = {
    width: '300px',
    height: '250px',
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    textAlign: 'center',
    lineHeight: '250px',
  }

  return <Box sx={style}>FOR SALE</Box>
}

```

コンポーネントのスタイリング手法についてはいくつかの選択肢がありますが、決定的なデファクトが存在せずそれぞれに長所や特徴があるというのが現状です。本書ではその中から MUI が提供している[sx prop](https://mui.com/system/the-sx-prop/)を利用しますが、実際のプロダクト開発においてはそれぞれの状況に応じた技術選定をする事をおすすめします。

:::message

本書ではファイル名について、通常のコンポーネントは React 公式ドキュメントに倣い[PascalCase](https://ja.reactjs.org/docs/faq-structure.html)を、ファイル名がそのまま URL としても使われる Next.js のページコンポーネントについては、Next.js 公式ドキュメントに倣い[kebab-case](https://nextjs.org/docs/routing/introduction)をそれぞれ使用します。

:::

それでは MediumRectangleDummyBanner コンポーネントを StatusPage コンポーネントへ組み込んで表示してみましょう。

```diff tsx:pages/statuses/[id].tsx
+import { MediumRectangleDummyBanner } from '@/atoms/banners/MediumRectangleDummy'
import type { GetServerSideProps, NextPage } from 'next'
import Head from 'next/head'

type StatusPageProps = { status: Status }

type Status = {
  id: string
  body: string
  author: string
  createdAt: string
}

// type guard
const isStatus = (data: unknown): data is Status => {
  const d = data as Status
  if (typeof d.id !== 'string') {
    return false
  }
  if (typeof d.body !== 'string') {
    return false
  }
  if (typeof d.author !== 'string') {
    return false
  }
  if (typeof d.createdAt !== 'string') {
    return false
  }

  return true
}

export const getServerSideProps: GetServerSideProps<StatusPageProps> = async (
  context
) => {
  const res = await fetch(
    `http://localhost:3000/api/status/getStatus?id=${context.query.id}`
  )
  const statusData = (await res.json()) as unknown
  if (!isStatus(statusData)) {
    return { notFound: true }
  }

  return { props: { status: statusData } }
}

const StatusPage: NextPage<StatusPageProps> = (props) => {
  return (
    <>
      <Head>
        <title>{props.status.body}</title>
        <meta property="og:title" content={props.status.body} key="ogtitle" />
      </Head>
      <h1>{props.status.body}</h1>
      <p>{props.status.author}</p>
+      <MediumRectangleDummyBanner />
    </>
  )
}

export default StatusPage

```

[http://localhost:3000/statuses/1](http://localhost:3000/statuses/1)

![](https://storage.googleapis.com/zenn-user-upload/708b43575643-20220415.png)

- [このセクションのサンプルコード](https://github.com/oubakiou/100perts/tree/c65f8a4c4c36e836ac9f79b449327e4057d83333/v0.1.1/helloworld-app)
- [前回との差分](https://github.com/oubakiou/100perts/compare/652bf7f3bcf76cdb1433ce74ee6fc8c5620e9f03...c65f8a4c4c36e836ac9f79b449327e4057d83333)

# Material-UI を使ってみよう

その他のコンポーネントも駆け足で作っていきましょう。MUI が提供する各コンポーネントについての詳細は[公式ドキュメント](https://mui.com/material-ui/)を確認してください。

```tsx:components/moleclues/VerticalBanners.tsx
import { FC } from 'react'
import { Box } from '@mui/material'
import { MediumRectangleDummyBanner } from '@/atoms/banners/MediumRectangleDummy'

export const VerticalBanners: FC = () => (
  <Box component="div">
    <Box pb={2}>
      <MediumRectangleDummyBanner />
    </Box>
    <Box>
      <MediumRectangleDummyBanner />
    </Box>
  </Box>
)

```

![](https://storage.googleapis.com/zenn-user-upload/a31a3107dfb58bf3a5ec92dd.png)

[Box](https://mui.com/material-ui/react-box/)は MUI が提供しているレイアウト用のコンポーネントです。デフォルトだと実体は div 要素として出力されますが`<Box component="span">`のように任意の要素を指定する事もできます。

```tsx:components/moleclues/StatusCard.tsx
import { FC } from 'react'
import { Card, CardContent, Typography } from '@mui/material'
import Link from 'next/link'

type StatusCardProps = {
  id: string
  body: string
  author: string
  createdAt: string
  linkEnabled?: boolean
}

export const StatusCard: FC<StatusCardProps> = ({
  id,
  body,
  author,
  createdAt,
  linkEnabled = true,
}) => {
  const date = new Date(createdAt).toLocaleString()

  return (
    <Card>
      <CardContent>
        <Typography gutterBottom variant="h3" component="div">
          {body}
        </Typography>
        <Typography gutterBottom variant="subtitle2" component="div">
          {author}
        </Typography>
        <Typography gutterBottom variant="subtitle2" component="div">
          {linkEnabled ? (
            <Link href={`/statuses/${id}`} prefetch={false}>
              <a>{date}</a>
            </Link>
          ) : (
            date
          )}
        </Typography>
      </CardContent>
    </Card>
  )
}

```

![](https://storage.googleapis.com/zenn-user-upload/356f66ace28584813884e39b.png)

[next/link](https://nextjs.org/docs/api-reference/next/link)は Next.js のページコンポーネント間でリンクを張るためのコンポーネントです。a タグのみを使った一般的なリンクがサーバーから新しいドキュメントを丸ごと貰い再描画・遷移するのに対して、Link コンポーネントを使ったリンクでは必要なコンポーネントのみ置き換わる高速なクライアントサイド遷移や prefetch がサポートされます。

なお今回は扱いませんが、この next/link と MUI の[@mui/material/Link](https://mui.com/material-ui/react-link/)とを併用する場合は[公式サンプルコード](https://mui.com/material-ui/guides/routing/#next-js)を参照しましょう。

```tsx:components/atoms/listItem/Home.tsx
import { FC } from 'react'
import { ListItem, ListItemIcon, ListItemText, useTheme } from '@mui/material'
import { Home as HomeIcon } from '@mui/icons-material'
import Link from 'next/link'

type HomeListItemProps = {
  selected?: boolean
}

export const HomeListItem: FC<HomeListItemProps> = ({ selected = false }) => {
  const theme = useTheme()

  const item = (
    <ListItem button selected={selected}>
      <ListItemIcon>
        <HomeIcon sx={{ color: theme.palette.primary.main }} />
      </ListItemIcon>
      <ListItemText primary="ホーム" />
    </ListItem>
  )

  if (selected) {
    return item
  }

  return (
    <Link href="/" prefetch={false}>
      <a>{item}</a>
    </Link>
  )
}

```

```tsx:components/moleclues/NavigationList.tsx
import { FC } from 'react'
import { List } from '@mui/material'
import { HomeListItem } from '@/atoms/listItem/Home'

type NavigationListProps = {
  currentRouteName?: string
}

export const NavigationList: FC<NavigationListProps> = ({
  currentRouteName,
}) => (
  <List>
    <HomeListItem selected={currentRouteName === 'home'} />
  </List>
)

```

![](https://storage.googleapis.com/zenn-user-upload/88e08deb30ed7c6125bbe05c.png)

```tsx:components/atoms/PermanentLeftDrawer.tsx
import { FC } from 'react'
import { Drawer } from '@mui/material'

type PermanentLeftDrawerProps = {
  children: JSX.Element
}

export const PermanentLeftDrawer: FC<PermanentLeftDrawerProps> = ({
  children,
}) => {
  const w = 200
  return (
    <Drawer
      variant="permanent"
      anchor="left"
      sx={{
        width: w,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: w,
          boxSizing: 'border-box',
        },
      }}
    >
      {children}
    </Drawer>
  )
}

```

今回 props に登場した[children](https://ja.reactjs.org/docs/composition-vs-inheritance.html)という名前は特別な意味を持っています。これはこのコンポーネントが子コンポーネントを受け取れる事を意味しています。例えば

```tsx
<PermanentLeftDrawer>
  <Typography>おぎゃー</Typography>
</PermanentLeftDrawer>
```

のように自身のタグで囲んだ要素(この場合は`<Typography>おぎゃー</Typography>`)を自身の子要素として props.children で参照する事ができます。なお children には 1 つの要素しか受け取ることができないという制約があります。(子要素の下に孫要素はいくつあっても問題ありません)

```tsx:components/atoms/layouts/TwoColumnLayout.tsx
import { FC } from 'react'
import { Grid } from '@mui/material'

type TwoColumnLayoutProps = {
  children: JSX.Element
  rightColumnContents: JSX.Element
}

export const TwoColumnLayout: FC<TwoColumnLayoutProps> = ({
  children,
  rightColumnContents,
}) => (
  <Grid container direction="row" spacing={2}>
    <Grid item xs>
      {children}
    </Grid>
    <Grid item xs>
      {rightColumnContents}
    </Grid>
  </Grid>
)

```

[Grid](https://mui.com/material-ui/react-grid/)はレスポンシブなグリッドシステムのために MUI が提供しているコンポーネントです。

```tsx:components/organisms/layouts/BirdHouseLayout.tsx
import { FC } from 'react'
import { Box } from '@mui/material'
import { PermanentLeftDrawer } from '@/atoms/PermanentLeftDrawer'
import { NavigationList } from '@/moleclues/NavigationList'
import { TwoColumnLayout } from '@/atoms/layouts/TwoColumnLayout'
import { VerticalBanners } from '@/moleclues/VerticalBanners'

type BirdHouseLayoutProps = {
  children: JSX.Element
  currentRouteName?: string
}

export const BirdHouseLayout: FC<BirdHouseLayoutProps> = ({
  children,
  currentRouteName,
}) => (
  <Box sx={{ display: 'flex' }}>
    <PermanentLeftDrawer>
      <NavigationList currentRouteName={currentRouteName} />
    </PermanentLeftDrawer>
    <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
      <TwoColumnLayout rightColumnContents={<VerticalBanners />}>
        {children}
      </TwoColumnLayout>
    </Box>
  </Box>
)

```

これで必要なパーツ(コンポーネント)は全て揃いました。StatusPage に組み込んでみましょう。(見た目以外は変更しません)

```tsx:pages/statuses/[id].tsx
const StatusPage: NextPage<StatusPageProps> = (props) => (
  <BirdHouseLayout>
    <>
      <Head>
        <title>{props.status.body}</title>
        <meta property="og:title" content={props.status.body} key="ogtitle" />
      </Head>
      <StatusCard {...props.status} linkEnabled={false} />
    </>
  </BirdHouseLayout>
)

```

![](https://storage.googleapis.com/zenn-user-upload/dccfccd42b1a20b85f794bcf.png)

さて、今まで作ってきたコンポーネントと API を利用して index.tsx にも手を加えてみましょう。下記の内容で HomePage コンポーネントを保存します。

```tsx:pages/index.tsx
import { GetServerSideProps, NextPage } from 'next'
import Head from 'next/head'
import { Box } from '@mui/material'
import { BirdHouseLayout } from '@/atoms/layouts/BirdHouseLayout'
import { StatusCard } from '@/moleclues/StatusCard'

type HomePageProps = {
  statuses: Status[]
}

type Status = {
  id: string
  body: string
  author: string
  createdAt: string
}

const isStatuses = (data: unknown): data is Status[] => {
  // 内緒だよ
  return true
}

export const getServerSideProps: GetServerSideProps<
  HomePageProps
> = async () => {
  const res = await fetch(`http://localhost:3000/api/status/listStatuses`)
  const statusesData = (await res.json()) as unknown
  if (!isStatuses(statusesData)) {
    return { notFound: true }
  }

  return { props: { statuses: statusesData } }
}

const HomePage: NextPage<HomePageProps> = ({ statuses }) => {
  return (
    <BirdHouseLayout currentRouteName="home">
      <>
        <Head>
          <title>最新ステータス</title>
          <meta property="og:title" content="最新ステータス" key="ogtitle" />
        </Head>
        {statuses.map((s) => (
          <Box key={s.id} pb={2}>
            <StatusCard {...s} />
          </Box>
        ))}
      </>
    </BirdHouseLayout>
  )
}

export default HomePage

```

このページでは props.statuses という Array を元に[map メソッド](https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Global_Objects/Array/map)で複数の StatusCard を出力しようとしています。React ではこういった繰り返し要素に対しては[key 属性で各コンポーネントに一意なキー文字列を付ける](https://ja.reactjs.org/docs/lists-and-keys.html)事が推奨されています。これは繰り返し要素(連続する子要素)に対して[部分更新](https://ja.reactjs.org/docs/reconciliation.html#recursing-on-children)を可能としパフォーマンスを向上させるためのものです。

![](https://storage.googleapis.com/zenn-user-upload/d54351382aa4eeccf5a9085a.png)

スタイルの SSR が正常に動作している事を確認するため、JavaScript を無効にした状態でもスタイルが崩れない事を確認しておくと良いでしょう。

- [このセクションのサンプルコード](https://github.com/oubakiou/100perts/tree/49ed0b00ae9460e4ab4f7f63a7f7da342f41e281/v0.1.1/helloworld-app)
- [前回との差分](https://github.com/oubakiou/100perts/compare/c65f8a4c4c36e836ac9f79b449327e4057d83333...49ed0b00ae9460e4ab4f7f63a7f7da342f41e281)
