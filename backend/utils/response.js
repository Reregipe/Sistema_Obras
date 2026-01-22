export function success(data) {
  return {
    success: true,
    data,
    error: null
  };
}

export function fail(errorMsg) {
  return {
    success: false,
    data: null,
    error: errorMsg
  };
}
