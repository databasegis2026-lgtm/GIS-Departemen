import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PencilIcon } from "@/icons";
import { useState } from "react";
import EditProfileModal, { type UserProfileData } from "./edit-profile-modal";

interface ProfileInfoSectionProps {
  initialUserName: string;
  onUserNameChange: (name: string) => void;
}

export default function ProfileInfoSection({
  initialUserName,
  onUserNameChange,
}: ProfileInfoSectionProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [profile, setProfile] = useState<UserProfileData>(() => {
    return {
      fullName: initialUserName,
      username: initialUserName.toLowerCase().replace(/\s+/g, "."),
      email: `${initialUserName.toLowerCase().replace(/\s+/g, ".")}@gis-departemen.com`,
      phone: "+62 812-3456-7890",
      role: "superadminGIS (Super Administrator GIS)",
      department: "Departemen GIS, Survey & Pemetaan",
      estateUnit: "Kantor Wilayah GIS - PT BUM",
      bio: "Bertanggung jawab atas validasi data spasial kebun, pembaharuan layer peta produksi, dan tata kelola sistem GIS perkebunan.",
    };
  });

  const handleSaveProfile = (updated: UserProfileData) => {
    setProfile(updated);
    if (updated.fullName) {
      onUserNameChange(updated.fullName);
    }
  };

  const initialLetter = profile.fullName.trim()
    ? profile.fullName.trim()[0].toUpperCase()
    : "R";

  return (
    <>
      <Card className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 dark:border-gray-800 dark:bg-white/3">
        {/* Top Header Row: Title & Edit Button */}
        <div className="flex items-center justify-between gap-4 border-b border-gray-100 pb-4 dark:border-gray-800">
          <div>
            <h3 className="text-base font-semibold text-gray-800 sm:text-lg dark:text-white/90">
              Informasi Data Diri & Kedinasan
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Kelola data profil akun dan identitas operasional Anda
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsEditModalOpen(true)}
            className="gap-2"
          >
            <PencilIcon className="size-4" />
            <span>Edit Profil</span>
          </Button>
        </div>

        {/* Profile Pic & Meta Header */}
        <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
          <Avatar className="size-20 shrink-0 rounded-2xl ring-2 ring-gray-100 dark:ring-gray-800">
            <AvatarImage
              src="/images/user/owner.png"
              alt={profile.fullName}
              className="rounded-2xl object-cover"
            />
            <AvatarFallback className="rounded-2xl bg-brand-500 text-2xl font-bold text-white">
              {initialLetter}
            </AvatarFallback>
          </Avatar>

          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2.5">
              <h4 className="text-lg font-bold text-gray-800 dark:text-white/90">
                {profile.fullName}
              </h4>
              <Badge color="success">{profile.role}</Badge>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
              <span>{profile.department}</span>
              <span className="inline-block size-1 rounded-full bg-gray-300 dark:bg-gray-600" />
              <span>{profile.estateUnit}</span>
            </div>
          </div>
        </div>

        {/* Detailed Information Grid */}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-3.5 dark:border-gray-800 dark:bg-white/[0.02]">
            <span className="text-[11px] font-medium text-gray-400 dark:text-gray-500">
              Nama Lengkap
            </span>
            <p className="mt-1 text-sm font-semibold text-gray-800 dark:text-white/90">
              {profile.fullName}
            </p>
          </div>

          <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-3.5 dark:border-gray-800 dark:bg-white/[0.02]">
            <span className="text-[11px] font-medium text-gray-400 dark:text-gray-500">
              Username
            </span>
            <p className="mt-1 text-sm font-semibold text-gray-800 dark:text-white/90 font-mono">
              {profile.username}
            </p>
          </div>

          <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-3.5 dark:border-gray-800 dark:bg-white/[0.02]">
            <span className="text-[11px] font-medium text-gray-400 dark:text-gray-500">
              Email Kedinasan
            </span>
            <p className="mt-1 text-sm font-semibold text-gray-800 dark:text-white/90">
              {profile.email}
            </p>
          </div>

          <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-3.5 dark:border-gray-800 dark:bg-white/[0.02]">
            <span className="text-[11px] font-medium text-gray-400 dark:text-gray-500">
              Nomor Telepon / WhatsApp
            </span>
            <p className="mt-1 text-sm font-semibold text-gray-800 dark:text-white/90">
              {profile.phone}
            </p>
          </div>

          <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-3.5 dark:border-gray-800 dark:bg-white/[0.02]">
            <span className="text-[11px] font-medium text-gray-400 dark:text-gray-500">
              Departemen
            </span>
            <p className="mt-1 text-sm font-semibold text-gray-800 dark:text-white/90">
              {profile.department}
            </p>
          </div>

          <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-3.5 dark:border-gray-800 dark:bg-white/[0.02]">
            <span className="text-[11px] font-medium text-gray-400 dark:text-gray-500">
              Unit Kerja / Estate
            </span>
            <p className="mt-1 text-sm font-semibold text-gray-800 dark:text-white/90">
              {profile.estateUnit}
            </p>
          </div>
        </div>

        {/* Bio / Catatan Tugas */}
        <div className="mt-4 rounded-xl border border-gray-100 bg-gray-50/50 p-4 dark:border-gray-800 dark:bg-white/[0.02]">
          <span className="text-[11px] font-medium text-gray-400 dark:text-gray-500">
            Tupoksi & Deskripsi Penugasan
          </span>
          <p className="mt-1 text-xs leading-relaxed text-gray-600 dark:text-gray-300">
            {profile.bio}
          </p>
        </div>
      </Card>

      <EditProfileModal
        isOpen={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        initialData={profile}
        onSave={handleSaveProfile}
      />
    </>
  );
}
