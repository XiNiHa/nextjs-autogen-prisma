/**
 * Get prisma like database name
 *
 * ```ts
 * const response = getDatabaseName("TestDatabase");
 * // -> testDatabase
 * ```
 *
 * @param name database name
 * @returns prisma like database name
 */
export function getDatabaseName(name: string) {
  return `${name[0].toLowerCase()}${name.slice(1)}`;
}
