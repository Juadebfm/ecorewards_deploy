import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { ClerkProvider, SignedIn, SignedOut } from "@clerk/clerk-react";
import ClerkAuthComponent, { ClerkLoginComponent } from "./ClerkAuthComponent";


// Dashboard or other protected components
const Dashboard = () => (
  <div className="p-8">
    <h1 className="text-3xl font-bold">Dashboard</h1>
    <p className="mt-4">Welcome to your eco-rewards dashboard!</p>
  </div>
);

// Landing page
const Home = () => (
  <div className="p-8 text-center">
    <h1 className="text-4xl font-bold text-green-600">Eco Rewards</h1>
    <p className="mt-4 text-xl">
      Help the Planet, Earn Points, and Become a Leader in Eco-Actions
    </p>
    <div className="mt-8 flex justify-center gap-4">
      <a
        href="/sign-up"
        className="bg-green-600 hover:bg-green-700 text-white py-2 px-6 rounded-lg font-medium"
      >
        Get Started
      </a>
      <a
        href="/login"
        className="border border-green-600 text-green-600 hover:bg-green-50 py-2 px-6 rounded-lg font-medium"
      >
        Sign In
      </a>
    </div>
  </div>
);

// Protected route wrapper
const ProtectedRoute = ({ children }) => {
  return (
    <>
      <SignedIn>{children}</SignedIn>
      <SignedOut>
        <Navigate to="/login" />
      </SignedOut>
    </>
  );
};

export default function App() {
  // Replace with your actual Clerk publishable key
  const clerkPubKey = "pk_test_d29ya2luZy1kb2RvLTgzLmNsZXJrLmFjY291bnRzLmRldiQ";

  return (
    <ClerkProvider publishableKey={clerkPubKey}>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Home />} />
          <Route path="/sign-up" element={<ClerkAuthComponent />} />
          <Route path="/login" element={<ClerkLoginComponent />} />

          {/* Protected routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </ClerkProvider>
  );
}
