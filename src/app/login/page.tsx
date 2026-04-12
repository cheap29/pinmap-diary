'use client'

import { useState } from 'react'
import {
  Box,
  Button,
  Center,
  Heading,
  Input,
  Text,
  VStack,
} from '@chakra-ui/react'
import { supabase } from '@/lib/supabase'
import { Toaster, toaster } from '@/components/Toaster'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleLogin() {
    if (!email) return
    setLoading(true)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/timeline`,
      },
    })
    setLoading(false)
    if (error) {
      toaster.error({ title: 'エラー', description: error.message })
    } else {
      setSent(true)
    }
  }

  return (
    <Center minH="100vh" bg="#faf9f7" px={4}>
      <Toaster />
      <Box
        bg="white"
        rounded="2xl"
        shadow="md"
        p={8}
        w="full"
        maxW="400px"
      >
        <VStack gap={6} align="stretch">
          <VStack gap={1}>
            <Heading
              fontSize="xl"
              fontFamily="heading"
              color="gray.700"
              textAlign="center"
            >
              人生ピンマップ日記
            </Heading>
            <Text fontSize="sm" color="gray.400" textAlign="center" fontStyle="italic">
              生きてきた、ここにいた
            </Text>
          </VStack>

          {sent ? (
            <VStack gap={3} py={4}>
              <Text textAlign="center" color="gray.600" fontSize="sm" lineHeight="tall">
                ログインリンクを送りました。
                <br />
                メールをご確認ください。
              </Text>
            </VStack>
          ) : (
            <>
              <Input
                type="email"
                placeholder="メールアドレス"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                borderColor="gray.200"
                rounded="lg"
              />
              <Button
                onClick={handleLogin}
                loading={loading}
                loadingText="送信中..."
                bg="brand.500"
                color="white"
                rounded="lg"
                size="md"
              >
                ログインリンクを送る
              </Button>
            </>
          )}
        </VStack>
      </Box>
    </Center>
  )
}
