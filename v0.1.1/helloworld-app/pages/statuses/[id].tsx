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
