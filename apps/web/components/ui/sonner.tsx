"use client"

import { Toaster as Sonner, type ToasterProps } from "sonner"

/**
 * Section H Toaster.
 *
 * The visual chrome for each toast lives in `toast.tsx` (`ToastBody`); here we
 * only configure the container. `toastOptions.unstyled` tells Sonner to skip
 * its own styles so our custom JSX renders unmodified.
 */
export function Toaster(props: ToasterProps) {
  return (
    <Sonner
      theme="light"
      position="top-right"
      offset={16}
      gap={10}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast: "font-sans",
        },
      }}
      {...props}
    />
  )
}
