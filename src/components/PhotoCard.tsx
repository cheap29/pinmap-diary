"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  HStack,
  Icon,
  Image,
  Text,
  Textarea,
  VStack,
  IconButton,
} from "@chakra-ui/react";
import {
  PiNotePencilBold,
  PiCheckBold,
  PiMapPinBold,
  PiPenNibBold,
  PiXBold,
  PiTrashBold,
  PiXCircleBold,
} from "react-icons/pi";
import { format, parseISO } from "date-fns";
import { ja } from "date-fns/locale";
import { Toaster, toaster } from "@/components/Toaster";
import { PERSONAS, type PersonaKey } from "@/lib/personas";

export type PhotoCardProps = {
  id: string;
  imageUrl: string;
  takenAt: string | null;
  hasLocation: boolean;
  locationName: string | null;
  lat: number | null;
  lng: number | null;
  diaryText: string | null;
  persona: string | null;
  memo: string | null;
  onMemoSave?: (id: string, memo: string) => Promise<void>;
  onDiaryUpdate?: (id: string, newDiaryText: string) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
};

function formatDate(takenAt: string | null): string | null {
  if (!takenAt) return null;
  try {
    return format(parseISO(takenAt), "yyyy年MM月dd日（EEE）", { locale: ja });
  } catch {
    return null;
  }
}

function formatDatetime(takenAt: string | null): string {
  if (!takenAt) return "思い出にっき";
  try {
    return (
      format(parseISO(takenAt), "yyyy年MM月dd日 HH:mm", { locale: ja }) +
      " の思い出にっき"
    );
  } catch {
    return "思い出にっき";
  }
}

function parseDiary(text: string | null): {
  body: string | null;
  tags: string[];
} {
  if (!text) return { body: null, tags: [] };
  const lines = text.trim().split("\n");
  const lastLine = lines[lines.length - 1].trim();
  if (lastLine.startsWith("#")) {
    const tags = lastLine.split(/\s+/).filter((t) => t.startsWith("#"));
    const body = lines.slice(0, -1).join("\n").trim() || null;
    return { body, tags };
  }
  return { body: text, tags: [] };
}

function rebuildDiaryText(body: string, tags: string[]): string {
  const b = body.trim();
  if (tags.length === 0) return b;
  return b + "\n" + tags.join(" ");
}

