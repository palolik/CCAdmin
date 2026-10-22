import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../userside/Provider/AuthProvider";
import { base_url } from "../../config/config";
import { FaEye, FaEyeSlash } from "react-icons/fa";

const REMEMBER_KEY = "adminRememberEmail";

// Lets the browser's password manager save the login (stored encrypted by the browser, not by us).
const saveCredentialToBrowser = async (email, password) => {
  try {
    if (window.PasswordCredential && navigator.credentials?.store) {
      await navigator.credentials.store(new window.PasswordCredential({ id: email, password, name: email }));
    }
  } catch (err) {
    console.warn("Could not save credential:", err);
  }
};

const ASignin = () => {
  const [remail, setEmail] = useState(() => localStorage.getItem(REMEMBER_KEY) || "");
  const [rpass, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(() => !!localStorage.getItem(REMEMBER_KEY));
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  const handleLogin = async (event) => {
    event.preventDefault();

    const loginData = { remail, rpass };

    try {
      const response = await fetch(`${base_url}/adminlogin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginData),
      });

      const data = await response.json();

      if (data.success && data.token && data.user) {
        localStorage.setItem("adminToken", data.token);
        localStorage.setItem("adminData", JSON.stringify(data.user));

        if (rememberMe) {
          localStorage.setItem(REMEMBER_KEY, remail);
          await saveCredentialToBrowser(remail, rpass);
        } else {
          localStorage.removeItem(REMEMBER_KEY);
        }

        await login(data.token);

        navigate("/admin");
      } else {
        setError(data.message || "Invalid credentials");
      }
    } catch (error) {
      console.error("Error during login:", error);
      setError("An error occurred. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
      <div className="bg-white shadow-2xl rounded-2xl w-full sm:w-96 p-8 transition-transform duration-300 hover:scale-[1.02]">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">Sign In</h2>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              name="email"
              autoComplete="username"
              value={remail}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                autoComplete="current-password"
                value={rpass}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                className="w-full border border-gray-300 rounded-md px-3 py-2 pr-10 focus:ring-2 focus:ring-blue-400 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 accent-blue-500"
            />
            Remember me
          </label>

          <button
            type="submit"
            className="w-full bg-blue-500 text-white font-semibold py-2 rounded-md mt-4 hover:bg-blue-600 focus:ring-2 focus:ring-blue-400 transition-all"
          >
            Sign In
          </button>

          {error && <p className="text-center text-sm text-red-500 mt-2">{error}</p>}
        </form>
      </div>
    </div>
  );
};

export default ASignin;
