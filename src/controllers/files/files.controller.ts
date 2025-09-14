import {
  Controller,
  Get,
  Param,
  NotFoundException,
  StreamableFile,
  Res,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';

@ApiTags('File Downloads')
@Controller('files')
export class FilesController {
  @Get('exports/:filename')
  @ApiOperation({ summary: 'Download exported file (public endpoint)' })
  @ApiParam({ name: 'filename', description: 'Export filename' })
  @ApiResponse({ status: 200, description: 'File downloaded successfully' })
  @ApiResponse({ status: 404, description: 'File not found or expired' })
  async downloadExport(
    @Param('filename') filename: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    // Validate filename to prevent directory traversal attacks
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      throw new NotFoundException('Invalid filename');
    }

    const filePath = path.join(process.cwd(), 'exports', filename);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('Export file not found or expired');
    }

    // Set appropriate content type based on file extension
    const ext = path.extname(filename).toLowerCase();
    const contentType = ext === '.pdf' ? 'application/pdf' :
                       ext === '.docx' ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' :
                       'application/octet-stream';

    res.set({
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${filename}"`,
    });

    const file = fs.createReadStream(filePath);

    // Schedule file deletion after download (5 minutes delay to ensure download completes)
    setTimeout(() => {
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (error) {
        console.error('Error cleaning up file:', error);
      }
    }, 5 * 60 * 1000);

    return new StreamableFile(file);
  }
}