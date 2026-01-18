import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { Package, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const AdminLoginPage = () => {
  const navigate = useNavigate();
  const { signIn, signUp } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [isSignup, setIsSignup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* =======================
     BASIC FRONTEND VALIDATION
     (backend is authority)
  ======================= */

  const validate = () => {
    if (!email || !password) {
      setError("Email and password are required");
      return false;
    }
    if (!email.includes("@")) {
      setError("Enter a valid email address");
      return false;
    }
    return true;
  };

  /* =======================
     SUBMIT
  ======================= */

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validate()) return;

    setLoading(true);

    try {
      if (isSignup) {
        // 🔹 SIGN UP FLOW
        const success = await signUp(email, password, password2);

        if (success) {
          toast({
            title: "Account created",
            description: "Your account has been created. Please wait for admin approval.",
          });
          setIsSignup(false);
          navigate("/admin/login");
        } else {
          setError("Signup failed. Please try again.");
        }
      } else {
        // 🔹 LOGIN FLOW
        const success = await signIn(email, password);

        if (success) {
          navigate("/admin/redirect");
        } else {
          setError("Invalid email or password");
        }
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-paymall-dark to-paymall-primary">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex-1 flex items-center justify-center px-6"
      >
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-strong p-8">
            {/* LOGO */}
            <div className="flex items-center justify-center gap-3 mb-8">
              <div className="h-12 w-12 bg-paymall-primary rounded-xl flex items-center justify-center">
                <Package className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">PayMall</h1>
                <p className="text-sm text-gray-500">Admin Portal</p>
              </div>
            </div>

            <h2 className="text-center text-xl font-semibold text-gray-900 mb-6">
              {isSignup ? 'Create Admin Account' : 'Sign in to Admin Panel'}
            </h2>

            {/* ERROR */}
            {error && (
              <div className="mb-4 text-sm text-red-600 text-center">
                {error}
              </div>
            )}

            {/* FORM */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="mt-1.5"
                />
              </div>

              {isSignup && (
                <div>
                  <Label htmlFor="password">Confirm Password</Label>
                  <Input
                    id="password2"
                    type="password"
                    value={password2}
                    onChange={(e) => setPassword2(e.target.value)}
                    placeholder="Enter your password"
                    className="mt-1.5"
                  />
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-paymall-primary hover:bg-paymall-secondary"
                disabled={loading}
              >
                {loading && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                {isSignup ? 'Create Account' : 'Sign In'}
              </Button>
            </form>

            {/* FOOTER */}
            <div className="mt-6 text-center pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                {isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
                <button
                  type="button"
                  onClick={() => {
                    setIsSignup(!isSignup);
                  }}
                  className="font-semibold text-paymall-primary hover:text-paymall-secondary"
                >
                  {isSignup ? 'Sign in' : 'Sign up'}
                </button>
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminLoginPage;
