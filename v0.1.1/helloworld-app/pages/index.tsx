import { NextPage } from 'next'
import Head from 'next/head'
import { Backdrop, Box, CircularProgress, Typography } from '@mui/material'
import { BirdHouseLayout } from '@/atoms/layouts/BirdHouseLayout'
import { StatusCard } from '@/moleclues/StatusCard'
import { useHomePagePropsQuery } from 'graphql/generated/operations'

const HomePage: NextPage = () => {
  const { loading, error, data } = useHomePagePropsQuery({
    variables: { bannerGroupId: '1' },
  })

  if (loading) {
    return (
      <Backdrop open={true}>
        <CircularProgress />
      </Backdrop>
    )
  }

  if (error) {
    return (
      <Backdrop open={true}>
        <Typography>エラーが発生しました</Typography>
      </Backdrop>
    )
  }

  return (
    <BirdHouseLayout currentRouteName="home">
      <>
        <Head>
          <title>最新ステータス</title>
          <meta property="og:title" content="最新ステータス" key="ogtitle" />
        </Head>
        {data?.statuses.map(
          (status) =>
            status && (
              <Box key={status.id} pb={2}>
                <StatusCard
                  {...status}
                  author={status.author?.name ?? 'John Doe'}
                />
              </Box>
            )
        )}
      </>
    </BirdHouseLayout>
  )
}

export default HomePage
