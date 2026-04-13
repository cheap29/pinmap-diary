'use client'

import { Box, Flex, Icon, Text, VStack } from '@chakra-ui/react'
import { usePathname, useRouter } from 'next/navigation'
import { PiListBold, PiMapPinBold, PiPlusBold, PiCalendarBold } from 'react-icons/pi'

const navItems = [
  { label: 'タイムライン', icon: PiListBold, href: '/timeline' },
  { label: 'カレンダー', icon: PiCalendarBold, href: '/calendar' },
  { label: 'マップ', icon: PiMapPinBold, href: '/map' },
]

export function BottomNav() {
  const pathname = usePathname()
  const router = useRouter()

  return (
    <>
      {/* フロートボタン（アップロードページでは非表示） */}
      <Box
        as="button"
        onClick={() => router.push('/upload')}
        display={pathname === '/upload' ? 'none' : 'flex'}
        position="fixed"
        bottom="72px"
        w="56px"
        h="56px"
        rounded="full"
        bg="brand.500"
        color="white"
        shadow="lg"
        alignItems="center"
        justifyContent="center"
        zIndex={200}
        style={{
          transition: 'background 0.15s',
          right: 'max(20px, calc((100vw - 1200px) / 2 + 20px))',
        }}
      >
        <Icon as={PiPlusBold} boxSize={6} />
      </Box>

      {/* ボトムバー */}
      <Box
        className="fixed-center"
        bottom={0}
        bg="white"
        borderTop="1px solid"
        borderColor="gray.100"
        zIndex={100}
      >
        <Flex>
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <VStack
                key={item.href}
                flex={1}
                gap={0.5}
                py={3}
                cursor="pointer"
                onClick={() => router.push(item.href)}
                color={isActive ? 'brand.500' : 'gray.400'}
                style={{ transition: 'color 0.15s' }}
              >
                <Icon as={item.icon} boxSize={5} />
                <Text fontSize="10px">{item.label}</Text>
              </VStack>
            )
          })}
        </Flex>
      </Box>
    </>
  )
}
