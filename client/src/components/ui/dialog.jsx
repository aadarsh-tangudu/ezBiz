import { Dialog as ChakraDialog, Portal } from "@chakra-ui/react"
import * as React from "react"

export const DialogRoot = ChakraDialog.Root
export const DialogTrigger = ChakraDialog.Trigger
export const DialogBody = ChakraDialog.Body
export const DialogHeader = ChakraDialog.Header
export const DialogFooter = ChakraDialog.Footer
export const DialogTitle = ChakraDialog.Title
export const DialogDescription = ChakraDialog.Description
export const DialogCloseTrigger = ChakraDialog.CloseTrigger

export const DialogContent = React.forwardRef(
  function DialogContent(props, ref) {
    const { children, portalled = true, portalRef, backdropProps, ...rest } = props
    return (
      <Portal disabled={!portalled} container={portalRef}>
        <ChakraDialog.Backdrop {...backdropProps} />
        <ChakraDialog.Positioner>
          <ChakraDialog.Content ref={ref} {...rest}>
            {children}
          </ChakraDialog.Content>
        </ChakraDialog.Positioner>
      </Portal>
    )
  },
)
