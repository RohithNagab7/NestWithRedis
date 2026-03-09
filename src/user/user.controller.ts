import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { UserService } from './user.service.js';
import { createUserDto } from './dtos/create-user.dto.js';
import { UpdateUserDto } from './dtos/update-user.dto.js';
import { PaginationQueryDto } from './dtos/pagination-query.dto.js';
import { RateLimit } from '../global/decorators/rate-limit.decorator.js';

@RateLimit(50, 60)
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  async getAllUsers(@Query() paginatedQuery: PaginationQueryDto) {
    return await this.userService.getAllUsers(paginatedQuery);
  }

  @RateLimit(3, 1)
  @Post()
  async createUser(@Body() createdUser: createUserDto) {
    return await this.userService.createUser(createdUser);
  }

  @Patch(':id')
  async updateUser(
    @Body() updatedUser: UpdateUserDto,
    @Param('id') id: string,
  ) {
    return await this.userService.updateUser(updatedUser, id);
  }

  @Delete(':id')
  async deleteUser(@Param('id') id: string) {
    return await this.userService.deleteUser(id);
  }
}
