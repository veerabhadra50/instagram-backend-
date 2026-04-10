export const cleanUsername = (input) => {
  if (!input) return null;

  return input
    .replace("https://www.instagram.com/", "")
    .replace("https://instagram.com/", "")
    .replace("@", "")
    .split("/")[0]
    .trim();
};