"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** CU-01, paso 5: vuelve a pedir los datos al servidor cada 30 segundos. */
export function RefrescoAutomatico({ segundos = 30 }: { segundos?: number }) {
  const router = useRouter();
  useEffect(() => {
    const id = setInterval(() => router.refresh(), segundos * 1000);
    return () => clearInterval(id);
  }, [router, segundos]);
  return null;
}
