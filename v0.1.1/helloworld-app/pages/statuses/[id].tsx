import type { GetServerSideProps, NextPage } from 'next'
import Head from 'next/head'

type StatusPageProps = { id: string; lang: string }

export const getServerSideProps: GetServerSideProps<StatusPageProps> = async (
  context
) => {
  const { id, lang } = context.query

  if (typeof id !== 'string') {
    return { notFound: true }
  }
  if (typeof lang !== 'string') {
    return { notFound: true }
  }

  return { props: { id, lang } }
}

const StatusPage: NextPage<StatusPageProps> = (props) => {
  const title = `このページのIDは${props.id}です`
  return (
      <Head>
        <title>{title}</title>
        <meta property="og:title" content={title} key="ogtitle" />
      </Head>
      <p>
        このページのIDは{props.id}で言語は{props.lang}です
      </p>
  )
}

export default StatusPage
