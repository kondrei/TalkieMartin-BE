import { BadRequestException, Injectable } from '@nestjs/common';
import { UserDto } from './dto/user.dto';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './schemas/user.schema';
import { Model } from 'mongoose';
import { UserResponseDto } from './dto/user-response.dto';
import { plainToInstance } from 'class-transformer';
import { UserResponseWithPasswordDto } from './dto/user-response-with-password';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<User>,
  ) {}
  async createUser(user: UserDto): Promise<UserResponseDto> {
    const userData = await new this.userModel(user).save().catch((error) => {
      if (error?.errorResponse?.code === 11000)
        throw new BadRequestException('User already exists');
      throw new BadRequestException(error);
    });
    const result = plainToInstance(UserResponseDto, userData.toJSON());
    return result;
  }

  async getUserBy(
    query: { username?: string; email?: string },
    withPassword?: boolean,
  ): Promise<UserResponseDto | UserResponseWithPasswordDto> {
    const userData = await this.userModel
      .findOne({ $or: [{ username: query.username }, { email: query.email }] })
      .exec();
    if (!userData)
      throw new BadRequestException(
        'User does not exist or invalid credentials',
      );
    return plainToInstance(
      withPassword ? UserResponseWithPasswordDto : UserResponseDto,
      userData.toJSON(),
    );
  }
}
