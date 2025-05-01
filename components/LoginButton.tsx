"use client";

interface LoginButtonProps {
  onLoginClick: () => void;
}

export default function LoginButton({ onLoginClick }: LoginButtonProps) {
  return (
    <button
      onClick={onLoginClick}
      className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
    >
      Login
    </button>
  );
} 