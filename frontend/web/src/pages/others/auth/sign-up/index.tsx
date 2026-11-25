import { cn } from "@/utils";
import { Link } from "react-router";
import SignUpFormFields from "./form";
import SignUpHeader from "./header";

export default function SignUp() {
  const baseUrl = import.meta.env.BASE_URL;

  return (
      <div className={cn("flex w-full flex-1 flex-col lg:w-1/2")}>
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center">
          <div>
            {/* Logo on mobile view */}
            <div className="mb-6 flex justify-center lg:hidden">
              <Link to="/" className="flex items-center gap-3">
                <img
                  src={`${baseUrl}images/logo/favicon.png`}
                  alt="GIS Departemen Logo"
                  className="size-12 rounded-xl object-contain shadow-sm"
                />
                <span className="text-xl font-bold tracking-tight text-gray-800 dark:text-white">
                  GIS Departemen
                </span>
              </Link>
            </div>

            <SignUpHeader />

            <div>
              <SignUpFormFields />

              <div className="mt-5">
                  <p className="text-center text-xs text-gray-500 dark:text-gray-400">
                    Sudah punya akun?{" "}
                    <Link
                      to="/signin"
                      className="font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
                    >
                      Masuk ke Sistem
                    </Link>
                  </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      );
}
