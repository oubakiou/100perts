import { ApolloServer } from 'apollo-server-micro'
import {
  ApolloServerPluginLandingPageGraphQLPlayground,
  ApolloServerPluginLandingPageDisabled,
} from 'apollo-server-core'
import { NextApiRequest, NextApiResponse } from 'next'
import typeDefs from 'graphql/schema/typeDefs.graphql'
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
