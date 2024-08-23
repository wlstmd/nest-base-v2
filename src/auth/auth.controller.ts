import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Post,
  UseGuards,
  ValidationPipe,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthDto, SignupDto } from './dto/auth.dto';
import { User } from './entities/user.entity';
import { GetUser } from 'src/@common/decorators/get-user.decorator';
import { AuthGuard } from '@nestjs/passport';
import { EditProfileDto } from './dto/edit-profile.dto';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiConsumes,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @ApiResponse({
    status: 201,
    description: '성공',
  })
  @ApiResponse({
    status: 500,
    description: '서버 오류',
  })
  @ApiOperation({ summary: '회원가입' })
  @Post('/signup')
  signup(@Body(ValidationPipe) signupDto: SignupDto) {
    return this.authService.signup(signupDto);
  }

  @ApiResponse({
    status: 200,
    description: '성공',
  })
  @ApiResponse({
    status: 401,
    description: '인증 오류',
  })
  @ApiOperation({ summary: '로그인' })
  @Post('/signin')
  signin(@Body(ValidationPipe) authDto: AuthDto) {
    return this.authService.signin(authDto);
  }

  @ApiResponse({
    status: 200,
    description: '성공',
  })
  @ApiResponse({
    status: 403,
    description: '접근 거부',
  })
  @ApiOperation({ summary: 'Refresh Token 발급' })
  @Get('/refresh')
  @UseGuards(AuthGuard('jwt'))
  refresh(@GetUser() user: User) {
    return this.authService.refreshToken(user);
  }

  @ApiOperation({ summary: '프로필 조회' })
  @Get('/me')
  @UseGuards(AuthGuard('jwt'))
  getProfile(@GetUser() user: User) {
    return this.authService.getProfile(user);
  }

  @ApiResponse({
    status: 200,
    description: '성공',
  })
  @ApiResponse({
    status: 404,
    description: '사용자를 찾을 수 없음',
  })
  @ApiOperation({ summary: '프로필 수정' })
  @ApiConsumes('multipart/form-data')
  @Patch('/me')
  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(FileInterceptor('image'))
  editProfile(
    @Body() editProfileDto: EditProfileDto,
    @GetUser() user: User,
    @UploadedFile() image?: Express.Multer.File,
  ) {
    return this.authService.editProfile(editProfileDto, user, image);
  }

  @ApiResponse({
    status: 200,
    description: '성공',
  })
  @ApiResponse({
    status: 404,
    description: '서버 오류',
  })
  @ApiOperation({ summary: '로그아웃' })
  @Post('/logout')
  @UseGuards(AuthGuard('jwt'))
  logout(@GetUser() user: User) {
    return this.authService.deleteRefreshToken(user);
  }

  @ApiResponse({
    status: 200,
    description: '성공',
  })
  @ApiResponse({
    status: 400,
    description: '요청을 처리하지 못함',
  })
  @ApiOperation({ summary: '계정 삭제' })
  @Delete('/me')
  @UseGuards(AuthGuard('jwt'))
  deleteAccount(@GetUser() user: User) {
    return this.authService.deleteAccount(user);
  }
}
