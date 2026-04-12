"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Box, Center, Spinner, Text, VStack } from "@chakra-ui/react";
import { AppHeader } from "@/components/AppHeader";
import { format, parseISO } from "date-fns";
import { ja } from "date-fns/locale";
import { supabase, createAuthClient, type Photo } from "@/lib/supabase";
import { PERSONAS, type PersonaKey } from "@/lib/personas";
import { PhotoCard } from "@/components/PhotoCard";
import { BottomNav } from "@/components/BottomNav";

type PhotoWithUrl = Photo & { imageUrl: string };

function groupByMonth(
  photos: PhotoWithUrl[],
): { label: string; items: PhotoWithUrl[] }[] {
  const map = new Map<string, PhotoWithUrl[]>();
  for (const photo of photos) {
    const key = photo.taken_at
      ? format(parseISO(photo.taken_at), "yyyy年MM月", { locale: ja })
      : "日時不明";
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(photo);
  }
  return Array.from(map.entries()).map(([label, items]) => ({ label, items }));
}

export default function TimelinePage() {
  const router = useRouter();
  const [photos, setPhotos] = useState<PhotoWithUrl[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [persona, setPersona] = useState<{
    emoji: string;
    label: string;
  } | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const key = localStorage.getItem("diary_persona") as PersonaKey | null;
    if (key && key in PERSONAS) setPersona(PERSONAS[key]);
  }, []);

  const loadPhotos = useCallback(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      router.replace("/login");
      return;
    }

    const authClient = createAuthClient(session.access_token);
    const { data, error } = await authClient
      .from("photos")
      .select("*")
      .order("taken_at", { ascending: false, nullsFirst: false });

    if (error || !data) {
      setFetchError(error?.message ?? "写真の取得に失敗しました");
      setLoading(false);
      return;
    }

    const photosWithUrls = await Promise.all(
      data.map(async (photo: Photo) => {
        const { data: urlData } = await supabase.storage
          .from("photos")
          .createSignedUrl(photo.storage_path, 3600);
        return { ...photo, imageUrl: urlData?.signedUrl ?? "" };
      }),
    );
    setPhotos(photosWithUrls);
    setLoading(false);
  }, [router]);

  useEffect(() => {
    loadPhotos();
  }, [loadPhotos]);

  async function getSession() {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session;
  }

  async function handleMemoSave(id: string, memo: string) {
    const session = await getSession();
    if (!session) return;
    const res = await fetch(`/api/photos/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ memo }),
    });
    if (!res.ok) throw new Error("Failed to save memo");
    setPhotos((prev) => prev.map((p) => (p.id === id ? { ...p, memo } : p)));
  }

  async function handleDiaryUpdate(id: string, diary_text: string) {
    const session = await getSession();
    if (!session) return;
    const res = await fetch(`/api/photos/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ diary_text }),
    });
    if (!res.ok) throw new Error("Failed to update diary");
    setPhotos((prev) =>
      prev.map((p) => (p.id === id ? { ...p, diary_text } : p)),
    );
  }

  async function handleDelete(id: string) {
    const session = await getSession();
    if (!session) return;
    const res = await fetch(`/api/photos/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    if (!res.ok) throw new Error("Failed to delete");
    setPhotos((prev) => prev.filter((p) => p.id !== id));
  }

  if (loading) {
    return (
      <Center h="100vh">
        <Spinner size="lg" color="brand.500" />
      </Center>
    );
  }

  const groups = groupByMonth(photos);

  return (
    <Box pt="56px" pb="80px" minH="100vh" bg="#faf9f7">
      <AppHeader title="タイムライン" fixed></AppHeader>

      {/* コンテンツ */}
      {fetchError ? (
        <Center py={20}>
          <VStack gap={2}>
            <Text color="red.400" fontSize="sm">
              エラー
            </Text>
            <Text color="red.300" fontSize="xs">
              {fetchError}
            </Text>
          </VStack>
        </Center>
      ) : photos.length === 0 ? (
        <Center py={20}>
          <VStack gap={2}>
            <Text color="gray.400" fontSize="sm">
              まだ写真がありません
            </Text>
            <Text color="gray.300" fontSize="xs">
              右下の＋ボタンから最初の一枚を投稿しましょう
            </Text>
          </VStack>
        </Center>
      ) : (
        <Box className="tl-container">
          {groups.map((group) => (
            <Box key={group.label} className="tl-group">
              {/* 月ヘッダー */}
              <Box className="tl-month-header">
                <Box className="tl-month-dot" />
                <Text className="tl-month-label">{group.label}</Text>
              </Box>

              {/* エントリー */}
              {group.items.map((photo) => (
                <Box key={photo.id} className="tl-entry">
                  <Box className="tl-entry-dot" />
                  <Box className="tl-entry-card">
                    <PhotoCard
                      id={photo.id}
                      imageUrl={photo.imageUrl}
                      takenAt={photo.taken_at}
                      hasLocation={photo.has_location}
                      locationName={photo.location_name ?? null}
                      lat={photo.lat}
                      lng={photo.lng}
                      diaryText={photo.diary_text}
                      persona={photo.persona}
                      memo={photo.memo}
                      onMemoSave={handleMemoSave}
                      onDiaryUpdate={handleDiaryUpdate}
                      onDelete={handleDelete}
                    />
                  </Box>
                </Box>
              ))}
            </Box>
          ))}
        </Box>
      )}

      <BottomNav />
    </Box>
  );
}
