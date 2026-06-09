import { IsString, IsBoolean, IsOptional, MinLength } from 'class-validator';

export class CreateRoomDto {
  @IsString()
  @MinLength(3)
  name: string;

  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;
}
