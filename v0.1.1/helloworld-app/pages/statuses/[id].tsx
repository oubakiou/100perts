import type { GetServerSideProps, NextPage } from 'next'
import Head from 'next/head'
import { BirdHouseLayout } from '@/atoms/layouts/BirdHouseLayout'
import { StatusCard } from '@/moleclues/StatusCard'

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
    `${process.env.API_ROOT}/api/status/getStatus?id=${context.query.id}`
  )
  const statusData = (await res.json()) as unknown
  if (!isStatus(statusData)) {
    return { notFound: true }
  }

  const m = 60
  const h = 60 * m
  const d = 24 * h
  context.res.setHeader(
    'Cache-Control',
    `public, s-maxage=${10 * m}, stale-while-revalidate=${30 * d}`
  )

  return { props: { status: statusData } }
}

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

export default StatusPage
