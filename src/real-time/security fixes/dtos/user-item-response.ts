import { IUser } from "../models/user-model";

export class UserItemResponse {
  constructor(user: IUser) {
    this.id = user.id;
    this.email = user.email;
    this.fullName = user.fullName;
    this.role = user.role;
  }

  id: string;
  email: string;
  fullName: string;
  role: string;
}
