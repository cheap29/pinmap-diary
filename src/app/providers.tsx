"use client";

import { ChakraProvider, createSystem, defaultConfig } from "@chakra-ui/react";

const system = createSystem(defaultConfig, {
  theme: {
    tokens: {
      fonts: {
        heading: { value: "'Mamelon','Noto Serif JP', serif" },
        body: { value: "'Mamelon','Noto Sans JP', sans-serif" },
      },
      colors: {
        brand: {
          50: { value: "#e8f4f4" },
          100: { value: "#c0e0e0" },
          500: { value: "#5a9e9e" },
          600: { value: "#4a8a8a" },
        },
      },
    },
    semanticTokens: {
      colors: {
        "chakra-body-bg": { value: "#faf9f7" },
        "chakra-body-text": { value: "#333" },
      },
    },
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  return <ChakraProvider value={system}>{children}</ChakraProvider>;
}
