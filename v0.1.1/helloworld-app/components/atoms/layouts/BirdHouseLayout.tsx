import { FC } from 'react'
import { Box } from '@mui/material'
import { PermanentLeftDrawer } from '@/atoms/PermanentLeftDrawer'
import { NavigationList } from '@/moleclues/NavigationList'
import { TwoColumnLayout } from '@/atoms/layouts/TwoColumnLayout'
import { VerticalBanners } from '@/moleclues/VerticalBanners'

type BirdHouseLayoutProps = {
  children: JSX.Element
  currentRouteName?: string
}

export const BirdHouseLayout: FC<BirdHouseLayoutProps> = ({
  children,
  currentRouteName,
}) => (
  <Box sx={{ display: 'flex' }}>
    <PermanentLeftDrawer>
      <NavigationList currentRouteName={currentRouteName} />
    </PermanentLeftDrawer>
    <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
      <TwoColumnLayout rightColumnContents={<VerticalBanners />}>
        {children}
      </TwoColumnLayout>
    </Box>
  </Box>
)
