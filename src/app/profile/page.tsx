
"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type AuthUser = {
  app_metadata?: { provider?: string };
  user_metadata?: { provider?: string };
  identities?: Array<{ provider?: string }>;
};

const hasDiscordIdentity = (user: AuthUser | null) => {
  if (!user) return false;
  if (user.app_metadata?.provider === "discord") return true;
  if (user.user_metadata?.provider === "discord") return true;
  return (user.identities || []).some((identity) => identity.provider === "discord");
};

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({
    display_name: "",
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    discord: ""
  });
  const [message, setMessage] = useState("");
  const [isDiscordLinked, setIsDiscordLinked] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login?redirect=/profile");
        return;
      }

      setIsDiscordLinked(hasDiscordIdentity(user as AuthUser));

      const { data, error } = await supabase
        .from("profiles")
        .select("display_name, first_name, last_name, email, phone, discord, id")
        .eq("id", user.id)
        .single();
      if (error) {
        setMessage("Could not load profile.");
      } else {
        setProfile({
          display_name: data.display_name || "",
          first_name: data.first_name || "",
          last_name: data.last_name || "",
          email: data.email || user.email || "",
          phone: data.phone || "",
          discord: data.discord || user.user_metadata?.discord_username || ""
        });
      }
      setLoading(false);
    };
    fetchProfile();
  }, [supabase, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setMessage("Not authenticated.");
      setSaving(false);
      return;
    }
    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: profile.display_name,
        first_name: profile.first_name,
        last_name: profile.last_name,
        email: profile.email,
        phone: profile.phone,
        discord: profile.discord
      })
      .eq("id", user.id);
    if (error) {
      setMessage("Failed to update profile.");
    } else {
      setMessage("Profile updated!");
    }
    setSaving(false);
  };

  const handleConnectDiscord = () => {
    router.push('/login?link_discord=1');
  };

  if (loading) return <main className="min-h-screen flex items-center justify-center">Loading...</main>;

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-16 bg-kraken-dark">
      <div className="card w-full max-w-xl">
        <h1 className="section-title mb-8">Profile Setup</h1>
        <form onSubmit={handleSave} className="space-y-5">
          <div>
            <label className="block text-kraken-cyan font-display tracking-wide mb-2">First Name</label>
            <input
              type="text"
              name="first_name"
              value={profile.first_name}
              onChange={handleChange}
              className="input-field"
              placeholder="First name"
            />
          </div>
          <div>
            <label className="block text-kraken-cyan font-display tracking-wide mb-2">Last Name</label>
            <input
              type="text"
              name="last_name"
              value={profile.last_name}
              onChange={handleChange}
              className="input-field"
              placeholder="Last name"
            />
          </div>
          <div>
            <label className="block text-kraken-cyan font-display tracking-wide mb-2">Display Name</label>
            <input
              type="text"
              name="display_name"
              value={profile.display_name}
              onChange={handleChange}
              className="input-field"
              placeholder="Display name"
            />
          </div>
          <div>
            <label className="block text-kraken-cyan font-display tracking-wide mb-2">Email</label>
            <input
              type="email"
              name="email"
              value={profile.email}
              onChange={handleChange}
              className="input-field"
              placeholder="Email"
            />
          </div>
          <div>
            <label className="block text-kraken-cyan font-display tracking-wide mb-2">Phone</label>
            <input
              type="tel"
              name="phone"
              value={profile.phone}
              onChange={handleChange}
              className="input-field"
              placeholder="Phone number"
            />
          </div>
          <div>
            <label className="block text-kraken-cyan font-display tracking-wide mb-2">Discord Username</label>
            <input
              type="text"
              name="discord"
              value={profile.discord}
              onChange={handleChange}
              className="input-field"
              placeholder="yourname#1234 or @username"
            />
            <p className="text-xs text-gray-400 mt-2">
              Discord OAuth status: {isDiscordLinked ? 'Connected' : 'Not connected'}
            </p>
            {!isDiscordLinked && (
              <button
                type="button"
                onClick={handleConnectDiscord}
                className="btn-secondary mt-3"
              >
                Connect Discord Account
              </button>
            )}
          </div>
          {message && <p className="text-sm text-gray-300">{message}</p>}
          <div className="flex gap-4">
            <button type="submit" disabled={saving} className="btn-primary w-full justify-center inline-flex">
              {saving ? "Saving..." : "Save Profile"}
            </button>
            <button type="button" className="btn-secondary w-full justify-center inline-flex" onClick={() => router.push("/")}>Cancel</button>
          </div>
        </form>
      </div>
    </main>
  );
}
