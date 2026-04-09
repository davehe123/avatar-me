/**
 * AvatarMe 水印工具
 * 使用 Canvas API 在图片上叠加 "AvatarMe" 水印
 */

interface WatermarkOptions {
  text?: string;
  opacity?: number;
  fontSize?: number;
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left";
}

/**
 * 给图片添加水印（纯前端 Canvas 操作）
 * @param imageUrl 图片 URL（支持 data: URL 或 http: URL）
 * @param options 水印配置
 * @returns 添加水印后的 data: URL
 */
export async function addWatermarkToImage(
  imageUrl: string,
  options: WatermarkOptions = {}
): Promise<string> {
  const {
    text = "AvatarMe",
    opacity = 0.4,
    fontSize = 16,
    position = "bottom-right",
  } = options;

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous"; // 支持跨域图片

    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("无法创建 Canvas 2D 上下文"));
        return;
      }

      // 设置 canvas 尺寸为图片尺寸
      canvas.width = img.width;
      canvas.height = img.height;

      // 绘制原图
      ctx.drawImage(img, 0, 0);

      // 设置水印样式
      ctx.globalAlpha = opacity;
      ctx.font = `${fontSize}px "Helvetica Neue", Arial, sans-serif`;
      ctx.fillStyle = "#ffffff";

      // 绘制阴影使水印更清晰
      ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
      ctx.shadowBlur = 2;
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;

      // 计算水印位置
      const padding = 12;
      const textWidth = ctx.measureText(text).width;
      const textHeight = fontSize;

      let x: number, y: number;

      switch (position) {
        case "bottom-left":
          x = padding;
          y = canvas.height - padding;
          ctx.textBaseline = "bottom";
          break;
        case "top-right":
          x = canvas.width - textWidth - padding;
          y = padding + textHeight;
          ctx.textBaseline = "top";
          break;
        case "top-left":
          x = padding;
          y = padding + textHeight;
          ctx.textBaseline = "top";
          break;
        case "bottom-right":
        default:
          x = canvas.width - textWidth - padding;
          y = canvas.height - padding;
          ctx.textBaseline = "bottom";
          break;
      }

      ctx.fillText(text, x, y);

      // 返回 data: URL
      resolve(canvas.toDataURL("image/png"));
    };

    img.onerror = () => {
      reject(new Error(`图片加载失败: ${imageUrl}`));
    };

    // 设置 src 触发加载
    img.src = imageUrl;
  });
}

/**
 * 下载图片（自动添加水印）
 * @param imageUrl 原图 URL
 * @param filename 下载文件名
 * @param addWatermark 是否添加水印（默认 true）
 */
export async function downloadImage(
  imageUrl: string,
  filename: string,
  addWatermark = true
): Promise<void> {
  let dataUrl = imageUrl;

  if (addWatermark) {
    try {
      dataUrl = await addWatermarkToImage(imageUrl);
    } catch (err) {
      console.warn("水印添加失败，使用原图:", err);
      // 水印失败不影响下载，使用原图
    }
  }

  // 创建下载链接
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
