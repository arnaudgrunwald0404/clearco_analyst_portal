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
      className="relative w-full h-48 bg-cover bg-center flex items-center justify-center overflow-hidden"
      style={{
        backgroundImage: "url('/banner-art/r8ieHgL2LSFO6wXZjZkiX.png')",
      }}
    >
      {/* Minimal gradient overlay for enhanced brightness */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/5 via-white to-black/5"></div>
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/3 to-black/8"></div>
      
      {/* Image enhancement overlay for more punch */}

      
      {/* Header content */}
      <div className="relative z-10 text-center px-8 max-w-4xl mx-auto">
        
        <h1 className="text-4xl font-extrabold mb-4 drop-shadow-2xl tracking-tight">
          <span className="text-gray-800">
            {industryName} <br/>Industry Relationship Management
          </span>
        </h1>
        <p className="text-2xl font-medium drop-shadow-lg text-gray-700 leading-relaxed">
          Manage relationships • Get noticed • Drive growth
        </p>
  
      </div>
    </header>
  );
};

export default Header;

