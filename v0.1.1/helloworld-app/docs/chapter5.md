# GraphQL Server を Next.js の API Routes で動かしてみよう

今まで使ってきた Next.js の API Routes を利用して今度は GraphQL Server を動かしてみましょう。本書では扱いませんが Next.js と GraphQL Server とを別々の独立したサーバーやコンテナで動作させる構成ももちろん可能です。

:::details コラム：なぜ GraphQL を使うのか
https://zenn.dev/oubakiou/articles/79f1b5e0b6f829
:::

先ずは下記を実行して Apollo Server をインストールします。

```
npm install apollo-server-micro
```

[apollo-server-micro](https://github.com/apollographql/apollo-server/tree/main/packages/apollo-server-micro)は[micro](https://github.com/vercel/micro)という HTTP サーバー向けに調整された Apollo Server です。(今回は Next.js に含まれている http サーバーを利用するため micro を利用するわけではありません)

インストールが終わったら GraphQL 用のエンドポイントとして下記を作成しましょう。

```ts:pages/api/graphql.ts
import { ApolloServer, Config, gql } from 'apollo-server-micro'
import {
  ApolloServerPluginLandingPageGraphQLPlayground,
  ApolloServerPluginLandingPageDisabled,
} from 'apollo-server-core'
import { NextApiRequest, NextApiResponse } from 'next'

// スキーマ定義(インターフェース)
const typeDefs: Config['typeDefs'] = gql`
  type Query {
    statuses: [Status]!
  }

  type Status {
    id: String!
    body: String!
    author: String!
    createdAt: String!
  }
`

// スキーマを実際に動作させるリゾルバー(実装)
const resolvers: Config['resolvers'] = {
  Query: {
    statuses() {
      return listStatuses()
    },
  },
}
const listStatuses = (): Status[] => statuses

// ハードコーディングされたデータ
type Status = { id: string; body: string; author: string; createdAt: string }
const statuses: Status[] = [
  {
    id: '2',
    body: 'inviting coworkers',
    author: 'jack',
    createdAt: new Date(2021, 4, 2).toISOString(),
  },
  {
    id: '1',
    body: 'just setting up my app',
    author: 'jack',
    createdAt: new Date(2021, 4, 1).toISOString(),
  },
]

// Next.jsのAPI Routeの設定
// @see https://nextjs.org/docs/api-routes/api-middlewares#custom-config
export const config = {
  api: {
    bodyParser: false,
  },
}

// Apollo Serverの生成
const isDevelopment = process.env.NODE_ENV === 'development'
const apolloServer = new ApolloServer({
  typeDefs,
  resolvers,
  introspection: isDevelopment,
  plugins: [
    isDevelopment
      ? ApolloServerPluginLandingPageGraphQLPlayground()
      : ApolloServerPluginLandingPageDisabled(),
  ],
})

// 起動と登録
const startServer = apolloServer.start()
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  await startServer
  await apolloServer.createHandler({
    path: '/api/graphql',
  })(req, res)
}

```

作成できたら

```shell
npm run dev
```

で起動し

[http://localhost:3000/api/graphql](http://localhost:3000/api/graphql)
へアクセスします。

![](https://storage.googleapis.com/zenn-user-upload/fdc32d8be12bd1ff4677a7cf.png)

これは[GraphQL Playground](https://www.apollographql.com/docs/apollo-server/testing/graphql-playground/)というブラウザベースのクエリーエディタです。試しに下記のクエリーを入力して実行してみましょう。

```graphql
{
  statuses {
    id
    body
  }
}
```

![](https://storage.googleapis.com/zenn-user-upload/bd94be683e273c0fad500c1a.png)

id と body の一覧が取得できたでしょうか。

それでは GraphQL サーバーのコードを見てみましょう。

```ts
// スキーマ定義(インターフェース)
const typeDefs: Config['typeDefs'] = gql`
  type Query {
    statuses: [Status]!
  }

  type Status {
    id: String!
    body: String!
    author: String!
    createdAt: String!
  }
`
```

**typeDefs**はこの GraphQL サーバーが扱うスキーマの定義です。また gql 関数へ[タグ付きテンプレートリテラル](https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Template_literals#tagged_templates)で渡されているものは GraphQL SDL(スキーマ定義言語)で記述されたスキーマ定義です。今回は Query 型として Status 型の配列を返す statuses というクエリーを一つ定義しています。Query 型は GraphQL のシステム上特別な意味を持った予約型で GraphQL クライアントからはここで定義したクエリーを使う事になります。

SDL での型定義でフィールドに対して`!`というマークがついているのは、そのフィールドが非 null である事を表現しています。また ID 型や String 型は標準で用意されている[スカラー型](https://graphql.org/learn/schema/#scalar-types)です。`[Status]`のように`[]`で囲まれているものは配列型を意味しています。

```ts
// スキーマを実際に動作させるリゾルバー(実装)
const resolvers: Config['resolvers'] = {
  Query: {
    statuses() {
      return listStatuses()
    },
  },
}
const listStatuses = (): Status[] => statuses

// ハードコーディングされたデータ
type Status = { id: string; body: string; author: string; createdAt: string }
const statuses: Status[] = [
  {
    id: '2',
    body: 'inviting coworkers',
    author: 'jack',
    createdAt: new Date(2021, 4, 2).toISOString(),
  },
  {
    id: '1',
    body: 'just setting up my app',
    author: 'jack',
    createdAt: new Date(2021, 4, 1).toISOString(),
  },
]
```

**resolvers**は先ほど typeDefs で定義した各クエリーについて、それを実際に処理するコードを書きます。今回はハードコーディングされたデータを使用していますが一般的なアプリケーションでは、MySQL や Firestore のような DB、あるいは別の REST API のような外部データソースから取得されたデータを返す事になります。

```ts
// Next.jsのAPI Routeの設定
// @see https://nextjs.org/docs/api-routes/api-middlewares#custom-config
export const config = {
  api: {
    bodyParser: false,
  },
}

// Apollo Serverの生成
const isDevelopment = process.env.NODE_ENV === 'development'
const apolloServer = new ApolloServer({
  typeDefs,
  resolvers,
  introspection: isDevelopment,
  plugins: [
    isDevelopment
      ? ApolloServerPluginLandingPageGraphQLPlayground()
      : ApolloServerPluginLandingPageDisabled(),
  ],
})

// 起動と登録
const startServer = apolloServer.start()
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  await startServer
  await apolloServer.createHandler({
    path: '/api/graphql',
  })(req, res)
}
```

最後は typeDefs や resolvers を元にして実際に GraphQL サーバーを生成しているコードです。playground と introspection は明示的に開発環境でのみ有効にしています。introspection は GraphQL クライアントなどがコードや型を生成するにあたって必要なスキーマ情報などを GraphQL サーバーから得るための機能です。

- [このセクションのサンプルコード](https://github.com/oubakiou/100perts/tree/18d6bba52bd3b065e00e0eeaf8dbab1d39e9d0c0/v0.1.1/helloworld-app)
- [前回との差分](https://github.com/oubakiou/100perts/compare/d2bfed244ba113abfb215cf921a7660ccb31bc82...18d6bba52bd3b065e00e0eeaf8dbab1d39e9d0c0)

# 引数を受け取れるクエリーを書いてみよう

ステータス ID を受け取って対応したステータスを返すクエリーを追加してみましょう。

```diff ts
const typeDefs: Config['typeDefs'] = gql`
  type Query {
    statuses: [Status]!
+    status(id: ID!): Status
  }
```

typeDefs の Query 型に status というクエリーを追加します。

```diff ts
const resolvers: Config['resolvers'] = {
  Query: {
    statuses() {
      return listStatuses()
    },
+    status(_parent, args) {
+      return getStatus(args?.id) ?? null
+    },
```

resolvers にも status クエリーと対応したリゾルバーを追加します。リゾルバーは parent, args, context, info という 4 つの引数を受け取りますが今回は第 2 引数の args のみを使用しています。

```diff ts
const listStatuses = (): Status[] => statuses
+const getStatus = (id: string): Status | undefined =>
+  statuses.find((d) => d.id === id)
```

最後に status リゾルバーへ紐付ける処理の実体を追加します。

それでは Playground から下記を実行してみましょう。

```graphql
{
  status(id: "1") {
    id
    body
  }
}
```

![](https://storage.googleapis.com/zenn-user-upload/59643adae01090e2f27d48b0.png)

- [このセクションのサンプルコード](https://github.com/oubakiou/100perts/tree/fbc00b1d21f8679700577da5ae58a032ef08045f/v0.1.1/helloworld-app)
- [前回との差分](https://github.com/oubakiou/100perts/compare/18d6bba52bd3b065e00e0eeaf8dbab1d39e9d0c0...fbc00b1d21f8679700577da5ae58a032ef08045f)

# 入れ子になったオブジェクトを取得してみよう

次はオブジェクトが別のオブジェクトを持った入れ子構造を表現してみましょう。

```diff graphql
  type Status {
    id: ID!
    body: String!
-    author: String!
+    author: Author!
    createdAt: String!
  }

+  type Author {
+    id: ID!
+    name: String!
+  }
```

SDL に新しく Author 型を追加し、それを Status 型に持たせます。続けてハードコーディングされたデータを新しい構造に合わせて修正しましょう。

```ts
// ハードコーディングされたデータ
type Status = { id: string; body: string; author: Author; createdAt: string }
type Author = { id: string; name: string }
const statuses: Status[] = [
  {
    id: '2',
    body: 'inviting coworkers',
    author: {
      id: '1',
      name: 'jack',
    },
    createdAt: new Date(2021, 4, 2).toISOString(),
  },
  {
    id: '1',
    body: 'just setting up my app',
    author: {
      id: '1',
      name: 'jack',
    },
    createdAt: new Date(2021, 4, 1).toISOString(),
  },
]
```

今回の例では resolver を変更する必要はありませんが、一般的な正規化された RDB が背後にある場合には status テーブルのデータと author テーブルのデータとを何らかの方法で組合せたり整形したりする必要があります。ORM が助けになる場合もあるでしょう。

```graphql
{
  statuses {
    id
    body
    author {
      id
      name
    }
  }
}
```

クエリーを実行して結果を確認してみましょう。

- [このセクションのサンプルコード](https://github.com/oubakiou/100perts/tree/58b9946116c7ee53fe7c6e00aae36dc08c093e11/v0.1.1/helloworld-app)
- [前回との差分](https://github.com/oubakiou/100perts/compare/fbc00b1d21f8679700577da5ae58a032ef08045f...58b9946116c7ee53fe7c6e00aae36dc08c093e11)

# 入れ子になったオブジェクトをリゾルバーチェーンで取得してみよう

別解として[リゾルバーチェーン](https://www.apollographql.com/docs/apollo-server/data/resolvers/#resolver-chains)という仕組みを利用して取得する方法も見てみましょう。これは複数のリゾルバを組合せる事で入れ子構造に対応する仕組みです。

今回は RDB をイメージした下記のようなデータ構造を使います。

```ts
// ハードコーディングされたデータ
type Status = { id: string; body: string; authorId: string; createdAt: string }
const statuses: Status[] = [
  {
    id: '2',
    authorId: '1',
    body: 'inviting coworkers',
    createdAt: new Date(2021, 4, 2).toISOString(),
  },
  {
    id: '1',
    authorId: '1',
    body: 'just setting up my app',
    createdAt: new Date(2021, 4, 1).toISOString(),
  },
]

type Author = { id: string; name: string }
const authors: Author[] = [
  {
    id: '1',
    name: 'jack',
  },
]
```

resolvers の Query 型と同レベルに Status 型のリゾルバーを書きましょう。

```diff ts
const resolvers: Config['resolvers'] = {
  Query: {
    statuses() {
      return listStatuses()
    }
    status(_parent, args) {
      return getStatus(args?.id) ?? null
    },
  },
+  Status: {
+    author: (parent) => {
+      return getAuthor(parent.authorId)
+    },
+  },
}
```

これは Status 型のオブジェクトの author フィールドを取得する際のリゾルバーとして機能します。また第一引数である parent からは親要素(この場合は Status)の実データを参照する事が出来ます。

```diff ts
const listStatuses = (): Status[] => statuses
const getStatus = (id: string): Status | undefined =>
  statuses.find((d) => d.id === id)
+const getAuthor = (id: string): Author | undefined =>
+  authors.find((a) => a.id === id)
```

リゾルバーチェーンを使うとリゾルバーの実装がシンプルになる反面、N+1 問題に気をつける必要があります。仮に getAuthor が 1 回 SQL を発行する実装の場合、100 個の Status を取得する際には 100 回の getAuthor が呼ばれ 100 回 SQL を発行する事になります。場合によってはこれを解消するために JOIN 句や IN 句を使って SQL を書き換えるなどの対策が必要になるでしょう。

あるいは[dataloader](https://github.com/graphql/dataloader)と呼ばれる仕組みが組み合わされる事もあります。

- [このセクションのサンプルコード](https://github.com/oubakiou/100perts/tree/ee9ceb6a9bbae35737ef4bff8e545f14f2295179/v0.1.1/helloworld-app)
- [前回との差分](https://github.com/oubakiou/100perts/compare/58b9946116c7ee53fe7c6e00aae36dc08c093e11...ee9ceb6a9bbae35737ef4bff8e545f14f2295179)

# 複数種類のオブジェクトを取得するクエリーを書いてみよう

最後に、複数種類のオブジェクトを取得する例を見てみましょう。今までは Status 型を中心に扱ってきましたが、それとは独立した Banner 型を新しく追加します。

```diff graphql
  type Query {
    statuses: [Status]!
    status(id: ID!): Status
+    banners(groupId: ID): [Banner]!
  }

  type Status {
    id: ID!
    body: String!
    author: Author!
    createdAt: String!
  }

  type Author {
    id: ID!
    name: String!
  }

+  type Banner {
+    id: ID!
+    groupId: String!
+    href: String
+  }
```

サーバー側の実装には特に新しい知識は必要ありません。banners クエリーのリゾルバーを実装しましょう。

```diff ts
const resolvers: Config['resolvers'] = {
  Query: {
    statuses() {
      return listStatuses()
    },
    status(_parent, args) {
      return getStatus(args?.id) ?? null
    },
+    banners(_parent, args) {
+      return listBanners(args.groupId)
+    },
  },
  Status: {
    author: (parent) => {
      return getAuthor(parent.authorId)
    },
  },
}

type Status = { id: string; body: string; authorId: string; createdAt: string }
const statuses: Status[] = [
  {
    id: '2',
    authorId: '1',
    body: 'inviting coworkers',
    createdAt: new Date(2021, 4, 2).toISOString(),
  },
  {
    id: '1',
    authorId: '1',
    body: 'just setting up my app',
    createdAt: new Date(2021, 4, 1).toISOString(),
  },
]

type Author = { id: string; name: string }
const authors: Author[] = [
  {
    id: '1',
    name: 'jack',
  },
]

+type Banner = {
+  id: string
+  groupId: string
+  href: string | null
+}
+const banners: Banner[] = [
+  {
+    id: '2',
+    groupId: '1',
+    href: null,
+  },
+  {
+    id: '1',
+    groupId: '1',
+    href: null,
+  },
+]

const listStatuses = (): Status[] => statuses
const getStatus = (id: string): Status | undefined =>
  statuses.find((d) => d.id === id)
const getAuthor = (id: string): Author | undefined =>
  authors.find((a) => a.id === id)
+const listBanners = (groupId: string): Banner[] =>
+  banners.filter((b) => b.groupId === groupId)

```

それでは下記のクエリーを Playground の左ペイン上に入力してみましょう。このクエリーは statusId と bannerGroupId という二つの引数を受け取る事ができます。

```graphql
query getStatusPageProps($statusId: ID!, $bannerGroupId: ID!) {
  status(id: $statusId) {
    id
    body
    author {
      id
      name
    }
  }
  banners(groupId: $bannerGroupId) {
    id
    href
  }
}
```

さらに左ペイン下の**QUERY VARIABLES**タブに具体的な引数の値を入力して実行します。

```json:QUERY VARIABLES
{
  "statusId": 1,
  "bannerGroupId": 1
}

```

:::message
QUERY VARIABLES タブの隣には HTTP HEADERS タブがありますが、誤ってそちらへ入力しないよう気をつけましょう
:::

![](https://storage.googleapis.com/zenn-user-upload/85574d7671faf40bdee016b3.png)

期待した通りの結果は返ってきたでしょうか。

- [このセクションのサンプルコード](https://github.com/oubakiou/100perts/tree/7e2a04a0887b416da0a20ea061e65a296ff315ac/v0.1.1/helloworld-app)
- [前回との差分](https://github.com/oubakiou/100perts/compare/ee9ceb6a9bbae35737ef4bff8e545f14f2295179...7e2a04a0887b416da0a20ea061e65a296ff315ac)

# typeDefs と resolvers を別ファイルに切り出してみよう

graphql.ts が長くなってきたので typeDefs と resolvers を別ファイルへ分割をしましょう。また typeDefs は TypeScript ファイルとしてではなく、純粋な SDL ファイルとして.graphql の拡張子で保持するようにします。

まずは webpack の設定を追加するため next.config.js に下記を追加します。これによって拡張子が graphql のファイルが import 時に graphql-tag/loader を使って読み込まれるようになります。

```diff js:next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
+  // @see https://www.apollographql.com/docs/react/integrations/webpack/
+  webpack: (config) => {
+    config.module.rules.push({
+      test: /\.(graphql)$/,
+      exclude: /node_modules/,
+      loader: 'graphql-tag/loader',
+    })
+
+    return config
+  },
}

module.exports = nextConfig
```

新しく graphql ディレクトリを作り下記を保存します。

```ts:graphql/graphql.d.ts
declare module '*.graphql' {
  import { DocumentNode } from 'graphql'
  const Schema: DocumentNode

  export = Schema
}
```

ここでは読み込まれた.graphql ファイルの中身が DocumentNode 型として扱われるよう宣言しています。準備が出来たので typeDefs と resolvers を別ファイルとして保存してみましょう。

```graphql:graphql/typeDefs.graphql
type Query {
  status(id: ID!): Status
  statuses: [Status]!
  banners(groupId: ID!): [Banner]!
}

type Status {
  id: ID!
  body: String!
  author: Author!
  createdAt: String!
}

type Author {
  id: ID!
  name: String!
}

type Banner {
  id: ID!
  groupId: ID!
  href: String
}

```

```ts:graphql/resolvers.ts
import { Config } from 'apollo-server-micro'

// スキーマを実際に動作させるリゾルバー(実装)
export const resolvers: Config['resolvers'] = {
  Query: {
    statuses() {
      return listStatuses()
    },
    status(_parent, args) {
      return getStatus(args?.id) ?? null
    },
    banners(_parent, args) {
      return listBanners(args.groupId)
    },
  },
  Status: {
    author: (parent) => {
      return getAuthor(parent.authorId)
    },
  },
}

const listStatuses = (): Status[] => statuses

const getStatus = (id: string): Status | undefined =>
  statuses.find((d) => d.id === id)

const getAuthor = (id: string): Author | undefined =>
  authors.find((a) => a.id === id)

const listBanners = (groupId: string): Banner[] =>
  banners.filter((b) => b.groupId === groupId)

// ハードコーディングされたデータ
type Status = { id: string; body: string; authorId: string; createdAt: string }
const statuses: Status[] = [
  {
    id: '2',
    authorId: '1',
    body: 'inviting coworkers',
    createdAt: new Date(2021, 4, 2).toISOString(),
  },
  {
    id: '1',
    authorId: '1',
    body: 'just setting up my app',
    createdAt: new Date(2021, 4, 1).toISOString(),
  },
]

type Author = { id: string; name: string }
const authors: Author[] = [
  {
    id: '1',
    name: 'jack',
  },
]

type Banner = {
  id: string
  groupId: string
  href: string | null
}
const banners: Banner[] = [
  {
    id: '2',
    groupId: '1',
    href: null,
  },
  {
    id: '1',
    groupId: '1',
    href: null,
  },
]

```

今後 resolver の実装が増えていくことを考えると、さらに分割しておいたほうが見通しが良くなりそうですが次章へ託しましょう。最後に graphql.ts から import します。

```ts:pages/api/graphql.ts
import { ApolloServer } from 'apollo-server-micro'
import {
  ApolloServerPluginLandingPageGraphQLPlayground,
  ApolloServerPluginLandingPageDisabled,
} from 'apollo-server-core'
import { NextApiRequest, NextApiResponse } from 'next'
import typeDefs from 'graphql/typeDefs.graphql'
import { resolvers } from 'graphql/resolvers'

// Next.jsのAPI Routeの設定
// @see https://nextjs.org/docs/api-routes/api-middlewares#custom-config
export const config = {
  api: {
    bodyParser: false,
  },
}

// Apollo Serverの生成
const isDevelopment = process.env.NODE_ENV === 'development'
const apolloServer = new ApolloServer({
  typeDefs,
  resolvers,
  introspection: isDevelopment,
  plugins: [
    isDevelopment
      ? ApolloServerPluginLandingPageGraphQLPlayground()
      : ApolloServerPluginLandingPageDisabled(),
  ],
})

// 起動と登録
const startServer = apolloServer.start()
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  await startServer
  await apolloServer.createHandler({
    path: '/api/graphql',
  })(req, res)
}

```

- [このセクションのサンプルコード](https://github.com/oubakiou/100perts/tree/e3926918d23facf474272fe792e876148f84f394/v0.1.1/helloworld-app)
- [前回との差分](https://github.com/oubakiou/100perts/compare/7e2a04a0887b416da0a20ea061e65a296ff315ac...e3926918d23facf474272fe792e876148f84f394)

# 型定義を生成してリゾルバーを安全に実装してみよう

実は今のままでは resolvers を実装する際に SDL で定義されている型は一切考慮されません。例えば SDL で String 型になっているフィールドに対して、boolean を渡すリゾルバーを書いたとしても型検査では何も言われません。それではさすがに困るので SDL から TypeScript の型定義を生成するようにしてみましょう。

```shell
npm install --save-dev @graphql-codegen/cli @graphql-codegen/typescript @graphql-codegen/typescript-resolvers
```

graphql-codegen は SDL 等を元に graphql に関するコードや型を生成する事ができるツールです。インストールが終わったら設定ファイルとして下記を作成します。

```json:codegen.json
{
  "generates": {
    "./graphql/generated/resolvers-types.ts": {
      "schema": "./graphql/typeDefs.graphql",
      "plugins": ["typescript", "typescript-resolvers"]
    },
  }
}
```

また npm スクリプトとして下記を追加しておきましょう

```diff json:package.json
  "scripts": {
    "dev": "next dev",
-    "build": "next build",
+    "build": "npm run gen && next build",
    "start": "next start",
    "lint": "next lint",
    "deploy": "firebase deploy --only functions,hosting",
+    "gen": "npx graphql-codegen"
  },

```

それではコード生成を実行しましょう。

```shell
npm run gen
```

`graphql/generated/resolvers-types.ts`というファイルが作成されたら resolvers.ts で Resolvers 型を import して Config['resolvers']型の代わりに使ってみましょう。

```diff ts:graphql/resolvers.ts
-import { Config } from 'apollo-server-micro'
+import { Resolvers } from './generated/resolvers-types'

-export const resolvers: Config['resolvers'] = {
+export const resolvers: Resolvers = {
```

![](https://storage.googleapis.com/zenn-user-upload/3cd527f9fd9e-20220513.png)

banners 以外のリゾルバーで型エラーが出ているのは、スキーマ側の Status 型が内部でもっている Author 型について、TS 側のリゾルバーチェーン適用前の型と不一致を起こしているためです。

スキーマ側の型と TS 側の型とをマッピングする設定を追加して解消させましょう。

```diff json:codegen.json
{
  "generates": {
    "./graphql/generated/resolvers-types.ts": {
      "schema": "./graphql/typeDefs.graphql",
+      "config": {
+        "mapperTypeSuffix": "Ts",
+        "mappers": {
+          "Status": "../resolvers#Status",
+          "Author": "../resolvers#Author"
+        }
+      },
      "plugins": ["typescript", "typescript-resolvers"]
    },
  }
}
```

mappers には生成されるファイル(この場合は resolvers-types.ts)から見ての相対パスでマッピング先ファイルを指定する必要があります。

```diff ts:graphql/resolvers.ts
-type Status = {
+export type Status = {

-type Author = { id: string; name: string }
+export type Author = { id: string; name: string }
```

またマッピング先になる TS 側の型は生成ファイル(resolvers-types.ts)から import されるため、export しておく必要があります。

設定が終わったら型定義を再生成しましょう。

```shell
npm run gen
```

![](https://storage.googleapis.com/zenn-user-upload/7a91f9c5ef15-20220513.png)

うまく設定されていれば Status.author リゾルバーの型エラーだけが残るはずです。

```graphql
type Status {
  id: ID!
  body: String!
  author: Author!
  createdAt: String!
}
```

この型エラーは、スキーマによって指定されている Status.author が Author!型(非 null の Author 型)であるのに対して、リゾルバーが Author | undefined 型を返しているために発生している型エラーです。どう修正するべきかはどういう仕様にしたいか次第ですが、今回は Author | null 型へ統一する事で型を一致させましょう。

```diff graphql
type Status {
  id: ID!
  body: String!
-  author: Author!
+  author: Author
  createdAt: String!
}
```

```diff ts
  Status: {
    author: (parent) => {
-      return getAuthor(parent.authorId)
+      return getAuthor(parent.authorId) ?? null
    },
  },
```

再生成をして型エラーがなくなっている事を確認しておきましょう。

```shell
npm run gen
```

![](https://storage.googleapis.com/zenn-user-upload/9cc9fa6c9c15-20220513.png)

ところで今回の Status.author リゾルバーの実装ミスについて、皆さんは型検査が有効化される前に気付けていたでしょうか？

筆者はもちろん気付いて**いませんでした**。こういった**人間の注意力に依存したミスを機械的に検査できる環境の重要性**は本書の大きなテーマです。

- [このセクションのサンプルコード](https://github.com/oubakiou/100perts/tree/21da2f5e3cbf54621dbb6b404dce180c579eb60d/v0.1.1/helloworld-app)
- [前回との差分](https://github.com/oubakiou/100perts/compare/e3926918d23facf474272fe792e876148f84f394...21da2f5e3cbf54621dbb6b404dce180c579eb60d)

# GraphQL ファイルにも ESLint をかけてみよう

GraphQL のクエリーを書き始める前に、GraphQL ファイルにも Lint がかかるよう設定しておきましょう。

GraphQL の Lint の中にはスキーマ情報が必要なものもあります。スキーマ情報の元としては前の章で記述した`graphql/typeDefs.graphql`そのものを利用したり、[http://localhost:3000/api/graphql](http://localhost:3000/api/graphql)
のような GraphQL エンドポイント URL を利用する事もできますが、ここでは敢えてエンドポイント URL から SDL ファイルを生成してそれを利用します。

`graphql/typeDefs.graphql`と同じ内容のファイルを生成する事になるので今回のケースでは回りくどいと感じるかもしれませんが、GraphQL サーバーが直接管理下にないケースや、GraphQL サーバーにおいて SDL ファイルではなくコードファーストでスキーマが定義(例えば TypeScript であれば[Nexus](https://nexusjs.org/)などで実現できます)されているケースなどでも利用できる手法です。

先ずは SDL ファイル生成のためのプラグインと ESLint プラグインをそれぞれインストールします。

```shell
npm install --save-dev @graphql-codegen/schema-ast @graphql-eslint/eslint-plugin
```

インストールが終わったら SDL ファイル生成のための設定を codege.json へ追加しましょう。

```diff json:codegen.json
{
  "generates": {
    "./graphql/generated/resolvers-types.ts": {
      "schema": "./graphql/schema/typeDefs.graphql",
      "config": {
        "mapperTypeSuffix": "Ts",
        "mappers": {
          "Status": "../resolvers#Status",
          "Author": "../resolvers#Author"
        }
      },
      "plugins": ["typescript", "typescript-resolvers"]
    },
+    "./graphql/generated/schema.graphql": {
+      "schema": "http://localhost:3000/api/graphql",
+      "plugins": ["schema-ast"]
+    }
  }
}

```

設定が終わったら一度ファイル生成を実行します。この時には GraphQL サーバー(を乗せている Next.js)を起動しておくようにしてください。生成にあたって I[ntrospection 機能](https://graphql.org/learn/introspection/)で GraphQL サーバーからスキーマ情報を取得する必要があるためです。

```
npm run gen
```

`graphql/generated/schema.graphql`へ`graphql/typeDefs.graphql`と同じ内容のファイルが生成されたでしょうか。次はこの schema.graphql を元にした lint の設定です。eslintrc.json を変更しましょう。

```diff json:.eslintrc.json
{
  "extends": [
    "next/core-web-vitals",
    "plugin:@typescript-eslint/recommended",
    "prettier"
  ],
+  "overrides": [
+    {
+      "files": ["./graphql/operations/**/*.graphql"],
+      "parserOptions": {
+        "operations": "./graphql/operations/**/*.graphql",
+        "schema": "./graphql/generated/schema.graphql"
+      },
+      "extends": "plugin:@graphql-eslint/operations-recommended"
+    },
+    {
+      "files": ["./graphql/schema/**/*.graphql"],
+      "parserOptions": {
+        "schema": "./graphql/schema/**/*.graphql"
+      },
+      "extends": "plugin:@graphql-eslint/schema-recommended"
+    }
+  ]
}

```

overrides の下へ 2 ブロックの設定を追加していますが、前者は GraphQL クライアントで扱う query や mutation といったファイルの lint 設定、後者は GraphQL サーバーで扱う SDL の lint 設定です。また設定に合わせて`graphql/typeDefs.graphql`は`graphql/schema/typeDefs.graphql`へ移動し`pages/api/graphql.ts`の import パスや codegen.json 内のファイルパスも修正しておきましょう。

最後に VSCode 上の ESLint で`*.graphql`ファイルも対象になるよう設定を追加します。

```diff json:settings.json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "[typescript]": { "editor.defaultFormatter": "esbenp.prettier-vscode" },
  "[typescriptreact]": { "editor.defaultFormatter": "esbenp.prettier-vscode" },
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "./node_modules/typescript/lib",
  "typescript.preferences.importModuleSpecifier": "non-relative",
+  "eslint.validate": [
+    "javascript",
+    "javascriptreact",
+    "typescript",
+    "typescriptreact",
+    "graphql"
+  ]
}

```

一通りの設定が終わったら動作確認のため下記のクエリーファイルを作って VSCode 上での表示を確認してみましょう。

```graphql:graphql/query/StatusPageProps.graphql
query StatusPageProps($statusId: ID!, $bannerGroupId: ID!) {
  status(id: $statusId) {
    id
    body
    author {
      id
      name
    }
    createdAt
  }
  banners(groupId: $bannerGroupId) {
    id
    hrefs
  }
}
```

![](https://storage.googleapis.com/zenn-user-upload/0b229eb92482-20220516.png)

banners のレスポンス型に存在しない hrefs というフィールド名の指定にちゃんと警告が表示されているでしょうか。警告を確認できたら`hrefs`を正しいフィールド名の`href`へ修正しておきましょう。次は既存の`graphql/schema/typeDefs.graphql`を表示してみましょう。

![](https://storage.googleapis.com/zenn-user-upload/91702ce0e2a2-20220516.png)

概要コメントを付けるよう注意されているので追加しておきます。

```diff graphql:graphql/schema/typeDefs.graphql
+"""
+クエリーの一覧
+"""
type Query {
  status(id: ID!): Status
  statuses: [Status]!
  banners(groupId: ID!): [Banner]!
}

+"""
+つぶやき
+"""
type Status {
  id: ID!
  body: String!
  author: Author
  createdAt: String!
}

+"""
+作者
+"""
type Author {
  id: ID!
  name: String!
}

+"""
+バナー
+"""
type Banner {
  id: ID!
  groupId: ID!
  href: String
}

```

- [このセクションのサンプルコード](https://github.com/oubakiou/100perts/tree/94e7e1c2b25dda2f39cce8baba2e53695aa3101e/v0.1.1/helloworld-app)
- [前回との差分](https://github.com/oubakiou/100perts/compare/21da2f5e3cbf54621dbb6b404dce180c579eb60d...94e7e1c2b25dda2f39cce8baba2e53695aa3101e)

# GraphQL クライアントを Next.js のサーバーサイドで使ってみよう

クエリーファイルが出来たので今度はこれを実際に Next.js から使ってみましょう。

:::details コラム：Query をどう配置するか？Fragment Colocation という考え方
本書では最上位のコンポーネントであるページコンポーネントと対応させたクエリーだけを配置しました。これはトップダウンの考え方に基づいていると言えますが、逆にボトムアップなアプローチもあります。

```graphql
fragment AuthorNamePart on Author {
  id
  name
}
```

GraphQL Query にはデータ構造の一部分を切り出して定義する[Fragment](https://graphql.org/learn/queries/#fragments)と呼ばれる機能があります。**Fragment Colocation**というアプローチでは個々の末端コンポーネントが必要とするデータ構造(props)をこの Fragment で定義してそのコンポーネントとセットで配置し、実際に発行する Query はそのページで利用するコンポーネントに応じた Fragment を集めて書きます。

Fragment Colocation ではコンポーネントとクエリーとの物理的な位置が近いため個々のコンポーネントの変更に伴うクエリーの変更漏れが起こりにくく、余分なデータの取得(オーバーフェッチ)も起こりにくい等のメリットがあります。なお Apollo Client と並んで人気がある GraphQL クライアントの[Relay](https://github.com/facebook/relay)では Fragment Colocation が基本方針となっています。
:::

GraphQL クライアントライブラリと、クエリーファイルから TypeScript コードと型を生成するためのプラグインをインストールします。

```shell
npm install @apollo/client
```

```shell
npm install --save-dev @graphql-codegen/typescript-react-apollo @graphql-codegen/typescript-operations
```

必要なパッケージをインストールしたら codegen.json に設定を追加しましょう。

```diff json:codegen.json
{
  "generates": {
    "./graphql/generated/resolvers-types.ts": {
      "schema": "./graphql/schema/typeDefs.graphql",
      "config": {
        "mapperTypeSuffix": "Ts",
        "mappers": {
          "Status": "../resolvers#Status",
          "Author": "../resolvers#Author"
        }
      },
      "plugins": ["typescript", "typescript-resolvers"]
    },
    "./graphql/generated/schema.graphql": {
      "schema": "http://localhost:3000/api/graphql",
      "plugins": ["schema-ast"]
    },
+    "./graphql/generated/operations.ts": {
+      "schema": "http://localhost:3000/api/graphql",
+      "documents": "./graphql/operations/**/*.graphql",
+      "plugins": [
+        "typescript",
+        "typescript-operations",
+        "typescript-react-apollo"
+      ]
+    }
  }
}

```

再びコード生成を実行します。

```shell
npm run gen
```

`graphql/generated/operations.ts`というファイルが生成されたでしょうか。これにはクエリーファイルから生成された型定義や React からクエリーを便利に扱うための[独自フック](https://ja.reactjs.org/docs/hooks-custom.html)の実装が含まれています。続けて Apollo Client を環境変数と使うため下記のファイルを作成します。

```ts:graphql/apollo-client.ts
import { ApolloClient, InMemoryCache } from '@apollo/client'

const endpointUrl = process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT_URL

export const apolloClient = new ApolloClient({
  uri: endpointUrl,
  cache: new InMemoryCache(),
})

```

```diff txt:.env
XDG_CONFIG_HOME=.config
API_ROOT=http://localhost:3000/
+NEXT_PUBLIC_GRAPHQL_ENDPOINT_URL=http://localhost:3000/api/graphql

```

それでは StatusPage のサーバーサイド処理から Apollo Client を使ってみましょう。SWR ヘッダの設定についてはページコンポーネントの見通しが悪くなるので、これを機に分割してします。

```ts:src/utils.ts
import { GetServerSidePropsContext } from 'next'
import { ParsedUrlQuery } from 'querystring'

export const setSwrHeader = (
  context: GetServerSidePropsContext<ParsedUrlQuery>,
  sMaxAgeSec: number,
  swrSec: number
): void => {
  context.res.setHeader(
    'Cache-Control',
    `public, s-maxage=${sMaxAgeSec}, stale-while-revalidate=${swrSec}`
  )
}

export const sec = {
  fromMinutes: (m: number): number => 60 * m,
  fromHours: (h: number): number => 3600 * h,
  fromDays: (d: number): number => 86400 * d,
}
```

```tsx:pages/statuses/[id].tsx
import type { GetServerSideProps, NextPage } from 'next'
import Head from 'next/head'
import { BirdHouseLayout } from '@/atoms/layouts/BirdHouseLayout'
import { StatusCard } from '@/moleclues/StatusCard'
import {
  StatusPagePropsDocument,
  StatusPagePropsQuery,
} from 'graphql/generated/operations'
import { sec, setSwrHeader } from 'src/utils'
import { apolloClient } from 'graphql/apollo-client'

type StatusPageProps = Omit<StatusPagePropsQuery, 'status'> & {
  status: NonNullable<StatusPagePropsQuery['status']>
}

export const getServerSideProps: GetServerSideProps<StatusPageProps> = async (
  context
) => {
  if (typeof context.query.id !== 'string') {
    return { notFound: true }
  }

  setSwrHeader(context, sec.fromMinutes(10), sec.fromDays(30))
  try {
    const props = await fetchProps(context.query.id)
    return { props }
  } catch {
    return { notFound: true }
  }
}

// GraphQLでのデータ取得
const fetchProps = async (statusId: string) => {
  const result = await apolloClient.query<StatusPagePropsQuery>({
    query: StatusPagePropsDocument,
    variables: { statusId: statusId, bannerGroupId: '1' },
  })
  const status = result.data.status
  if (!status) {
    throw new Error('status not found')
  }

  return { ...result.data, status }
}

const StatusPage: NextPage<StatusPageProps> = ({ status }) => (
  <BirdHouseLayout>
    <>
      <Head>
        <title>{status.body}</title>
        <meta property="og:title" content={status.body} key="ogtitle" />
      </Head>
      <StatusCard
        {...status}
        author={status.author?.name ?? 'John Doe'}
        linkEnabled={false}
      />
    </>
  </BirdHouseLayout>
)

export default StatusPage

```

ページコンポーネントのコードから順番に見てみましょう。

```ts
type StatusPageProps = Omit<StatusPagePropsQuery, 'status'> & {
  status: NonNullable<StatusPagePropsQuery['status']>
}
```

`StatusPagePropsQuery`という型は`StatusPageProps.graphql`を元に`operations.ts`へ自動生成された型です。両者を見比べてみましょう。

```graphql:graphql/operations/query/StatusPageProps.graphql
query StatusPageProps($statusId: ID!, $bannerGroupId: ID!) {
  status(id: $statusId) {
    id
    body
    author {
      id
      name
    }
    createdAt
  }
  banners(groupId: $bannerGroupId) {
    id
    href
  }
}

```

```ts:graphql/generated/operations.ts
export type StatusPagePropsQuery = {
  __typename?: 'Query',
  status?: {
    __typename?: 'Status',
    id: string,
    body: string,
    createdAt: string,
    author?: {
      __typename?: 'Author',
      id: string,
      name: string
    } | null
  } | null,
  banners: Array<{
    __typename?: 'Banner',
    id: string,
    href?: string | null
  } | null>
};

```

`__typename`は[同じ構造の型があった時に両者が混同されてしまう](https://typescript-jp.gitbook.io/deep-dive/main-1/nominaltyping#intfsuno)のを区別するため自動生成されているプロパティです。なお Apollo Client のデフォルト設定では`__typename`は`id`と合わせる事で[クライアントサイドキャッシュの管理](https://www.apollographql.com/docs/react/caching/overview/#2-generate-cache-ids)にも使われます。

StatusPageProps の型定義に戻りましょう。

```ts
type StatusPageProps = Omit<StatusPagePropsQuery, 'status'> & {
  status: NonNullable<StatusPagePropsQuery['status']>
}
```

ここで登場している`Omit<Type, Keys>`と`NonNullable<Type>`は[ユーティリティ型](https://www.typescriptlang.org/docs/handbook/utility-types.html)と呼ばれているものです。`Omit<Type, Keys>`は Type 型から Keys で指定した名前のプロパティを取り除いた新しい型を、`NonNullable<Type>`は Type 型から null 可能性を削除した新しい型を得る事ができます。

また`&`は交差型(Intersection Type)を使うための記法です。交差型を使うと２つの型を合成したような型を作り出す事ができます。

```ts:例
type Pet = { name: string }
type Dog = { breedName: string }
type PetDog = Pet & Dog
// type PetDog = { name: string; breedName: string }と同義
```

これらを組合せて何をしているかをまとめると「StatusPagePropsQuery 型を素材にして status プロパティが非 null な StatusPageProps 型を新しく作っている」という事になります。こういった[既に存在する型を素材に新しい型を作る操作](https://www.typescriptlang.org/docs/handbook/2/types-from-types.html)は上手く使うと開発をする上での型の運用を大幅に効率化してくれます。標準で用意されているユーティリティー型以外にも例えば[type-fest](https://github.com/sindresorhus/type-fest)のような型ライブラリも存在するため記憶に留めておくと良いでしょう。

型の話はこれぐらいにして実装を見てみましょう。

```ts
// GraphQLでのデータ取得
const fetchProps = async (statusId: string) => {
  const result = await apolloClient.query<StatusPagePropsQuery>({
    query: StatusPagePropsDocument,
    variables: { statusId: statusId, bannerGroupId: '1' },
  })
  const status = result.data.status
  if (!status) {
    throw new Error('status not found')
  }

  return { ...result.data, status }
}
```

apolloClient へ渡している`StatusPagePropsDocument`は`StatusPageProps.graphql`の TypeScript 表現でありクエリーそのものです。なお最後の return で新しくオブジェクトを生成してから返しているのは status プロパティが null チェック済であり非 null である事を明確にするためです。

変更が終わったら下記を表示して、これまで通りのページが表示されている事を確認してみましょう。

[http://localhost:3000/statuses/1](http://localhost:3000/statuses/1)

![](https://storage.googleapis.com/zenn-user-upload/ea9dd77f2690ec2520cbc55a.png)

- [このセクションのサンプルコード](https://github.com/oubakiou/100perts/tree/21d6f02113eb08597e364ba31a4c5131bf08a112/v0.1.1/helloworld-app)
- [前回との差分](https://github.com/oubakiou/100perts/compare/94e7e1c2b25dda2f39cce8baba2e53695aa3101e...21d6f02113eb08597e364ba31a4c5131bf08a112)

# GraphQL クライアントを Next.js のクライアントサイドで使ってみよう

前章ではサーバーサイド(Node.js)から GraphQL サーバーへアクセスしましたが、次はクライアントサイド(ブラウザ)から Hooks を通じて GraphQL サーバーへアクセスしてみましょう。

```diff tsx:pages/_app.tsx
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
+import { ApolloProvider } from '@apollo/client'
+import { apolloClient } from 'graphql/apollo-client'

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
+    <ApolloProvider client={apolloClient}>
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
+    </ApolloProvider>
  )
}

export default MyApp

```

以上で準備は終了です。

それでは以下のクエリーを追加してコード生成をしましょう。

```graphql:graphql/operations/query/HomePageProps.graphql
query HomePageProps($bannerGroupId: ID!) {
  statuses {
    id
    body
    author {
      id
      name
    }
    createdAt
  }
  banners(groupId: $bannerGroupId) {
    id
    href
  }
}

```

```shell
npm run gen
```

続けて HomePage を下記のように変更しましょう。

```tsx:pages/index.tsx
import { NextPage } from 'next'
import Head from 'next/head'
import { Backdrop, Box, CircularProgress, Typography } from '@mui/material'
import { BirdHouseLayout } from '@/atoms/layouts/BirdHouseLayout'
import { StatusCard } from '@/moleclues/StatusCard'
import { useHomePagePropsQuery } from 'graphql/generated/operations'

const HomePage: NextPage = () => {
  const { loading, error, data } = useHomePagePropsQuery({
    variables: { bannerGroupId: '1' },
  })

  if (loading) {
    return (
      <Backdrop open={true}>
        <CircularProgress />
      </Backdrop>
    )
  }

  if (error) {
    return (
      <Backdrop open={true}>
        <Typography>エラーが発生しました</Typography>
      </Backdrop>
    )
  }

  return (
    <BirdHouseLayout currentRouteName="home">
      <>
        <Head>
          <title>最新ステータス</title>
          <meta property="og:title" content="最新ステータス" key="ogtitle" />
        </Head>
        {data?.statuses.map(
          (status) =>
            status && (
              <Box key={status.id} pb={2}>
                <StatusCard
                  {...status}
                  author={status.author?.name ?? 'John Doe'}
                />
              </Box>
            )
        )}
      </>
    </BirdHouseLayout>
  )
}

export default HomePage

```

`useHomePagePropsQuery`は`HomePageProps.graphql`から生成された Hooks です。`useHomePagePropsQuery`は通信の進捗に応じて左辺の`{ loading, error, data }`を変化させるので、その変化に応じてどういったパターンのコンポーネントを返すのかを記述します。

変更を保存したら表示を確認してみましょう。

[http://localhost:3000/](http://localhost:3000/)

![](https://storage.googleapis.com/zenn-user-upload/cc424f7238fc765cdec86c7b.png)

F12 キーを押してデベロッパーツールを開き「Network」の「XHR」で、ブラウザと GraphQL サーバーとの間の通信も確認してみましょう。

![](https://storage.googleapis.com/zenn-user-upload/45eb5b598e9382cb6584b78e.png)

`Preview`タブで GraphQL サーバーからのレスポンスを確認する事ができます。

![](https://storage.googleapis.com/zenn-user-upload/003abc6cbd4efb2d076c3f9b.png)

- [このセクションのサンプルコード](https://github.com/oubakiou/100perts/tree/d9223b19f6691413d1b4c30596a7ef0b8fb6ed7f/v0.1.1/helloworld-app)
- [前回との差分](https://github.com/oubakiou/100perts/compare/21d6f02113eb08597e364ba31a4c5131bf08a112...d9223b19f6691413d1b4c30596a7ef0b8fb6ed7f)
