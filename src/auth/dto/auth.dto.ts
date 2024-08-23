import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class AuthDto {
  @ApiProperty({ description: '이메일' })
  @IsString()
  @MinLength(6)
  @MaxLength(50)
  @IsNotEmpty()
  @Matches(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, {
    message: '이메일 형식이 아닙니다.',
  })
  email: string;

  @ApiProperty({ description: '비밀번호' })
  @IsString()
  @MinLength(8)
  @MaxLength(20)
  @IsNotEmpty()
  @Matches(/^[a-zA-z0-9]*$/, {
    message: '비밀번호가 영어 또는 숫자 조합이 아닙니다.',
  })
  password: string;
}

export class SignupDto extends AuthDto {
  @ApiProperty({ description: '닉네임' })
  @IsString()
  @MinLength(1)
  @MaxLength(20)
  @IsNotEmpty()
  nickName: string;
}
