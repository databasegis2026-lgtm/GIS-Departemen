import { PageMeta } from "@/components/shared/page-meta";
import SignIn from "./index";

export default function SignInPage() {
  return (
    <>
      <PageMeta
        title="Masuk | GIS Departemen"
        description="Masuk ke Sistem GIS Departemen"
      />
      <SignIn />
    </>
  );
}
