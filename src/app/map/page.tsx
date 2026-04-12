'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Box, Center, Spinner, Text } from '@chakra-ui/react'
import { supabase, type Photo } from '@/lib/supabase'
import { MapView, type MapPhoto } from '@/components/MapView'
import { BottomNav } from '@/components/BottomNav'

export default function MapPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [mapPhotos, setMapPhotos] = useState<MapPhoto[]>([])
  const [loading, setLoading] = useState(true)

  // クエリパラメータから初期位置を取得
  const focusLat = searchParams.get('lat') ? parseFloat(searchParams.get('lat')!) : null
  const focusLng = searchParams.get('lng') ? parseFloat(searchParams.get('lng')!) : null
  const focusZoom = searchParams.get('zoom') ? parseFloat(searchParams.get('zoom')!) : null

  const loadPhotos = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      router.replace('/login')
      return
    }

    const { data, error } = await supabase
      .from('photos')
      .select('*')
      .eq('has_location', true)

    if (error || !data) {
      setLoading(false)
      return
    }

    const photosWithUrls = await Promise.all(
      data
        .filter((p: Photo) => p.lat !== null && p.lng !== null)
        .map(async (photo: Photo) => {
          const { data: urlData } = await supabase.storage
            .from('photos')
            .createSignedUrl(photo.storage_path, 3600)
          return {
            id: photo.id,
            lat: photo.lat!,
            lng: photo.lng!,
            imageUrl: urlData?.signedUrl ?? '',
            diaryText: photo.diary_text,
          }
        })
    )

    setMapPhotos(photosWithUrls)
    setLoading(false)
  }, [router])

  useEffect(() => {
    loadPhotos()
  }, [loadPhotos])

  if (loading) {
    return (
      <Center h="100vh">
        <Spinner size="lg" color="brand.500" />
      </Center>
    )
  }

  return (
    <Box h="100vh" pb="60px" display="flex" flexDirection="column">
      <Box
        px={4}
        py={3}
        bg="white"
        borderBottom="1px solid"
        borderColor="gray.100"
        zIndex={10}
      >
        <Text fontFamily="heading" fontSize="lg" color="gray.700">
          マップ
        </Text>
      </Box>

      <Box flex={1} position="relative">
        {mapPhotos.length === 0 ? (
          <Center h="full">
            <Text color="gray.400" fontSize="sm">
              位置情報付きの写真がありません
            </Text>
          </Center>
        ) : (
          <MapView
            photos={mapPhotos}
            focusLat={focusLat}
            focusLng={focusLng}
            focusZoom={focusZoom}
          />
        )}
      </Box>

      <BottomNav />
    </Box>
  )
}
