import { Field, InputType } from '@nestjs/graphql';
import { IsEmail, IsNotEmpty, Length, MinLength } from 'class-validator';

@InputType({ description: 'Dados de entrada para criar um novo usuário.' })
export class CreateUserInput {
  @Field({ description: 'O nome completo do novo usuário.' })
  @IsNotEmpty({ message: 'Nome não pode ser vazio.' })
  name: string;

  @Field({
    description: 'O endereço de e-mail do novo usuário. Deve ser único.',
  })
  @IsEmail({}, { message: 'Formato de e-mail inválido.' })
  @IsNotEmpty({ message: 'E-mail não pode ser vazio.' })
  email: string;

  @Field({ description: 'O CPF do novo usuário (somente números), único.' })
  @IsNotEmpty({ message: 'CPF não pode ser vazio.' })
  @Length(11, 11, { message: 'CPF deve conter exatamente 11 dígitos.' })
  cpf: string;

  @Field({ description: 'A senha do novo usuário (mínimo de 6 caracteres).' })
  @IsNotEmpty({ message: 'Senha não pode ser vazia.' })
  @MinLength(6, { message: 'A senha deve ter no mínimo 6 caracteres.' })
  password: string;
}
