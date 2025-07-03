// backend/src/chat/message.entity.ts
import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from '../user/user.entity';

@ObjectType({
  description: 'Representa uma mensagem dentro de uma sala de chat.',
})
@Entity('messages')
export class Message {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field({ description: 'O ID da sala de chat.' })
  @Column()
  roomId: string;

  @Field({ description: 'O conteúdo da mensagem.' })
  @Column({ type: 'text' })
  content: string;

  @Field(() => User, { description: 'O autor da mensagem.' })
  @ManyToOne(() => User, { eager: true, onDelete: 'CASCADE', nullable: false })
  author: User;

  @Field({ description: 'Timestamp de criação da mensagem.' })
  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  timestamp: Date;

  @Field({ description: 'Timestamp de expiração da mensagem.' })
  @Column({ type: 'datetime' })
  expiresAt: Date;
}
