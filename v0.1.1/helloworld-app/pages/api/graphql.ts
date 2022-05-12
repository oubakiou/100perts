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
    status(id: ID!): Status
  }

  type Status {
    id: String!
    body: String!
    author: Author!
    createdAt: String!
  }

  type Author {
    id: ID!
    name: String!
  }
`

// スキーマを実際に動作させるリゾルバー(実装)
const resolvers: Config['resolvers'] = {
  Query: {
    statuses() {
      return listStatuses()
    },
    status(_parent, args) {
      return getStatus(args?.id) ?? null
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
