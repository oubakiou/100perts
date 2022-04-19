import { FC } from 'react'
import { Box } from '@mui/material'
import { MediumRectangleDummyBanner } from '@/atoms/banners/MediumRectangleDummy'

export const VerticalBanners: FC = () => (
  <Box component="div">
    <Box pb={2}>
      <MediumRectangleDummyBanner />
    </Box>
    <Box>
      <MediumRectangleDummyBanner />
    </Box>
  </Box>
)
