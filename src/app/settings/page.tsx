'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Box,
  Button,
  Icon,
  Text,
  Textarea,
  VStack,
  SimpleGrid,
} from '@chakra-ui/react'
import { PiCheckBold } from 'react-icons/pi'
import { AppHeader } from '@/components/AppHeader'
import { BottomNav } from '@/components/BottomNav'
import { Toaster, toaster } from '@/components/Toaster'
import { PERSONAS, type PersonaKey } from '@/lib/personas'
import { PERSONA_DISPLAY } from '@/lib/personaDisplay'

const PERSONA_KEY = 'diary_persona'
const CUSTOM_PROMPT_KEY = 'diary_custom_prompt'

export default function SettingsPage() {
  const router = useRouter()
  const [selectedPersona, setSelectedPersona] = useState<PersonaKey | null>(null)
  const [customPrompt, setCustomPrompt] = useState('')

  useEffect(() => {
    const p = localStorage.getItem(PERSONA_KEY)
    if (p && p in PERSONAS) setSelectedPersona(p as PersonaKey)
    setCustomPrompt(localStorage.getItem(CUSTOM_PROMPT_KEY) ?? '')
  }, [])

  function handleSave() {
    if (selectedPersona) {
      localStorage.setItem(PERSONA_KEY, selectedPersona)
    } else {
      localStorage.removeItem(PERSONA_KEY)
    }
    localStorage.setItem(CUSTOM_PROMPT_KEY, customPrompt)
    toaster.success({ title: '保存しました' })
    setTimeout(() => router.replace('/upload'), 600)
  }

  function handleReset() {
    setSelectedPersona(null)
    setCustomPrompt('')
    localStorage.removeItem(PERSONA_KEY)
    localStorage.removeItem(CUSTOM_PROMPT_KEY)
    toaster.success({ title: 'リセットしました' })
  }

  return (
    <Box pb="80px" minH="100vh" bg="#faf9f7">
      <Toaster />
      <AppHeader title="日記の設定" showBack />

      <VStack gap={6} p={5} align="stretch">

        {/* ペルソナ選択 */}
        <VStack align="stretch" gap={3}>
          <Text fontSize="sm" fontWeight="600" color="gray.700">
            日記のキャラクター
          </Text>
          <Text fontSize="xs" color="gray.400" lineHeight="tall">
            AIが日記を書くときの口調・視点を選べます。次の投稿から反映されます。
          </Text>

          <SimpleGrid columns={2} gap={3}>
            {(Object.entries(PERSONAS) as [PersonaKey, typeof PERSONAS[PersonaKey]][]).map(([key, persona]) => {
              const isSelected = selectedPersona === key
              const display = PERSONA_DISPLAY[key]
              return (
                <Box
                  key={key}
                  as="button"
                  onClick={() => setSelectedPersona(isSelected ? null : key)}
                  border="1.5px solid"
                  borderColor={isSelected ? 'brand.500' : 'gray.200'}
                  bg={isSelected ? 'brand.50' : 'white'}
                  rounded="xl"
                  p={3}
                  textAlign="left"
                  style={{ transition: 'all 0.15s' }}
                >
                  <Icon
                    as={display.icon}
                    boxSize={5}
                    color={isSelected ? 'brand.500' : 'gray.400'}
                    display="block"
                    mb={1.5}
                  />
                  <Text fontSize="xs" fontWeight="700" color={isSelected ? 'brand.600' : 'gray.700'} mb={1}>
                    {persona.label}
                  </Text>
                  <Text
                    fontSize="10px"
                    color={isSelected ? 'brand.500' : 'gray.400'}
                    lineHeight="1.65"
                    whiteSpace="pre-wrap"
                  >
                    {display.description}
                  </Text>
                </Box>
              )
            })}
          </SimpleGrid>
        </VStack>

        {/* 追加指示 */}
        <VStack align="stretch" gap={2}>
          <Text fontSize="sm" fontWeight="600" color="gray.700">
            追加の指示（任意）
          </Text>
          <Text fontSize="xs" color="gray.400" lineHeight="tall">
            例：「短めにして」「詩っぽく書いて」「英語を混ぜて」
          </Text>
          <Textarea
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            placeholder="追加の指示を入力..."
            rows={4}
            rounded="xl"
            borderColor="gray.200"
            fontSize="sm"
            color="gray.600"
            resize="none"
          />
        </VStack>

        <Button
          onClick={handleSave}
          bg="brand.500"
          color="white"
          rounded="xl"
          size="lg"
        >
          保存
        </Button>

        <Button
          onClick={handleReset}
          variant="ghost"
          color="gray.400"
          size="sm"
        >
          リセット
        </Button>
      </VStack>

      <BottomNav />
    </Box>
  )
}
