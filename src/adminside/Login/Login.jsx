import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../userside/Provider/AuthProvider";
import { base_url } from "../../config/config";
const ASignin = () => {
  const [remail, setEmail] = useState("");
  const [rpass, setPassword] = useState("");
  const [error, setError] = useState("");
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
              value={remail}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              value={rpass}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-400 focus:outline-none"
            />
          </div>

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
