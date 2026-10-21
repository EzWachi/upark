"use client";

import { useEffect, useRef, useState } from "react";
import { leerQr, precalentarLectorQr } from "@/lib/qr/zxing";

/** Cuánto se deja pasar antes de volver a leer el mismo QR. */
const ESPERA_MISMO_QR_MS = 4000;

/**
 * Cámara + lectura de QR (adaptado del escáner de Isaseca). No sabe qué
 * significa lo que lee: entrega el texto y quien lo usa decide.
 *
 * Montarlo solo mientras se esté leyendo: al desmontarse apaga la cámara. El
 * navegador solo da acceso a la cámara en https o en localhost.
 */
export function EscanerQR({ onLeer }: { onLeer: (texto: string) => void | Promise<void> }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [errorCamara, setErrorCamara] = useState<string | null>(null);

  // En refs: los lee el bucle de escaneo y no deben provocar renders por cuadro.
  const ultimoQr = useRef<{ texto: string; cuando: number } | null>(null);
  const consultando = useRef(false);
  const onLeerRef = useRef(onLeer);
  useEffect(() => {
    onLeerRef.current = onLeer;
  });

  // El decodificador se pide en paralelo con el permiso de la cámara.
  useEffect(() => {
    precalentarLectorQr();
  }, []);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let animacion = 0;
    let vivo = true;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d", { willReadFrequently: true });

    async function procesar(texto: string) {
      const ahora = Date.now();
      const previo = ultimoQr.current;
      // La cámara ve el mismo QR muchas veces por segundo mientras se sostiene.
      if (previo?.texto === texto && ahora - previo.cuando < ESPERA_MISMO_QR_MS) return;
      if (consultando.current) return;
      ultimoQr.current = { texto, cuando: ahora };
      consultando.current = true;
      try {
        await onLeerRef.current(texto);
      } finally {
        consultando.current = false;
      }
    }

    async function arrancar() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        });
      } catch {
        setErrorCamara("No se pudo abrir la cámara. Dale permiso al navegador y revisa que la página esté en https.");
        return;
      }
      if (!vivo) {
        stream.getTracks().forEach((pista) => pista.stop());
        return;
      }

      const video = videoRef.current;
      if (!video || !ctx) return;
      video.srcObject = stream;
      await video.play().catch(() => {});

      const cuadro = async () => {
        if (!vivo) return;
        if (video.readyState === video.HAVE_ENOUGH_DATA) {
          try {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            ctx.drawImage(video, 0, 0);
            const texto = await leerQr(ctx.getImageData(0, 0, canvas.width, canvas.height));
            if (texto) await procesar(texto);
          } catch {
            // Un cuadro ilegible no detiene el escaneo.
          }
        }
        if (vivo) animacion = requestAnimationFrame(() => void cuadro());
      };
      animacion = requestAnimationFrame(() => void cuadro());
    }

    void arrancar();
    return () => {
      vivo = false;
      cancelAnimationFrame(animacion);
      stream?.getTracks().forEach((pista) => pista.stop());
    };
  }, []);

  if (errorCamara) {
    return (
      <p role="alert" className="rounded-lg border border-red-600 p-4 text-sm text-red-600">
        {errorCamara}
      </p>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-lg border border-neutral-300 bg-black dark:border-neutral-700">
      <video ref={videoRef} playsInline muted className="aspect-[3/4] w-full object-cover sm:aspect-video" />
      {/* Marco guía para saber dónde poner el QR. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="size-48 rounded-xl border-2 border-white/70" />
      </div>
    </div>
  );
}
