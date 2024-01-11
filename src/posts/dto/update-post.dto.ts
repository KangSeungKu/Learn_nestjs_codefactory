import { PartialType } from '@nestjs/mapped-types';
import { CreatePostDto } from './createPost.dto';
import { IsOptional, IsString } from 'class-validator';

export class UpdatePostDto extends PartialType(CreatePostDto) {
  @IsString()
  @IsOptional()
  title: string;

  @IsString()
  @IsOptional()
  content: string;
}
