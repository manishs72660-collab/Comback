const app = require("../app");
const apiPathPattern = /^\/(auth|routines|logs|dashboard|analytics|profile|social|tasks|assistant)(\/|$)/;

module.exports = (req, res) => {
  const requestUrl = new URL(req.url, `https://${req.headers.host || "localhost"}`);
  const route = requestUrl.searchParams.get("route");
  if (!route || !apiPathPattern.test(route)) {
    return res.status(404).json({ success: false, message: "API route not found" });
  }
  requestUrl.searchParams.delete("route");
  req.url = `${route}${requestUrl.search}`;
  return app(req, res);
};
