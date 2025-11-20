import api from "../api";

export async function fetchMe() {
  const data = await api.get("me/");
  return data;
}

export async function updateMyProfile(payload) {
  const data = await api.patch("me/update_profile/", payload);
  return data;
}
