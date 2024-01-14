import { Transform } from 'class-transformer';
import { IsString } from 'class-validator';
import { join } from 'path';
import { POST_PUBLIC_IMAGE_PATH } from 'src/common/const/path.const';
import { BaseModel } from 'src/common/entities/base.entity';
import { UserModel } from 'src/users/entities/users.entity';
import { Column, Entity, ManyToOne } from 'typeorm';

@Entity()
export class PostModel extends BaseModel {
  @ManyToOne(() => UserModel, (user) => user.posts, {
    nullable: false,
  })
  author: UserModel;

  @Column()
  @IsString({
    message: 'title은 String타입을 입력해줘야 합니다.',
  })
  title: string;

  @Column()
  @IsString({ message: 'content는 String타입을 입력해줘야 합니다.' })
  content: string;

  @Column({
    nullable: true,
  })
  @Transform(({ value }) => value && `/${join(POST_PUBLIC_IMAGE_PATH, value)}`)
  image?: string;

  @Column()
  likeCount: number;

  @Column()
  commentCount: number;
}
