// Tags are stored lowercase ("gospel", "new job"); show them capitalized ("Gospel", "New job").
export function tagLabel(tag: string) {
  return tag.charAt(0).toUpperCase() + tag.slice(1);
}
