export interface AuthResponse {
  token: string;
  user: {
    id: string;
    fullName: string;
    email: string;
    phone: string;
    role: string;
    staffProfileRole: string | null;
    status: string;
  };
}
