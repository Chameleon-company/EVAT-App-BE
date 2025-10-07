// Fix in error-middleware.ts
export const errorHandler = (err, req, res, next) => {
  console.error(err); // log internally
  const status = err.status || 500;
  const message = process.env.NODE_ENV === "production"
    ? "Something went wrong"
    : err.message;

  res.status(status).json({ message });
};
