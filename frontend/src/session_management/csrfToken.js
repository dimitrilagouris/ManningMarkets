import { DJANGO_API_BASE } from "../config"

export async function getCSRFToken() {
    const res = await fetch(`${DJANGO_API_BASE}/get-csrf-token/`, {
        credentials: "include"
    });
    const data = await res.json();
    return data.csrfToken;
}