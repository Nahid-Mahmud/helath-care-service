/**
 * Fields to exclude from the filter object because they
 * are handled by dedicated methods in the QueryBuilder.
 */
export const excludeFields = ["searchTerm", "sort", "fields", "page", "limit", "days", "dateField", "populate"];
