import { NextRequest, NextResponse } from "next/server";

// Fal.ai API 配置
const FAL_API_KEY = process.env.FAL_API_KEY || "";
const FAL_API_URL = "https://queue.fal.run/fal-ai/flux-schnell";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const image = formData.get("image") as File;
    const style = formData.get("style") as string;
    const similarity = formData.get("similarity") as string;
    const descriptor = formData.get("descriptor") as string;

    if (!image || !style) {
      return NextResponse.json(
        { error: "缺少必要参数" },
        { status: 400 }
      );
    }

    if (!FAL_API_KEY) {
      // 开发模式：返回示例图片
      return NextResponse.json({
        imageUrl: "https://picsum.photos/512/512",
        style,
        similarity: Number(similarity) || 80,
        message: "开发模式：使用占位图片",
      });
    }

    // 将图片转换为 base64
    const imageBuffer = await image.arrayBuffer();
    const imageBase64 = Buffer.from(imageBuffer).toString("base64");
    const imageDataUrl = `data:${image.type};base64,${imageBase64}`;

    // 解析面部特征向量
    let faceDescriptor: number[] = [];
    if (descriptor) {
      try {
        faceDescriptor = JSON.parse(descriptor);
      } catch {
        console.error("Failed to parse descriptor");
      }
    }

    // 构建提示词
    const prompt = `A high-quality avatar portrait with ${style} style. The face should maintain ${similarity}% similarity to the reference. Style: ${getStylePrompt(style)}. Award winning portrait photography, sharp focus, detailed, 4K`;

    // 调用 Fal.ai API
    const falResponse = await fetch(FAL_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Key ${FAL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt,
        image_url: imageDataUrl,
        num_inference_steps: 4,
        guidance_scale: 3.5,
        enable_safety_checker: true,
      }),
    });

    if (!falResponse.ok) {
      const error = await falResponse.text();
      console.error("Fal.ai API error:", error);
      return NextResponse.json(
        { error: "AI 生成失败，请稍后重试" },
        { status: 500 }
      );
    }

    const falResult = await falResponse.json();

    return NextResponse.json({
      imageUrl: falResult.images?.[0]?.url || falResult.image?.url,
      style,
      similarity: Number(similarity) || 80,
    });
  } catch (error) {
    console.error("Generate API error:", error);
    return NextResponse.json(
      { error: "服务器错误，请稍后重试" },
      { status: 500 }
    );
  }
}

function getStylePrompt(styleId: string): string {
  const stylePrompts: Record<string, string> = {
    anime: "Japanese anime style, big expressive eyes, soft lighting, cel shading",
    cartoon: "Pixar Disney 3D cartoon style, vibrant colors, character portrait",
    kpop: "Korean K-pop idol illustration style, detailed hair, makeup",
    chibi: "Chibi anime style, cute round face, big head small body",
    sumin: "Chinese sumi-e ink painting style anime",
    rpg: "Fantasy RPG video game character, Zelda Genshin Impact style",
    pixel: "Pixel art style, 16-bit retro video game character",
    cyberpunk: "Cyberpunk 2077 style, neon lights, futuristic, rain",
    fantasy: "Epic fantasy Warcraft style, ornate armor, dramatic lighting",
    steampunk: "Steampunk Victorian style, mechanical gears, brass copper",
    oil: "Rembrandt oil painting portrait, dramatic chiaroscuro lighting",
    watercolor: "Watercolor illustration style, soft brush strokes, delicate",
    sketch: "Pencil sketch portrait, black and white, detailed shading",
    y2k: "Y2K 2000s aesthetic, butterfly clips, blonde, low rise fashion",
    suits: "Handsome businessman suit portrait, sharp jawline, confident pose",
  };
  return stylePrompts[styleId] || styleId;
}
