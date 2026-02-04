"use client";

import { FRONTEND_MEMBERS } from "@/lib/constants";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { App, Input } from "antd";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const { setUser } = useCurrentUser();
  const [nameInput, setNameInput] = useState("");
  const { message } = App.useApp();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = nameInput.trim();
    if (!trimmed) return;
    const member = FRONTEND_MEMBERS.find(
      (m) => m.name.toLowerCase() === trimmed.toLowerCase()
    );
    if (!member) {
      message.error("ชื่อนี้ไม่มีในรายชื่อสมาชิก ไม่สามารถเข้าสู่ระบบได้");
      return;
    }
    setUser({ name: member.name, role: member.role });
    router.push("/dashboard");
    router.refresh();
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
      <div className="w-full max-w-sm rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h1 className="mb-2 text-center text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Frontend Dashboard
        </h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="name"
              className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              ชื่อ
            </label>
            <Input
              id="name"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="กรอกชื่อของคุณ"
              required
              autoComplete="name"
              size="large"
              className="w-full"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-lg bg-zinc-900 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            เข้าสู่ระบบ
          </button>
        </form>
      </div>
    </div>
  );
}
