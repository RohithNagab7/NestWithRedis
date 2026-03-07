import { IsEmail, IsString, IsStrongPassword } from 'class-validator';

export class createUserDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  description: string;

  @IsString()
  phoneNumber: string;

  @IsStrongPassword()
  passwordHash: string;
}
