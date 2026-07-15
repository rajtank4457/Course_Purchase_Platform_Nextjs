"use client";

import { useEffect, useState } from "react";
import { apiRequest, achievementApi } from "@/lib/apiHelper";
import { Sparkles, Lock, CheckCircle } from "lucide-react";

export default function AchievementBadges() {
  const [badges, setBadges] = useState([]);
  const [unlocked, setUnlocked] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAchievements = async () => {
    try {
      const res = await apiRequest(achievementApi.getAchievements, {
        method: "GET",
      });

      if (res.success) {
        setBadges(res.data?.data?.allBadges || []);
        setUnlocked(res.data?.data?.unlocked || []);
      }
    } catch (err) {
      console.log("ACHIEVEMENT FETCH ERROR:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAchievements();
  }, []);

  const isUnlocked = (key) => unlocked.some((item) => item.badgeKey === key);

  if (loading) return null;

  return (
    <div className="rounded-3xl bg-white p-6 shadow-xl">
      <div className="flex items-center gap-3">
        <div className="rounded-2xl bg-purple-100 p-3 text-purple-700">
          <Sparkles className="h-6 w-6" />
        </div>

        <div>
          <h2 className="text-xl font-black text-gray-900">
            Achievement Badges
          </h2>
          <p className="text-sm text-gray-500">Unlock rewards as you learn</p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {badges.map((badge) => {
          const unlockedBadge = isUnlocked(badge.key);

          return (
            <div
              key={badge.key}
              className={`relative min-h-[130px] overflow-hidden rounded-2xl p-4 transition ${
                unlockedBadge
                  ? "bg-purple-50 ring-1 ring-purple-100"
                  : "bg-gray-50 opacity-70 ring-1 ring-gray-100"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl text-xl ${
                      unlockedBadge ? "bg-white" : "bg-gray-100 grayscale"
                    }`}
                  >
                    {badge.icon}
                  </div>

                  <div>
                    <h3 className="line-clamp-1 text-sm font-black text-gray-900">
                      {badge.title}
                    </h3>

                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-gray-500">
                      {badge.description}
                    </p>
                  </div>
                </div>

                {unlockedBadge ? (
                  <CheckCircle className="h-5 w-5 shrink-0 text-green-600" />
                ) : (
                  <Lock className="h-5 w-5 shrink-0 text-gray-400" />
                )}
              </div>

              <div className="mt-6">
                {unlockedBadge ? (
                  <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-black text-green-700">
                    Unlocked
                  </span>
                ) : (
                  <span className="rounded-full bg-gray-200 px-3 py-1 text-xs font-black text-gray-600">
                    Locked
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
