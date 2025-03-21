export interface LoginRequest {
    username: string
    password: string
  }
  
  export interface ValidationError {
    username?: string[]
    password?: string[]
  }
  
  export interface ErrorResponse {
    message: string
    errors?: ValidationError
  }