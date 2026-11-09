// Demo data loader: dynamically loads mock data only when VITE_ENABLE_DEMO === "true"

export const isDemoModeEnabled = (): boolean => {
  if (typeof window !== "undefined" && window.location.search.includes("demo=true")) {
    return true;
  }
  return import.meta.env.VITE_ENABLE_DEMO === "true";
};

export async function getDemoCompanies() {
  if (!isDemoModeEnabled()) return [];
  const { CLIENT_COMPANIES } = await import("./mockInitialData");
  return CLIENT_COMPANIES;
}

export async function getDemoUsers() {
  if (!isDemoModeEnabled()) return [];
  const { DEFAULT_USERS } = await import("./mockInitialData");
  return DEFAULT_USERS;
}

export async function getDemoCompliances() {
  if (!isDemoModeEnabled()) return {};
  const { ALL_COMPANIES_COMPLIANCES } = await import("./companyData");
  return ALL_COMPANIES_COMPLIANCES;
}

export async function getDemoActions() {
  if (!isDemoModeEnabled()) return {};
  const { ALL_COMPANIES_ACTIONS } = await import("./companyData");
  return ALL_COMPANIES_ACTIONS;
}
