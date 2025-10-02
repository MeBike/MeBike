import { IsEmail, IsNotEmpty, MinLength, Length } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @IsNotEmpty()
  fullName!: string;

  @IsNotEmpty()
  @Length(10, 10, { message: 'Phone Number must be 10 letters' })
  phoneNumber!: string;

  @MinLength(6)
  @IsNotEmpty()
  password!: string;
}
