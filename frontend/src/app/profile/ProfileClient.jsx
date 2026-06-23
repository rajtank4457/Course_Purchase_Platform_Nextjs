"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import API_URL from "@/config/api";
import {
  User,
  Mail,
  Phone,
  MapPin,
  CalendarDays,
  ShieldCheck,
  BadgeCheck,
  BookOpen,
  Crown,
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function ProfileClient() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      const res = await axios.get(`${API_URL}/auth/home`, {
        withCredentials: true,
      });

      setProfile(res.data.user || res.data.data || res.data);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 font-black text-purple-700">
        Loading Profile...
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 font-bold text-gray-600">
        Profile not found
      </div>
    );
  }

  const isAdmin = profile.userType === "admin" || profile.type === "admin";

  const fullName =
    profile.adminName ||
    `${profile.firstName || ""} ${profile.lastName || ""}`.trim() ||
    "User";

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-50 p-4">
        <div className="mx-auto max-w-5xl">
          <div className="overflow-hidden rounded-[2rem] bg-white shadow-2xl">
            <div className="relative bg-gradient-to-r from-purple-700 via-violet-700 to-indigo-700 px-6 py-10 text-white">
              <div className="absolute right-6 top-6 rounded-full bg-white/15 px-4 py-1 text-sm font-black backdrop-blur">
                {isAdmin ? "ADMIN PROFILE" : "STUDENT PROFILE"}
              </div>

              <div className="flex flex-col items-center gap-5 sm:flex-row">
                <div className="flex h-28 w-28 items-center justify-center rounded-full border-4 border-white bg-white text-5xl font-black text-purple-700 shadow-xl">
                  {fullName.charAt(0).toUpperCase()}
                </div>

                <div>
                  <h1 className="text-3xl font-black sm:text-4xl">
                    {fullName}
                  </h1>

                  <p className="mt-2 flex items-center gap-2 text-purple-100">
                    <Mail className="h-4 w-4" />
                    {profile.email}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-3">
                    <span className="flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-bold backdrop-blur">
                      {isAdmin ? (
                        <Crown className="h-4 w-4" />
                      ) : (
                        <BookOpen className="h-4 w-4" />
                      )}
                      {isAdmin ? profile.role || "Admin" : "Student"}
                    </span>

                    <span className="flex items-center gap-2 rounded-full bg-green-400/20 px-4 py-2 text-sm font-bold text-green-100 backdrop-blur">
                      <BadgeCheck className="h-4 w-4" />
                      Active Account
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-5 p-6 md:grid-cols-3">
              <ProfileCard
                icon={<User />}
                label={isAdmin ? "Admin ID" : "User ID"}
                value={profile.adminId || profile.userId || "N/A"}
              />

              <ProfileCard
                icon={<ShieldCheck />}
                label="Account Type"
                value={isAdmin ? "Administrator" : "Student"}
              />

              <ProfileCard
                icon={<Mail />}
                label="Email Address"
                value={profile.email || "N/A"}
              />

              {!isAdmin && (
                <>
                  <ProfileCard
                    icon={<Phone />}
                    label="Phone Number"
                    value={profile.phoneNo || "N/A"}
                  />

                  <ProfileCard
                    icon={<MapPin />}
                    label="Address"
                    value={profile.address || "N/A"}
                  />

                  <ProfileCard
                    icon={<MapPin />}
                    label="City / State"
                    value={`${profile.city || "N/A"} / ${profile.state || "N/A"}`}
                  />

                  <ProfileCard
                    icon={<CalendarDays />}
                    label="Date of Birth"
                    value={
                      profile.dob
                        ? new Date(profile.dob).toLocaleDateString()
                        : "N/A"
                    }
                  />
                </>
              )}

              {isAdmin && (
                <ProfileCard
                  icon={<Crown />}
                  label="Admin Role"
                  value={profile.role || "admin"}
                />
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}

function ProfileCard({ icon, label, value }) {
  return (
    <div className="rounded-3xl border border-gray-100 bg-gradient-to-br from-white to-slate-50 p-5 shadow-lg transition hover:-translate-y-1 hover:shadow-xl">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-100 text-purple-700">
        {icon}
      </div>

      <p className="text-sm font-bold text-gray-500">{label}</p>
      <h3 className="mt-1 break-words text-lg font-black text-gray-900">
        {value}
      </h3>
    </div>
  );
}
