import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { MoveRight, PhoneCall } from "lucide-react";
import { Button } from "@/components/ui/button";

function Hero() {
  const [titleNumber, setTitleNumber] = useState(0);
  const titles = useMemo(
    () => ["amazing", "new", "wonderful", "beautiful", "smart"],
    []
  );

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (titleNumber === titles.length - 1) {
        setTitleNumber(0);
      } else {
        setTitleNumber(titleNumber + 1);
      }
    }, 2000);
    return () => clearTimeout(timeoutId);
  }, [titleNumber, titles]);

  return (
    <div className="w-full">
      <div className="container mx-auto">
        <div className="flex gap-8 py-20 lg:py-40 items-center justify-center flex-col">
          <div>
            <Button variant="secondary" size="sm" className="gap-4">
              Read our launch article <MoveRight className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex gap-4 flex-col">
            <h1 className="text-5xl md:text-7xl max-w-2xl tracking-tighter text-center font-regular">
              <span className="text-spektr-cyan-50">This is something</span>
              <span className="relative flex w-full justify-center overflow-hidden text-center md:pb-4 md:pt-1">
                &nbsp;
                {titles.map((title, index) => (
                  <motion.span
                    key={index}
                    className="absolute font-semibold"
                    initial={{ opacity: 0, y: "-100" }}
                    transition={{ type: "spring", stiffness: 50 }}
                    animate={
                      titleNumber === index
                        ? {
                            y: 0,
                            opacity: 1,
                          }
                        : {
                            y: titleNumber > index ? -150 : 150,
                            opacity: 0,
                          }
                    }
                  >
                    {title}
                  </motion.span>
                ))}
              </span>
            </h1>

            <p className="text-lg md:text-xl leading-relaxed tracking-tight text-muted-foreground max-w-2xl text-center">
              Managing a small business today is already tough. Avoid further
              complications by ditching outdated, tedious trade methods. Our
              goal is to streamline SMB trade, making it easier and faster than
              ever.
            </p>
          </div>
          <div className="flex flex-row gap-3">
            <Button size="lg" className="gap-4" variant="outline">
              Jump on a call <PhoneCall className="w-4 h-4" />
            </Button>
            <Button size="lg" className="gap-4">
              Sign up here <MoveRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface AnimatedHeroProps {
  title: string;
  subtitle?: string;
  ctaText?: string;
  onCtaClick?: () => void;
}

function AnimatedHero({ title, subtitle, ctaText, onCtaClick }: AnimatedHeroProps) {
  const [titleNumber, setTitleNumber] = useState(0);
  
  // Parse the subtitle to extract rotating words or use default
  const titles = useMemo(() => {
    if (!subtitle) return ["exciting", "inspiring", "mind-boggling", "packed with value", "you've never seen before"];
    // Split by • or comma and clean up
    return subtitle.split(/[•,]/).map(word => word.trim()).filter(word => word.length > 0);
  }, [subtitle]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (titleNumber === titles.length - 1) {
        setTitleNumber(0);
      } else {
        setTitleNumber(titleNumber + 1);
      }
    }, 3000);
    return () => clearTimeout(timeoutId);
  }, [titleNumber, titles]);

  return (
    <div className="w-full flex items-center justify-center">
      <div className="text-center max-w-lg">
        {/* ClearCompany Logo */}
        <div className="mb-12">
          <img 
            src="/clearco-logo.png" 
            alt="ClearCo Logo" 
            width={200} 
            height={80} 
            className="mx-auto"
          />
        </div>
        
        {/* Main Heading with Animated Text */}
        <div className="flex flex-col gap-2">
          <h1 className="text-5xl font-bold text-white leading-tight">
            {title}
          </h1>
          <div className="text-5xl font-bold text-white italic leading-tight h-20 flex items-center justify-center">
            <span className="relative flex justify-center overflow-hidden min-w-full">
              {titles.map((rotatingTitle, index) => (
                <motion.span
                  key={index}
                  className="absolute font-bold italic whitespace-nowrap"
                  initial={{ opacity: 0, y: "-100" }}
                  transition={{ type: "spring", stiffness: 50 }}
                  animate={
                    titleNumber === index
                      ? {
                          y: 0,
                          opacity: 1,
                        }
                      : {
                          y: titleNumber > index ? -150 : 150,
                          opacity: 0,
                        }
                  }
                >
                  {rotatingTitle}
                </motion.span>
              ))}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export { Hero, AnimatedHero };
