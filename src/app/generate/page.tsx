"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Image from "next/image";
import { useFaceDetection } from "@/lib/useFaceDetection";
import { STYLES, CATEGORIES, BASIC_STYLES } from "@/lib/styles";

type Step = "upload" | "select" | "generate" | "result";

interface GenerationResult {
  imageUrl: string;
  style: string;
  similarity: number;
}

export default function GeneratePage() {
  const [step, setStep] = useState<Step>("upload");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [selectedStyle, setSelectedStyle] = useState(STYLES[0]);
  const [similarity, setSimilarity] = useState(80);
  const [category, setCategory] = useState("all");
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [credits] = useState(3);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isModelLoading, detectFace, error: detectionError } = useFaceDetection();

  const filteredStyles =
    category === "all"
      ? STYLES
      : STYLES.filter((s) => s.category === category);

  const handleFileSelect = useCallback(
    (file: File) => {
      if (!file.type.startsWith("image/")) {
        setError("请上传图片文件");
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        setSelectedImage(dataUrl);
        setImageFile(file);
        setStep("select");
        setError(null);
      };
      reader.readAsDataURL(file);
    },
    []
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) handleFileSelect(file);
    },
    [handleFileSelect]
  );

  const handleGenerate = useCallback(async () => {
    if (!selectedImage || !imageFile) return;

    setIsGenerating(true);
    setError(null);

    try {
      // 步骤 1: 人脸检测
      const img = new window.Image();
      img.src = selectedImage;
      await new Promise((resolve) => {
        img.onload = resolve;
      });

      const detection = await detectFace(img);

      if (!detection.success) {
        setError(detection.message);
        setIsGenerating(false);
        return;
      }

      // 步骤 2: 调用 Fal.ai API
      // 注意：这里需要将图片转换为 base64 并发送到 Worker
      const formData = new FormData();
      formData.append("image", imageFile);
      formData.append("style", selectedStyle.id);
      formData.append("similarity", similarity.toString());
      formData.append(
        "descriptor",
        JSON.stringify(Array.from(detection.descriptor || new Float32Array(128)))
      );

      const response = await fetch("/api/generate", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "生成失败");
      }

      const data = await response.json();

      setResult({
        imageUrl: data.imageUrl,
        style: selectedStyle.name,
        similarity,
      });
      setStep("result");
    } catch (err) {
      console.error("Generation error:", err);
      setError(err instanceof Error ? err.message : "生成失败，请重试");
    } finally {
      setIsGenerating(false);
    }
  }, [selectedImage, imageFile, selectedStyle, similarity, detectFace]);

  return (
    <div className="min-h-[calc(100vh-4rem)] py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">
            <span className="gradient-text">生成 AI 头像</span>
          </h1>
          <p className="text-purple-200/60">
            剩余 {credits} 次生成机会 · 今日免费额度
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-4 mb-10">
          {["上传照片", "选择风格", "生成头像"].map((label, index) => {
            const stepNames = ["upload", "select", "generate"];
            const currentIndex = stepNames.indexOf(step === "result" ? "generate" : step);
            const isActive = index <= currentIndex;
            return (
              <div key={label} className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    isActive
                      ? "bg-purple-600 text-white"
                      : "bg-purple-900/50 text-purple-300"
                  }`}
                >
                  {index + 1}
                </div>
                <span className={`text-sm ${isActive ? "text-white" : "text-purple-300/50"}`}>
                  {label}
                </span>
                {index < 2 && (
                  <div className="w-12 h-px bg-purple-500/30" />
                )}
              </div>
            );
          })}
        </div>

        {/* Error Display */}
        {(error || detectionError) && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
            {error || detectionError}
          </div>
        )}

        {/* Step 1: Upload */}
        {step === "upload" && (
          <div
            className="upload-zone rounded-2xl p-12 text-center cursor-pointer"
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileSelect(file);
              }}
            />
            <div className="text-6xl mb-4">📸</div>
            <h3 className="text-xl font-semibold mb-2">上传您的照片</h3>
            <p className="text-purple-200/60 mb-4">
              拖拽图片到此处，或点击选择文件
            </p>
            <p className="text-xs text-purple-300/50">
              支持 JPG、PNG、WebP · 建议正面照 · 不存储原图
            </p>

            {isModelLoading && (
              <div className="mt-6 flex items-center justify-center gap-2 text-sm text-purple-300">
                <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                加载人脸检测模型...
              </div>
            )}
          </div>
        )}

        {/* Step 2: Select Style */}
        {(step === "select" || step === "generate") && (
          <div className="space-y-8">
            {/* Image Preview */}
            <div className="glass-card rounded-2xl p-6">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="relative w-full md:w-1/3 aspect-square rounded-xl overflow-hidden bg-purple-900/20">
                  {selectedImage && (
                    <Image
                      src={selectedImage}
                      alt="Selected"
                      fill
                      className="object-cover"
                    />
                  )}
                </div>

                <div className="flex-1 space-y-6">
                  {/* Similarity Slider */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      相似度: {similarity}%
                    </label>
                    <input
                      type="range"
                      min="60"
                      max="95"
                      value={similarity}
                      onChange={(e) => setSimilarity(Number(e.target.value))}
                      className="w-full h-2 rounded-full appearance-none cursor-pointer bg-purple-900/50 accent-purple-500"
                    />
                    <div className="flex justify-between text-xs text-purple-300/60 mt-1">
                      <span>更抽象</span>
                      <span>更真实</span>
                    </div>
                  </div>

                  {/* Style Selection */}
                  <div>
                    <h4 className="text-sm font-medium mb-3">选择风格</h4>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {CATEGORIES.map((cat) => (
                        <button
                          key={cat.id}
                          onClick={() => setCategory(cat.id)}
                          className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                            category === cat.id
                              ? "bg-purple-600 text-white"
                              : "bg-purple-900/30 text-purple-300 hover:bg-purple-900/50"
                          }`}
                        >
                          {cat.name}
                        </button>
                      ))}
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 max-h-[240px] overflow-y-auto pr-2">
                      {(category === "all" ? STYLES : filteredStyles).map((style) => (
                        <button
                          key={style.id}
                          onClick={() => setSelectedStyle(style)}
                          className={`style-card p-3 rounded-xl text-center ${
                            selectedStyle.id === style.id ? "selected" : ""
                          }`}
                        >
                          <div
                            className="w-10 h-10 mx-auto mb-2 rounded-lg flex items-center justify-center text-xl"
                            style={{ backgroundColor: `${style.color}20` }}
                          >
                            🎭
                          </div>
                          <p className="text-xs font-medium truncate">{style.name}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Generate Button */}
            <div className="flex justify-center gap-4">
              <button
                onClick={() => {
                  setStep("upload");
                  setSelectedImage(null);
                  setImageFile(null);
                }}
                className="px-6 py-3 rounded-xl font-medium glass-card hover:bg-purple-500/10 transition-colors"
              >
                重新上传
              </button>
              <button
                onClick={handleGenerate}
                disabled={isGenerating || credits <= 0}
                className="px-8 py-3 rounded-xl font-semibold btn-primary flex items-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    生成中...
                  </>
                ) : (
                  <>开始生成 →</>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Result */}
        {step === "result" && result && (
          <div className="space-y-8">
            <div className="glass-card rounded-2xl p-8 text-center">
              <div className="text-5xl mb-4">🎉</div>
              <h3 className="text-2xl font-bold mb-2">头像生成成功！</h3>
              <p className="text-purple-200/60 mb-6">
                风格: {result.style} · 相似度: {result.similarity}%
              </p>

              <div className="relative max-w-md mx-auto aspect-square rounded-xl overflow-hidden bg-purple-900/20 mb-6">
                <Image
                  src={result.imageUrl}
                  alt="Generated avatar"
                  fill
                  className="object-cover"
                />
                {/* Watermark for free users */}
                <div className="absolute bottom-2 right-2 text-xs text-white/50">
                  AvatarMe
                </div>
              </div>

              <div className="flex justify-center gap-4">
                <button
                  onClick={() => {
                    // Download image
                    const link = document.createElement("a");
                    link.href = result.imageUrl;
                    link.download = `avatarme-${result.style}-${Date.now()}.png`;
                    link.click();
                  }}
                  className="px-6 py-3 rounded-xl font-medium glass-card hover:bg-purple-500/10 transition-colors"
                >
                  下载头像
                </button>
                <button
                  onClick={() => {
                    setStep("upload");
                    setSelectedImage(null);
                    setImageFile(null);
                    setResult(null);
                  }}
                  className="px-6 py-3 rounded-xl font-semibold btn-primary"
                >
                  生成新头像
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
