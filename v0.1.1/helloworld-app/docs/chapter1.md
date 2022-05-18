# 想定読者

本書では何らかの技術スタックにおいて既に Web アプリケーション開発を経験した事のある読者を対象としているため、初学者には不親切な箇所があります。0 から学びたい場合には初学者向け書籍「0 から分かる 100%TS」をお待ち下さい。

# 本書(上巻)に登場する主な技術スタック

本書で動作確認を行ったバージョンについてはサンプルコードの[package.json](https://github.com/oubakiou/100perts/blob/main/v0.1.1/helloworld-app/package.json#L17-L53)等を参照してください。学習に当たって必ずしも同一バージョンでなければいけないというわけではありません。

### TypeScript

JavaScript への変換が可能な静的型付き言語です。
https://www.typescriptlang.org/

### React

宣言的な View ライブラリです。
https://ja.reactjs.org/

### MUI

[マテリアルデザイン](https://material.io/design)を採用した React コンポーネント集です。
https://mui.com/

### Next.js

React をベースに、page コンポーネントの概念やファイルベースでのルーティング定義、SSR/SG/ISR などの機能を備えたフレームワークです。
https://nextjs.org/

### Apollo

[GraphQL](https://graphql.org/) Client の JavaScript 実装である Appolo Client や、GraphQL Server の JavaScript(Node.js)実装である Appolo Server 等を提供しているプロジェクトです。
https://www.apollographql.com/

### Prisma

RDB のスキーマを PSL(Prisma Schema Language)で定義し、マイグレーションや ORM 機能を提供するライブラリです。
https://www.prisma.io/

### Cloud Functions for Firebase

GCP(Firebase)における FaaS です。
https://firebase.google.com/docs/functions?hl=ja

### Firebase Hosting

GCP(Firebase)における静的ファイル配信サービスです。
https://firebase.google.com/docs/hosting?hl=ja

### MySQL

RDB です。

# Vercel について

本書では Firebase/GCP 系サービスを中心に採用しています。しかし中核ライブラリとして採用している Next.js には開発元である[Vercel 社による専用のホスティングサービス](https://nextjs.org/docs/deployment#managed-nextjs-with-vercel)が存在します。[無料のホビープラン](https://vercel.com/pricing)もあるので選択肢の一つとして検討するのも良いでしょう。

# 表紙は何？

Llama? No, it's a Guanaco
https://search.creativecommons.org/photos/998f1299-0d34-4dfb-a1e1-73e7f0d364a3

# 内容に誤りや誤字脱字などを見つけたら

[著者](https://twitter.com/oubakiou)までお知らせください。(必ずしも返信できるわけでは有りません)

# Releases

## v0.1.0 (2021/9/27)

- 初版

## v0.1.1 (2022/5/18)

- 古くなっている箇所の修正
- 取り扱っているバージョンを明記するよう変更
- サンプルコードの Github リポジトリ追加

## 下巻について

クリスマスまでには出版されることになっている
