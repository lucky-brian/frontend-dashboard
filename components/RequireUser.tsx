"use client";

import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function RequireUser({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const router = useRouter();
  const { user } = useCurrentUser();
  // รอ 1 เฟรมก่อน redirect เพื่อให้ client อ่าน localStorage ก่อน (ป้องกัน refresh แล้วโดนส่งไป login ทันที)
  const [canRedirect, setCanRedirect] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setCanRedirect(true));
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    if (!canRedirect) return;
    if (!user) {
      router.replace("/login");
    }
  }, [canRedirect, user, router]);

  if (!canRedirect || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          กำลังโหลด...
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
