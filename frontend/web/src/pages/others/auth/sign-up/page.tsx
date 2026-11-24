import { PageMeta } from "@/components/shared/page-meta";
import SignUp from "./index";

export default function SignUpPage() {
  return (
    <>
      <PageMeta
        title="Daftar Akun | GIS Departemen"
        description="Pendaftaran Akun GIS Departemen"
      />
      <SignUp />
    </>
  );
}
