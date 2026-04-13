"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Box, Center, HStack, Icon, Image, Spinner, Text, VStack } from "@chakra-ui/react";
import { PiCaretLeftBold, PiCaretRightBold, PiMapPinFill } from "react-icons/pi";
import { AppHeader } from "@/components/AppHeader";
import {
  format, parseISO, startOfMonth, endOfMonth,
  eachDayOfInterval, getDay, isToday, isSameDay,
  addMonths, subMonths,
} from "date-fns";
import { ja } from "date-fns/locale";
import { supabase, createAuthClient, getPublicUrl, type Photo } from "@/lib/supabase";
import { PhotoCard } from "@/components/PhotoCard";
import { BottomNav } from "@/components/BottomNav";

type PhotoWithUrl = Photo & { imageUrl: string };

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

export default function CalendarPage() {
  const router = useRouter();
  const [photos, setPhotos] = useState<PhotoWithUrl[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const loadPhotos = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.replace("/login"); return; }

    const authClient = createAuthClient(session.access_token);
    const { data } = await authClient
      .from("photos").select("*")
      .order("taken_at", { ascending: false, nullsFirst: false });

    if (!data) { setLoading(false); return; }

    const withUrls = data.map((photo: Photo) => ({
      ...photo,
      imageUrl: getPublicUrl(photo.storage_path),
    }));
    setPhotos(withUrls);
    setLoading(false);
  }, [router]);

  useEffect(() => { loadPhotos(); }, [loadPhotos]);

  async function handleMemoSave(id: string, memo: string) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    await fetch(`/api/photos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ memo }),
    });
    setPhotos((prev) => prev.map((p) => (p.id === id ? { ...p, memo } : p)));
  }

  async function handleDiaryUpdate(id: string, diary_text: string) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    await fetch(`/api/photos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ diary_text }),
    });
    setPhotos((prev) => prev.map((p) => (p.id === id ? { ...p, diary_text } : p)));
  }

  async function handleDelete(id: string) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    await fetch(`/api/photos/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    setPhotos((prev) => prev.filter((p) => p.id !== id));
    setSelectedDate(null);
  }

  // 日付→写真のMap
  const photosByDate = new Map<string, PhotoWithUrl[]>();
  photos.forEach((p) => {
    if (!p.taken_at) return;
    const key = format(parseISO(p.taken_at), "yyyy-MM-dd");
    if (!photosByDate.has(key)) photosByDate.set(key, []);
    photosByDate.get(key)!.push(p);
  });

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startPad = getDay(monthStart);

  const selectedPhotos = selectedDate
    ? photos.filter((p) => p.taken_at && isSameDay(parseISO(p.taken_at), selectedDate))
    : [];

  if (loading) {
    return <Center h="100vh"><Spinner size="lg" color="brand.500" /></Center>;
  }

  return (
    <Box pt="56px" pb="80px" minH="100vh" bg="#faf9f7">
      <AppHeader title="カレンダー" fixed />

      <Box px={3} pt={3}>
        {/* 月ナビゲーション */}
        <HStack justify="space-between" align="center" mb={3}>
          <Box as="button"
            onClick={() => { setCurrentMonth(subMonths(currentMonth, 1)); setSelectedDate(null); }}
            color="gray.400" p={1}>
            <Icon as={PiCaretLeftBold} boxSize={4} />
          </Box>
          <Text fontFamily="heading" fontSize="sm" fontWeight="700" color="gray.700">
            {format(currentMonth, "yyyy年 MM月", { locale: ja })}
          </Text>
          <Box as="button"
            onClick={() => { setCurrentMonth(addMonths(currentMonth, 1)); setSelectedDate(null); }}
            color="gray.400" p={1}>
            <Icon as={PiCaretRightBold} boxSize={4} />
          </Box>
        </HStack>

        {/* カレンダー */}
        <Box className="cal-wrap">
          {/* 曜日ヘッダー */}
          <Box className="cal-header-row">
            {WEEKDAYS.map((d, i) => (
              <Text key={d} className="cal-weekday"
                color={i === 0 ? "#e88" : i === 6 ? "#88b" : "#9b8b82"}>
                {d}
              </Text>
            ))}
          </Box>

          {/* 日付グリッド */}
          <Box className="cal-grid">
            {Array.from({ length: startPad }).map((_, i) => (
              <Box key={`pad-${i}`} className="cal-cell" />
            ))}

            {days.map((day) => {
              const key = format(day, "yyyy-MM-dd");
              const dayPhotos = photosByDate.get(key) ?? [];
              const thumbnail = dayPhotos[0];
              const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
              const today = isToday(day);
              const isSun = getDay(day) === 0;
              const isSat = getDay(day) === 6;

              return (
                <Box
                  key={key}
                  className={[
                    "cal-cell",
                    isSelected ? "cal-cell--selected" : "",
                    today ? "cal-cell--today" : "",
                    dayPhotos.length > 0 ? "cal-cell--has-photo" : "",
                  ].join(" ").trim()}
                  onClick={() => dayPhotos.length > 0 && setSelectedDate(isSelected ? null : day)}
                >
                  <Text
                    className="cal-day-num"
                    color={isSun ? "#e88" : isSat ? "#88b" : "#9b8b82"}
                  >
                    {format(day, "d")}
                  </Text>

                  {thumbnail && (
                    <Box className="cal-sticky">
                      {/* 写真 */}
                      <Box className="cal-sticky-photo">
                        <Image src={thumbnail.imageUrl} alt="" className="cal-thumb" />
                      </Box>
                      {/* メモ欄 */}
                      <Box className="cal-sticky-memo">
                        {thumbnail.taken_at && (
                          <Text className="cal-sticky-time">
                            {format(parseISO(thumbnail.taken_at), "HH:mm")}
                          </Text>
                        )}
                        {thumbnail.has_location && (
                          <Icon as={PiMapPinFill} className="cal-sticky-pin" />
                        )}
                      </Box>
                    </Box>
                  )}
                </Box>
              );
            })}
          </Box>
        </Box>

        {/* 選択日の写真 */}
        {selectedDate && (
          <Box mt={5}>
            <Text fontSize="xs" color="gray.400" mb={3} fontWeight="600" letterSpacing="wider">
              {format(selectedDate, "MM月dd日（EEE）", { locale: ja })} の日記
            </Text>
            <VStack gap={4} align="stretch">
              {selectedPhotos.map((photo) => (
                <PhotoCard
                  key={photo.id}
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
              ))}
            </VStack>
          </Box>
        )}
      </Box>

      <BottomNav />
    </Box>
  );
}
