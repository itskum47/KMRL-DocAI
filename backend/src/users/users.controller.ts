import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  Patch,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { AuthGuard } from '../auth/auth.guard';
import { UpdateUserDto, UserQueryDto } from './dto/user.dto';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(AuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  async getCurrentUser(@Request() req) {
    return this.usersService.getCurrentUser(req.user);
  }

  @Get()
  @ApiOperation({ summary: 'Get users (Admin only)' })
  async getUsers(@Query() query: UserQueryDto, @Request() req) {
    return this.usersService.getUsers(query, req.user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  async getUser(@Param('id') id: string, @Request() req) {
    return this.usersService.getUser(id, req.user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update user (Admin only)' })
  async updateUser(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Request() req
  ) {
    return this.usersService.updateUser(id, updateUserDto, req.user);
  }

  @Get('department/:department')
  @ApiOperation({ summary: 'Get users by department' })
  async getUsersByDepartment(@Param('department') department: string, @Request() req) {
    return this.usersService.getUsersByDepartment(department, req.user);
  }

  @Post('sync-clerk')
  @ApiOperation({ summary: 'Sync user from Clerk webhook' })
  async syncFromClerk(@Body() clerkData: any) {
    return this.usersService.syncFromClerk(clerkData);
  }
}