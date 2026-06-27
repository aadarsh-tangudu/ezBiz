import { ClientOnly, IconButton, Skeleton } from "@chakra-ui/react"
import { useTheme } from "next-themes"
import * as React from "react"
import { Sun, Moon } from "lucide-react"

export function ColorModeProvider(props) {
  return (
    <ThemeProvider
      attribute="class"
      disableTransitionOnChange
      {...props}
    />
  )
}

export function useColorMode() {
  const { theme, setTheme } = useTheme()
  const toggleColorMode = () => {
    setTheme(theme === "light" ? "dark" : "light")
  }
  return {
    colorMode: theme,
    setColorMode: setTheme,
    toggleColorMode,
  }
}

export function useColorModeValue(light, dark) {
  const { colorMode } = useColorMode()
  return colorMode === "light" ? light : dark
}

export const ColorModeButton = React.forwardRef(
  function ColorModeButton(props, ref) {
    const { toggleColorMode, colorMode } = useColorMode()
    return (
      <ClientOnly fallback={<Skeleton boxSize="8" />}>
        <IconButton
          onClick={toggleColorMode}
          variant="ghost"
          aria-label="Toggle color mode"
          size="sm"
          ref={ref}
          {...props}
        >
          {colorMode === "light" ? <Moon size={16} /> : <Sun size={16} />}
        </IconButton>
      </ClientOnly>
    )
  },
)
