import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/50">
      <div className="w-full max-w-md space-y-8 px-4">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">Het Schoolbord</h1>
          <p className="mt-2 text-muted-foreground">
            Log in om verder te gaan
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
