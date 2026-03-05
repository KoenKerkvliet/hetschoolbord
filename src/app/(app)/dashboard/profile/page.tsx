"use client";

import { useAuth } from "@/lib/auth-context";
import { ProfileForm } from "@/components/dashboard/profile-form";

export default function ProfilePage() {
  const { user, profile } = useAuth();

  if (!profile || !user) return null;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Profiel</h1>
      <ProfileForm profile={profile} email={user.email ?? ""} />
    </div>
  );
}
