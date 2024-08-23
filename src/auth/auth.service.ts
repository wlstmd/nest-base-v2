import axios from 'axios';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { AuthDto, SignupDto } from './dto/auth.dto';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { EditProfileDto } from './dto/edit-profile.dto';
import { ImageService } from '../image/image.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
    private configService: ConfigService,
    private imageService: ImageService,
  ) {}

  async signup(signupDto: SignupDto) {
    const { email, password, nickName } = signupDto;
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = this.userRepository.create({
      email,
      password: hashedPassword,
      loginType: 'email',
      nickName,
    });

    try {
      await this.userRepository.save(user);
    } catch (error) {
      console.log(error);
      if (error.code === 'ER_DUP_ENTRY') {
        throw new ConflictException('이미 존재하는 이메일입니다.');
      }
      console.error('회원가입 오류:', error.message);
      throw new InternalServerErrorException(
        '회원가입 도중 에러가 발생했습니다.',
      );
    }

    return { message: '회원가입이 완료되었습니다.' };
  }

  private async getTokens(payload: { email: string }) {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('JWT_SECRET'),
        expiresIn: this.configService.get('JWT_ACCESS_TOKEN_EXPIRATION'),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('JWT_SECRET'),
        expiresIn: this.configService.get('JWT_REFRESH_TOKEN_EXPIRATION'),
      }),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }

  async signin(authDto: AuthDto) {
    const { email, password } = authDto;
    const user = await this.userRepository.findOneBy({ email });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new UnauthorizedException(
        '이메일 또는 비밀번호가 일치하지 않습니다.',
      );
    }

    const { accessToken, refreshToken } = await this.getTokens({ email });
    await this.updateHashedRefreshToken(user.id, refreshToken);

    return {
      message: '로그인이 성공적으로 되었습니다.',
      accessToken,
      refreshToken,
    };
  }

  private async updateHashedRefreshToken(id: number, refreshToken: string) {
    const salt = await bcrypt.genSalt();
    const hashedRefreshToken = await bcrypt.hash(refreshToken, salt);

    try {
      await this.userRepository.update(id, { hashedRefreshToken });
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException();
    }
  }

  async refreshToken(user: User) {
    const { email } = user;
    const { accessToken, refreshToken } = await this.getTokens({ email });

    if (!user.hashedRefreshToken) {
      throw new ForbiddenException();
    }

    await this.updateHashedRefreshToken(user.id, refreshToken);

    return { accessToken, refreshToken };
  }

  getProfile(user: User) {
    const { password, hashedRefreshToken, ...rest } = user;

    return { ...rest };
  }

  async editProfile(
    editProfileDto: EditProfileDto,
    user: User,
    image?: Express.Multer.File,
  ) {
    const profile = await this.userRepository
      .createQueryBuilder('user')
      .where('user.id = :userId', { userId: user.id })
      .getOne();

    if (!profile) {
      throw new NotFoundException('존재하지 않는 사용자입니다.');
    }

    const { nickName, email } = editProfileDto;
    profile.nickName = nickName;
    profile.email = email;

    if (image) {
      try {
        const imageUrl = await this.imageService.upload(
          image.originalname,
          image.buffer,
        );
        profile.imageUri = imageUrl;
      } catch (error) {
        console.error('이미지 업로드 오류:', error);
        throw new InternalServerErrorException(
          '이미지 업로드 중 오류가 발생했습니다.',
        );
      }
    }

    try {
      await this.userRepository.save(profile);
    } catch (error) {
      console.error('프로필 수정 오류:', error);
      throw new InternalServerErrorException(
        '프로필 수정 도중 에러가 발생했습니다.',
      );
    }

    return { message: '프로필이 성공적으로 수정되었습니다.', profile };
  }

  async deleteRefreshToken(user: User) {
    try {
      await this.userRepository.update(user.id, { hashedRefreshToken: null });
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException();
    }
  }

  async deleteAccount(user: User) {
    try {
      await this.userRepository
        .createQueryBuilder('user')
        .delete()
        .from(User)
        .where('id = :id', { id: user.id })
        .execute();
    } catch (error) {
      console.log(error);
      throw new BadRequestException(
        '탈퇴할 수 없습니다. 남은 데이터가 존재하는지 확인해주세요.',
      );
    }
  }
}
