# MySQL コンテナを準備してみよう

ここまでの章ではソースコード上にハードコーディングされたデータを扱ってきました。しかし我々もそろそろデータベースを扱うべき時期です。Firebase プラットフォームでは[Firestore](https://firebase.google.com/docs/firestore?hl=ja)のようなドキュメント指向データベースを提供していますが、今回はリレーショナル・データベース(RDB)として代表的な製品の一つである[MySQL](https://www.mysql.com/jp/)を扱います。

:::details コラム：RDB と Firestore、どちらを使うべきか
伝統的な RDB にはデータの整合性を保証するための様々な機能、プログラミング無しでも宣言的にデータを扱える柔軟で強力な SQL など Firestore には無い利点が数多くあります。例えば Firestore では整合性制約やスキーマに相当するものはデータベースの機能として提供されていないため、データの整合性についてアプリケーション側でより多くの責任(や実装)を持つ事になります。

それでは逆に Firestore を選ぶべき理由にはどういったものがあるのでしょうか。最も大きいものは２つあると筆者は考えています。

### RDB よりもスケールしやすい

極端に負荷が高い環境下では、RDB サーバーのインスタンス性能を上げていくスケールアップだけでは対応できなくなる場面があります。そういった場合に RDB では Read 負荷であればレプリケーションと呼ばれる機能や、Write 負荷であればテーブルの水平/垂直分割(シャーディング)で複数台構成にする事で対応していく事があります。しかしシャーディングを採用する場合には最初に挙げていた RDB の利点がかなり制限されます。

Firestore ではデータ設計にも影響するいくつかの独特な制限(例えば[同一ドキュメントに対しては 1 秒当たり 1 回までの書き込みに抑える事が推奨されている](https://firebase.google.com/docs/firestore/best-practices?hl=ja#updates_to_a_single_document)等)はあるものの、利用者がサーバーの存在を意識する事はあまりなく性能に関しても比較的スムーズにスケールするようになっています。例えばチャットサービスのような極端に高い Write 負荷が予想される機能でかつ利用者数も多い想定あれば、最初から Firestore で構築してしまうのも一つの手でしょう。

### RDB よりも安い

[Cloud SQL](https://cloud.google.com/sql?hl=ja)や[RDS](https://aws.amazon.com/jp/rds/)のようないわゆるフルマネージドな RDB サービスでは、ほとんど DB 問い合わせが発生しないサービスであっても月額 1000 円程度は最低額として発生してしまいます。(セルフマネージが可能であれば[GCE](https://cloud.google.com/compute?hl=ja)や[EC2](https://aws.amazon.com/jp/ec2/)上で RDB を自力運用するのは比較的安価な選択肢になり得ます)また本格的なサービスでメモリや CPU を多く積んだハイスペックな RDB インスタンスを運用しようとすると一般的に高額になります。

Firestore の場合はそもそも料金モデルが一般的なフルマネージド RDB とは異なり、実際に読み書きしたドキュメント(RDB におけるレコード)の数などに基づいた、より実際の使用量に即したモデルになっています。アプリケーションやデータ構造の設計次第という部分も大きく単純比較が出来るわけでは有りませんが、筆者の経験上 RDB に対して一桁や二桁安くなる事がままあります。ホビー用途であれば多くの場合は無料枠の中で収まるでしょう。

:::

[MySQL のオフィシャルイメージ](https://hub.docker.com/_/mysql)を利用します。Docker がインストールされた状態で下記を実行しましょう。

```shell
docker pull mysql:8.0.29
```

続けてこのコンテナの設定として下記の[docker-compose.yml](https://docs.docker.com/compose/compose-file/compose-versioning/#version-38)を作成します。

```yml:docker-compose.yml
# https://docs.docker.com/compose/compose-file/compose-versioning/#version-38
version: '3.8'
services:
  db:
    image: mysql:8.0.29
    # caching_sha2_passwordから旧来のmysql_native_passwordへ変更
    command: --default-authentication-plugin=mysql_native_password
    restart: always
    env_file: .env
    ports:
    - 3306:3306
```

また docker-compose.yml で扱う環境変数として下記を.env へ追加しましょう。

```diff shell:.env
XDG_CONFIG_HOME=.config
API_ROOT=http://localhost:3000/
NEXT_PUBLIC_GRAPHQL_ENDPOINT_URL=http://localhost:3000/api/graphql
+MYSQL_ROOT_PASSWORD=example
+MYSQL_DATABASE=helloworld-db
```

それでは docker-compose.yml のあるディレクトリへ移動して起動してみましょう。

```
docker-compose up
```

`[Server] /usr/sbin/mysqld: ready for connections.`というメッセージが表示されたら MySQL Workbench を起動して接続の確認をします。

![](https://storage.googleapis.com/zenn-user-upload/6767f0ee6491596b0ebb52d5.png)

docker-compose.yml の設定をもとに接続情報を入力し`Test Connection`をクリックします。パスワードは.env で設定したものを入力しましょう。

![](https://storage.googleapis.com/zenn-user-upload/93c450dfd6b558e798c9f78f.png)

`Successfully made the MySQL connection`というメッセージが表示されれば接続成功です。

- [このセクションのサンプルコード](https://github.com/oubakiou/100perts/tree/4941849463c652f30cf9be4bea648cee7f0e3acd/v0.1.1/helloworld-app)
- [前回との差分](https://github.com/oubakiou/100perts/compare/d9223b19f6691413d1b4c30596a7ef0b8fb6ed7f...4941849463c652f30cf9be4bea648cee7f0e3acd)

# Prisma をセットアップしてみよう

Prisma は

- Prisma Client(型安全なクエリービルダーを含む DB クライアント)
- Prisma Migrate(DB マイグレーションツール)
- Prisma Studio(DB 操作用 GUI)

などを提供しているプロジェクトです。本書では Prisma Client と Prisma Migrate を扱います。さっそく下記を実行してみましょう。

```shell
npm install --save-dev prisma
```

インストールが終わったら下記でセットアップを走らせます。

```shell
npx prisma init
```

init が終わると prisma ディレクトリが作成され、また.env には下記のような追記がされているはずです。

```diff shell:.env
XDG_CONFIG_HOME=.config
NEXT_PUBLIC_API_ROOT=http://localhost:3000
MYSQL_ROOT_PASSWORD=example
MYSQL_DATABASE=helloworld-db

+# This was inserted by `prisma init`:
+# Environment variables declared in this file are automatically made available to Prisma.
+# See the documentation for more detail: https://pris.ly/d/prisma-schema#using-environment-variables
+
+# Prisma supports the native connection string format for PostgreSQL, MySQL, SQLite, SQL Server (Preview) and MongoDB (Preview).
+# See the documentation for all the connection string options: https://pris.ly/d/connection-strings
+
+DATABASE_URL="postgresql://johndoe:randompassword@localhost:5432/mydb?schema=public"
```

[DATABASE_URL](https://www.prisma.io/docs/reference/database-reference/connection-urls/)は接続情報を URL 形式で表現したものです。[MySQL 向け](https://www.prisma.io/docs/concepts/database-connectors/mysql)に修正しましょう。

```diff shell:.env
-DATABASE_URL="postgresql://johndoe:randompassword@localhost:5432/mydb?schema=public"
+DATABASE_URL="mysql://root:example@localhost:3306/helloworld-db"
```

- [このセクションのサンプルコード](https://github.com/oubakiou/100perts/tree/898dc9fc06d890d5762865aa85fa08a77e50c7f9/v0.1.1/helloworld-app)
- [前回との差分](https://github.com/oubakiou/100perts/compare/4941849463c652f30cf9be4bea648cee7f0e3acd...898dc9fc06d890d5762865aa85fa08a77e50c7f9)

# Prisma スキーマを書いてみよう

Prisma では[Prisma Schema Language](https://www.prisma.io/docs/concepts/components/prisma-schema)(以下 PSL と呼びます)という独自形式を用いてデータ構造を記述し、それを元に型安全な DB クライアントである[Prisma クライアント](https://www.prisma.io/docs/concepts/components/prisma-client)を生成したり、[Prisma マイグレート](https://www.prisma.io/docs/concepts/components/prisma-migrate)経由で RDB 上のテーブルを生成したりする事ができます。
([Introspection](https://www.prisma.io/docs/concepts/components/introspection)という機能で RDB へ接続し、既存テーブル情報から Prisma スキーマを生成して利用する SQL ファーストなワークフローも可能です)

それでは早速 PSL でスキーマを書いてみましょう。

```protobuf:prisma/schema.prisma
datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id        String    @id @default(cuid())
  name      String
  createdAt DateTime? @default(now())
  Status    Status[]
}

model Status {
  id        String    @id @default(cuid())
  author    User      @relation(fields: [authorId], references: [id])
  authorId  String
  body      String
  createdAt DateTime? @default(now())
}

model BannerGroup {
  id        String    @id @default(cuid())
  name      String
  createdAt DateTime? @default(now())
  Banner    Banner[]
}

model Banner {
  id            String      @id @default(cuid())
  bannerGroup   BannerGroup @relation(fields: [bannerGroupId], references: [id])
  bannerGroupId String
  href          String?
  createdAt     DateTime?   @default(now())
}
```

なお VScode で Prisma スキーマ保存時のオートフォーマットを有効化するため下記のように settings.json を変更しておきましょう。

```diff json:.vscode/settings.json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": false
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.preferences.importModuleSpecifier": "non-relative",
+  "[prisma]": {
+    "editor.defaultFormatter": "Prisma.prisma"
+  }
}
```

schema.prisma が保存できたら下記を実行します。

```shell
npx prisma migrate dev --name init
```

実行が終わると prisma/migrations というディレクトリが作成されているはずです。

![](https://storage.googleapis.com/zenn-user-upload/9f364f41a1b6-20220518.png)

PSL からどういった SQL が生成されるか、その中の migration.sql を見てみましょう。

```sql:migration.sql
-- CreateTable
CREATE TABLE `User` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Status` (
    `id` VARCHAR(191) NOT NULL,
    `authorId` VARCHAR(191) NOT NULL,
    `body` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BannerGroup` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Banner` (
    `id` VARCHAR(191) NOT NULL,
    `bannerGroupId` VARCHAR(191) NOT NULL,
    `href` VARCHAR(191),
    `createdAt` DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Status` ADD FOREIGN KEY (`authorId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Banner` ADD FOREIGN KEY (`bannerGroupId`) REFERENCES `BannerGroup`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
```

`prisma migrate dev`の実行によってこれらの SQL 生成と同時に DB への適用も行われています。MySQL workbench からも実体を確認してみましょう。

![](https://storage.googleapis.com/zenn-user-upload/701871669dfa2c266d51097b.png)

なおマイグレーションの作成のみを実行し DB への適用をしたくない場合は`--create-only`を付けると良いでしょう。

さて、それでは schema.prisma に戻って上から見ていきます。

```protobuf
datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}
```

[datasource](https://www.prisma.io/docs/concepts/components/prisma-schema/data-sources)では接続する RDB について設定します。ここでは.evn で定義していた DATABASE_URL を利用しています。

```protobuf
generator client {
  provider = "prisma-client-js"
}
```

[generator](https://www.prisma.io/docs/concepts/components/prisma-schema/generators)はコード生成に関する設定です。ここでは前述した型安全な DB クライアントである Prisma クライアントの生成を指示しています。また今回は利用しませんが DB クライアント以外にもコミュニティが提供している[generator](https://www.prisma.io/docs/concepts/components/prisma-schema/generators#community-generators)等を利用して様々なコードやドキュメント等を生成する事もできます。

```protobuf
model User {
  id        String    @id @default(cuid())
  name      String
  createdAt DateTime? @default(now())
  Status    Status[]
}

model Status {
  id        String    @id @default(cuid())
  author    User      @relation(fields: [authorId], references: [id])
  authorId  String
  body      String
  createdAt DateTime? @default(now())
}

model BannerGroup {
  id        String    @id @default(cuid())
  name      String
  createdAt DateTime? @default(now())
  Banner    Banner[]
}

model Banner {
  id            String       @id @default(cuid())
  bannerGroup   BannerGroup  @relation(fields: [bannerGroupId], references: [id])
  bannerGroupId String
  href          String?
  createdAt     DateTime?    @default(now())
}
```

[model](https://www.prisma.io/docs/concepts/components/prisma-schema/data-model)はスキーマ記述の本体です。この定義に従って Prisma クライアントが扱う型や、RDB 上の実テーブルなどが生成される事になります。

### PSL におけるプリミティブ型について

例えば String 型は、利用しているのが[MySQL であれば varchar(191)](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference#string)としてデフォルトマッピングされます。これを変更したい場合は

```
body   String @db.MediumText
```

のように指定する事になります。(MEDIUMTEXT は MySQL 固有のカラム型です)

:::details コラム：なぜ 191 文字なのか
MySQL(InnoDB+Antelope)の場合、単一カラムインデックスを作る際に[標準では 767 バイトまでのキー長しか扱えません](https://yakst.com/ja/posts/734)。これを越えた場合

```
ERROR 1071 (42000): Specified key was too long; max key length is 767 bytes
```

というエラーを目にする事になります。

絵文字も表現可能な utf8mb4 を利用する場合は 1 文字で 4 バイトを消費するため、インデックスを作成する場合には 191 文字(`4*191=764`)が安全な最大文字数という事になります。なお扱う UTF-8 が 3 バイト(utf8mb3)だった時代には 255 文字(`3*255=765`)がデフォルトの最大値として利用されていました。
:::

### PSL における@relation について

@relation を使う事で model 同士の関係性を記述する事ができ、RDB 上は外部キーが作成されます。

```protobuf
model User {
  id        String    @id @default(cuid())
  name      String
  createdAt DateTime? @default(now())
  Status    Status[]
}

model Status {
  id        String    @id @default(cuid())
  author    User      @relation(fields: [authorId], references: [id])
  authorId  String
  body      String
  createdAt DateTime? @default(now())
}
```

例えば「1 つの User が複数(N 個)の Status を持っている」という 1:N の関係を表現する場合、Status 側にはその Status の作者が誰なのかを示す User 型のフィールドを持ち、User 側には Status[]型を持つことになります。

```
author    User     @relation(fields: [authorId], references: [id])
```

これは`Status.authorId`と`User.id`を突き合わせる事で具体的な User を取ってくるという意味です。

- [このセクションのサンプルコード](https://github.com/oubakiou/100perts/tree/9a509422cd7f62ee46bd7b65b840476be577e9be/v0.1.1/helloworld-app)
- [前回との差分](https://github.com/oubakiou/100perts/compare/898dc9fc06d890d5762865aa85fa08a77e50c7f9...9a509422cd7f62ee46bd7b65b840476be577e9be)

# Prisma でマイグレーションしてみよう

ここで少しスキーマ定義の変更を試してみましょう。まずは PSL を変更します。

```diff protobuf
model Status {
  id        String   @id @default(cuid())
  author    User     @relation(fields: [authorId], references: [id])
  authorId  String
-  body      String
+  body      String    @db.MediumText
  createdAt DateTime? @default(now())
}
```

schema.prisma の変更が保存できたら再び prisma migrate dev コマンドを実行します。

```shell
npx prisma migrate dev --name to_mediumtext
```

![](https://storage.googleapis.com/zenn-user-upload/1f71b4b48f6b-20220518.png)

今度は to_mediumtext ディレクトリの migration.sql を確認してみましょう。

```sql
-- AlterTable
ALTER TABLE `Status` MODIFY `body` MEDIUMTEXT NOT NULL;
```

このようにスキーマ定義に変更があると、prisma migrate dev は最新のマイグレーションファイルからの差分として追加のマイグレーションファイルを作成してくれます。特にチーム開発であれば、スキーマ定義の変更がマイグレーションファイルとしてソースコードと同様に管理できるのは便利でしょう。他人が行ったスキーマ定義変更を自身の手元にある DB へ適用したい場合には`npx prisma migrate deploy`を実行しましょう。

- [このセクションのサンプルコード](https://github.com/oubakiou/100perts/tree/9b994ffcb073411212b6ad130de85cea95f6fac1/v0.1.1/helloworld-app)
- [前回との差分](https://github.com/oubakiou/100perts/compare/9a509422cd7f62ee46bd7b65b840476be577e9be...9b994ffcb073411212b6ad130de85cea95f6fac1)

# Prisma クライアントで seed(初期テストデータ)を作ってみよう

そろそろ Prisma クライアントを使って実際に DB からデータを取り出してみたい所ですが、そのためにはまず DB へデータを追加する必要があります。入力フォームを利用した DB へのデータ保存については次のセクションで説明しますが、今回は[seed](https://www.prisma.io/docs/guides/database/seed-database)と呼ばれる仕組みで初期テストデータを準備しましょう。

まずは seed ファイルの場所と実行方法を package.json に追加します。

```diff json:package.json
  "main": "firebaseFunctions.js",
+  "prisma": {
+    "seed": "ts-node prisma/seed.ts"
+  },
  "scripts": {
```

また seed を TypeScript で書いて実行するため ts-node を入れ tsconfig.json へ設定を追加します。

```
npm install --save-dev ts-node
```

```diff json:tsconfig.json
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
    "baseUrl": ".",
    "paths": {
      "@/*": ["components/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules"],
+  "ts-node": {
+    "compilerOptions": {
+      "module": "commonjs"
+    }
+  }
}

```

seed.ts 自体は単なる TypeScript ファイルです。PrismaClient を利用した通常のプログラムと同様にデータを作成するためのコードを記述します。

```ts:prisma/seed.ts
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const jack = await prisma.user.create({
    data: {
      name: 'jack',
      Status: {
        create: [
          {
            body: 'just setting up my app',
            createdAt: new Date('2006/03/22 11:00:00'),
          },
          {
            body: 'inviting coworkers',
            createdAt: new Date('2014/03/22 12:00:00'),
          },
          { body: 'MySQL server has gone away...?' },
        ],
      },
    },
  })
  console.log(`Created user with id: ${jack.id}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
```

{PrismaClient のインスタンス}.{テーブル名}.create の形で[create メソッド](https://www.prisma.io/docs/concepts/components/prisma-client/crud#create)を呼ぶ事で対象のテーブルへレコードを作成する事ができます。なお PrismaClient には PSL を元に生成された実装と型情報とが含まれているため

```ts:node_modules/.prisma/client/index.d.ts
  export type UserCreateInput = {
    name: string
    createdAt?: Date | string | null
    Status?: StatusCreateNestedManyWithoutAuthorInput
  }
```

例えば User に存在しないフィールドを誤って`prisma.user.create`へ渡そうとすると警告されます。

![](https://storage.googleapis.com/zenn-user-upload/be8791fa9be7eaa657248a5c.png)

さてそれでは seed を実行してみましょう。

```shell
npx prisma migrate reset
```

![](https://storage.googleapis.com/zenn-user-upload/add2597b74f8-20220518.png)

リセットに伴い既存のデータが失われる事に対する警告が表示されるので y を入力して進めます。最終的に以下のように表示されれば seed 処理は終了です。

```ts
Running seed command `ts-node prisma/seed.ts` ...
Created user with id: cl3bcb6ws0000y6pxwmbr7s7d

🌱  The seed command has been executed.
```

MySQL workbench からも直接データを確認してみましょう。

![](https://storage.googleapis.com/zenn-user-upload/b98b9c00381ff40a3aa98a83.png)

:::details コラム：主キーをどのように生成するべきか

そもそも「主キーにはナチュラルキーを使用するべきかサロゲートキーを使用するべきか」という有名な議論がありますが、筆者の見解としては「絶対にサロゲートキーを使うべき」です。そのサロゲートキーをどのように生成するべきか、というのがこのコラムでのお題です。

### RDB の機能で発番する

おそらく最もシンプルでメジャーな手法は RDB 自身が持つ機能で発番する方法です。MySQL や Oracle12c 以降であれば AUTO_INCREMENT、PostgreSQL であれば SERIAL 型といったものがあります。この手法の大きなデメリットとしては単一の DB が管理する発番機構ではスケールしないという点があります。(また GraphQL を前面で扱う場合の話ですが、GraphQL の[ID 型は String 型である必要がある](https://spec.graphql.org/draft/#sec-ID)のに対し AUTO_INCREMENT で発番された主キーは Int になるため ID を全てキャストする必要が発生する、Node Interface のため[全てのリソース間をまたがってグローバルにユニークな ID 体系が推奨されている](https://graphql.org/learn/global-object-identification/)などの相性の悪さもあります)

### 衝突耐性のあるアルゴリズムでアプリケーションが発番する

そこで単一の DB に発番させるのではなく、個々のアプリケーションに衝突耐性のあるロジックで分散発番させるという手法がとられる事があります。有名なものとしては[Snow Flake](https://github.com/twitter-archive/snowflake/tree/master)(現在はメンテナンス停止)、[ULID](https://github.com/ulid/spec)、[UUID](https://www.ietf.org/rfc/rfc4122.txt)といったアルゴリズムがあります。

なお UUID については衝突耐性はあるものの、連続性が低く MySQL での主キー利用にはあまり向いていないという注意点があります。(INSERT 時にアクセスするリーフページの局所性がないためインデックスサイズが大きくなるとキャッシュ外アクセスが頻発しやすい)

### Prisma でのサポート

現在の Prisma では UUID と[CUID](https://github.com/ericelliott/cuid)が[標準サポート](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference#cuid)されています。本書ではこのうち CUID を利用しています。

:::

- [このセクションのサンプルコード](https://github.com/oubakiou/100perts/tree/884e0187120c9b440655401b6086a07e7f72e128/v0.1.1/helloworld-app)
- [前回との差分](https://github.com/oubakiou/100perts/compare/9b994ffcb073411212b6ad130de85cea95f6fac1...884e0187120c9b440655401b6086a07e7f72e128)

# Prisma クライアントでデータを取り出してみよう

「GraphQL を使ってみよう」の章では Resolver からソースコード上にハードコーディングされたデータを扱っていました。この章の締めくくりとして、これを PrismaClient で MySQL から取得するよう変更してみましょう。

```typescript:graphql/resolvers.ts
import { Resolvers } from '@gql/generated/resolvers-types'
import { PrismaClient } from '@prisma/client'

export const resolvers: Resolvers = {
  Query: {
    status(_parent, args) {
      return getStatus(args.id) ?? null
    },
    statuses() {
      return listStatuses()
    },
    banners(_parent, args) {
      return listBanners(args.groupId)
    },
  },
  Status: {
    author: (parent) => {
      return getAuthor(parent.authorId) ?? null
    },
  },
}

const prisma = new PrismaClient()

const listStatuses = async () => {
  const statuses = await prisma.status.findMany({
    orderBy: { createdAt: 'desc' },
  })

  return statuses.map((status) => ({
    ...status,
    createdAt: status.createdAt?.toISOString(),
  }))
}

const getStatus = async (id: string) => {
  const status = await prisma.status.findUnique({ where: { id: id } })

  return { ...status, createdAt: status?.createdAt?.toISOString() }
}
const getAuthor = (id: string) => prisma.user.findUnique({ where: { id: id } })

const listBanners = async (groupId: string) => {
  const banners = await prisma.banner.findMany({
    where: { bannerGroupId: groupId },
  })

  // bannerGroupIdをgroupIdというフィールド名でマッピング
  return banners.map((banner) => ({ ...banner, groupId: banner.bannerGroupId }))
}

```

GraphQL 側のスキーマ(SDL)に変更はないため内部実装である Resolver を差し替えるだけです。

```
npm run dev
```

Next.js を起動して[http://localhost:3000/](http://localhost:3000/)にアクセスしてみましょう。

![](https://storage.googleapis.com/zenn-user-upload/d1ccbdd77fd2-20220518.png)

- [このセクションのサンプルコード](https://github.com/oubakiou/100perts/tree/85eb6f1e4b2bddd3b32603010e8f88cb98a28fa0/v0.1.1/helloworld-app)
- [前回との差分](https://github.com/oubakiou/100perts/compare/884e0187120c9b440655401b6086a07e7f72e128...85eb6f1e4b2bddd3b32603010e8f88cb98a28fa0)
