import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString, IsOptional, MaxLength, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { LeaveStatus } from '@prisma/client';

export class ApproveLeaveDto {
  @ApiProperty({
    description: 'Hành động: duyệt hoặc từ chối',
    enum: ['APPROVE', 'REJECT'],
    example: 'APPROVE',
  })
  @IsEnum(['APPROVE', 'REJECT'])
  action: 'APPROVE' | 'REJECT';

  @ApiProperty({
    description: 'Lý do từ chối (bắt buộc nếu REJECT)',
    example: 'Không đủ nhân sự trong khoảng thời gian này',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  rejectionReason?: string;
}

export class GetDepartmentLeavesQueryDto {
  @ApiProperty({
    description: 'Lọc theo trạng thái',
    enum: LeaveStatus,
    required: false,
  })
  @IsOptional()
  @IsEnum(LeaveStatus)
  status?: LeaveStatus;

  @ApiProperty({
    description: 'Ngày bắt đầu (YYYY-MM-DD)',
    required: false,
  })
  @IsOptional()
  startDate?: string;

  @ApiProperty({
    description: 'Ngày kết thúc (YYYY-MM-DD)',
    required: false,
  })
  @IsOptional()
  endDate?: string;

  @ApiProperty({
    description: 'Trang hiện tại',
    default: 1,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiProperty({
    description: 'Số bản ghi mỗi trang',
    default: 20,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;
}
