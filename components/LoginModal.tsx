"use client";
import * as Dialog from "@radix-ui/react-dialog";
import { useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRequestAccess: () => void;
}

type Status = "idle" | "loading" | "success" | "error";

export default function LoginModal({ isOpen, onClose, onRequestAccess }: LoginModalProps) {
  const supabase = createClientComponentClient();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleLogin = async () => {
    setStatus("loading");
    setErrorMessage("");
    
    try {
      const { data: existingUser, error: userError } = await supabase
        .from('Users')
        .select('email')
        .eq('email', email)
        .maybeSingle();

      if (userError) {
        setStatus("error");
        setErrorMessage("Error checking user account. Please try again.");
        return;
      }

      if (existingUser) {
        localStorage.setItem('userEmail', email);
        setStatus("success");
        window.dispatchEvent(new Event('user-auth-changed'));
        onClose();
      } else {
        onRequestAccess();
        onClose();
      }
    } catch (error) {
      setStatus("error");
      setErrorMessage("An unexpected error occurred. Please try again.");
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="bg-black/30 fixed inset-0" />
        <Dialog.Content className="bg-white p-6 rounded-md shadow-md fixed top-10 left-1/2 transform -translate-x-1/2 w-80">
          <Dialog.Title className="text-lg font-semibold mb-4 text-center">Enter Email Address</Dialog.Title>
          <div>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2 border rounded mb-4"
            />
            <button
              onClick={handleLogin}
              disabled={status === "loading"}
              className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
            >
              {status === "loading" ? "Checking..." : "Continue"}
            </button>
            {errorMessage && (
              <p className="text-red-500 text-sm mt-2 text-center">
                {errorMessage}
              </p>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
} 