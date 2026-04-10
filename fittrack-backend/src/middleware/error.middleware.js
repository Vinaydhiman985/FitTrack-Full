// Not found handler
export const notFound = (req, res, next) => {
  res.status(404).json({ error: 'Not found' });
};

// Central error handler
export const errorHandler = (err, req, res, _next) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Something went wrong';
  if (status >= 500) {
    console.error('[error]', err);
  }
  res.status(status).json({ error: message });
};
