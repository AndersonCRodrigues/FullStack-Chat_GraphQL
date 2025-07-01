import { Field, ID, ObjectType } from '@nestjs/graphql';
import { IsEmail, IsNotEmpty, Length } from 'class-validator';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@ObjectType({ description: 'Representa um usuário do sistema.' })
@Entity('users')
export class User {
  @Field(() => ID, { description: 'O ID único do usuário.' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field({ description: 'O nome completo do usuário.' })
  @Column()
  @IsNotEmpty({ message: 'Nome não pode ser vazio.' })
  name: string;

  @Field({ description: 'O endereço de e-mail único do usuário.' })
  @Column({ unique: true })
  @IsEmail({}, { message: 'Formato de e-mail inválido.' })
  @IsNotEmpty({ message: 'E-mail não pode ser vazio.' })
  email: string;

  @Field({ description: 'O CPF do usuário (somente números), único.' })
  @Column({ unique: true })
  @IsNotEmpty({ message: 'CPF não pode ser vazio.' })
  @Length(11, 11, { message: 'CPF deve conter exatamente 11 dígitos.' })
  cpf: string;

  @Column()
  @IsNotEmpty()
  password: string;

  @Column({ nullable: true })
  refreshToken?: string;
}
