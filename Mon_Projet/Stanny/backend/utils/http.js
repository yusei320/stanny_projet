function sendSuccess(res, payload = {}, status = 200) {
  if (Array.isArray(payload)) {
    return res.status(status).json(payload);
  }

  if (payload && typeof payload === 'object') {
    return res.status(status).json({
      success: true,
      ...payload
    });
  }

  return res.status(status).json({
    success: true,
    data: payload
  });
}

function createHttpError(status, message, details) {
  const error = new Error(message);
  error.status = status;

  if (typeof details !== 'undefined') {
    error.details = details;
  }

  return error;
}

module.exports = { sendSuccess, createHttpError };