import { Field, InputType } from '@nestjs/graphql';
import { IsEmail, IsNotEmpty, Length, MinLength } from 'class-validator';

@InputType({
  description: 'Dados de entrada para o registro de um novo usuário.',
})
export class RegisterInput {
  @Field({ description: 'O nome completo do novo usuário.' })
  @IsNotEmpty({ message: 'Nome não pode ser vazio.' })
  name: string;

  @Field({ description: 'O endereço de e-mail do novo usuário.' })
  @IsEmail()
  email: string;

  @Field({ description: 'O CPF do novo usuário (somente números), único.' })
  @IsNotEmpty({ message: 'CPF não pode ser vazio.' })
  @Length(11, 11, { message: 'CPF deve conter exatamente 11 dígitos.' })
  cpf: string;

  @Field({ description: 'A senha do novo usuário (mínimo de 6 caracteres).' })
  @IsNotEmpty()
  @MinLength(6)
  password: string;
}

@InputType({ description: 'Credenciais de login do usuário.' })
export class LoginInput {
  @Field({ description: 'O endereço de e-mail do usuário.' })
  @IsEmail()
  email: string;

  @Field({ description: 'A senha do usuário.' })
  @IsNotEmpty()
  password: string;
}
