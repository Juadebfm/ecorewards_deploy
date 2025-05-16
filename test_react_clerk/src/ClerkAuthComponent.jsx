import React from "react";
import {
  SignIn,
  SignUp,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/clerk-react";

const ClerkAuthComponent = () => {
  return (
    <div className="bg-white rounded-lg p-8 shadow-md max-w-md mx-auto">
      <SignedOut>
        <div className="space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold">Sign Up</h1>
            <p className="text-gray-600 mt-2">
              Already have an account?{" "}
              <a href="/login" className="text-green-600 hover:underline">
                Login
              </a>
            </p>
          </div>

          <SignUp
            path="/sign-up"
            routing="path"
            signInUrl="/login"
            appearance={{
              elements: {
                formButtonPrimary:
                  "bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded w-full",
                socialButtonsBlockButton:
                  "border border-gray-300 text-gray-700 py-2 px-4 rounded w-full flex items-center justify-center gap-2 hover:bg-gray-50",
                formFieldInput: "w-full p-2 border border-gray-300 rounded",
              },
            }}
          />

          <div className="text-center">
            <p className="text-gray-500">
              By signing up, you agree to our{" "}
              <a href="/terms" className="text-green-600 hover:underline">
                Terms
              </a>{" "}
              and{" "}
              <a href="/privacy" className="text-green-600 hover:underline">
                Privacy Policy
              </a>
              .
            </p>
          </div>
        </div>
      </SignedOut>

      <SignedIn>
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-semibold">Welcome!</h2>
          <p>You are signed in to your account.</p>
          <UserButton />
          <button
            onClick={() => (window.location.href = "/dashboard")}
            className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded w-full"
          >
            Go to Dashboard
          </button>
        </div>
      </SignedIn>
    </div>
  );
};

// Login component
export const ClerkLoginComponent = () => {
  return (
    <div className="bg-white rounded-lg p-8 shadow-md max-w-md mx-auto">
      <SignedOut>
        <div className="space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold">Login</h1>
            <p className="text-gray-600 mt-2">
              Don't have an account?{" "}
              <a href="/sign-up" className="text-green-600 hover:underline">
                Sign Up
              </a>
            </p>
          </div>

          <SignIn
            path="/login"
            routing="path"
            signUpUrl="/sign-up"
            appearance={{
              elements: {
                formButtonPrimary:
                  "bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded w-full",
                socialButtonsBlockButton:
                  "border border-gray-300 text-gray-700 py-2 px-4 rounded w-full flex items-center justify-center gap-2 hover:bg-gray-50",
                formFieldInput: "w-full p-2 border border-gray-300 rounded",
              },
            }}
          />

          <div className="text-center">
            <a
              href="/forgot-password"
              className="text-green-600 hover:underline"
            >
              Forgot Password?
            </a>
          </div>
        </div>
      </SignedOut>

      <SignedIn>
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-semibold">Welcome Back!</h2>
          <p>You are already signed in.</p>
          <UserButton />
          <button
            onClick={() => (window.location.href = "/dashboard")}
            className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded w-full"
          >
            Go to Dashboard
          </button>
        </div>
      </SignedIn>
    </div>
  );
};

export default ClerkAuthComponent;
