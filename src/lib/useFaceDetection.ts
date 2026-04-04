"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import * as faceapi from "face-api.js";

export interface FaceDetectionResult {
  success: boolean;
  message: string;
  landmarks?: faceapi.FaceLandmarks68;
  descriptor?: Float32Array;
}

export interface UseFaceDetectionReturn {
  isLoading: boolean;
  isModelLoading: boolean;
  error: string | null;
  detectFace: (image: HTMLImageElement | HTMLCanvasElement | string) => Promise<FaceDetectionResult>;
  loadModels: () => Promise<void>;
}

export function useFaceDetection(): UseFaceDetectionReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [isModelLoading, setIsModelLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const modelsLoaded = useRef(false);

  const loadModels = useCallback(async () => {
    if (modelsLoaded.current) return;

    setIsModelLoading(true);
    try {
      // 使用 face-api.js 官方模型路径
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri("/models/tiny_face_detector"),
        faceapi.nets.faceLandmark68TinyNet.loadFromUri("/models/face_landmark_68_tiny"),
        faceapi.nets.faceRecognitionNet.loadFromUri("/models/face_recognition"),
      ]);
      modelsLoaded.current = true;
    } catch (err) {
      console.error("Failed to load face-api models:", err);
      setError("人脸检测模型加载失败，请刷新页面重试");
    } finally {
      setIsModelLoading(false);
    }
  }, []);

  const detectFace = useCallback(
    async (input: HTMLImageElement | HTMLCanvasElement | string): Promise<FaceDetectionResult> => {
      if (!modelsLoaded.current) {
        await loadModels();
      }

      setIsLoading(true);
      setError(null);

      try {
        const img = input instanceof HTMLImageElement
          ? input
          : await faceapi.fetchImage(input as string);

        const options = new faceapi.TinyFaceDetectorOptions({
          inputSize: 320,
          scoreThreshold: 0.5,
        });

        const detections = await faceapi
          .detectAllFaces(img, options)
          .withFaceLandmarks(true)
          .withFaceDescriptors();

        if (detections.length === 0) {
          return {
            success: false,
            message: "未检测到人脸，请上传包含清晰人脸的照片",
          };
        }

        if (detections.length > 1) {
          return {
            success: false,
            message: "检测到多个人脸，请上传单人照片",
          };
        }

        const detection = detections[0];
        return {
          success: true,
          message: "人脸检测成功",
          landmarks: detection.landmarks,
          descriptor: detection.descriptor,
        };
      } catch (err) {
        console.error("Face detection error:", err);
        return {
          success: false,
          message: "人脸检测失败，请尝试其他照片",
        };
      } finally {
        setIsLoading(false);
      }
    },
    [loadModels]
  );

  // 自动加载模型
  useEffect(() => {
    loadModels();
  }, [loadModels]);

  return {
    isLoading,
    isModelLoading,
    error,
    detectFace,
    loadModels,
  };
}
