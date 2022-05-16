import { GetServerSidePropsContext } from 'next'
import { ParsedUrlQuery } from 'querystring'

export const setSwrHeader = (
  context: GetServerSidePropsContext<ParsedUrlQuery>,
  sMaxAgeSec: number,
  swrSec: number
): void => {
  context.res.setHeader(
    'Cache-Control',
    `public, s-maxage=${sMaxAgeSec}, stale-while-revalidate=${swrSec}`
  )
}

export const sec = {
  fromMinutes: (m: number): number => 60 * m,
  fromHours: (h: number): number => 3600 * h,
  fromDays: (d: number): number => 86400 * d,
}
