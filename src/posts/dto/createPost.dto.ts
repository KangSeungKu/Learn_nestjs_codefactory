import { IsString } from 'class-validator';

export class CreatePostDto {
  @IsString()
  subject: string;

  @IsString()
  comment: string;
}
