"use client";

import { Box, Icon, Text } from "@chakra-ui/react";
import { PiArrowLeftBold, PiGearBold } from "react-icons/pi";
import { useRouter } from "next/navigation";

type AppHeaderProps = {
  title: string;
  showBack?: boolean;
  fixed?: boolean;
  children?: React.ReactNode;
};

export function AppHeader({
  title,
  showBack = false,
  fixed = false,
  children,
}: AppHeaderProps) {
  const router = useRouter();
  return (
    <Box
      px={4}
      py={3}
      bg="white"
      borderBottom="1px solid"
      borderColor="gray.100"
      display="flex"
      alignItems="center"
      gap={2}
      className={fixed ? "fixed-center" : undefined}
      {...(fixed ? { top: 0, zIndex: 100 } : {})}
    >
      {showBack && (
        <Box as="button" onClick={() => router.back()} color="gray.400">
          <Icon as={PiArrowLeftBold} boxSize={5} />
        </Box>
      )}
      <Text fontFamily="heading" fontSize="lg" color="gray.700" flex={1}>
        {title}
      </Text>
      {children}
      <Box
        as="button"
        onClick={() => router.push("/settings")}
        color="gray.400"
        ml={1}
      >
        <Icon as={PiGearBold} boxSize={5} />
      </Box>
    </Box>
  );
}
