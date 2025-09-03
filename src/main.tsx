import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { initAnalytics } from './lib/analytics';

// Initialize Google Analytics if measurement ID is available
const GA4_MEASUREMENT_ID = import.meta.env.VITE_GA4_MEASUREMENT_ID as string;
if (GA4_MEASUREMENT_ID) {
  initAnalytics(GA4_MEASUREMENT_ID);
} else {
  console.warn('Google Analytics Measurement ID not found. Analytics will be disabled.');
}

createRoot(document.getElementById("root")!).render(<App />);
