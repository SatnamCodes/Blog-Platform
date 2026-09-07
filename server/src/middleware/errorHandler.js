export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export function notFoundHandler(req, res) {
  res.status(404).json({ error: 'Route not found' });
}

// Express requires 4-arg arity to recognize error middleware, hence _next.
export function errorHandler(err, req, res, _next) {
  const status = err.status || 500;
  if (status >= 500) {
    // console.error (not console.log) for unexpected server errors; a real
    // deployment would wire this into a logging/observability service.
    console.error(err);
  }
  res.status(status).json({ error: err.message || 'Internal server error' });
}
