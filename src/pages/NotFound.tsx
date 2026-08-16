import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname,
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100">
      <div className="text-center">
        <h1 className="text-6xl font-black mb-4 bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">404</h1>
        <p className="text-xl text-slate-400 mb-4">Oops! Page not found</p>
        <a href="/" className="text-indigo-400 hover:text-indigo-300 underline font-semibold">
          Return to Nexus Plex
        </a>
      </div>
    </div>
  );
};

export default NotFound;