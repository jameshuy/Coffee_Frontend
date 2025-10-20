import { Link } from "wouter";
import PolicyModal from "./PolicyModal";
import React from "react";

interface FooterProps {
  showTopLine?: boolean;
  transparent?: boolean;
}

export default function Footer({ showTopLine = false, transparent = false }: FooterProps) {
  return (
    <footer className={`${transparent ? 'bg-transparent' : 'bg-black'} py-4 mt-2`}>
      {showTopLine && (
        <div className="container mx-auto px-4">
          {/* Horizontal line above footer - same width as navigation lines */}
          <div className="w-full h-px bg-white mb-4"></div>
        </div>
      )}
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center justify-center">
          {/* Footer links - moved above copyright */}
          <div className="flex flex-wrap justify-center space-x-4 md:space-x-6 tracking-wider mb-2">
            <Link href="/privacy" className="cursor-pointer text-white hover:text-opacity-80 transition-all text-[10px] tracking-[0.15em] opacity-70">
              Privacy Policy
            </Link>

            <Link href="/terms" className="cursor-pointer text-white hover:text-opacity-80 transition-all text-[10px] tracking-[0.15em] opacity-70">
              Terms of Service
            </Link>

            <a href="mailto:info@polycraft-studios.com" className="text-white hover:text-opacity-80 transition-all text-[10px] tracking-[0.15em] opacity-70">
              Contact
            </a>
          </div>

          {/* Footer text - moved below links */}
          <div className="text-white text-[8px] text-center opacity-60">
            &copy; 2025 PolyCraft SNC. All Rights Reserved. Made in 🇨🇭
          </div>
        </div>
      </div>
    </footer >
  );
}