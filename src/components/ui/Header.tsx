import React, { useEffect, useState } from "react";
import { getBannerImagePath } from "@/lib/banner-utils";

interface HeaderProps {
  title?: string;
  subtitle?: string;
  showBanner?: boolean;
}

const Header: React.FC<HeaderProps> = ({ 
  title, 
  subtitle, 
  showBanner = true 
}) => {
  const [industryName, setIndustryName] = useState("Industry");
  const [logoUrl, setLogoUrl] = useState("");
  const [bannerImage, setBannerImage] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await fetch("/api/settings/general");
        if (response.ok) {
          const data = await response.json();
          setIndustryName(data.industryName || "Industry");
          setLogoUrl(data.logoUrl || "");
        } else {
          setError("Failed to load settings");
        }
      } catch (error) {
        console.error("Failed to fetch settings:", error);
        setError("Failed to load settings");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, []);

  useEffect(() => {
    if (showBanner) {
      setBannerImage(getBannerImagePath('r8ieHgL2LSFO6wXZjZkiX.png'));
    }
  }, [showBanner]);
  return (
    <header
      className="relative w-full h-36 bg-cover bg-center flex items-center justify-center overflow-hidden"
      style={{
        backgroundImage: showBanner && bannerImage 
          ? `url('${bannerImage}')` 
          : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      }}
      role="banner"
      aria-label="Main header"
    >
      {/* Gradient overlays for better text readability */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/5 via-white to-black/5"></div>
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/5 to-black/5"></div>
      
      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-white/20 backdrop-blur-sm flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}
      
      {/* Error state */}
      {error && !isLoading && (
        <div className="absolute inset-0 bg-red-50/90 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-600 text-sm font-medium">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="mt-2 text-blue-600 hover:text-blue-800 text-sm underline"
            >
              Retry
            </button>
          </div>
        </div>
      )}
      
      {/* Header content */}
      <div className="relative z-10 text-center px-4 md:px-8 max-w-4xl mx-auto">
  
        
        <h1 className="text-2xl md:text-3xl lg:text-3xl font-extrabold mb-2 md:mb-4 drop-shadow-2xl tracking-tight">
          <span className="text-gray-800">
            {title || `${industryName} Industry Relationship Management`}
          </span>
        </h1>
        
        <p className="text-lg md:text-xl lg:text-2xl font-medium drop-shadow-lg text-gray-700 leading-relaxed">
          {subtitle || "Manage relationships • Get noticed • Drive growth"}
        </p>
      </div>
    </header>
  );
};

export default Header;

