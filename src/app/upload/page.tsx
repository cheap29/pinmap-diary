"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Button,
  Center,
  Icon,
  Image,
  SimpleGrid,
  Text,
  VStack,
} from "@chakra-ui/react";
import { motion, useAnimationFrame } from "framer-motion";
import { PiCameraFill, PiImageSquareFill } from "react-icons/pi";
import { supabase } from "@/lib/supabase";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { Toaster, toaster } from "@/components/Toaster";
import { PERSONAS, type PersonaKey } from "@/lib/personas";
import { PERSONA_DISPLAY } from "@/lib/personaDisplay";

// 3色くるくるアニメーション
const CIRCLES = [
  { color: "#5a9e9e", radius: 28, speed: 1.2, size: 14, initialAngle: 0 },
  { color: "#e8a87c", radius: 18, speed: -1.8, size: 10, initialAngle: 120 },
  { color: "#b07cc6", radius: 38, speed: 0.7, size: 8, initialAngle: 240 },
];

function OrbitingCircle({
  color,
  radius,
  speed,
  size,
  initialAngle,
}: {
  color: string;
  radius: number;
  speed: number;
  size: number;
  initialAngle: number;
}) {
  const ref = useRef<SVGCircleElement>(null);
  const angleRef = useRef((initialAngle * Math.PI) / 180);

  useAnimationFrame((_, delta) => {
    angleRef.current += (speed * delta) / 1000;
    const x = 50 + radius * Math.cos(angleRef.current);
    const y = 50 + radius * Math.sin(angleRef.current);
    ref.current?.setAttribute("cx", String(x));
    ref.current?.setAttribute("cy", String(y));
  });

  return (
    <circle
      ref={ref}
      cx={50 + radius}
      cy={50}
      r={size / 2}
      fill={color}
      opacity={0.85}
    />
  );
}

function DiaryAnimation() {
  return (
    <VStack gap={4}>
      <svg width="100" height="100" viewBox="0 0 100 100">
        {CIRCLES.map((c) => (
          <OrbitingCircle key={c.color} {...c} />
        ))}
      </svg>
      <motion.div
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        <Text fontSize="sm" color="gray.500">
          AIが日記を書いています...
        </Text>
      </motion.div>
    </VStack>
  );
}

// 長辺を maxPx 以内に収めてリサイズ（JPEG品質 0.85）
async function resizeImage(file: File, maxPx = 1920): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const { width, height } = img;
      const scale = Math.min(1, maxPx / Math.max(width, height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(width * scale);
      canvas.height = Math.round(height * scale);
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("canvas error"));
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => {
          if (!blob) return reject(new Error("resize failed"));
          resolve(
            new File([blob], file.name.replace(/\.\w+$/, ".jpg"), {
              type: "image/jpeg",
            }),
          );
        },
        "image/jpeg",
        0.85,
      );
    };
    img.onerror = reject;
    img.src = url;
  });
}

