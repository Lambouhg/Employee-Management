import { IsEnum, IsNotEmpty } from 'class-validator';

export enum ScheduleStatusTransition {
    PUBLISH = 'PUBLISHED', // Draft -> Published
    LOCK = 'LOCKED',       // Published -> Locked
}

export class UpdateScheduleStatusDto {
    @IsEnum(ScheduleStatusTransition)
    @IsNotEmpty()
    status: ScheduleStatusTransition;
}
