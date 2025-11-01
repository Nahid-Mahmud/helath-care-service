// Define a generic type for a Prisma model (e.g., prisma.post, prisma.user)

import { excludeFields } from "../constants/excludeFields";

// This allows us to pass the model to the class for .count()
type PrismaModel = {
  count: (args?: any) => Promise<number>;
  [key: string]: any; // Allow other model methods
};

/**
 * A fluent, method-chaining query builder for Prisma, inspired by
 * the Mongoose QueryBuilder pattern.
 */
export class PrismaQueryBuilder<T extends PrismaModel> {
  private prismaModel: T;
  private query: Record<string, any>; // req.query
  private searchableFields: string[];
  private filterableFields: string[];

  // Internal state for building Prisma args
  private args: {
    where: Record<string, any>;
    orderBy: Record<string, "asc" | "desc">[] | undefined;
    skip: number;
    take: number;
    select?: Record<string, boolean>;
    include?: Record<string, any>;
  };

  // Separate clauses for metadata calculation
  private whereClause: Record<string, any> = {};
  private searchClause: Record<string, any> = {};

  constructor(
    prismaModel: T,
    query: Record<string, any>,
    config: {
      searchableFields?: string[];
      filterableFields?: string[];
    } = {}
  ) {
    this.prismaModel = prismaModel;
    this.query = { ...query }; // Shallow copy
    this.searchableFields = config.searchableFields || [];
    this.filterableFields = config.filterableFields || [];

    // Initialize default Prisma arguments
    this.args = {
      where: {},
      orderBy: undefined,
      skip: 0,
      take: 20, // Default limit
    };
  }

  /**
   * Applies filters based on query parameters.
   * Excludes reserved fields (pagination, sort, etc.).
   * Cleans up filter values.
   */
  filter(): this {
    const filterQuery = { ...this.query };

    // Remove reserved fields
    for (const field of excludeFields) {
      delete filterQuery[field];
    }

    // Clean up empty/null/default values
    Object.keys(filterQuery).forEach((key) => {
      if (
        filterQuery[key] === "" ||
        filterQuery[key] === "all" ||
        filterQuery[key] === null ||
        filterQuery[key] === undefined ||
        filterQuery[key] === "null" ||
        filterQuery[key] === "undefined"
      ) {
        delete filterQuery[key];
      }
    });

    // Build Prisma filter object
    const filters: Record<string, any> = {};
    for (const key of Object.keys(filterQuery)) {
      if (!this.filterableFields.includes(key)) {
        continue; // Skip fields not in the allowlist
      }

      const value = filterQuery[key];

      if (typeof value === "object" && value !== null && !Array.isArray(value)) {
        // Complex filter: ?price[gt]=100 -> { price: { gt: 100 } }
        const operators = Object.keys(value);
        const processedOps: Record<string, any> = {};

        for (const op of operators) {
          processedOps[op] = this.autoParseValue(value[op]);
        }
        filters[key] = processedOps;
      } else {
        // Simple filter or IN filter: ?status=published or ?status[in]=draft,published
        filters[key] = this.autoParseValue(value);
      }
    }

    this.whereClause = filters;
    return this;
  }

  /**
   * Applies a search query across 'searchableFields'.
   * Uses the 'searchTerm' query parameter.
   */
  search(): this {
    const searchTerm = this.query.searchTerm as string;
    if (searchTerm && this.searchableFields.length > 0) {
      this.searchClause = {
        OR: this.searchableFields.map((field) => ({
          [field]: { contains: searchTerm, mode: "insensitive" },
        })),
      };
    }
    return this;
  }

  /**
   * Applies sorting.
   * ?sort=field1,-field2
   */
  sort(): this {
    const sortBy = (this.query.sort as string) || "-createdAt"; // Default sort
    const fields = sortBy.split(",");
    const orderBy: Record<string, "asc" | "desc">[] = fields.map((field) => {
      if (field.startsWith("-")) {
        return { [field.substring(1)]: "desc" } as Record<string, "asc" | "desc">;
      }
      return { [field]: "asc" } as Record<string, "asc" | "desc">;
    });

    this.args.orderBy = orderBy;
    return this;
  }

