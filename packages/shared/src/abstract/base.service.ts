export abstract class BaseService<T, CreateDto = never, UpdateDto = never> {
  constructor(protected readonly model: any) {}

  create(dto: CreateDto): Promise<T> {
    return this.model.create({ data: dto });
  }

  async findAll(
    page = 1,
    limit = 10,
  ): Promise<{
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.model.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.model.count(),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  findOne(id: string): Promise<T | null> {
    return this.model.findUnique({ where: { id } });
  }

  update(id: string, dto: UpdateDto): Promise<T> {
    return this.model.update({ where: { id }, data: dto });
  }
}
