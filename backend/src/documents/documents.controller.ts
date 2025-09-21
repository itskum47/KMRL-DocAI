import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { DocumentsService } from './documents.service';
import { AuthGuard } from '../auth/auth.guard';
import { CreateDocumentDto, DocumentQueryDto } from './dto/document.dto';

@ApiTags('documents')
@ApiBearerAuth()
@Controller('documents')
@UseGuards(AuthGuard)
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post('presign')
  @ApiOperation({ summary: 'Get presigned URL for document upload' })
  async getPresignedUrl(@Body() createDocumentDto: CreateDocumentDto, @Request() req) {
    return this.documentsService.createPresignedUrl(createDocumentDto, req.user);
  }

  @Post(':id/finalize')
  @ApiOperation({ summary: 'Finalize document upload and start processing' })
  async finalizeUpload(@Param('id') id: string, @Request() req) {
    return this.documentsService.finalizeUpload(id, req.user);
  }

  @Get()
  @ApiOperation({ summary: 'Get documents with filtering and pagination' })
  async getDocuments(@Query() query: DocumentQueryDto, @Request() req) {
    return this.documentsService.getDocuments(query, req.user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get document by ID' })
  async getDocument(@Param('id') id: string, @Request() req) {
    return this.documentsService.getDocument(id, req.user);
  }

  @Post(':id/reprocess')
  @ApiOperation({ summary: 'Reprocess document (Admin only)' })
  async reprocessDocument(@Param('id') id: string, @Request() req) {
    return this.documentsService.reprocessDocument(id, req.user);
  }
}