"use client";

import { Suspense } from "react";
import SecureAuthForm from "@/components/secure-auth-form";

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-7xl px-4 py-16 text-center">Loading authentication...</div>}>
      <SecureAuthForm />
    </Suspense>
  );
}