export function PhotoCard({
  id,
  imageUrl,
  takenAt,
  hasLocation,
  locationName,
  lat,
  lng,
  diaryText,
  persona,
  memo,
  onMemoSave,
  onDiaryUpdate,
  onDelete,
}: PhotoCardProps) {
  const router = useRouter();
  const [localDiaryText, setLocalDiaryText] = useState(diaryText);
  const [editingDiary, setEditingDiary] = useState(false);
  const [editDiaryValue, setEditDiaryValue] = useState("");
  const [savingDiary, setSavingDiary] = useState(false);

  const [editingMemo, setEditingMemo] = useState(false);
  const [memoValue, setMemoValue] = useState(memo ?? "");
  const [savingMemo, setSavingMemo] = useState(false);

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const dateStr = formatDate(takenAt);
  const { body, tags } = parseDiary(localDiaryText);
  const personaInfo =
    persona && persona in PERSONAS ? PERSONAS[persona as PersonaKey] : null;

  // 日記編集
  function startEditDiary() {
    setEditDiaryValue(body ?? "");
    setEditingDiary(true);
  }

  async function saveDiary() {
    if (!onDiaryUpdate) return;
    setSavingDiary(true);
    try {
      const newText = rebuildDiaryText(editDiaryValue, tags);
      await onDiaryUpdate(id, newText);
      setLocalDiaryText(newText);
      setEditingDiary(false);
    } catch {
      toaster.error({ title: "保存に失敗しました" });
    } finally {
      setSavingDiary(false);
    }
  }

  // タグ削除
  async function deleteTag(tag: string) {
    if (!onDiaryUpdate) return;
    try {
      const newTags = tags.filter((t) => t !== tag);
      const newText = rebuildDiaryText(body ?? "", newTags);
      await onDiaryUpdate(id, newText);
      setLocalDiaryText(newText);
    } catch {
      toaster.error({ title: "タグ削除に失敗しました" });
    }
  }

  // メモ保存
  async function handleSaveMemo() {
    if (!onMemoSave) return;
    setSavingMemo(true);
    try {
      await onMemoSave(id, memoValue);
      setEditingMemo(false);
    } catch {
      toaster.error({ title: "メモの保存に失敗しました" });
    } finally {
      setSavingMemo(false);
    }
  }

  // 削除
  async function handleDelete() {
    if (!onDelete) return;
    setDeleting(true);
    try {
      await onDelete(id);
    } catch {
      toaster.error({ title: "削除に失敗しました" });
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  return (
    <Box className="pc-card">
      <Toaster />

      {/* 写真カラム */}
      <Box className="pc-photo-col">
        <Box className="pc-polaroid">
          <Box className="pc-pin" />
          <Image src={imageUrl} alt="photo" className="pc-photo" />
        </Box>
        {hasLocation && lat != null && lng != null ? (
          <Box
            className="pc-location"
            as="button"
            onClick={() => router.push(`/map?lat=${lat}&lng=${lng}&zoom=16`)}
            _hover={{ opacity: 0.75 }}
            style={{ transition: "opacity 0.15s" }}
          >
            <Icon as={PiMapPinBold} className="pc-location-icon" />
            <Text className="pc-location-text">
              {locationName ?? "位置情報あり"}
            </Text>
          </Box>
        ) : (
          <Box className="pc-location pc-location--none">
            <Icon as={PiMapPinBold} className="pc-location-icon" />
            <Text className="pc-location-text">位置情報なし</Text>
          </Box>
        )}
      </Box>

      {/* 日記カラム */}
      <Box className="pc-diary-col">
        {/* 日記本文 */}
        {(body || editingDiary) && (
          <Box className="pc-diary">
            {/* ヘッダー */}
            <HStack className="pc-diary-header">
              <Icon as={PiPenNibBold} className="pc-diary-icon" />
              <Text className="pc-diary-title">{formatDatetime(takenAt)}</Text>
              {personaInfo && (
                <Box className="pc-persona-badge">
                  <Text className="pc-persona-label">{personaInfo.label}</Text>
                </Box>
              )}
              {onDiaryUpdate && !editingDiary && (
                <IconButton
                  aria-label="日記を編集"
                  size="xs"
                  variant="ghost"
                  onClick={startEditDiary}
                  className="pc-diary-edit-btn"
                >
                  <Icon as={PiNotePencilBold} />
                </IconButton>
              )}
            </HStack>

            {/* 本文 or 編集フォーム */}
            {editingDiary ? (
              <VStack align="stretch" gap={2}>
                <Textarea
                  value={editDiaryValue}
                  onChange={(e) => setEditDiaryValue(e.target.value)}
                  rows={6}
                  resize="none"
                  fontSize="sm"
                  borderColor="gray.200"
                  rounded="lg"
                />
                <HStack justify="flex-end" gap={2}>
                  <IconButton
                    aria-label="キャンセル"
                    size="sm"
                    variant="ghost"
                    onClick={() => setEditingDiary(false)}
                  >
                    <Icon as={PiXBold} />
                  </IconButton>
                  <IconButton
                    aria-label="保存"
                    size="sm"
                    variant="ghost"
                    loading={savingDiary}
                    onClick={saveDiary}
                    color="brand.500"
                  >
                    <Icon as={PiCheckBold} />
                  </IconButton>
                </HStack>
              </VStack>
            ) : (
              <Text className="pc-diary-text">{body}</Text>
            )}
          </Box>
        )}

        {/* タグ */}
        {tags.length > 0 && (
          <HStack className="pc-tags" flexWrap="wrap">
            {tags.map((tag) => (
              <HStack key={tag} className="pc-tag" gap={1}>
                <Text>{tag}</Text>
                {onDiaryUpdate && (
                  <Box
                    as="button"
                    onClick={() => deleteTag(tag)}
                    opacity={0.5}
                    _hover={{ opacity: 1 }}
                    lineHeight={1}
                  >
                    <Icon as={PiXBold} boxSize={2.5} />
                  </Box>
                )}
              </HStack>
            ))}
          </HStack>
        )}

        {/* メモ */}
        {editingMemo ? (
          <HStack align="flex-start">
            <Textarea
              value={memoValue}
              onChange={(e) => setMemoValue(e.target.value)}
              placeholder="ひとことメモ..."
              resize="none"
              rows={3}
              className="pc-memo-textarea"
            />
            <IconButton
              aria-label="保存"
              size="sm"
              variant="ghost"
              loading={savingMemo}
              onClick={handleSaveMemo}
            >
              <Icon as={PiCheckBold} />
            </IconButton>
          </HStack>
        ) : (
          <HStack
            justify="space-between"
            align="flex-start"
            mt={memoValue ? 2 : 0}
          >
            {memoValue && <Text className="pc-memo-text">{memoValue}</Text>}
            {onMemoSave && (
              <IconButton
                aria-label="メモを編集"
                size="xs"
                variant="ghost"
                onClick={() => setEditingMemo(true)}
                className="pc-edit-btn"
                ml="auto"
              >
                <Icon as={PiNotePencilBold} />
              </IconButton>
            )}
          </HStack>
        )}

        {/* 削除 */}
        {onDelete && (
          <Box mt={2}>
            {confirmDelete ? (
              <HStack gap={2} justify="flex-end">
                <Text fontSize="xs" color="gray.400">
                  本当に削除しますか？
                </Text>
                <IconButton
                  aria-label="キャンセル"
                  size="xs"
                  variant="ghost"
                  color="gray.400"
                  onClick={() => setConfirmDelete(false)}
                >
                  <Icon as={PiXBold} />
                </IconButton>
                <IconButton
                  aria-label="削除する"
                  size="xs"
                  variant="ghost"
                  color="red.400"
                  loading={deleting}
                  onClick={handleDelete}
                >
                  <Icon as={PiTrashBold} />
                </IconButton>
              </HStack>
            ) : (
              <HStack justify="flex-end">
                <Text
                  fontSize="xs"
                  color="gray.400"
                  onClick={() => setConfirmDelete(true)}
                  _hover={{ textDecoration: "underline", cursor: "pointer" }}
                >
                  Delete
                </Text>
                <IconButton
                  aria-label="削除"
                  size="xs"
                  variant="ghost"
                  color="gray.300"
                  onClick={() => setConfirmDelete(true)}
                >
                  <Icon as={PiXCircleBold} />
                </IconButton>
              </HStack>
            )}
          </Box>
        )}
      </Box>
    </Box>
  );
}
