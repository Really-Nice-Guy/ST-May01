"use client";
import * as Dialog from "@radix-ui/react-dialog";
import { useState } from "react";

interface RequestAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function RequestAccessModal({ isOpen, onClose }: RequestAccessModalProps) {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleRequest = async () => {
    setSubmitted(true);
    console.log("Request Access Submitted:", email);
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="bg-black/30 fixed inset-0" />
        <Dialog.Content className="bg-white p-6 rounded-md shadow-md fixed top-10 left-1/2 transform -translate-x-1/2 w-80">
          <Dialog.Title className="text-lg font-semibold mb-4 text-center">Request Access</Dialog.Title>
          {!submitted ? (
            <>
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-2 border rounded mb-4"
              />
              <button
                onClick={handleRequest}
                className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
              >
                Request Access
              </button>
            </>
          ) : (
            <p className="text-center text-green-700">Request submitted! We'll get back to you.</p>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
} 