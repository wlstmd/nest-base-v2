import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  MaxLength,
  MinLength,
  IsOptional,
  IsEmail,
  Matches,
} from 'class-validator';

export class EditProfileDto {
  @ApiProperty({ description: '이름' })
  @IsString()
  @MinLength(1)
  @MaxLength(20)
  @IsOptional()
  nickName?: string;

  @ApiProperty({ description: '이미지 URI' })
  @IsString()
  @IsOptional()
  imageUri?: string;

  @ApiProperty({ description: '이메일' })
  @IsEmail()
  @MinLength(6)
  @MaxLength(50)
  @Matches(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, {
    message: '이메일 형식이 아닙니다.',
  })
  @IsOptional()
  email?: string;
}
