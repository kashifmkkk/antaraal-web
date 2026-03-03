import { SignupComponent } from "@/components/Signup";
import { Link } from "react-router-dom";

const SignupPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/20 px-4">
      <div className="w-full max-w-sm space-y-4 text-center">
        <SignupComponent />
        <p className="text-sm text-muted-foreground">
          Already registered?
          {" "}
          <Link className="font-medium text-primary hover:underline" to="/login">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default SignupPage;
