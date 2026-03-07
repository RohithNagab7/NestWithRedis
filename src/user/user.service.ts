import {
  ConflictException,
  Injectable,
  NotFoundException,
  // InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { createUserDto } from './dtos/create-user.dto.js';
import { userSelect } from '../prisma/selects/user.select.js';
import { UpdateUserDto } from './dtos/update-user.dto.js';
import { PaginationQueryDto } from './dtos/pagination-query.dto.js';
import { RedisService } from '../redis/redis.service.js';

@Injectable()
export class UserService {
  constructor(
    private prisma: PrismaService,
    private redisService: RedisService,
  ) {}

  async getAllUsers(paginatedQuery: PaginationQueryDto) {
    const { page, limit } = paginatedQuery;
    const cacheKey = `users:page:${page}:limit:${limit}`;
    const cachedData = await this.redisService.get(cacheKey);

    if (cachedData) {
      return cachedData;
    }

    const skip = (page - 1) * limit;

    const [users, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        skip,
        take: limit,
        select: userSelect,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.user.count(),
    ]);
    console.log(users);

    const response = {
      data: users,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      message: 'Users fetched successfully',
    };

    await this.redisService.set(cacheKey, response, 60);
    return response;
  }

  async createUser(createdUser: createUserDto) {
    const { name, email, phoneNumber, description, passwordHash } = createdUser;

    const existingUser = await this.prisma.user.findUnique({
      where: { email: email },
    });

    if (existingUser) {
      throw new ConflictException('User already exists');
    }

    const result = await this.prisma.user.create({
      data: {
        name,
        email,
        phoneNumber,
        description,
        passwordHash,
      },
      select: userSelect,
    });

    await this.redisService.deleteByPattern('users:*');

    return { data: result, message: 'User added successfully' };
  }

  async updateUser(updatedUser: UpdateUserDto, id: string) {
    const existingUser = await this.prisma.user.findUnique({
      where: { id },
    });
    console.log(existingUser);

    if (!existingUser) {
      throw new NotFoundException('User does not exist');
    }

    const result = await this.prisma.user.update({
      where: { id },
      data: updatedUser,
      select: userSelect,
    });

    await this.redisService.deleteByPattern('users:*');

    return { data: result, message: 'User updated successfully' };
  }

  async deleteUser(id: string) {
    const existingUser = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      throw new NotFoundException('User not found');
    }

    const result = await this.prisma.user.delete({
      where: { id },
      select: userSelect,
    });

    await this.redisService.deleteByPattern('users:*');

    return { data: result, message: 'User deleted successfully' };
  }
}
