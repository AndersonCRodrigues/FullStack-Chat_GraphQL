import { Field, InputType, PartialType } from '@nestjs/graphql';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  Length,
  MinLength,
} from 'class-validator';
import { CreateUserInput } from './create-user.input';

@InputType({
  description: 'Dados de entrada para atualizar um usuário existente.',
})
export class UpdateUserInput extends PartialType(CreateUserInput) {
  @Field({ nullable: true, description: 'Novo nome completo para o usuário.' })
  @IsOptional()
  @IsNotEmpty({ message: 'Nome não pode ser vazio.', always: true })
  name?: string;

  @Field({
    nullable: true,
    description: 'Novo endereço de e-mail para o usuário.',
  })
  @IsOptional()
  @IsEmail({}, { message: 'Formato de e-mail inválido.' })
  email?: string;

  @Field({
    nullable: true,
    description: 'Novo CPF para o usuário (somente números), único.',
  })
  @IsOptional()
  @Length(11, 11, { message: 'CPF deve conter exatamente 11 dígitos.' })
  cpf?: string;

  @Field({
    nullable: true,
    description: 'Nova senha para o usuário (mínimo de 6 caracteres).',
  })
  @IsOptional()
  @MinLength(6, { message: 'A senha deve ter no mínimo 6 caracteres.' })
  password?: string;
}
