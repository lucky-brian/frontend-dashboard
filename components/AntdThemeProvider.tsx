"use client";

import { ConfigProvider, theme } from "antd";
import { useSyncExternalStore } from "react";

const { defaultAlgorithm, darkAlgorithm } = theme;

function subscribe(callback: () => void) {
  const m = globalThis.matchMedia("(prefers-color-scheme: dark)");
  const listener = () => callback();
  m.addEventListener("change", listener);
  return () => m.removeEventListener("change", listener);
}

function getSnapshot() {
  return globalThis.matchMedia("(prefers-color-scheme: dark)").matches;
}

function getServerSnapshot() {
  return false;
}

export function AntdThemeProvider({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const isDark = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  return (
    <ConfigProvider
      theme={{
        algorithm: isDark ? darkAlgorithm : defaultAlgorithm,
      }}
    >
      {children}
    </ConfigProvider>
  );
}
