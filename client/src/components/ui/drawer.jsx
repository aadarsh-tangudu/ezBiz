import { Drawer as ChakraDrawer, Portal } from "@chakra-ui/react"
import * as React from "react"

export const DrawerRoot = ChakraDrawer.Root
export const DrawerTrigger = ChakraDrawer.Trigger
export const DrawerBody = ChakraDrawer.Body
export const DrawerHeader = ChakraDrawer.Header
export const DrawerFooter = ChakraDrawer.Footer
export const DrawerTitle = ChakraDrawer.Title
export const DrawerDescription = ChakraDrawer.Description
export const DrawerCloseTrigger = ChakraDrawer.CloseTrigger

export const DrawerContent = React.forwardRef(
  function DrawerContent(props, ref) {
    const { children, portalled = true, portalRef, backdropProps, ...rest } = props
    return (
      <Portal disabled={!portalled} container={portalRef}>
        <ChakraDrawer.Backdrop {...backdropProps} />
        <ChakraDrawer.Positioner>
          <ChakraDrawer.Content ref={ref} {...rest}>
            {children}
          </ChakraDrawer.Content>
        </ChakraDrawer.Positioner>
      </Portal>
    )
  },
)
