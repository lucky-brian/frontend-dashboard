"use client";

import { createClient } from "@/lib/supabase";
import { useEffect, useState } from "react";

type Status = "checking" | "connected" | "error";

export function SupabaseConnectionStatus() {
  const [status, setStatus] = useState<Status>("checking");
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    let cancelled = false;

    async function check() {
      try {
        const supabase = createClient();
        // ทดสอบการเชื่อมต่อโดยเรียก API (ไม่ต้องมีตาราง)
        const { error } = await supabase.auth.getSession();
        if (cancelled) return;
        if (error) {
          setStatus("error");
          setMessage(error.message);
          console.error(error);
          return;
        }
        setStatus("connected");
        setMessage("เชื่อมต่อ Supabase ได้แล้ว");
      } catch (err) {
        if (cancelled) return;
        setStatus("error");
        setMessage(
          err instanceof Error ? err.message : "ไม่สามารถเชื่อมต่อได้"
        );
        console.error(err);
      }
    }

    check();
    return () => {
      cancelled = true;
    };
  }, []);

  if (status === "checking") {
    return (
      <div className="flex items-center gap-2">
        <span className="size-2 animate-pulse rounded-full bg-amber-500" />
        <span>กำลังตรวจสอบการเชื่อมต่อฐานข้อมูล...</span>
      </div>
    );
  }

  if (status === "connected") {
    return (
      <div className="flex items-center gap-2">
        <span className="size-2 rounded-full bg-green-500" />
        <span>{message}</span>
      </div>
    );
  }

  return (
    <div className="">
      <span className="size-2 rounded-full bg-red-500" />
      <span>เชื่อมต่อฐานข้อมูลไม่ได้</span>
    </div>
  );
}
