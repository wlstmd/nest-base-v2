import {
  BaseEntity,
  Column,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';

@Entity()
@Unique(['email'])
export class User extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  loginType: 'email';

  @Column()
  email: string;

  @Column()
  password: string;

  @Column()
  nickName: string;

  @Column({ nullable: true })
  imageUri?: string;

  @Column({ nullable: true })
  hashedRefreshToken?: string;
}
