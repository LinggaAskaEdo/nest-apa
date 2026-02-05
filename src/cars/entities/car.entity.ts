export class Car {
  id!: string;
  user_id!: string;
  brand!: string;
  model!: string;
  year!: number;
  color?: string;
  license_plate!: string;
  is_available!: boolean;
  created_at!: Date;
  updated_at!: Date;
}

export class CarWithUser extends Car {
  user_name?: string;
  user_email?: string;
}
