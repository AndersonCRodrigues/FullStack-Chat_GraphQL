import { gql } from '@apollo/client';

export interface User {
  id: string;
  name: string;
  email: string;
  cpf: string;
}

export interface Message {
  id: string;
  content: string;
  timestamp: string;
  expiresAt: string; 
  roomId: string;
  author: User;
}

export interface AuthOutput {
  accessToken: string;
  refreshToken?: string | null; // Presente no schema, mas tipado como opcional (cookies HttpOnly)
  user: User;
}

// Input Types (DTOs) - Conforme o schema
export interface CreateMessageInput {
  content: string;
  roomId: string;
}

export interface CreateUserInput {
  cpf: string;
  email: string;
  name: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  cpf: string;
  email: string;
  name: string;
  password: string;
}

export interface UpdateUserInput {
  cpf?: string | null; // Tipado como opcional no input
  email?: string | null;
  name?: string | null;
  password?: string | null;
}

// --- Fragments ---
export const USER_FIELDS = gql`
  fragment UserFields on User {
    id
    name
    email
    cpf
  }
`;

export const MESSAGE_FIELDS = gql`
  fragment MessageFields on Message {
    id
    content
    timestamp
    expiresAt
    roomId
    author {
      ...UserFields
    }
  }
  ${USER_FIELDS}
`;

// --- Queries ---
export const GET_MY_PROFILE = gql`
  query GetMyProfile {
    myProfile {
      ...UserFields
    }
  }
  ${USER_FIELDS}
`;
export interface GetMyProfileQuery {
  myProfile: User;
}

export const GET_USER_BY_ID = gql`
  query GetUserById($id: ID!) {
    user(id: $id) {
      ...UserFields
    }
  }
  ${USER_FIELDS}
`;
export interface GetUserByIdQuery {
  user: User | null;
}

export const GET_USERS = gql`
  query GetUsers {
    users {
      ...UserFields
    }
  }
  ${USER_FIELDS}
`;
export interface GetUsersQuery {
  users: User[];
}

export const GET_USER_BY_CPF = gql`
  query GetUserByCpf($cpf: String!) {
    userByCpf(cpf: $cpf) {
      ...UserFields
    }
  }
  ${USER_FIELDS}
`;
export interface GetUserByCpfQuery {
  userByCpf: User | null;
}

export const GET_USER_BY_EMAIL = gql`
  query GetUserByEmail($email: String!) {
    userByEmail(email: $email) {
      ...UserFields
    }
  }
  ${USER_FIELDS}
`;
export interface GetUserByEmailQuery {
  userByEmail: User | null;
}

export const GET_AVAILABLE_ROOMS = gql`
  query GetAvailableRooms {
    getAvailableRooms
  }
`;
export interface GetAvailableRoomsQuery {
  getAvailableRooms: string[];
}

export const GET_MESSAGES_BY_ROOM_ID = gql`
  query GetMessagesByRoomId($roomId: String!) {
    messages(roomId: $roomId) {
      ...MessageFields
    }
  }
  ${MESSAGE_FIELDS}
`;
export interface GetMessagesByRoomIdQuery {
  messages: Message[];
}

// --- Mutations ---
export const REGISTER_MUTATION = gql`
  mutation Register($registerInput: RegisterInput!) {
    register(registerInput: $registerInput) {
      accessToken
      user {
        ...UserFields
      }
    }
  }
  ${USER_FIELDS}
`;
export interface RegisterMutationResponse {
  register: Pick<AuthOutput, 'accessToken' | 'user'>;
}

export const LOGIN_MUTATION = gql`
  mutation Login($loginInput: LoginInput!) {
    login(loginInput: $loginInput) {
      accessToken
      user {
        ...UserFields
      }
    }
  }
  ${USER_FIELDS}
`;
export interface LoginMutationResponse {
  login: Pick<AuthOutput, 'accessToken' | 'user'>;
}

export const CREATE_USER_MUTATION = gql`
  mutation CreateUser($createUserInput: CreateUserInput!) {
    createUser(createUserInput: $createUserInput) {
      ...UserFields
    }
  }
  ${USER_FIELDS}
`;
export interface CreateUserMutationResponse {
  createUser: User;
}

export const UPDATE_USER_MUTATION = gql`
  mutation UpdateUser($id: ID!, $updateUserInput: UpdateUserInput!) {
    updateUser(id: $id, updateUserInput: $updateUserInput) {
      ...UserFields
    }
  }
  ${USER_FIELDS}
`;
export interface UpdateUserMutationResponse {
  updateUser: User;
}

export const DELETE_USER_MUTATION = gql`
  mutation DeleteUser($id: ID!) {
    deleteUser(id: $id)
  }
`;
export interface DeleteUserMutationResponse {
  deleteUser: boolean;
}

export const CREATE_MESSAGE_MUTATION = gql`
  mutation CreateMessage($createMessageInput: CreateMessageInput!) {
    createMessage(createMessageInput: $createMessageInput) {
      ...MessageFields
    }
  }
  ${MESSAGE_FIELDS}
`;
export interface CreateMessageMutationResponse {
  createMessage: Message;
}

export const LOGOUT_MUTATION = gql`
  mutation Logout {
    logout
  }
`;
export interface LogoutMutationResponse {
  logout: boolean;
}

export const REFRESH_TOKENS_MUTATION = gql`
  mutation RefreshTokens {
    refreshTokens {
      accessToken
      user {
        ...UserFields
      }
    }
  }
  ${USER_FIELDS}
`;
export interface RefreshTokensMutationResponse {
  refreshTokens: Pick<AuthOutput, 'accessToken' | 'user'>;
}

// --- Subscriptions ---
export const MESSAGE_ADDED_SUBSCRIPTION = gql`
  subscription MessageAdded($roomId: String!) {
    messageAdded(roomId: $roomId) {
      ...MessageFields
    }
  }
  ${MESSAGE_FIELDS}
`;
export interface MessageAddedSubscriptionResponse {
  messageAdded: Message;
}