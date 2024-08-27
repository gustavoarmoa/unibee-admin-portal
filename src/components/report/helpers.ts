export const fuzzyMatch = (
  target: string,
  matchString: string,
  matchEmptyString?: boolean
): boolean =>
  target.trim().toLowerCase().includes(matchString.toLowerCase()) ||
  matchEmptyString ||
  matchString === ''
