"use client";

import "./globals.css";
import { Inter } from "next/font/google";
import { useStore } from "@/store/useStore";
import { useEffect, useState, useRef } from "react";
import { RiWifiOffLine } from "react-icons/ri";
import Link from "next/link";
import { AuthProvider, useAuth } from "@/components/AuthProvider";
import LogoutButton from "@/components/LogoutButton";
import InactivitySettings from "@/components/InactivitySettings";
import InactivityWarning from "@/components/InactivityWarning";
import Head from "next/head";
import { ErrorBoundary } from "@/components/ErrorBoundary";

const inter = Inter({ subsets: ["latin"] });

function RootLayoutContent({ children }: { children: React.ReactNode }) {
  const { isOffline, setOfflineStatus } = useStore();
  const { user } = useAuth();
  const fontSelectorRef = useRef<HTMLDivElement>(null);
  const [showFontSelector, setShowFontSelector] = useState(false);
  const [selectedFont, setSelectedFont] = useState(() => {
    // Try to get saved font from localStorage
    if (typeof window !== "undefined") {
      const savedFont = localStorage.getItem("soul-pages-font");
      return savedFont || "Indie Flower";
    }
    return "Indie Flower";
  });

  useEffect(() => {
    // Handle click outside to close dropdown
    const handleClickOutside = (event: MouseEvent) => {
      if (
        fontSelectorRef.current &&
        !fontSelectorRef.current.contains(event.target as Node)
      ) {
        setShowFontSelector(false);
      }
    };

    if (showFontSelector) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showFontSelector]);

  useEffect(() => {
    // Offline detection
    const handleOnline = () => setOfflineStatus(false);
    const handleOffline = () => setOfflineStatus(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [setOfflineStatus]);

  // Apply selected font on component mount and save to localStorage
  useEffect(() => {
    document.documentElement.style.setProperty("--app-font", selectedFont);
    // Save font preference to localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem("soul-pages-font", selectedFont);
    }
  }, [selectedFont]);

  // Font options with their display names
  const fontOptions = [
    {
      name: "Indie Flower",
      display: "Indie Flower",
      style: "font-handwriting",
    },
    { name: "Inter", display: "Inter", style: "font-sans" },
    { name: "Georgia", display: "Georgia", style: "font-serif" },
    { name: "Courier New", display: "Courier New", style: "font-mono" },
    { name: "Arial", display: "Arial", style: "font-sans" },
    {
      name: "Times New Roman",
      display: "Times New Roman",
      style: "font-serif",
    },
    { name: "Verdana", display: "Verdana", style: "font-sans" },
    { name: "Trebuchet MS", display: "Trebuchet MS", style: "font-sans" },
    { name: "Garamond", display: "Garamond", style: "font-serif" },
    { name: "Bookman", display: "Bookman", style: "font-serif" },
    { name: "Comic Sans MS", display: "Comic Sans MS", style: "font-sans" },
  ];

  return (
    <>
      <Head>
        <title>Soul Pages - Your Personal Journal</title>
        <meta
          name="description"
          content="A secure and private journaling application"
        />
      </Head>
      <div className={inter.className}>
        <nav className="bg-surface border-b border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex">
                <Link
                  href="/"
                  className="flex items-center text-2xl font-bold text-primary"
                >
                  Soul Pages
                </Link>
              </div>

              <div className="flex items-center gap-4">
                {isOffline && (
                  <div className="flex items-center gap-2 text-yellow-500">
                    <RiWifiOffLine className="w-5 h-5" />
                    <span className="text-sm">Offline</span>
                  </div>
                )}

                {user && (
                  <>
                    {/* Font Selector */}
                    <div
                      className="relative font-selector-dropdown"
                      ref={fontSelectorRef}
                    >
                      <button
                        onClick={() => {
                          setShowFontSelector(!showFontSelector);
                        }}
                        className="hover:text-green-400 transition-colors duration-300 cursor-pointer"
                        title="Change font"
                      >
                        <span className="text-sm font-medium text-secondary hover:text-[#008C5E] transition-colors duration-300 cursor-pointer">
                          Font:{" "}
                          <span style={{ fontFamily: selectedFont }}>
                            {selectedFont}
                          </span>
                        </span>
                      </button>

                      {showFontSelector && (
                        <div className="absolute right-0 top-12 bg-surface border border-border rounded-xl shadow-2xl p-2 min-w-[200px] max-h-[300px] overflow-y-auto scrollbar-hide z-50">
                          <div className="px-3 py-2 text-xs font-medium text-text-secondary border-b border-border mb-2">
                            Current:{" "}
                            <span style={{ fontFamily: selectedFont }}>
                              {selectedFont}
                            </span>
                          </div>
                          {fontOptions.map((font) => (
                            <button
                              key={font.name}
                              onClick={() => {
                                setSelectedFont(font.name);
                                setShowFontSelector(false);
                                // Apply font to the app
                                document.documentElement.style.setProperty(
                                  "--app-font",
                                  font.name,
                                );
                              }}
                              className={`w-full text-left px-3 py-2 rounded-lg transition-all duration-200 ${
                                selectedFont === font.name
                                  ? "bg-primary text-white shadow-sm"
                                  : "hover:bg-surface-hover hover:text-primary text-text-primary hover:shadow-sm"
                              }`}
                              style={{ fontFamily: font.name }}
                            >
                              {font.display}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="hidden sm:flex items-center gap-2 text-sm text-secondary">
                      <span className="hidden md:inline">Signed in as:</span>
                      <span className="font-medium text-primary">
                        {user.email
                          ? user.email
                              .split("@")[0]
                              .replace(/[0-9]/g, "")
                              .replace(/^[^a-zA-Z]*/, "")
                              .charAt(0)
                              .toUpperCase() +
                              user.email
                                .split("@")[0]
                                .replace(/[0-9]/g, "")
                                .replace(/^[^a-zA-Z]*/, "")
                                .slice(1) || "User"
                          : "User"}
                      </span>
                    </div>
                    <InactivitySettings />
                    <LogoutButton />
                  </>
                )}
              </div>
            </div>
          </div>
        </nav>

        <main>
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </main>
        {user && <InactivityWarning />}
      </div>
    </>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <RootLayoutContent>{children}</RootLayoutContent>
        </AuthProvider>
      </body>
    </html>
  );
}
