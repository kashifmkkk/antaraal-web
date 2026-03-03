import { LoginComponent } from "@/components/Login";
import { Link } from "react-router-dom";

const LoginPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/20 px-4">
      <div className="w-full max-w-sm space-y-4 text-center">
        <LoginComponent />
        <p className="text-sm text-muted-foreground">
          Need an account?
          {" "}
          <Link className="font-medium text-primary hover:underline" to="/signup">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
