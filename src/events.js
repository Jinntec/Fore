export function leadingDebounce(caller, func, timeout = 300) {
  let timer;
  return (...args) => {
    if (!timer) {
      func.apply(caller, args);
    }
    clearTimeout(timer);
    timer = setTimeout(() => {
      timer = undefined;
      return null;
    }, timeout);
  };
}

export function debounce(caller, func, timeout = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      func.apply(caller, args);
    }, timeout);
  };
}
