export abstract class BaseService<T, CreateDto = never, UpdateDto = never> {
  constructor(protected readonly model: any) {}

  create?(dto: CreateDto): Promise<T> {
    return this.model.create({ data: dto });
  }

  findAll(): Promise<T[]> {
    return this.model.findMany();
  }

  findOne(id: string): Promise<T | null> {
    return this.model.findUnique({ where: { id } });
  }

  update?(id: string, dto: UpdateDto): Promise<T> {
    return this.model.update({ where: { id }, data: dto });
  }
}
