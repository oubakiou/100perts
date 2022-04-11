import type { GetServerSideProps, NextPage } from 'next'

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
  return (
    <p>
      このページのIDは{props.id}で言語は{props.lang}です
    </p>
  )
}

export default StatusPage
