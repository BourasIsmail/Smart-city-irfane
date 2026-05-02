"use client";

import { signIn } from "next-auth/react";
import { MapPin } from "lucide-react";

export default function LoginPage() {
  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-emerald-500/20 rounded-full">
              <MapPin className="h-12 w-12 text-emerald-500" />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-white mb-2">
            Irfane Digital Twin
          </h1>
          <p className="text-gray-400 mb-8">
            Connectez-vous pour acceder a la plateforme Smart City
          </p>

          <button
            onClick={() => signIn("keyrock", { callbackUrl: "/" })}
            className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            Se connecter avec Keyrock
          </button>

          <p className="mt-6 text-sm text-gray-500">
            Plateforme de surveillance en temps reel pour le quartier Irfane,
            Rabat
          </p>
        </div>
      </div>
    </div>
  );
}
