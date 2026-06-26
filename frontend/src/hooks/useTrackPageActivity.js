// hooks/useTrackPageActivity.js
"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { apiRequest, activityApi } from "@/lib/apiHelper";

export default function useTrackPageActivity() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;

    const track = async () => {
      await apiRequest(activityApi.trackPage, {
        method: "POST",
        data: {
          pageUrl: pathname,
          actionType: "page_view",
        },
      });
    };

    track();
  }, [pathname]);
}