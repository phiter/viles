export const getStoredBoolean = (key: string): boolean | null => {
  const storedValue = globalThis.localStorage.getItem(key)

  if (storedValue === 'true') {
    return true
  }

  if (storedValue === 'false') {
    return false
  }

  return null
}

export const buildExportPayload = (realmSelections: string[]) =>
  realmSelections
    .map((faction, index) => ({ realmNumber: index + 1, faction: faction.trim() }))
    .filter(({ faction }) => faction.length > 0)
    .map(({ realmNumber, faction }) => `${realmNumber} ${faction}`)
    .join('\n')

export const getFactionImagesFromModules = (modules: Record<string, string>) =>
  Object.fromEntries(
    Object.entries(modules).map(([path, url]) => [
      path.replace('./factions/', '').replace('.png', ''),
      url,
    ]),
  ) as Record<string, string>
