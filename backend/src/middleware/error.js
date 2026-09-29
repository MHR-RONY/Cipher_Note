export const notFound = (req, res) => res.status(404).json({ message: "Not found" });

export const errorHandler = (err, req, res, next) => {
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern ?? {})[0];
    return res
      .status(409)
      .json({ message: field ? `${field} already in use` : "Duplicate value" });
  }

  if (err.name === "ValidationError") {
    const first = Object.values(err.errors ?? {})[0];
    return res.status(400).json({ message: first?.message ?? "Validation failed" });
  }

  if (err.status) return res.status(err.status).json({ message: err.message });

  res.status(500).json({ message: "Server error" });
};
