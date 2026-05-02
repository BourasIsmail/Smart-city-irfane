"use client";

import { SessionProvider } from "next-auth/react";
import { SWRConfig } from "swr";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <SWRConfig
        value={{
          revalidateOnFocus: false,
          fetcher: (url: string) => fetch(url).then((res) => res.json()),
        }}
      >
        {children}
      </SWRConfig>
    </SessionProvider>
  );
}
