export class User {
  id!: string;
  email!: string;
  name!: string;
  age?: number;
  is_active?: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export class UserWithCars extends User {
  cars?: any[];
  car_count?: number;
}
