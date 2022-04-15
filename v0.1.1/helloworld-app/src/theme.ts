import { createTheme, ThemeOptions } from '@mui/material/styles'

const themeOptions: ThemeOptions = {
  palette: {
    primary: {
      main: '#1DA1F2',
      contrastText: '#FFFFFF',
    },
  },
}

export const Theme = createTheme(themeOptions)
