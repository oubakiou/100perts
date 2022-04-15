import { FC } from 'react'
import { Box, SxProps, useTheme } from '@mui/material'

export const MediumRectangleDummyBanner: FC = () => {
  const theme = useTheme()
  const style: SxProps = {
    width: '300px',
    height: '250px',
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    textAlign: 'center',
    lineHeight: '250px',
  }

  return <Box sx={style}>FOR SALE</Box>
}
