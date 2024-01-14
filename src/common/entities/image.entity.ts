import { Column, Entity, ManyToOne } from 'typeorm';
import { BaseModel } from './base.entity';
import { IsEnum, IsInt, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { POST_IMAGE_PATH, POST_PUBLIC_IMAGE_PATH } from '../const/path.const';
import { PostModel } from 'src/posts/entities/posts.entity';
import { join } from 'path';

export enum ImageModelType {
  POST_IMAGE = 'POST_IMAGE',
}

@Entity()
export class ImageModel extends BaseModel {
  @Column()
  @IsInt()
  @IsOptional()
  order: number;

  @Column({
    type: 'enum',
    enum: ImageModelType,
  })
  @IsEnum(ImageModelType)
  @IsString()
  type: ImageModelType;

  @Column()
  @IsString()
  @Transform(({ value, obj }) => {
    if (obj.type === ImageModelType.POST_IMAGE) {
      return `/${join(POST_PUBLIC_IMAGE_PATH, value)}`;
    } else {
      return value;
    }
  })
  path: string;

  @ManyToOne((type) => PostModel, (post) => post.images)
  post?: PostModel;
}
