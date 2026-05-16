module.exports = {
  standard: "WCAG2AA",
  timeout: 30000,
  headers: process.env.PA11Y_COOKIE
    ? {
        Cookie: process.env.PA11Y_COOKIE,
      }
    : {},
  chromeLaunchConfig: {
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  },
};
