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
    status(_parent, args) {
      return getStatus(args?.id) ?? null
    },
  },
}
const listStatuses = (): Status[] => statuses
const getStatus = (id: string): Status | undefined =>
  statuses.find((d) => d.id === id)

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
