import { Field, ObjectType } from '@nestjs/graphql';
import { User } from '../../user/user.entity'; // Importa a entidade User

@ObjectType({
  description:
    'Resultado da autenticação, incluindo tokens e informações do usuário.',
})
export class AuthOutput {
  @Field({ description: 'O token de acesso JWT (curta duração).' })
  accessToken: string;

  @Field({
    nullable: true,
    description:
      'O refresh token JWT para renovar a sessão. Este campo é removido da resposta HTTP pelo backend por segurança (colocado em um cookie).',
  })
  refreshToken: string;

  @Field(() => User, { description: 'As informações do usuário autenticado.' })
  user: User;
}