  /**
   * Applies pagination.
   * ?page=1&limit=10
   */
  paginate(): this {
    const page = Math.max(1, Number(this.query.page) || 1);
    const take = Math.max(1, Number(this.query.limit) || 10); // Use 10 to match your Mongoose
    const skip = (page - 1) * take;

    this.args.skip = skip;
    this.args.take = take;
    return this;
  }

  /**
   * Applies field selection (Prisma's 'select').
   * ?fields=title,content
   */
  fields(): this {
    const fieldsStr = this.query.fields as string;
    if (fieldsStr) {
      const select: Record<string, boolean> = {};
      fieldsStr.split(",").forEach((f) => {
        select[f.trim()] = true;
      });
      this.args.select = select;
    }
    return this;
  }

  /**
   * Applies relation inclusion (Prisma's 'include').
   * ?populate=user,comments
   * Note: This is a simplified version of your 'populate'.
   * It doesn't support nested select.
   */
  populate(): this {
    const populateStr = this.query.populate as string;
    if (populateStr) {
      const include: Record<string, boolean> = {};
      populateStr.split(",").forEach((p) => {
        include[p.trim()] = true;
      });
      // Ensure 'select' is not set if 'include' is used
      if (this.args.select) {
        console.warn(
          "PrismaQueryBuilder: Cannot use 'fields' (select) and 'populate' (include) at the same time. 'populate' will take precedence."
        );
        delete this.args.select;
      }
      this.args.include = include;
    }
    return this;
  }

  /**
   * Applies a date filter based on the last N days.
   * ?days=15&dateField=createdAt
   */
  dateWise(): this {
    const days = parseInt(this.query.days, 10);
    const dateField = (this.query.dateField as string) || "createdAt";

    if (days && days > 0) {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      startDate.setHours(0, 0, 0, 0); // Start of the day

      const dateFilter = { [dateField]: { gte: startDate } };
      // Add to the main where clause
      this.whereClause = { ...this.whereClause, ...dateFilter };
    }
    return this;
  }

  /**
   * Gets pagination metadata by running a .count() query.
   */
  async getMeta() {
    // Build the final 'where' clause just for counting
    const where = this.buildFinalWhereClause();

    const totalDocuments = await this.prismaModel.count({ where });
    const page = Math.floor(this.args.skip / this.args.take) + 1;
    const limit = this.args.take;
    const totalPages = Math.ceil(totalDocuments / limit);

    return {
      page,
      limit,
      total: totalDocuments,
      totalPages,
    };
  }

  /**
   * Combines filter and search clauses into a final 'where' object.
   */
  private buildFinalWhereClause(): Record<string, any> {
    const conditions: any[] = [];
    if (Object.keys(this.whereClause).length > 0) {
      conditions.push(this.whereClause);
    }
    if (Object.keys(this.searchClause).length > 0) {
      conditions.push(this.searchClause);
    }

    if (conditions.length > 1) {
      return { AND: conditions };
    }
    if (conditions.length === 1) {
      return conditions[0];
    }
    return {};
  }

  /**
   * Builds and returns the final Prisma 'findMany' arguments object.
   */
  getPrismaArgs() {
    this.args.where = this.buildFinalWhereClause();

    // Prisma optimization: if 'include' is used, 'select' must be null.
    if (this.args.include) {
      delete this.args.select;
    }

    return this.args;
  }

  /**
   * Utility to auto-parse string values to boolean, number, or return as is.
   */
  private autoParseValue(value: any): any {
    if (typeof value !== "string") {
      return value; // Already parsed (e.g., arrays for 'in')
    }
    if (value === "true") return true;
    if (value === "false") return false;
    if (!isNaN(Number(value)) && !isNaN(parseFloat(value)) && Number.isFinite(Number(value))) {
      return Number(value);
    }
    return value;
  }
}
