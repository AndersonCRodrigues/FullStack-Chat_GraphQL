import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsString } from 'class-validator';

@InputType({
  description: 'Dados de entrada para criar uma nova mensagem de chat.',
})
export class CreateMessageInput {
  @Field({ description: 'O ID da sala de chat à qual a mensagem pertence.' })
  @IsNotEmpty({ message: 'O ID da sala não pode ser vazio.' })
  @IsString()
  roomId: string;

  @Field({ description: 'O conteúdo da mensagem.' })
  @IsNotEmpty({ message: 'A mensagem não pode ser vazia.' })
  @IsString()
  content: string;
}
