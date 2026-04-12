'use client'

import {
  Portal,
  Spinner,
  Stack,
  Toast,
  Toaster as ChakraToaster,
  createToaster,
} from '@chakra-ui/react'

export const toaster = createToaster({
  placement: 'top',
  pauseOnPageIdle: true,
})

export function Toaster() {
  return (
    <Portal>
      <ChakraToaster toaster={toaster}>
        {(toast) => (
          <Toast.Root>
            {toast.type === 'loading' ? (
              <Spinner size="sm" />
            ) : (
              <Toast.Indicator />
            )}
            <Stack gap={1} flex={1}>
              {toast.title && <Toast.Title>{toast.title}</Toast.Title>}
              {toast.description && (
                <Toast.Description>{toast.description}</Toast.Description>
              )}
            </Stack>
            <Toast.CloseTrigger />
          </Toast.Root>
        )}
      </ChakraToaster>
    </Portal>
  )
}
