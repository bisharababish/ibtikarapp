// Central place for backend URLs. Adjust if your ports change.
// Use Render URL for production
export const BASE_URL =
  process.env.EXPO_PUBLIC_BACKEND_URL || "https://ibtikar-backend.onrender.com";

// The model API is used by the backend; exposed here only if needed later.
// Backend uses IBTIKAR_URL environment variable for the model API
export const MODEL_URL =
  process.env.EXPO_PUBLIC_MODEL_URL;


