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
import { TasksService } from './tasks.service';
import { AuthGuard } from '../auth/auth.guard';
import { CreateTaskDto, TaskQueryDto, AcknowledgeTaskDto } from './dto/task.dto';

@ApiTags('tasks')
@ApiBearerAuth()
@Controller('tasks')
@UseGuards(AuthGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new task' })
  async createTask(@Body() createTaskDto: CreateTaskDto, @Request() req) {
    return this.tasksService.createTask(createTaskDto, req.user);
  }

  @Get()
  @ApiOperation({ summary: 'Get tasks with filtering and pagination' })
  async getTasks(@Query() query: TaskQueryDto, @Request() req) {
    return this.tasksService.getTasks(query, req.user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get task by ID' })
  async getTask(@Param('id') id: string, @Request() req) {
    return this.tasksService.getTask(id, req.user);
  }

  @Patch(':id/acknowledge')
  @ApiOperation({ summary: 'Acknowledge a task' })
  async acknowledgeTask(
    @Param('id') id: string,
    @Body() acknowledgeTaskDto: AcknowledgeTaskDto,
    @Request() req
  ) {
    return this.tasksService.acknowledgeTask(id, acknowledgeTaskDto, req.user);
  }

  @Patch(':id/close')
  @ApiOperation({ summary: 'Close a task' })
  async closeTask(@Param('id') id: string, @Request() req) {
    return this.tasksService.closeTask(id, req.user);
  }

  @Get('department/:department')
  @ApiOperation({ summary: 'Get tasks for a specific department' })
  async getDepartmentTasks(@Param('department') department: string, @Request() req) {
    return this.tasksService.getDepartmentTasks(department, req.user);
  }
}