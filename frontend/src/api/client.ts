const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ?? "http://localhost:3333/graphql";

function getToken() {
  return localStorage.getItem("financy_token");
}

async function graphqlRequest<T>(query: string, variables?: Record<string, unknown>) {
  const headers: HeadersInit = {
    "Content-Type": "application/json"
  };

  const token = getToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(BACKEND_URL, {
    method: "POST",
    headers,
    body: JSON.stringify({ query, variables })
  });

  const body = await response.json();
  if (!response.ok || body.errors) {
    const message = body.errors?.[0]?.message ?? "Unknown error occurred";
    throw new Error(message);
  }

  return body.data as T;
}

export { BACKEND_URL, graphqlRequest };
