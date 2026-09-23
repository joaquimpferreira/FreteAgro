// app/(auth)/_layout.tsx
// Stack navigator for unauthenticated screens.
// No auth guard — reachable when unauthenticated.
//
// The connectivity banner is gone from here: sign-in genuinely needs the
// network, so an offline state is reported by the sign-in attempt itself,
// where the driver can act on it. A persistent banner over a login form tells
// him something is wrong before he has done anything.

import { View } from 'react-native'
import { Stack } from 'expo-router'
import { makeStyles } from '../../lib/theme/ThemeProvider'

export default function AuthLayout() {
  const styles = useStyles()

  return (
    <View style={styles.container}>
      <Stack screenOptions={{ headerShown: false }} />
    </View>
  )
}

const useStyles = makeStyles(({ colors }) => ({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
}))
