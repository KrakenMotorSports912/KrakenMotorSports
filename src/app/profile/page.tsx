
"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({ display_name: "", discord: "" });
  const [message, setMessage] = useState("");
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
      const { data, error } = await supabase
        .from("profiles")
        .select("display_name, id")
        .eq("id", user.id)
        .single();
      if (error) {
        setMessage("Could not load profile.");
      } else {
        setProfile({ display_name: data.display_name || "", discord: user.user_metadata?.discord_username || "" });
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
      .update({ display_name: profile.display_name })
      .eq("id", user.id);
    if (error) {
      setMessage("Failed to update profile.");
    } else {
      setMessage("Profile updated!");
    }
    setSaving(false);
  };

  if (loading) return <main className="min-h-screen flex items-center justify-center">Loading...</main>;

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-16 bg-kraken-dark">
      <div className="card w-full max-w-xl">
        <h1 className="section-title mb-8">Profile Setup</h1>
        <form onSubmit={handleSave} className="space-y-5">
          <div>
            <label className="block text-kraken-cyan font-display tracking-wide mb-2">Display Name</label>
            <input
              type="text"
              name="display_name"
              value={profile.display_name}
              onChange={handleChange}
              className="input-field"
              placeholder="Your name"
              required
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
          </div>
          {message && <p className="text-sm text-gray-300">{message}</p>}
          <button type="submit" disabled={saving} className="btn-primary w-full justify-center inline-flex">
            {saving ? "Saving..." : "Save Profile"}
          </button>
        </form>
      </div>
    </main>
  );
}