export default function UploadPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedPersona, setSelectedPersona] = useState<PersonaKey | null>(
    null,
  );
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const key = localStorage.getItem("diary_persona") as PersonaKey | null;
    if (key && key in PERSONAS) setSelectedPersona(key);
    setMounted(true);
  }, []);

  function selectPersona(key: PersonaKey) {
    const next = selectedPersona === key ? null : key;
    setSelectedPersona(next);
    if (next) localStorage.setItem("diary_persona", next);
    else localStorage.removeItem("diary_persona");
  }

  function applyFile(file: File) {
    if (!file.type.startsWith("image/")) {
      toaster.error({
        title: "エラー",
        description: "画像ファイルを選択してください",
      });
      return;
    }
    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreview(url);
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) applyFile(file);
  }

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) applyFile(file);
  }, []);

  async function handleUpload() {
    if (!selectedFile) return;

    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      router.replace("/login");
      return;
    }

    setUploading(true);
    try {
      // オリジナルから EXIF 抽出（リサイズ前）
      let clientTakenAt = "";
      let clientLat = "";
      let clientLng = "";
      try {
        const exifrMod = await import("exifr");
        const exifr = exifrMod.default ?? exifrMod;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const parsed = await (exifr.parse as any)(selectedFile, { tiff: true, exif: true, gps: true });
        console.log("[EXIF] parsed:", parsed);
        if (parsed?.DateTimeOriginal) {
          clientTakenAt = new Date(parsed.DateTimeOriginal).toISOString();
        }
        if (parsed?.latitude != null && parsed?.longitude != null) {
          clientLat = String(parsed.latitude);
          clientLng = String(parsed.longitude);
          console.log("[EXIF] GPS取得成功:", clientLat, clientLng);
        } else {
          console.warn("[EXIF] GPS未取得:", parsed);
        }
      } catch (e) {
        console.warn("[EXIF] 抽出失敗:", e);
      }


      const resized = await resizeImage(selectedFile, 1200);
      const formData = new FormData();
      formData.append("file", resized);
      if (clientTakenAt) formData.append("takenAt", clientTakenAt);
      if (clientLat) formData.append("lat", clientLat);
      if (clientLng) formData.append("lng", clientLng);

      // ペルソナ + 追加指示を結合して送信
      const { PERSONAS } = await import("@/lib/personas");
      const personaKey = localStorage.getItem("diary_persona") as
        | keyof typeof PERSONAS
        | null;
      const personaPrompt =
        personaKey && personaKey in PERSONAS ? PERSONAS[personaKey].prompt : "";
      const extraPrompt = localStorage.getItem("diary_custom_prompt") ?? "";
      const combined = [personaPrompt, extraPrompt].filter(Boolean).join("\n");
      if (combined) formData.append("customPrompt", combined);
      if (personaKey) formData.append("personaKey", personaKey);

      const res = await fetch("/api/photos", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: formData,
      });

      if (!res.ok) {
        let message = `エラー (${res.status})`;
        try {
          const err = await res.json();
          message = err.error ?? message;
        } catch {
          // JSONでないエラーレスポンス（413など）
          if (res.status === 413) message = "ファイルサイズが大きすぎます";
        }
        throw new Error(message);
      }

      router.replace("/timeline");
    } catch (err) {
      toaster.error({
        title: "エラー",
        description:
          err instanceof Error ? err.message : "アップロードに失敗しました",
      });
    } finally {
      setUploading(false);
    }
  }

  return (
    <Box pb="80px" minH="100vh" bg="#faf9f7">
      <Toaster />
      <AppHeader title="写真を投稿" showBack />

      <VStack gap={6} p={6} align="stretch">
        <Box
          border="2px dashed"
          borderColor={
            isDragging ? "brand.500" : preview ? "transparent" : "gray.200"
          }
          rounded="2xl"
          overflow="hidden"
          cursor={uploading ? "default" : "pointer"}
          onClick={() => !uploading && fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          minH="460px"
          display="flex"
          alignItems="center"
          justifyContent="center"
          bg={isDragging ? "brand.50" : "white"}
          position="relative"
          transition="all 0.15s"
        >
          {preview ? (
            <Image
              src={preview}
              alt="preview"
              position="absolute"
              top={0}
              left={0}
              w="full"
              h="full"
              objectFit="contain"
              bg="black"
            />
          ) : isDragging ? (
            <VStack gap={3} color="brand.500" py={12}>
              <Icon as={PiImageSquareFill} boxSize={12} />
              <Text fontSize="sm">ここにドロップ</Text>
            </VStack>
          ) : (
            <VStack gap={3} color="gray.300" py={12}>
              <Icon as={PiCameraFill} boxSize={12} />
              <Text fontSize="sm">タップまたはドラッグで写真を選ぶ</Text>
            </VStack>
          )}
        </Box>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={handleFileSelect}
        />
        {uploading ? (
          <Center py={4}>
            <DiaryAnimation />
          </Center>
        ) : (
          <Button
            onClick={handleUpload}
            disabled={!selectedFile}
            bg="brand.500"
            color="white"
            rounded="xl"
            size="lg"
          >
            この写真で日記を作る
          </Button>
        )}
        {/* ペルソナ選択 */}
        {mounted && (
          <VStack align="stretch" gap={2}>
            <Text fontSize="xs" fontWeight="600" color="gray.500">
              日記のキャラクター（任意）
            </Text>
            <SimpleGrid columns={2} gap={2}>
              {(
                Object.entries(PERSONAS) as [
                  PersonaKey,
                  (typeof PERSONAS)[PersonaKey],
                ][]
              ).map(([key, persona]) => {
                const isSelected = selectedPersona === key;
                const display = PERSONA_DISPLAY[key];
                return (
                  <Box
                    key={key}
                    as="button"
                    onClick={() => selectPersona(key)}
                    border="1.5px solid"
                    borderColor={isSelected ? "brand.500" : "gray.200"}
                    bg={isSelected ? "brand.50" : "white"}
                    rounded="xl"
                    p={3}
                    textAlign="left"
                    style={{ transition: "all 0.15s" }}
                  >
                    <Icon
                      as={display.icon}
                      boxSize={5}
                      color={isSelected ? "brand.500" : "gray.400"}
                      display="block"
                      mb={1.5}
                    />
                    <Text
                      fontSize="xs"
                      fontWeight="700"
                      color={isSelected ? "brand.600" : "gray.700"}
                      mb={1}
                    >
                      {persona.label}
                    </Text>
                    <Text
                      fontSize="10px"
                      color={isSelected ? "brand.500" : "gray.400"}
                      lineHeight="1.65"
                      whiteSpace="pre-wrap"
                    >
                      {display.description}
                    </Text>
                  </Box>
                );
              })}
            </SimpleGrid>
          </VStack>
        )}
      </VStack>

      <BottomNav />
    </Box>
  );
}
