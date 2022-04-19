import { FC } from 'react'
import { Grid } from '@mui/material'

type TwoColumnLayoutProps = {
  children: JSX.Element
  rightColumnContents: JSX.Element
}

export const TwoColumnLayout: FC<TwoColumnLayoutProps> = ({
  children,
  rightColumnContents,
}) => (
  <Grid container direction="row" spacing={2}>
    <Grid item xs>
      {children}
    </Grid>
    <Grid item xs>
      {rightColumnContents}
    </Grid>
  </Grid>
)
