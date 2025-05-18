import {
  Controller,
  Get,
  Param,
  UseGuards,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@interfaces/api/guards/jwt-auth.guard';
import { GetUser } from '@interfaces/api/decorators/get-user.decorator';
import { GQMService } from '@application/gqm/use-cases/gqm.service';
// import { UserDto } from '@domain/users/dtos/user.dto';

interface RequestUser {
  id: string;
  [key: string]: any;
}

@ApiTags('GQM')
@Controller('gqm')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class GQMController {
  constructor(private readonly gqmService: GQMService) {}

  @Get('goal/:goalId')
  @ApiOperation({ summary: 'Get the complete GQM tree for a specific goal' })
  @ApiParam({
    name: 'goalId',
    description: 'ID of the goal to retrieve the GQM tree for',
  })
  @ApiResponse({ status: 200, description: 'GQM tree retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Goal not found' })
  async getGQMTree(@Param('goalId') goalId: string) {
    try {
      return await this.gqmService.getGQMTree(goalId);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to retrieve GQM tree');
    }
  }

  @Get('user')
  @ApiOperation({ summary: 'Get all GQM trees for the current user' })
  @ApiResponse({ status: 200, description: 'GQM trees retrieved successfully' })
  async getAllGQMTrees(@GetUser() user: RequestUser) {
    try {
      return await this.gqmService.getAllGQMTrees(user.id);
    } catch (_) {
      throw new InternalServerErrorException('Failed to retrieve GQM trees');
    }
  }
}
