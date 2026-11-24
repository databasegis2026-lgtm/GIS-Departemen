import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useState } from "react";

export interface UserProfileData {
  fullName: string;
  username: string;
  email: string;
  phone: string;
  role: string;
  department: string;
  estateUnit: string;
  bio: string;
}

interface EditProfileModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  initialData: UserProfileData;
  onSave: (data: UserProfileData) => void;
}

export default function EditProfileModal({
  isOpen,
  onOpenChange,
  initialData,
  onSave,
}: EditProfileModalProps) {
  const [formData, setFormData] = useState<UserProfileData>(initialData);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100%-2rem)] rounded-2xl p-6 sm:max-w-xl sm:p-8">
        <DialogHeader className="gap-1 pe-10 text-start">
          <DialogTitle className="text-xl font-bold text-gray-800 dark:text-white/90">
            Edit Profil Pengguna
          </DialogTitle>
          <DialogDescription className="text-xs text-gray-500 dark:text-gray-400">
            Perbarui data diri dan informasi kedinasan GIS Departemen
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                Nama Lengkap
              </FieldLabel>
              <Input
                type="text"
                value={formData.fullName}
                onChange={(e) =>
                  setFormData({ ...formData, fullName: e.target.value })
                }
                required
              />
            </Field>

            <Field>
              <FieldLabel className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                Username
              </FieldLabel>
              <Input
                type="text"
                value={formData.username}
                onChange={(e) =>
                  setFormData({ ...formData, username: e.target.value })
                }
                required
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                Email Kedinasan
              </FieldLabel>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required
              />
            </Field>

            <Field>
              <FieldLabel className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                Nomor Telepon / WA
              </FieldLabel>
              <Input
                type="tel"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                Departemen
              </FieldLabel>
              <Input
                type="text"
                value={formData.department}
                onChange={(e) =>
                  setFormData({ ...formData, department: e.target.value })
                }
              />
            </Field>

            <Field>
              <FieldLabel className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                Unit / Estate
              </FieldLabel>
              <Input
                type="text"
                value={formData.estateUnit}
                onChange={(e) =>
                  setFormData({ ...formData, estateUnit: e.target.value })
                }
              />
            </Field>
          </div>

          <Field>
            <FieldLabel className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
              Deskripsi Singkat / Bio
            </FieldLabel>
            <Input
              type="text"
              value={formData.bio}
              onChange={(e) =>
                setFormData({ ...formData, bio: e.target.value })
              }
            />
          </Field>

          <DialogFooter className="mt-6 flex items-center justify-end gap-3 pt-2">
            <DialogClose render={<Button variant="outline" type="button" />}>
              Batal
            </DialogClose>
            <Button type="submit">
              Simpan Perubahan
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
