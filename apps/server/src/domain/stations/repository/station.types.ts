export type StationFilter = {
  name?: string;
  address?: string;
  capacity?: number;
};

export type StationSortField = "name" | "capacity" | "updatedAt";

// export type StationPageRequest = PageRequest<StationSortField>;
