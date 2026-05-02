"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signIn, signOut } from "next-auth/react";
import { MapPin, Menu, X, LogOut, User } from "lucide-react";
import { useState } from "react";
import clsx from "clsx";

const navLinks = [
  { href: "/", label: "Vue d'ensemble" },
  { href: "/map", label: "Carte Live" },
  { href: "/traffic", label: "Trafic" },
  { href: "/tramway", label: "Tramway" },
  { href: "/weather", label: "Meteo" },
  { href: "/greenspace", label: "Espaces Verts" },
  { href: "/alerts", label: "Alertes" },
];

export default function Navbar() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="bg-gray-900 border-b border-gray-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <MapPin className="h-8 w-8 text-emerald-500" />
            <span className="text-xl font-bold text-white">
              Irfane Digital Twin
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={clsx(
                  "px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  pathname === link.href
                    ? "bg-emerald-500/20 text-emerald-400"
                    : "text-gray-300 hover:bg-gray-800 hover:text-white"
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Auth Section */}
          <div className="hidden md:flex items-center gap-4">
            {status === "loading" ? (
              <div className="h-8 w-24 bg-gray-800 rounded animate-pulse" />
            ) : session ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <User className="h-4 w-4" />
                  <span>{session.user?.email}</span>
                </div>
                <button
                  onClick={() => signOut()}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Deconnexion
                </button>
              </div>
            ) : (
              <button
                onClick={() => signIn("keyrock")}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
              >
                Connexion
              </button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800"
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-800">
          <div className="px-4 py-3 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={clsx(
                  "block px-3 py-2 rounded-lg text-base font-medium transition-colors",
                  pathname === link.href
                    ? "bg-emerald-500/20 text-emerald-400"
                    : "text-gray-300 hover:bg-gray-800 hover:text-white"
                )}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-4 border-t border-gray-800">
              {session ? (
                <div className="space-y-2">
                  <div className="px-3 py-2 text-sm text-gray-400">
                    {session.user?.email}
                  </div>
                  <button
                    onClick={() => signOut()}
                    className="w-full text-left px-3 py-2 rounded-lg text-base font-medium text-gray-300 hover:bg-gray-800"
                  >
                    Deconnexion
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => signIn("keyrock")}
                  className="w-full px-3 py-2 rounded-lg text-base font-medium bg-emerald-600 text-white"
                >
                  Connexion
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
