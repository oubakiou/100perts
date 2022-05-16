import { ApolloClient, InMemoryCache } from '@apollo/client'

const endpointUrl = process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT_URL

export const apolloClient = new ApolloClient({
  uri: endpointUrl,
  cache: new InMemoryCache(),
})
