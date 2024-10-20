export const stringifyCategories = (categories: string[]): string => {
  return categories.map((s) => s.trim()).join(";");
};

export const parseCategories = (categoriesString: string): string[] => {
  // From semicolon-separated string to array of non-empty, non-duplicate category strings
  return Array.from(
    new Set(
      categoriesString
        .split(";")
        .map((s) => s.trim())
        .filter((s) => s.length > 0),
    ),
  );
};
