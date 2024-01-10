import { Column, Entity, OneToMany } from 'typeorm';
import { RolesEnum } from '../const/roles.const';
import { PostModel } from 'src/posts/entities/posts.entity';
import { BaseModel } from 'src/common/entities/base.entity';

@Entity()
export class UserModel extends BaseModel {
  @Column({
    length: 20,
    unique: true,
  })
  nickname: string;

  @Column({
    unique: true,
  })
  email: string;

  @Column()
  password: string;

  @Column({
    type: 'enum',
    enum: Object.values(RolesEnum),
    default: RolesEnum.USER,
  })
  role: RolesEnum;

  @OneToMany(() => PostModel, (post) => post.author)
  posts: PostModel[];
}
