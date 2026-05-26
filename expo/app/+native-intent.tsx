export function redirectSystemPath({
  path: _path,
  initial: _initial,
}: { path: string; initial: boolean }) {
  console.log("[NativeIntent] Redirecting:", _path, "initial:", _initial);
  if (_initial) {
    return "/";
  }
  return _path || "/";
}

