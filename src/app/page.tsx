'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Center, Spinner } from '@chakra-ui/react'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.replace('/timeline')
      } else {
        router.replace('/login')
      }
    })
  }, [router])

  return (
    <Center h="100vh">
      <Spinner size="lg" color="brand.500" />
    </Center>
  )
}
