import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './entities/category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100);
}

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categories: Repository<Category>,
  ) {}

  list(): Promise<Category[]> {
    return this.categories.find({ order: { sortOrder: 'ASC', name: 'ASC' } });
  }

  async findById(id: string): Promise<Category> {
    const category = await this.categories.findOne({ where: { id } });
    if (!category) throw new NotFoundException('Category not found');
    return category;
  }

  async create(dto: CreateCategoryDto): Promise<Category> {
    const slug = slugify(dto.name);
    if (!slug) throw new ConflictException('Invalid category name');
    const existing = await this.categories.findOne({ where: { slug } });
    if (existing) throw new ConflictException('Category already exists');
    const row = this.categories.create({
      name: dto.name,
      slug,
      sortOrder: dto.sortOrder ?? 0,
    });
    return this.categories.save(row);
  }

  async update(id: string, dto: UpdateCategoryDto): Promise<Category> {
    const category = await this.findById(id);
    if (dto.name !== undefined) {
      const newSlug = slugify(dto.name);
      if (newSlug !== category.slug) {
        const existing = await this.categories.findOne({ where: { slug: newSlug } });
        if (existing && existing.id !== category.id) {
          throw new ConflictException('Category already exists');
        }
        category.slug = newSlug;
      }
      category.name = dto.name;
    }
    if (dto.sortOrder !== undefined) category.sortOrder = dto.sortOrder;
    return this.categories.save(category);
  }

  async remove(id: string): Promise<void> {
    const result = await this.categories.delete(id);
    if (!result.affected) throw new NotFoundException('Category not found');
  }
}
