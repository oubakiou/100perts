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
