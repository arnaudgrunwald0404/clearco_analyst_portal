import React, { useEffect, useState } from "react";

const Header: React.FC = () => {
  const [industryName, setIndustryName] = useState("Industry");
  const [logoUrl, setLogoUrl] = useState("");

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch("/api/settings/general");
        if (response.ok) {
          const data = await response.json();
          setIndustryName(data.industryName || "Industry");
          setLogoUrl(data.logoUrl || "");
        }
      } catch (error) {
        console.error("Failed to fetch settings:", error);
      }
    };

    fetchSettings();
  }, []);
  return (
    <header
      className="relative w-full h-64 bg-cover bg-center flex items-center justify-center overflow-hidden"
      style={{
        backgroundImage: "url('/banner-art/r8ieHgL2LSFO6wXZjZkiX.png')",
      }}
    >
      {/* Minimal gradient overlay for enhanced brightness */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/5 via-transparent to-black/5"></div>
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/2 to-black/8"></div>
      
      {/* Image enhancement overlay for more punch */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/5 to-pink-500/10 mix-blend-overlay"></div>
      
      {/* Header content */}
      <div className="relative z-10 text-center text-white px-8 max-w-4xl mx-auto">
        
        <h1 className="text-5xl font-extrabold mb-6 drop-shadow-2xl tracking-tight">
          <span className="bg-gradient-to-r from-gray-800 to-gray-900 bg-clip-text text-transparent">
            {industryName} Analyst Relationship Management
          </span>
        </h1>
        <p className="text-2xl font-medium drop-shadow-lg text-gray-700 leading-relaxed">
          Manage relationships • Track insights • Drive growth
        </p>
        <div className="mt-6 w-24 h-1 bg-gradient-to-r from-blue-400 to-purple-400 mx-auto rounded-full"></div>
      </div>
    </header>
  );
};

export default Header;

